/**
 * Firebase Configuration
 * 
 * Using @react-native-firebase which reads configuration from google-services.json
 * No need for .env file for Firebase config - it's automatically loaded from google-services.json
 * 
 * Only GOOGLE_WEB_CLIENT_ID is needed from .env for GoogleSignin.configure()
 */

import { GOOGLE_WEB_CLIENT_ID } from '@env';

// Google Web Client ID - needed for GoogleSignin.configure()
// Get this from Firebase Console > Authentication > Sign-in method > Google > Web client ID
export const googleWebClientId = GOOGLE_WEB_CLIENT_ID || 'your-google-web-client-id.apps.googleusercontent.com';

// Note: Firebase configuration is automatically loaded from android/app/google-services.json
// No need to manually configure Firebase - @react-native-firebase handles it natively

