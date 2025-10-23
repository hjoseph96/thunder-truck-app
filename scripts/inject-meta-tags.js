#!/usr/bin/env node

/**
 * Post-build script to inject SEO meta tags into the generated index.html
 * This ensures social media crawlers can see the meta tags without JavaScript execution
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

console.log('📝 Injecting SEO meta tags into dist/index.html...');

// Read the generated index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Define all the meta tags we want to inject
const metaTags = `
    <!-- Primary Meta Tags -->
    <meta name="title" content="ThunderTruck: Order Street Food Ahead and Track Real-Time Delivery" />
    <meta name="keywords" content="food truck, street food, food delivery, order ahead, real-time tracking, food truck locator, mobile food ordering, delivery tracking, local food, food truck app" />
    <meta name="author" content="ThunderTruck" />
    
    <!-- Open Graph / Facebook Meta Tags for Social Sharing -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://web.thundertruck.app" />
    <meta property="og:title" content="ThunderTruck: Order Street Food Ahead and Track Real-Time Delivery" />
    <meta property="og:description" content="Street food, minus the lines: locate trucks, order ahead, and watch your delivery in real time. ThunderTruck brings your favorites to you." />
    <meta property="og:image" content="https://web.thundertruck.app/images/thundertruck_icon.png" />
    <meta property="og:image:secure_url" content="https://web.thundertruck.app/images/thundertruck_icon.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="ThunderTruck - Order street food with real-time delivery tracking" />
    <meta property="og:site_name" content="ThunderTruck" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://web.thundertruck.app" />
    <meta name="twitter:title" content="ThunderTruck: Order Street Food Ahead and Track Real-Time Delivery" />
    <meta name="twitter:description" content="Street food, minus the lines: locate trucks, order ahead, and watch your delivery in real time. ThunderTruck brings your favorites to you." />
    <meta name="twitter:image" content="https://web.thundertruck.app/images/thundertruck_icon.png" />
    <meta name="twitter:image:alt" content="ThunderTruck - Order street food with real-time delivery tracking" />
    <meta name="twitter:creator" content="@thundertruck" />
    <meta name="twitter:site" content="@thundertruck" />
    
    <!-- Robots Meta Tag -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />
    
    <!-- Geographic Meta Tags -->
    <meta name="geo.region" content="US-NY" />
    <meta name="geo.placename" content="New York" />
    <meta name="geo.position" content="40.7081;-73.9571" />
    <meta name="ICBM" content="40.7081, -73.9571" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://web.thundertruck.app" />
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/images/thundertruck_icon.png" />
    
    <!-- Schema.org Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ThunderTruck",
      "alternateName": "ThunderTruck App",
      "url": "https://web.thundertruck.app",
      "logo": "https://web.thundertruck.app/images/thundertruck_icon.png",
      "description": "Street food, minus the lines: locate trucks, order ahead, and watch your delivery in real time. ThunderTruck brings your favorites to you.",
      "slogan": "Street food, minus the lines",
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@thundertruck.app",
        "availableLanguage": ["en", "es"]
      },
      "sameAs": [
        "https://www.facebook.com/thundertruck",
        "https://twitter.com/thundertruck",
        "https://www.instagram.com/thundertruck"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "addressCountry": "US"
      }
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ThunderTruck",
      "url": "https://web.thundertruck.app",
      "applicationCategory": "FoodApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1250"
      },
      "description": "Order street food ahead and track your delivery in real time. Find food trucks near you, browse menus, and enjoy your favorites delivered to your location.",
      "screenshot": "https://web.thundertruck.app/images/thundertruck_icon.png",
      "featureList": [
        "Real-time food truck location tracking",
        "Order ahead and skip the lines",
        "Live delivery tracking",
        "Browse menus from multiple food trucks",
        "Secure payment processing",
        "Order history and favorites"
      ]
    }
    </script>
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "ThunderTruck",
      "image": "https://web.thundertruck.app/images/thundertruck_icon.png",
      "@id": "https://web.thundertruck.app",
      "url": "https://web.thundertruck.app",
      "telephone": "+1-800-THUNDER",
      "priceRange": "$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Williamsburg",
        "addressLocality": "Brooklyn",
        "addressRegion": "NY",
        "postalCode": "11249",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.7081,
        "longitude": -73.9571
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "servesCuisine": ["Street Food", "American", "International"],
      "paymentAccepted": ["Credit Card", "Debit Card", "Mobile Payment"],
      "currenciesAccepted": "USD"
    }
    </script>
`;

// Inject the meta tags right after the <head> tag
html = html.replace('<head>', '<head>' + metaTags);

// Write the modified HTML back
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Successfully injected SEO meta tags into dist/index.html');
console.log('📍 Meta tags include:');
console.log('   - Open Graph tags for Facebook/LinkedIn');
console.log('   - Twitter Card tags');
console.log('   - Schema.org structured data');
console.log('   - Image: /images/thundertruck_icon.png');

