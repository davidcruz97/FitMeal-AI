import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ScanProvider } from './src/context/ScanContext';
import { OnBoardingProvider } from './src/context/OnBoardingContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ScanProvider>
        <OnBoardingProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </OnBoardingProvider>
      </ScanProvider>
    </AuthProvider>
  );
}
