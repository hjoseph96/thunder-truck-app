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
      eventSubscribers.forEach(callback => {
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
    if (this.connectionState === CONNECTION_STATES.CONNECTING ||
        this.connectionState === CONNECTION_STATES.CONNECTED) {
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

      // Create WebSocket connection
      const wsUrl = CURRENT_API_CONFIG.websocketURL;
      console.log('Connecting to WebSocket:', wsUrl);

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

    // Send authentication message
    this.sendAuthMessage();
  }

  /**
   * Send authentication message
   */
  sendAuthMessage() {
    if (!this.authToken) {
      console.error('No auth token available for WebSocket authentication');
      this.disconnect();
      return;
    }

    const authMessage = {
      command: 'subscribe',
      identifier: JSON.stringify({
        channel: 'CourierLocationChannel',
        token: this.authToken,
      }),
    };

    if (this.send(authMessage)) {
      console.log('WebSocket authentication message sent');
    } else {
      console.error('Failed to send WebSocket authentication message');
      this.disconnect();
    }
  }

  /**
   * Handle WebSocket message event
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle different message types
      if (data.type === 'ping') {
        // Respond to ping with pong
        this.send({ type: 'pong' });
        return;
      }

      if (data.type === 'welcome') {
        this.setConnectionState(CONNECTION_STATES.CONNECTED);
        this.startHeartbeat();
        console.log('WebSocket authentication successful');
        return;
      }

      if (data.type === 'confirm_subscription') {
        console.log('WebSocket subscription confirmed for:', data.identifier);
        return;
      }

      if (data.message && data.message.type === 'courier_location_update') {
        // Handle courier location updates
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
    this.clearHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('WebSocket heartbeat timeout - disconnecting');
          this.disconnect();
          this.scheduleReconnect();
        }, 10000); // 10 second timeout
      }
    }, 30000); // Send ping every 30 seconds
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
    console.log(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts + 1} in ${timeout}ms`);

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
