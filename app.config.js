import pkg from './package.json';

export default {
  "expo": {
    "name": "Smart Clipboard",
    "slug": "smart-clipboard",
    "version": pkg.version,
    "sdkVersion": "54.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "icon": "./src/assets/images/logo.png",
    "splash": {
      "image": "./src/assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.smartclipboard.app",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "package": "com.smartclipboard.app",
      "versionCode": pkg.buildNumber ?? 1,
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/images/logo.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [],
      googleServicesFile: "./android/app/google-services.json", // important for Firebase
    },
    "web": {},
    "plugins": [
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}

