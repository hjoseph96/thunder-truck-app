import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG content as strings (extracted from the actual SVG files)
const visaSvg = `<svg width="800px" height="800px" viewBox="0 -140 780 780" enable-background="new 0 0 780 500" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M40,0h700c22.092,0,40,17.909,40,40v420c0,22.092-17.908,40-40,40H40c-22.091,0-40-17.908-40-40V40   C0,17.909,17.909,0,40,0z" fill="#0E4595"/><path d="m293.2 348.73l33.361-195.76h53.36l-33.385 195.76h-53.336zm246.11-191.54c-10.57-3.966-27.137-8.222-47.822-8.222-52.725 0-89.865 26.55-90.18 64.603-0.299 28.13 26.514 43.822 46.752 53.186 20.771 9.595 27.752 15.714 27.654 24.283-0.131 13.121-16.586 19.116-31.922 19.116-21.357 0-32.703-2.967-50.227-10.276l-6.876-3.11-7.489 43.823c12.463 5.464 35.51 10.198 59.438 10.443 56.09 0 92.5-26.246 92.916-66.882 0.199-22.269-14.016-39.216-44.801-53.188-18.65-9.055-30.072-15.099-29.951-24.268 0-8.137 9.668-16.839 30.557-16.839 17.449-0.27 30.09 3.535 39.938 7.5l4.781 2.26 7.232-42.429m137.31-4.223h-41.232c-12.773 0-22.332 3.487-27.941 16.234l-79.244 179.4h56.031s9.16-24.123 11.232-29.418c6.125 0 60.555 0.084 68.338 0.084 1.596 6.853 6.49 29.334 6.49 29.334h49.514l-43.188-195.64zm-65.418 126.41c4.412-11.279 21.26-54.723 21.26-54.723-0.316 0.522 4.379-11.334 7.074-18.684l3.605 16.879s10.219 46.729 12.354 56.528h-44.293zm-363.3-126.41l-52.24 133.5-5.567-27.13c-9.725-31.273-40.025-65.155-73.898-82.118l47.766 171.2 56.456-0.064 84.004-195.39h-56.521" fill="#ffffff"/><path d="m146.92 152.96h-86.041l-0.681 4.073c66.938 16.204 111.23 55.363 129.62 102.41l-18.71-89.96c-3.23-12.395-12.597-16.094-24.186-16.527" fill="#F2AE14"/></svg>`;

// For now, let's use a simplified approach with basic shapes for other cards
// You can replace these with the actual SVG content from your files
const mastercardSvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#EB001B"/><circle cx="9" cy="7.5" r="3" fill="#F79E1B"/><circle cx="15" cy="7.5" r="3" fill="#FF5F00"/><path d="M12 4.5c1.2 0 2.3.5 3 1.3-1.4.8-2.3 2.3-2.3 4 0 1.7.9 3.2 2.3 4-.7.8-1.8 1.3-3 1.3s-2.3-.5-3-1.3c1.4-.8 2.3-2.3 2.3-4 0-1.7-.9-3.2-2.3-4 .7-.8 1.8-1.3 3-1.3z" fill="white"/></svg>`;

const amexSvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#006FCF"/><text x="12" y="9" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">AMEX</text></svg>`;

const discoverSvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#FF6000"/><circle cx="7" cy="7.5" r="2" fill="white"/><text x="12" y="9" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">DISCOVER</text></svg>`;

const dinersSvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#0079BE"/><circle cx="12" cy="7.5" r="3" fill="white"/><text x="12" y="9" text-anchor="middle" fill="#0079BE" font-family="Arial" font-size="6" font-weight="bold">DC</text></svg>`;

const jcbSvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#003087"/><text x="12" y="9" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">JCB</text></svg>`;

const unionpaySvg = `<svg viewBox="0 0 24 15" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="15" rx="2" fill="#E21836"/><text x="12" y="9" text-anchor="middle" fill="white" font-family="Arial" font-size="6" font-weight="bold">UNIONPAY</text></svg>`;

const CreditCardIcon = ({ brand, size = 48, style }) => {
  const iconHeight = size * 0.63; // Standard credit card aspect ratio

  const renderIcon = () => {
    const brandLower = brand?.toLowerCase();
    
    switch (brandLower) {
      case 'visa':
        return (
          <SvgXml
            xml={visaSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'mastercard':
      case 'master':
        return (
          <SvgXml
            xml={mastercardSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'amex':
      case 'american_express':
      case 'americanexpress':
        return (
          <SvgXml
            xml={amexSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'discover':
        return (
          <SvgXml
            xml={discoverSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'diners':
      case 'diners_club':
      case 'dinersclub':
        return (
          <SvgXml
            xml={dinersSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'jcb':
        return (
          <SvgXml
            xml={jcbSvg}
            width={size}
            height={iconHeight}
          />
        );
      case 'unionpay':
      case 'union_pay':
        return (
          <SvgXml
            xml={unionpaySvg}
            width={size}
            height={iconHeight}
          />
        );
      default:
        // Fallback to Visa icon for unknown brands
        return (
          <SvgXml
            xml={visaSvg}
            width={size}
            height={iconHeight}
          />
        );
    }
  };

  return (
    <View style={[{ width: size, height: size * 0.63 }, style]}>
      {renderIcon()}
    </View>
  );
};

export default CreditCardIcon;
