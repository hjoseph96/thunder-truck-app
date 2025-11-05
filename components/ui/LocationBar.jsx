import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const LocationBar = ({ navigation, onGPSPress, userData }) => {
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    const defaultAddress = userData?.userAddresses?.find(address => address.isDefault);
    setSelectedAddress(defaultAddress);
  }, []);

  const updateSelectedAddress = (address) => {
    setSelectedAddress(address);
  };

  const formatAddress = (address) => {
    if (!address) return 'No address set';
    
    const parts = [
      address.streetLineOne,
      address.streetLineTwo,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    const fullAddress = parts.join(', ');
    
    // Truncate if too long (similar to the static data)
    return fullAddress.length > 40 ? fullAddress.substring(0, 37) + '...' : fullAddress;
  };


  return (
    <View style={styles.locationBar}>
      <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.locationPin}>
        <Path
          d="M12 1.5C9.81273 1.50248 7.71575 2.37247 6.16911 3.91911C4.62247 5.46575 3.75248 7.56273 3.75 9.75C3.75 16.8094 11.25 22.1409 11.5697 22.3641C11.6958 22.4524 11.846 22.4998 12 22.4998C12.154 22.4998 12.3042 22.4524 12.4303 22.3641C12.75 22.1409 20.25 16.8094 20.25 9.75C20.2475 7.56273 19.3775 5.46575 17.8309 3.91911C16.2843 2.37247 14.1873 1.50248 12 1.5ZM12 6.75C12.5933 6.75 13.1734 6.92595 13.6667 7.25559C14.1601 7.58524 14.5446 8.05377 14.7716 8.60195C14.9987 9.15013 15.0581 9.75333 14.9424 10.3353C14.8266 10.9172 14.5409 11.4518 14.1213 11.8713C13.7018 12.2909 13.1672 12.5766 12.5853 12.6924C12.0033 12.8081 11.4001 12.7487 10.8519 12.5216C10.3038 12.2946 9.83524 11.9101 9.50559 11.4167C9.17595 10.9234 9 10.3433 9 9.75C9 8.95435 9.31607 8.19129 9.87868 7.62868C10.4413 7.06607 11.2044 6.75 12 6.75Z"
          fill="#EE6C4D"
        />
      </Svg>

      <TouchableOpacity 
        style={styles.locationText}
        onPress={() => navigation.navigate('UserAddressList', { userAddresses: userData?.userAddresses, onAddressSelect: updateSelectedAddress })} 
        activeOpacity={0.7}
      >
        <Text style={styles.locationTitle}>{selectedAddress?.label || 'Delivery Address'}</Text>
        <Text style={styles.locationSubtitle}>{formatAddress(selectedAddress) || 'No address set'}</Text>
      </TouchableOpacity>

       <TouchableOpacity style={styles.currentLocationIcon} onPress={onGPSPress} activeOpacity={0.7}>
        <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.currentLocationIcon}>
          <Path
            d="M12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z"
            fill="#EE6C4D"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 1.25C12.1989 1.25 12.3897 1.32902 12.5303 1.46967C12.671 1.61032 12.75 1.80109 12.75 2V3.282C14.8038 3.45905 16.7293 4.35539 18.1869 5.81306C19.6446 7.27073 20.541 9.19616 20.718 11.25H22C22.1989 11.25 22.3897 11.329 22.5303 11.4697C22.671 11.6103 22.75 11.8011 22.75 12C22.75 12.1989 22.671 12.3897 22.5303 12.5303C22.3897 12.671 22.1989 12.75 22 12.75H20.718C20.541 14.8038 19.6446 16.7293 18.1869 18.1869C16.7293 19.6446 14.8038 20.541 12.75 20.718V22C12.75 22.1989 12.671 22.3897 12.5303 22.5303C12.3897 22.671 12.1989 22.75 12 22.75C11.8011 22.75 11.6103 22.671 11.4697 22.5303C11.329 22.3897 11.25 22.1989 11.25 22V20.718C9.19616 20.541 7.27073 19.6446 5.81306 18.1869C4.35539 16.7293 3.45905 14.8038 3.282 12.75H2C1.80109 12.75 1.61032 12.671 1.46967 12.5303C1.32902 12.3897 1.25 12.1989 1.25 12C1.25 11.8011 1.32902 11.6103 1.46967 11.4697C1.61032 11.329 1.80109 11.25 2 11.25H3.282C3.45905 9.19616 4.35539 7.27073 5.81306 5.81306C7.27073 4.35539 9.19616 3.45905 11.25 3.282V2C11.25 1.80109 11.329 1.61032 11.4697 1.46967C11.6103 1.32902 11.8011 1.25 12 1.25ZM4.75 12C4.75 12.9521 4.93753 13.8948 5.30187 14.7745C5.66622 15.6541 6.20025 16.4533 6.87348 17.1265C7.5467 17.7997 8.34593 18.3338 9.22554 18.6981C10.1052 19.0625 11.0479 19.25 12 19.25C12.9521 19.25 13.8948 19.0625 14.7745 18.6981C15.6541 18.3338 16.4533 17.7997 17.1265 17.1265C17.7997 16.4533 18.3338 15.6541 18.6981 14.7745C19.0625 13.8948 19.25 12.9521 19.25 12C19.25 10.0772 18.4862 8.23311 17.1265 6.87348C15.7669 5.51384 13.9228 4.75 12 4.75C10.0772 4.75 8.23311 5.51384 6.87348 6.87348C5.51384 8.23311 4.75 10.0772 4.75 12Z"
            fill="#EE6C4D"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationPin: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter',
    marginTop: 2,
    textAlign: 'left',
  },
  currentLocationIcon: {
    marginLeft: 8,
  },
});