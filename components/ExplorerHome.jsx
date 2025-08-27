import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, G, ClipPath, Rect, Defs } from 'react-native-svg';
import Carousel from '@brandingbrand/react-native-snap-carousel';
import FoodTypesHeader from './FoodTypesHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ExplorerHome({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);

  const slideImages = [
          require('../assets/images/slide-1.png'),
      require('../assets/images/slide-2.png'),
      require('../assets/images/slide-3.png'),
      require('../assets/images/slide-4.png'),
      require('../assets/images/slide-5.png')
  ];

  const renderSlideItem = ({ item, index }) => {
    return (
      <View style={styles.slideItem}>
        <Image
          source={item}
          style={styles.slideImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const onSnapToItem = (index) => {
    setCurrentSlide(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.searchIcon}>
            <Path d="M7.33335 12C9.91068 12 12 9.91068 12 7.33335C12 4.75602 9.91068 2.66669 7.33335 2.66669C4.75602 2.66669 2.66669 4.75602 2.66669 7.33335C2.66669 9.91068 4.75602 12 7.33335 12Z" fill="white" stroke="#fecd15" strokeWidth="1.33333"/>
            <Path d="M13.3334 13.3334L11.3334 11.3334" stroke="#fecd15" strokeWidth="1.33333" strokeLinecap="round"/>
          </Svg>

          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#000"
          />

          <Svg width="16" height="16" viewBox="0 0 16 16" style={styles.micIcon}>
            <Path d="M8 9.33331C9.10667 9.33331 10 8.43998 10 7.33331V3.33331C10 2.22665 9.10667 1.33331 8 1.33331C6.89333 1.33331 6 2.22665 6 3.33331V7.33331C6 8.43998 6.89333 9.33331 8 9.33331Z" fill="black"/>
            <Path d="M11.3334 7.33331C11.3334 9.17331 9.84004 10.6666 8.00004 10.6666C6.16004 10.6666 4.66671 9.17331 4.66671 7.33331H3.33337C3.33337 9.68665 5.07337 11.62 7.33337 11.9466V14H8.66671V11.9466C10.9267 11.62 12.6667 9.68665 12.6667 7.33331H11.3334Z" fill="black"/>
          </Svg>
        </View>
      </View>

      {/* Location Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationContent}>
          <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.locationIcon}>
            <Path d="M12 1.5C9.81273 1.50248 7.71575 2.37247 6.16911 3.91911C4.62247 5.46575 3.75248 7.56273 3.75 9.75C3.75 16.8094 11.25 22.1409 11.5697 22.3641C11.6958 22.4524 11.846 22.4998 12 22.4998C12.154 22.4998 12.3042 22.4524 12.4303 22.3641C12.75 22.1409 20.25 16.8094 20.25 9.75C20.2475 7.56273 19.3775 5.46575 17.8309 3.91911C16.2843 2.37247 14.1873 1.50248 12 1.5ZM12 6.75C12.5933 6.75 13.1734 6.92595 13.6667 7.25559C14.1601 7.58524 14.5446 8.05377 14.7716 8.60195C14.9987 9.15013 15.0581 9.75333 14.9424 10.3353C14.8266 10.9172 14.5409 11.4518 14.1213 11.8713C13.7018 12.2909 13.1672 12.5766 12.5853 12.6924C12.0033 12.8081 11.4001 12.7487 10.8519 12.5216C10.3038 12.2946 9.83524 11.9101 9.50559 11.4167C9.17595 10.9234 9 10.3433 9 9.75C9 8.95435 9.31607 8.19129 9.87868 7.62868C10.4413 7.06607 11.2044 6.75 12 6.75Z" fill="#2D1E2F"/>
          </Svg>
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>Office</Text>
            <Text style={styles.locationAddress}>H-11, First Floor, Sector 63, Noida, Uttar...</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('MapPage')}
          style={styles.currentLocationButton}
          activeOpacity={0.7}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.currentLocationIcon}>
            <Path d="M12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z" fill="red"/>
            <Path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C12.1989 1.25 12.3897 1.32902 12.5303 1.46967C12.671 1.61032 12.75 1.80109 12.75 2V3.282C14.8038 3.45905 16.7293 4.35539 18.1869 5.81306C19.6446 7.27073 20.541 9.19616 20.718 11.25H22C22.1989 11.25 22.3897 11.329 22.5303 11.4697C22.671 11.6103 22.75 11.8011 22.75 12C22.75 12.1989 22.671 12.3897 22.5303 12.5303C22.3897 12.671 22.1989 12.75 22 12.75H20.718C20.541 14.8038 19.6446 16.7293 18.1869 18.1869C16.7293 19.6446 14.8038 20.541 12.75 20.718V22C12.75 22.1989 12.671 22.3897 12.5303 22.5303C12.3897 22.671 12.1989 22.75 12 22.75C11.8011 22.75 11.6103 22.671 11.4697 22.5303C11.329 22.3897 11.25 22.1989 11.25 22V20.718C9.19616 20.541 7.27073 19.6446 5.81306 18.1869C4.35539 16.7293 3.45905 14.8038 3.282 12.75H2C1.80109 12.75 1.61032 12.671 1.46967 12.5303C1.32902 12.3897 1.25 12.1989 1.25 12C1.25 11.8011 1.32902 11.6103 1.46967 11.4697C1.61032 11.329 1.80109 11.25 2 11.25H3.282C3.45905 9.19616 4.35539 7.27073 5.81306 5.81306C7.27073 4.35539 9.19616 3.45905 11.25 3.282V2C11.25 1.80109 11.329 1.61032 11.4697 1.46967C11.6103 1.32902 11.8011 1.25 12 1.25ZM4.75 12C4.75 12.9521 4.93753 13.8948 5.30187 14.7745C5.66622 15.6541 6.20025 16.4533 6.87348 17.1265C7.5467 17.7997 8.34593 18.3338 9.22554 18.6981C10.1052 19.0625 11.0479 19.25 12 19.25C12.9521 19.25 13.8948 19.0625 14.7745 18.6981C15.6541 18.3338 16.4533 17.7997 17.1265 17.1265C17.7997 16.4533 18.3338 15.6541 18.6981 14.7745C19.0625 13.8948 19.25 12.9521 19.25 12C19.25 10.0772 18.4862 8.23311 17.1265 6.87348C15.7669 5.51384 13.9228 4.75 12 4.75C10.0772 4.75 8.23311 5.51384 6.87348 6.87348C5.51384 8.23311 4.75 10.0772 4.75 12Z" fill="red"/>
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Hero Image */}
        <Carousel
          ref={carouselRef}
          data={slideImages}
          renderItem={renderSlideItem}
          sliderWidth={screenWidth}
          itemWidth={screenWidth}
          onSnapToItem={onSnapToItem}
          loop
          autoplay
          autoplayInterval={5000}
          style={styles.heroImage}
        />

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          {slideImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicatorDot,
                currentSlide === index && styles.pageIndicatorDotActive
              ]}
            />
          ))}
        </View>


        {/* Food Categories */}
        <View style={styles.categoriesContainer}>
          {/* What's on your mind */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>Hungry? Let’s roll.</Text>
          </View>

          {/* Food Types Header */}
          <FoodTypesHeader />

          {/* Grid Layout for Categories */}
          <View style={styles.categoriesGrid}>
            <TouchableOpacity style={styles.categoryItem}>
              <Image
                source={{uri: 'https://api.builder.io/api/v1/image/assets/TEMP/6441ea7b1bfe2c54c78e966c210007d5a55c13e0'}}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryText}>Italian</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.categoryItem}>
              <Image
                source={{uri: 'https://api.builder.io/api/v1/image/assets/TEMP/2c2fe82379ca9735853ab26649f88b157acf2af7'}}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryText}>Indian</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryItem}>
              <Image
                source={{uri: 'https://api.builder.io/api/v1/image/assets/TEMP/610510e9c226ff95cc39d7ff74c327fab433350b'}}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryText}>Mexican</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.categoryItem}>
              <Image
                source={{uri: 'https://api.builder.io/api/v1/image/assets/TEMP/afd733b2759b142eec2e1fe43c0abd685a902da5'}}
                style={styles.categoryImage}
                resizeMode="contain"
              />
              <Text style={styles.categoryText}>Spanish</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Load More Button */}
        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Svg width="32" height="32" viewBox="0 0 32 32">
            <Path d="M16 28L14.0666 26.2667C11.8222 24.2444 9.96663 22.5 8.49996 21.0333C7.03329 19.5667 5.86663 18.2498 4.99996 17.0827C4.13329 15.9164 3.52796 14.8444 3.18396 13.8667C2.83996 12.8889 2.66751 11.8889 2.66663 10.8667C2.66663 8.77777 3.36663 7.03332 4.76663 5.63333C6.16663 4.23333 7.91107 3.53333 9.99996 3.53333C11.1555 3.53333 12.2555 3.77777 13.3 4.26666C14.3444 4.75555 15.2444 5.44444 16 6.33333C16.7555 5.44444 17.6555 4.75555 18.7 4.26666C19.7444 3.77777 20.8444 3.53333 22 3.53333C24.0888 3.53333 25.8333 4.23333 27.2333 5.63333C28.6333 7.03332 29.3333 8.77777 29.3333 10.8667C29.3333 11.8889 29.1613 12.8889 28.8173 13.8667C28.4733 14.8444 27.8675 15.9164 27 17.0827C26.1333 18.2498 24.9666 19.5667 23.5 21.0333C22.0333 22.5 20.1777 24.2444 17.9333 26.2667L16 28Z" fill="#fecd15"/>
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Svg width="36" height="32" viewBox="0 0 36 32">
            <G clipPath="url(#clip0_29_622)">
              <Path d="M18 0C13.6506 0 10.125 3.52563 10.125 7.875C10.125 11.3912 15.2719 17.8 17.2437 20.1262C17.6431 20.5975 18.3575 20.5975 18.7563 20.1262C20.7281 17.8 25.875 11.3912 25.875 7.875C25.875 3.52563 22.3494 0 18 0ZM1.2575 13.4969C0.886361 13.6453 0.568207 13.9016 0.344068 14.2325C0.11993 14.5635 8.8888e-05 14.954 0 15.3538L0 30.9988C0 31.7063 0.714375 32.19 1.37125 31.9275L10 28V13.4325C9.4475 12.4338 8.99562 11.4613 8.67188 10.5312L1.2575 13.4969ZM18 22.4794C17.1206 22.4794 16.2887 22.0931 15.7181 21.4194C14.4894 19.9694 13.1825 18.3181 12 16.6244V27.9994L24 31.9994V16.625C22.8175 18.3181 21.5113 19.97 20.2819 21.42C19.7113 22.0931 18.8794 22.4794 18 22.4794ZM34.6287 10.0725L26 14V32L34.7425 28.5031C35.1137 28.3548 35.4319 28.0985 35.656 27.7675C35.8802 27.4366 36 27.046 36 26.6462V11.0013C36 10.2938 35.2856 9.81 34.6287 10.0725Z" fill="#fecd15"/>
            </G>

            <Defs>
              <ClipPath id="clip0_29_622">
                <Rect width="36" height="32" fill="#2D1E2F"/>
              </ClipPath>
            </Defs>
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exploreButton}>
          <View style={styles.exploreButtonBackground}>
            <Svg width="48" height="48" viewBox="0 0 48 48">
              <Path d="M13 35L28 28L35 13L20 20L13 35ZM24 26C23.4333 26 22.9587 25.808 22.576 25.424C22.1933 25.04 22.0013 24.5653 22 24C22 23.4333 22.192 22.9587 22.576 22.576C22.96 22.1933 23.4347 22.0013 24 22C24.5667 22 25.042 22.192 25.426 22.576C25.81 22.96 26.0013 23.4347 26 24C26 24.5667 25.808 25.042 25.424 25.426C25.04 25.81 24.5653 26.0013 24 26ZM24 44C21.2333 44 18.6333 43.4747 16.2 42.424C13.7667 41.3733 11.65 39.9487 9.85 38.15C8.05 36.35 6.62533 34.2333 5.576 31.8C4.52667 29.3667 4.00133 26.7667 4 24C4 21.2333 4.52533 18.6333 5.576 16.2C6.62667 13.7667 8.05133 11.65 9.85 9.85C11.65 8.05 13.7667 6.62533 16.2 5.576C18.6333 4.52667 21.2333 4.00133 24 4C26.7667 4 29.3667 4.52533 31.8 5.576C34.2333 6.62667 36.35 8.05133 38.15 9.85C39.95 11.65 41.3753 13.7667 42.426 16.2C43.4767 18.6333 44.0013 21.2333 44 24C44 26.7667 43.4747 29.3667 42.424 31.8C41.3733 34.2333 39.9487 36.35 38.15 38.15C36.35 39.95 34.2333 41.3753 31.8 42.426C29.3667 43.4767 26.7667 44.0013 24 44Z" fill="#2D1E2F"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Svg width="32" height="32" viewBox="0 0 32 32">
            <Path fillRule="evenodd" clipRule="evenodd" d="M16 1.33337C15.6178 1.33332 15.24 1.41544 14.8923 1.57416C14.5446 1.73287 14.2351 1.96448 13.9847 2.25329C13.7343 2.5421 13.549 2.88135 13.4412 3.24806C13.3334 3.61477 13.3057 4.00036 13.36 4.37871C11.4275 4.94927 9.73142 6.12967 8.52506 7.7436C7.31869 9.35753 6.66678 11.3184 6.66667 13.3334V24H5.33333C4.97971 24 4.64057 24.1405 4.39052 24.3906C4.14048 24.6406 4 24.9798 4 25.3334C4 25.687 4.14048 26.0261 4.39052 26.2762C4.64057 26.5262 4.97971 26.6667 5.33333 26.6667H26.6667C27.0203 26.6667 27.3594 26.5262 27.6095 26.2762C27.8595 26.0261 28 25.687 28 25.3334C28 24.9798 27.8595 24.6406 27.6095 24.3906C27.3594 24.1405 27.0203 24 26.6667 24H25.3333V13.3334C25.3332 11.3184 24.6813 9.35753 23.4749 7.7436C22.2686 6.12967 20.5725 4.94927 18.64 4.37871C18.6943 4.00036 18.6666 3.61477 18.5588 3.24806C18.451 2.88135 18.2657 2.5421 18.0153 2.25329C17.7649 1.96448 17.4554 1.73287 17.1077 1.57416C16.76 1.41544 16.3822 1.33332 16 1.33337ZM18.6667 29.3334C18.6667 29.687 18.5262 30.0261 18.2761 30.2762C18.0261 30.5262 17.687 30.6667 17.3333 30.6667H14.6667C14.313 30.6667 13.9739 30.5262 13.7239 30.2762C13.4738 30.0261 13.3333 29.687 13.3333 29.3334C13.3333 28.9798 13.4738 28.6406 13.7239 28.3906C13.9739 28 14.313 28 14.6667 28H17.3333C17.687 28 18.0261 28.1405 18.2761 28.3906C18.5262 28.6406 18.6667 28.9798 18.6667 29.3334Z" fill="#fecd15"/>
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Svg width="32" height="32" viewBox="0 0 32 32">
            <Path d="M5.33337 29.3334C5.33337 26.5044 6.45718 23.7913 8.45757 21.7909C10.458 19.7905 13.1711 18.6667 16 18.6667C18.829 18.6667 21.5421 19.7905 23.5425 21.7909C25.5429 23.7913 26.6667 26.5044 26.6667 29.3334H5.33337ZM16 17.3334C11.58 17.3334 8.00004 13.7534 8.00004 9.33337C8.00004 4.91337 11.58 1.33337 16 1.33337C20.42 1.33337 24 4.91337 24 9.33337C24 13.7534 20.42 17.3334 16 17.3334Z" fill="#fecd15"/>
          </Svg>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#2D1E2F',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 12,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  timeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 0.1,
    borderColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 5,
    backgroundColor: 'white'
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000',
    paddingVertical: 0,
  },
  micIcon: {
    marginLeft: 5,
  },
  locationBar: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 3,
  },
  locationText: {
    marginLeft: 4,
  },
  locationTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  locationAddress: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    maxWidth: 237,
  },
  currentLocationIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  currentLocationButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: screenWidth,
    height: 250,
  },
  slideItem: {
    width: screenWidth,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: screenWidth,
    height: 250,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 15,
    gap: 21,
  },
  pageIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  pageIndicatorDotActive: {
    backgroundColor: '#fecd15',
  },
  questionText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1E2F',
    textAlign: 'center',
  },
  questionHeader: {
    backgroundColor: '#fecd15',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesContainer: {
    paddingHorizontal: 27,
    marginTop: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryItem: {
    width: '48%', // Two items per row
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryImage: {
    width: '100%',
    height: 100, // Fixed height for category images
    marginBottom: 10,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: 'rgba(254, 205, 21, 0.25)',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  loadMoreText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 27,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    position: 'relative',
    backgroundColor: '#2D1E2F',
    borderTopColor: 'black',
    borderTopWidth: 3,
    boxShadow: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);'
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreButton: {
    position: 'relative',
    marginTop: -25,
  },
  exploreButtonBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fecd15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
