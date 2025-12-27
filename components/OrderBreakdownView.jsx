import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchOrder } from '../lib/order-service';

const { width: screenWidth } = Dimensions.get('window');

const OrderBreakdownView = ({ route, navigation }) => {
  const { orderIds } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await Promise.all(
        orderIds.map((orderId) => fetchOrder(orderId))
      );
      
      // Filter out any orders without foodTruck (shouldn't happen since we skip parent)
      // but adding as safety check
      const vendorOrders = fetchedOrders.filter(order => order.vendor);
      
      setOrders(vendorOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9800';
      case 'preparing':
        return '#2196F3';
      case 'delivering':
        return '#9C27B0';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'hourglass-empty';
      case 'preparing':
        return 'restaurant';
      case 'delivering':
        return 'local-shipping';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB9C12" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Failed to load orders</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllOrders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2D1E2F" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Your Orders</Text>
          <Text style={styles.headerSubtitle}>{orders.length} vendor{orders.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color="#FB9C12" />
          <Text style={styles.infoText}>
            You ordered from multiple vendors. Track each order separately below.
          </Text>
        </View>

        {orders.map((order, index) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => handleOrderPress(order.id)}
            activeOpacity={0.7}
          >
            {/* Vendor Header */}
            <View style={styles.vendorHeader}>
              <View style={styles.vendorImageContainer}>
                {order.vendor?.logoUrl ? (
                  <Image
                    source={{ uri: order.vendor.logoUrl }}
                    style={styles.vendorImage}
                  />
                ) : (
                  <View style={styles.vendorImagePlaceholder}>
                    <MaterialIcons name="local-shipping" size={24} color="#999" />
                  </View>
                )}
              </View>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{order.vendor?.name || 'Unknown Vendor'}</Text>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderNumber}>Order #{order.id.slice(-8)}</Text>
                </View>
              </View>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <MaterialIcons name={getStatusIcon(order.status)} size={16} color="#FFF" />
              <Text style={styles.statusText}>{order.status?.toUpperCase()}</Text>
            </View>

            {/* Order Items Summary */}
            <View style={styles.itemsSummary}>
              <Text style={styles.itemsSummaryTitle}>Items ({order.orderItems?.length || 0})</Text>
              {order.orderItems?.slice(0, 3).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemQuantity}>×{item.quantity || 1}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.menuItemName}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.totalPriceCents)}
                  </Text>
                </View>
              ))}
              {order.orderItems?.length > 3 && (
                <Text style={styles.moreItemsText}>
                  +{order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Order Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalCents)}</Text>
            </View>

            {/* Delivery Address */}
            {order.orderAddresses?.[0] && (
              <View style={styles.addressSection}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {order.orderAddresses[0].streetLineOne}, {order.orderAddresses[0].city}
                </Text>
              </View>
            )}

            {/* View Details Arrow */}
            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Details & Track</Text>
              <MaterialIcons name="chevron-right" size={24} color="#FB9C12" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
      },
    }),
  },
  header: {
    backgroundColor: '#2D1E2F',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: 16,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D38105',
    letterSpacing: -0.3,
    fontFamily: 'Cairo',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Cairo',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 82,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
    fontFamily: 'Cairo',
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  vendorImage: {
    width: 56,
    height: 56,
  },
  vendorImagePlaceholder: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Cairo',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 6,
    fontFamily: 'Cairo',
    letterSpacing: 0.5,
  },
  itemsSummary: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  itemsSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB9C12',
    width: 32,
    fontFamily: 'Cairo',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  moreItemsText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 32,
    fontFamily: 'Cairo',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#132a13',
    fontFamily: 'Cairo',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FB9C12',
    fontFamily: 'Cairo',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Cairo',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FB9C12',
    marginRight: 4,
    fontFamily: 'Cairo',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Cairo',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#132a13',
    marginTop: 16,
    fontFamily: 'Cairo',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FB9C12',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default OrderBreakdownView;
