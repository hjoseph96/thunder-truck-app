import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { webSocketService, WEBSOCKET_EVENTS } from '../lib/websocket-service';
import { courierTrackingManager } from '../lib/courier-tracking-service';

const WebSocketTestScreen = ({ navigation }) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [logs, setLogs] = useState([]);
  const [courierCount, setCourierCount] = useState(0);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev.slice(-20),
      {
        // Keep last 20 logs
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message,
        type,
        timestamp,
      },
    ]);
  };

  useEffect(() => {
    // Subscribe to WebSocket events
    const subscriptions = [
      webSocketService.subscribe(WEBSOCKET_EVENTS.CONNECTION_STATE_CHANGED, (data) => {
        setConnectionState(data.state);
        addLog(`Connection state: ${data.state}`, 'connection');
      }),

      webSocketService.subscribe(WEBSOCKET_EVENTS.COURIER_LOCATION_UPDATE, (data) => {
        addLog(`Courier update: ${JSON.stringify(data)}`, 'courier');
      }),

      webSocketService.subscribe(WEBSOCKET_EVENTS.ERROR, (data) => {
        addLog(`Error: ${data.error} (${data.context})`, 'error');
      }),

      webSocketService.subscribe(WEBSOCKET_EVENTS.MESSAGE_RECEIVED, (data) => {
        addLog(`Message: ${JSON.stringify(data)}`, 'message');
      }),
    ];

    // Subscribe to courier tracking updates
    const courierSubscription = courierTrackingManager.subscribe((event, data) => {
      setCourierCount(courierTrackingManager.getAllCouriers().length);
      addLog(`Courier tracking: ${event}`, 'tracking');
    });

    return () => {
      // Cleanup subscriptions
      subscriptions.forEach((unsubscribe) => unsubscribe());
      courierSubscription();
    };
  }, []);

  const handleConnect = async () => {
    try {
      addLog('Attempting to connect...', 'action');
      await webSocketService.connect();
    } catch (error) {
      addLog(`Connection failed: ${error.message}`, 'error');
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = () => {
    addLog('Disconnecting...', 'action');
    webSocketService.disconnect();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return '#ff4444';
      case 'connection':
        return '#4CAF50';
      case 'courier':
        return '#2196F3';
      case 'tracking':
        return '#FF9800';
      case 'action':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      case 'reconnecting':
        return '#FF9800';
      case 'error':
        return '#ff4444';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>WebSocket Test</Text>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connection:</Text>
        <Text style={[styles.statusValue, { color: getConnectionColor() }]}>
          {connectionState.toUpperCase()}
        </Text>
        <Text style={styles.statusLabel}>Couriers:</Text>
        <Text style={styles.statusValue}>{courierCount}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.connectButton]}
          onPress={handleConnect}
          disabled={connectionState === 'connected' || connectionState === 'connecting'}
        >
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.disconnectButton]}
          onPress={handleDisconnect}
          disabled={connectionState === 'disconnected'}
        >
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Real-time Updates:</Text>
        <Text style={styles.infoText}>
          Position updates are received automatically when couriers move. No manual requests needed.
        </Text>
      </View>

      {/* Logs */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Logs:</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearLogs}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <Text style={styles.logTimestamp}>{log.timestamp}</Text>
              <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                {log.message}
              </Text>
            </View>
          ))}
          {logs.length === 0 && <Text style={styles.noLogs}>No logs yet. Try connecting!</Text>}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#ff4444',
  },
  requestButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 15,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#666',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
  },
  logsScroll: {
    flex: 1,
  },
  logItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  noLogs: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default WebSocketTestScreen;
