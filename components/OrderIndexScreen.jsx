import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fetchUserOrders, formatOrdersForDisplay } from '../lib/order-service';

// Filter options - individual statuses
const FILTER_OPTIONS = [
  { id: 'pending', label: 'Pending', statuses: ['pending'] },
  { id: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { id: 'delivering', label: 'Delivering', statuses: ['delivering'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
  { id: 'completed', label: 'Completed', statuses: ['completed'] },
];

export default function OrderIndexScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('pending'); // Default to pending
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Load initial orders when filter changes
  useEffect(() => {
    const loadInitialOrders = async () => {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
      try {
        const currentFilter = FILTER_OPTIONS.find(f => f.id === selectedFilter);
        const status = currentFilter ? currentFilter.statuses : ['pending', 'preparing', 'delivering'];

        const response = await fetchUserOrders({
          status,
          perPage: 10,
          page: 1,
        });

        if (response.orders) {
          const formattedOrders = formatOrdersForDisplay(response.orders);
          setOrders(formattedOrders);
          setTotalCount(response.totalCount || 0);
          setHasMore(formattedOrders.length < (response.totalCount || 0));
        } else {
          setOrders([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadInitialOrders();
  }, [selectedFilter]);

  // Load more orders for infinite scroll
  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const currentFilter = FILTER_OPTIONS.find(f => f.id === selectedFilter);
      const status = currentFilter ? currentFilter.statuses : ['pending', 'preparing', 'delivering'];
      const nextPage = currentPage + 1;

      const response = await fetchUserOrders({
        status,
        perPage: 10,
        page: nextPage,
      });

      if (response.orders && response.orders.length > 0) {
        const formattedOrders = formatOrdersForDisplay(response.orders);
        setOrders(prevOrders => [...prevOrders, ...formattedOrders]);
        setCurrentPage(nextPage);

        // Check if there are more orders to load
        const totalLoaded = orders.length + formattedOrders.length;
        setHasMore(totalLoaded < (response.totalCount || 0));
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more orders:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll to bottom
  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 20;

    // Check if user scrolled to bottom
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreOrders();
    }
  };

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

  const currentFilterLabel = FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label || 'Pending';

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

      {/* Horizontal Filter List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No {currentFilterLabel} Orders
            </Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'pending'
                ? "You don't have any pending orders right now."
                : selectedFilter === 'preparing'
                ? "You don't have any orders being prepared."
                : selectedFilter === 'delivering'
                ? "You don't have any orders being delivered."
                : selectedFilter === 'completed'
                ? "You haven't completed any orders yet."
                : selectedFilter === 'cancelled'
                ? "You don't have any cancelled orders."
                : "You don't have any orders."}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {currentFilterLabel} Orders
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
                      {order.vendor?.name || 'Unknown Restaurant'}
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

            {/* Loading more indicator */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingMoreText}>Loading more orders...</Text>
              </View>
            )}

            {/* End of list indicator */}
            {!hasMore && displayOrders.length > 0 && (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>No more orders to load</Text>
              </View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: '#FFF',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '100%',
      },
    }),
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
  filterScrollView: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 65,
        left: 0,
        right: 0,
        zIndex: 99,
        width: '100%',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2D1E2F',
    borderColor: '#2D1E2F',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Poppins',
  },
  filterChipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        position: 'absolute',
        top: 125,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 40,
      },
    }),
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
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins',
    fontStyle: 'italic',
  },
});
