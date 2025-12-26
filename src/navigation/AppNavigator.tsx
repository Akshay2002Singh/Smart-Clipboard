import React from 'react';
import { StatusBar, Platform, TouchableOpacity, Text, ActivityIndicator, ToastAndroid } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@theme';
import { useDialog } from '@context/DialogContext';
import { useAuth } from '@context/AuthContext';

import { ClipboardListScreen } from '@screens/clipboard/ClipboardListScreen';
import { ClipboardEditScreen } from '@screens/clipboard/ClipboardEditScreen';
import { TemplatesListScreen } from '@screens/clipboard/TemplatesListScreen';
import { TemplateEditScreen } from '@screens/clipboard/TemplateEditScreen';
import { NotepadScreen } from '@screens/notepad/NotepadScreen';
import { ProfileScreen } from '@screens/profile';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Button Component for Header
interface AuthButtonProps {
  isAuthenticated: boolean;
  user: FirebaseAuthTypes.User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  showLogoutWhenAuthenticated?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ 
  isAuthenticated, 
  user, 
  onSignIn, 
  onSignOut,
  showLogoutWhenAuthenticated = false,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);
  const { showConfirm } = useDialog();

  const handlePress = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        if (showLogoutWhenAuthenticated) {
          await showConfirm(
            'Are you sure you want to logout?',
            'Logout',
            async () => {
              await onSignOut();
            }
          );
        }
      } else {
        await onSignIn();
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = (error as any)?.message || 'Authentication failed. Please try again.';
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      // await showConfirm(errorMessage, 'Authentication Failed', undefined, undefined);
    } finally {
      setIsLoading(false);
    }
  };

  // When authenticated: show logout only if allowed
  if (isAuthenticated) {
    if (!showLogoutWhenAuthenticated) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isLoading}
        style={{ 
          marginRight: 16, 
          flexDirection: 'row', 
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: colors.surface,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} style={{ marginRight: 8 }} />
        ) : (
          <Icon name="logout" size={20} color={colors.text} style={{ marginRight: 8 }} />
        )}
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
          {isLoading ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    );
  }

  // When not authenticated: show login button
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={{ 
        marginRight: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: colors.primary,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
      ) : (
        <Icon name="login" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
      )}
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
        {isLoading ? 'Signing in...' : 'Login'}
      </Text>
    </TouchableOpacity>
  );
};

const ClipboardStack = () => {
  const { colors } = useTheme();
  const { isAuthenticated, user, signOut, signInWithGoogle } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ClipboardList"
        component={ClipboardListScreen}
        options={{
          title: 'Clipboard',
          headerRight: () => (
            <AuthButton 
              isAuthenticated={isAuthenticated}
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
            />
          ),
        }}
      />
      <Stack.Screen
        name="ClipboardEdit"
        component={ClipboardEditScreen}
        options={{ title: 'Clipboard Item' }}
      />
    </Stack.Navigator>
  );
};

const TemplatesStack = () => {
  const { colors } = useTheme();
  const { isAuthenticated, user, signOut, signInWithGoogle } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="TemplatesList"
        component={TemplatesListScreen}
        options={{
          title: 'Templates',
          headerRight: () => (
            <AuthButton 
              isAuthenticated={isAuthenticated}
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
            />
          ),
        }}
      />
      <Stack.Screen
        name="TemplateEdit"
        component={TemplateEditScreen}
        options={{ title: 'Template' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  const { colors } = useTheme();
  const { isAuthenticated, user, signOut, signInWithGoogle } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerRight: () => (
            <AuthButton 
              isAuthenticated={isAuthenticated}
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
              showLogoutWhenAuthenticated
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};

const NotepadStack = () => {
    const { colors } = useTheme();
    const { isAuthenticated, user, signOut, signInWithGoogle } = useAuth();
    
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.header,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Notepad"
          component={NotepadScreen}
          options={{ 
            title: 'Notepad',
            headerRight: () => (
              <AuthButton 
                isAuthenticated={isAuthenticated}
                user={user}
                onSignIn={signInWithGoogle}
                onSignOut={signOut}
              />
            ),
          }}
        />
      </Stack.Navigator>
    );
  };

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, signInWithGoogle } = useAuth();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.header}
        translucent={Platform.OS === 'android'}
      />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.error,
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: '400' as const,
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500' as const,
            },
            bold: {
              fontFamily: 'System',
              fontWeight: '700' as const,
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '800' as const,
            },
          },
        }}
      >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="ClipboardTab"
          component={ClipboardStack}
          options={{
            tabBarLabel: 'Clipboard',
            tabBarIcon: ({ color, size }) => (
              <Icon name="content-paste" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="TemplatesTab"
          component={TemplatesStack}
          options={{
            tabBarLabel: 'Templates',
            tabBarIcon: ({ color, size }) => (
              <Icon name="description" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="NotepadTab"
          component={NotepadStack}
          options={{
            tabBarLabel: 'Notepad',
            tabBarIcon: ({ color, size }) => (
              <Icon name="edit" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="account-circle" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </>
  );
};

