# Welcome to the mobile app for image upload 👋

## Get started

1. Set up EAS and initialise it

   ```bash
   npx eas-cli@latest init:onboarding
   ```

2. Start by

   ```bash
   npx expo start --go
   ```

   Note: If error indicated heap out of memory, modify the script in package.json as below:
   {
   "scripts": {
   "start": "NODE_OPTIONS=--max-old-space-size=4096 expo start",
   "android": "NODE_OPTIONS=--max-old-space-size=4096 expo start --android",
   "ios": "NODE_OPTIONS=--max-old-space-size=4096 expo start --ios",
   "web": "NODE_OPTIONS=--max-old-space-size=4096 expo start --web"
   }
   }

3. (Optional) Install Watchman for watching files

   ```bash
    brew install watchman
   ```

4. When you see 'Using Expo Go' in terminal (press 's' if you see 'Using development build'), scan QR code in the terminal to see the changes in the Expo go app on ios device (If the ios device has not had Expo go app installed, first download it from App Store)

   Note: If the QR code doesn't work, first make sure the local machine and the ios device are on the same Wi-Fi network. If problem persist, first install Expo cli:

   ```bash
   npm install -g expo-cli
   ```

   Then restart the server using tunnel option to bypass network issues:

   ```bash
   npx expo start --tunnel
   ```

   After that, enable Web Inspector on iOS:

   On your ios device, go to Settings > Safari > Advanced and enable Web Inspector.
   Use Safari Developer Tools:

   Open Safari on your MacBook.
   Go to Develop in the menu bar and select your device.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory.
