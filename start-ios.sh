#!/bin/bash

echo "🚀 Starting ThunderTruck iOS Simulator..."

# Boot the iPhone 13 Test simulator
echo "📱 Booting iPhone 13 Test simulator..."
xcrun simctl boot "iPhone 13 Test"

# Wait a moment for simulator to boot
sleep 2

# Open simulator app
echo "🖥️  Opening Simulator..."
open -a Simulator

# Wait for simulator to be ready
sleep 3

# Start Expo with iOS target
echo "⚡ Starting Expo for iOS..."
npx expo start --ios --clear

echo "✅ Setup complete! The app should launch automatically in the simulator."
