import { CURRENT_API_CONFIG } from '../config/api-config';
import { getStoredToken } from './token-manager';

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

const WEBSOCKET_EVENTS = {
  CONNECTION_STATE_CHANGED: 'connection_state_changed',
  MESSAGE_RECEIVED: 'message_received',
  COURIER_LOCATION_UPDATE: 'courier_location_update',
  ERROR: 'error',
};

export class WebSocketService {
  constructor() {
    this.ws = null;
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeouts = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
    this.reconnectTimer = null;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;

    this.isManualDisconnect = false;
    this.authToken = null;

    // Courier position polling
    this.positionPollingInterval = null;
    this.positionPollingEnabled = false;
    this.positionPollingIntervalMs = 3000; // 4 seconds

    // Bind methods to preserve context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Subscribe to WebSocket events
   * @param {string} event - Event type to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
        if (eventSubscribers.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  /**
   * Emit event to all subscribers
   * @param {string} event - Event type
   * @param {any} data - Event data
   */
  emit(event, data) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Set connection state and notify subscribers
   * @param {string} state - New connection state
   */
  setConnectionState(state) {
    if (this.connectionState !== state) {
      const previousState = this.connectionState;
      this.connectionState = state;
      console.log(`WebSocket state changed: ${previousState} -> ${state}`);
      this.emit(WEBSOCKET_EVENTS.CONNECTION_STATE_CHANGED, {
        state,
        previousState,
      });
    }
  }

  /**
   * Get current connection state
   * @returns {string} Current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connectionState === CONNECTION_STATES.CONNECTED;
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    if (
      this.connectionState === CONNECTION_STATES.CONNECTING ||
      this.connectionState === CONNECTION_STATES.CONNECTED
    ) {
      console.log('WebSocket already connecting or connected');
      return;
    }

    try {
      // Get authentication token
      this.authToken = await getStoredToken();
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      this.setConnectionState(CONNECTION_STATES.CONNECTING);
      this.isManualDisconnect = false;

      // Create WebSocket connection with authentication token
      const wsUrl = `${CURRENT_API_CONFIG.websocketURL}?token=${encodeURIComponent(this.authToken)}`;
      console.log('Connecting to WebSocket with auth token:', CURRENT_API_CONFIG.websocketURL);

      this.ws = new WebSocket(wsUrl);

      // Set up event listeners
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onerror = this.handleError;
      this.ws.onclose = this.handleClose;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.setConnectionState(CONNECTION_STATES.ERROR);
      this.emit(WEBSOCKET_EVENTS.ERROR, { error, context: 'connection' });
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('Manually disconnecting WebSocket');
    this.isManualDisconnect = true;
    this.clearReconnectTimer();
    this.clearHeartbeat();
    this.clearPositionRequests();
    this.stopCourierPositionPolling();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Send message to WebSocket server
   * @param {Object} message - Message to send
   * @returns {boolean} True if message was sent
   */
  send(message) {
    if (!this.isConnected() || !this.ws) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.emit(WEBSOCKET_EVENTS.ERROR, { error, context: 'send_message' });
      return false;
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connection opened');
    this.reconnectAttempts = 0;

    // For Action Cable, we wait for the welcome message before subscribing
    console.log('Waiting for Action Cable welcome message...');
  }

  /**
   * Send authentication and subscription message for Action Cable
   */
  sendAuthMessage() {
    if (!this.authToken) {
      console.error('No auth token available for WebSocket authentication');
      this.disconnect();
      return;
    }

    // Action Cable subscription message for CourierPositionChannel
    const subscriptionMessage = {
      command: 'subscribe',
      identifier: JSON.stringify({
        channel: 'CourierPositionChannel',
      }),
    };

    if (this.send(subscriptionMessage)) {
      console.log('WebSocket subscription message sent for CourierPositionChannel');
    } else {
      console.error('Failed to send WebSocket subscription message');
      this.disconnect();
    }
  }

  /**
   * Request initial courier positions (one-time on connection)
   */
  requestInitialCourierPositions() {
    if (!this.isConnected()) {
      console.warn('Cannot request initial courier positions: WebSocket not connected');
      return false;
    }

    try {
      const positionRequest = {
        command: 'message',
        identifier: JSON.stringify({
          channel: 'CourierPositionChannel',
        }),
        data: JSON.stringify({
          action: 'get_position',
        }),
      };

      if (this.send(positionRequest)) {
        console.log('Initial courier positions requested');
        return true;
      } else {
        console.error('Failed to send initial position request');
        this.emit(WEBSOCKET_EVENTS.ERROR, {
          error: 'Failed to send initial position request',
          context: 'initial_position_request',
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating initial position request:', error);
      this.emit(WEBSOCKET_EVENTS.ERROR, {
        error,
        context: 'initial_position_request_creation',
      });
      return false;
    }
  }

  /**
   * Request courier location for demo (can be called manually)
   * @returns {Promise<Object>} Promise that resolves with courier location
   */
  async getCourierLocation() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Set up one-time listener for position response
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for courier position'));
      }, 10000); // 10 second timeout

      const unsubscribe = this.subscribe(WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE, (data) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve({
          latitude: data.latitude || data.courierLatitude,
          longitude: data.longitude || data.courierLongitude,
          timestamp: Date.now(),
        });
      });

      // Send get_position request
      try {
        const positionRequest = {
          command: 'message',
          identifier: JSON.stringify({
            channel: 'CourierPositionChannel',
          }),
          data: JSON.stringify({
            action: 'get_position',
          }),
        };

        if (!this.send(positionRequest)) {
          clearTimeout(timeout);
          unsubscribe();
          reject(new Error('Failed to send position request'));
        }
      } catch (error) {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    });
  }

  /**
   * Request courier position without promise (for polling)
   */
  requestCourierPosition() {
    if (!this.isConnected()) {
      console.log('📡 WebSocket not connected, skipping position request');
      return false;
    }

    try {
      const positionRequest = {
        command: 'message',
        identifier: JSON.stringify({
          channel: 'CourierPositionChannel',
        }),
        data: JSON.stringify({
          action: 'get_position',
        }),
      };

      if (this.send(positionRequest)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting courier position:', error);
      return false;
    }
  }

  /**
   * Start automatic courier position polling
   * @param {number} intervalMs - Polling interval in milliseconds (default: 4000)
   */
  startCourierPositionPolling(intervalMs = null) {
    if (this.positionPollingInterval) {
      return;
    }

    if (intervalMs) {
      this.positionPollingIntervalMs = intervalMs;
    }

    this.positionPollingEnabled = true;

    // Request initial position immediately
    this.requestCourierPosition();

    // Set up interval for regular polling
    this.positionPollingInterval = setInterval(() => {
      if (this.positionPollingEnabled && this.isConnected()) {
        this.requestCourierPosition();
      }
    }, this.positionPollingIntervalMs);
  }

  /**
   * Stop automatic courier position polling
   */
  stopCourierPositionPolling() {
    if (this.positionPollingInterval) {
      clearInterval(this.positionPollingInterval);
      this.positionPollingInterval = null;
    }
    this.positionPollingEnabled = false;
  }

  /**
   * Check if position polling is active
   * @returns {boolean}
   */
  isPollingActive() {
    return this.positionPollingEnabled && this.positionPollingInterval !== null;
  }

  /**
   * Handle WebSocket message event for Action Cable
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle Action Cable message types
      if (data.type === 'ping') {
        // Action Cable ping - no response needed
        return;
      }

      if (data.type === 'pong') {
        // Clear heartbeat timeout on pong response
        if (this.heartbeatTimeout) {
          clearTimeout(this.heartbeatTimeout);
          this.heartbeatTimeout = null;
        }
        return;
      }

      if (data.type === 'welcome') {
        console.log('Action Cable welcome received');
        this.setConnectionState(CONNECTION_STATES.CONNECTED);

        // Send subscription after welcome
        this.sendAuthMessage();
        return;
      }

      if (data.type === 'confirm_subscription') {
        console.log('Action Cable subscription confirmed for:', data.identifier);
        // Start automatic courier position polling instead of one-time request
        this.startCourierPositionPolling();
        return;
      }

      if (data.type === 'reject_subscription') {
        console.error('Action Cable subscription rejected for:', data.identifier);
        this.emit(WEBSOCKET_EVENTS.ERROR, {
          error: 'Subscription rejected - check authentication',
          context: 'subscription_rejected',
          identifier: data.identifier,
        });
        // Stop position requests if subscription is rejected
        this.clearPositionRequests();
        return;
      }

      if (data.type === 'disconnect') {
        console.error('Action Cable disconnected:', data.reason);
        if (data.reason === 'unauthorized') {
          this.emit(WEBSOCKET_EVENTS.ERROR, {
            error: 'Unauthorized - invalid or expired token',
            context: 'unauthorized_disconnect',
            reason: data.reason,
          });
        }
        return;
      }

      // Handle real-time courier position broadcasts from server
      if (data.message) {
        console.log('Received real-time courier position update:', data.message);
        this.emit(WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE, data.message);
        return;
      }

      // Emit generic message received event
      this.emit(WEBSOCKET_EVENTS.MESSAGE_RECEIVED, data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit(WEBSOCKET_EVENTS.ERROR, { error, context: 'message_parsing' });
    }
  }

  /**
   * Handle WebSocket error event
   * @param {Event} event - WebSocket error event
   */
  handleError(event) {
    console.error('WebSocket error:', event);
    this.setConnectionState(CONNECTION_STATES.ERROR);
    this.emit(WEBSOCKET_EVENTS.ERROR, { error: event, context: 'connection_error' });
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.clearHeartbeat();
    this.ws = null;

    if (!this.isManualDisconnect) {
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      this.scheduleReconnect();
    }
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    // Action Cable handles heartbeat automatically
    // No custom heartbeat needed
  }

  /**
   * Clear heartbeat timers
   */
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.isManualDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.setConnectionState(CONNECTION_STATES.ERROR);
      }
      return;
    }

    this.clearReconnectTimer();

    const timeout = this.reconnectTimeouts[this.reconnectAttempts] || 16000;
    console.log(
      `Scheduling WebSocket reconnection attempt ${this.reconnectAttempts + 1} in ${timeout}ms`,
    );

    this.setConnectionState(CONNECTION_STATES.RECONNECTING);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }

  /**
   * Clear reconnection timer
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear any pending position requests
   */
  clearPositionRequests() {
    // This is a placeholder function to prevent errors
    // Position requests are handled by getCourierLocation() promise timeout
    console.log('Clearing position requests');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.disconnect();
    this.subscribers.clear();
  }
}

// Export connection states and events for external use
export { CONNECTION_STATES, WEBSOCKET_EVENTS };

// Global WebSocket service instance
export const webSocketService = new WebSocketService();
