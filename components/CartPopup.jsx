import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

const CartPopup = ({
  visible,
  cartData,
  cartLoading,
  onClose,
  onQuantityChange,
  onCheckout,
  foodTruckId,
}) => {
  if (!visible) return null;

  const renderCartItems = () => {
    if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
      return (
        <Text style={styles.cartEmptyText}>Your cart is empty</Text>
      );
    }

    return (
      <View style={styles.cartItemsContainer}>
        <Text style={styles.cartItemsTitle}>Cart</Text>
        <View style={styles.cartItemsList}>
          {cartData.cartItems.map((cartItem) => {
            const totalPrice = (cartItem.menuItem.price * cartItem.quantity).toFixed(2);
            return (
              <View key={cartItem.id} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  {cartItem.menuItem.imageUrl && (
                    <Image
                      source={{ uri: cartItem.menuItem.imageUrl }}
                      style={styles.cartItemImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View style={styles.cartItemCenter}>
                  <Text style={styles.cartItemName}>{cartItem.menuItem.name}</Text>
                  {
                    cartItem.cartItemOptions.length > 0 && (
                      <Text style={styles.cartItemOption}>
                        {cartItem.cartItemOptions.map((option) => 
                          option.option.name + ' | ' + 
                          (option.option.price === 0 ? 
                            `$${option.option.price.toFixed(2)}` : 
                            `$${option.option.price.toFixed(2)}`
                          )
                        ).join(', ')}
                      </Text>
                    )
                  }
                  <Text style={styles.cartItemPrice}>${totalPrice}</Text>
                </View>
                <View style={styles.cartItemRight}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onQuantityChange(cartItem.id, -1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onQuantityChange(cartItem.id, 1)}
                    disabled={cartLoading}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.cartTotal}>
          <Text style={styles.cartTotalText}>Total: {cartData.totalPrice}</Text>
        </View>

        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => onCheckout(foodTruckId)}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* Backdrop to close popup when tapping outside */}
      <TouchableOpacity 
        style={styles.cartPopupBackdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={styles.cartPopup}>
        <View style={styles.cartPopupContent}>
          {cartLoading ? (
            <ActivityIndicator size="small" color="#F9B319" />
          ) : (
            <ScrollView 
              style={styles.cartPopupScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {renderCartItems()}
            </ScrollView>
          )}
        </View>
        <View style={styles.cartPopupTriangle} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  cartPopupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  cartPopup: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    zIndex: 999,
  },
  cartPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 300,
    height: 250,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cartPopupScroll: {
    flex: 1,
  },
  cartPopupTriangle: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  cartEmptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  cartItemsContainer: {
    width: '100%',
  },
  cartItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  cartItemsList: {
    width: '100%',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  cartItemLeft: {
    marginRight: 12,
  },
  cartItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  cartItemCenter: {
    flex: 1,
    marginRight: 12,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  cartItemOption: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#008000',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9B319',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Cairo',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#132a13',
    marginHorizontal: 12,
    fontFamily: 'Cairo',
  },
  cartTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  cartTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#132a13',
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
    fontFamily: 'Cairo',
    letterSpacing: 0.5,
  },
});

export default CartPopup;
