import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform, Dimensions } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const RootStack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9A961" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Group>
          <RootStack.Screen name="Auth" component={AuthStack} />
          <RootStack.Screen name="Main" component={MainApp} />
        </RootStack.Group>
      ) : (
        <RootStack.Group>
          <RootStack.Screen name="Main" component={MainApp} />
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
    </RootStack.Navigator>
  );
}

function MainApp() {
  return (
    <CartProvider>
      <AppNavigator />
    </CartProvider>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_MOBILE_WIDTH = 430;

export default function App() {
  const isWeb = Platform.OS === 'web';
  const needsConstraint = isWeb && screenWidth > MAX_MOBILE_WIDTH;

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        {needsConstraint ? (
          <View style={styles.webContainer}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              <View style={styles.phoneScreen}>
                <RootNavigator />
              </View>
            </View>
          </View>
        ) : (
          <RootNavigator />
        )}
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: MAX_MOBILE_WIDTH,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#000',
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  phoneNotch: {
    width: 150,
    height: 28,
    backgroundColor: '#000',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignSelf: 'center',
    zIndex: 10,
    marginTop: -2,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
});
