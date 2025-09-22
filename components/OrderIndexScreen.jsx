import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchUserOrders, formatOrdersForDisplay } from '../lib/order-service';

export default function OrderIndexScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const status = showAllOrders
          ? ['pending', 'preparing', 'delivering', 'cancelled']
          : ['preparing', 'delivering'];

        const response = await fetchUserOrders({
          status,
          perPage: 10,
          page: 1,
        });

        if (response.orders) {
          const formattedOrders = formatOrdersForDisplay(response.orders);
          setOrders(formattedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [showAllOrders]);

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order confirmed';
      case 'preparing':
        return 'Preparing your order...';
      case 'delivering':
        return 'Heading your way...';
      case 'completed':
        return 'Order delivered';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#2196F3';
      case 'preparing':
        return '#FF6B35';
      case 'delivering':
        return '#4CAF50';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButtonLeft} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M19 12H5M12 19L5 12L12 5"
                stroke="#2D1E2F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayOrders = orders;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButtonLeft} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="#2D1E2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity
          style={[styles.toggleButton, styles.headerButtonRight]}
          onPress={() => setShowAllOrders(!showAllOrders)}
        >
          <Text style={styles.toggleButtonText}>{showAllOrders ? 'Active' : 'All'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {showAllOrders ? 'No Orders' : 'No Active Orders'}
            </Text>
            <Text style={styles.emptyText}>
              {showAllOrders
                ? "You haven't placed any orders yet."
                : "You don't have any orders being prepared or delivered right now."}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {showAllOrders ? 'All Orders' : 'Active Orders'}
            </Text>
            {displayOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order)}
              >
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.foodTruckName} numberOfLines={1} ellipsizeMode="tail">
                      {order.foodTruck?.name || 'Unknown Restaurant'}
                    </Text>
                    <Text style={styles.orderNumber} numberOfLines={1} ellipsizeMode="tail">
                      Order #{order.id}
                    </Text>
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}
                  >
                    <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={[styles.statusMessage, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>

                <Text style={styles.estimatedTime}>Total: ${order.total}</Text>

                <View style={styles.itemsList}>
                  {order.formattedItems.map((item, index) => (
                    <View key={item.id || index} style={styles.itemRow}>
                      <Text style={styles.itemName}>✓ {item.menuItemName}</Text>
                      <Text style={styles.itemPrice}>${item.price}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButtonLeft: {
    position: 'absolute',
    left: 20,
  },
  headerButtonRight: {
    position: 'absolute',
    right: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  toggleButton: {
    backgroundColor: '#2D1E2F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
    marginTop: 20,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodTruckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1E2F',
    fontFamily: 'Poppins',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 2,
    marginLeft: 16,
  },
});
