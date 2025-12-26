import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

let currentNetworkState: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
};

let isNetInfoAvailable = false;

// Check if NetInfo is available
try {
  // Try to access NetInfo to check if native module is loaded
  if (NetInfo && typeof NetInfo.fetch === 'function') {
    isNetInfoAvailable = true;
    
    // Initialize network state
    NetInfo.fetch().then((state: NetInfoState) => {
      currentNetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    }).catch(() => {
      // If fetch fails, assume offline
      currentNetworkState = {
        isConnected: false,
        isInternetReachable: false,
      };
    });

    // Listen to network changes
    NetInfo.addEventListener((state: NetInfoState) => {
      currentNetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    });
  }
} catch (error) {
  console.warn('NetInfo native module not available:', error);
  isNetInfoAvailable = false;
  // Default to assuming offline if module not available
  currentNetworkState = {
    isConnected: false,
    isInternetReachable: false,
  };
}

export const isNetworkAvailable = async (): Promise<boolean> => {
  try {
    if (!isNetInfoAvailable || !NetInfo || typeof NetInfo.fetch !== 'function') {
      console.warn('NetInfo not available, assuming offline');
      return false;
    }
    const state = await NetInfo.fetch();
    return (state.isConnected === true) && (state.isInternetReachable === true);
  } catch (error) {
    console.error('Error checking network:', error);
    // On error, assume offline to be safe
    return false;
  }
};

export const getNetworkState = (): NetworkState => {
  return { ...currentNetworkState };
};

