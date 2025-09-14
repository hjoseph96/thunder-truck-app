import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const UserAddressList = ({ navigation, route }) => {
  const { userAddresses } = route.params || { userAddresses: [] };

  const renderAddressItem = ({ item: address }) => (
    <TouchableOpacity 
      style={styles.addressItem}
      onPress={() => {
        // Navigate back to CheckoutForm with selected address
        navigation.navigate('CheckoutForm', { selectedAddress: address });
      }}
    >
      <View style={styles.addressItemContent}>
        {/* Map Marker Icon - Fixed Left */}
        <View style={styles.markerContainer}>
          <MaterialIcons name="place" size={24} color="red" />
        </View>

        {/* Address Details Section */}
        <View style={styles.addressDetails}>
          {address.label && (
            <Text style={styles.addressLabel}>{address.label}</Text>
          )}
          <Text style={styles.addressStreet}>{address.streetLineOne}</Text>
          <Text style={styles.addressCity}>
            {address.city}, {address.state}
          </Text>
        </View>

        {/* Right Caret - Fixed Right */}
        <View style={styles.caretContainer}>
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Address</Text>
        </View>

        <View style={styles.headerSpacer} />

        <Text style={styles.headerTitleCount}>({userAddresses.length} addresses)</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Address List */}
      <View style={styles.listContainer}>
        {userAddresses.length > 0 ? (
          <FlatList
            data={userAddresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No addresses found</Text>
            <Text style={styles.emptySubtext}>Add your first address to get started</Text>
          </View>
        )}
      </View>

      {/* Add New Address Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addAddressButton}
          onPress={() => navigation.navigate('AddAddressForm') }
        >
          <MaterialIcons name="add" size={24} color="#132a13" />
          <Text style={styles.addAddressButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FB9C12'
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'whitesmoke',
    fontFamily: 'Cairo',
  },
  headerTitleCount: {
    fontSize: 8,
    fontWeight: '200',
    color: 'whitesmoke',
    fontFamily: 'Cairo',
  },
  headerSpacer: {
    width: 40,
  },
  listContainer: {
    flex: 1,
    width: '100%'
  },
  listContent: {
    width: '100%',
  },
  addressItem: {
    backgroundColor: '#fff',
    elevation: 3,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addressItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  markerContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  addressDetails: {
    flex: 1,
    marginRight: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#132a13',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  addressStreet: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Cairo',
  },
  addressCity: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Cairo',
  },
  caretContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addAddressButton: {
    backgroundColor: '#FECD15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addAddressButtonText: {
    color: '#132a13',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Cairo',
  },
});

export default UserAddressList;
