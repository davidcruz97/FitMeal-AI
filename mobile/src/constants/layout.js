// src/constants/layout.js
import { Platform } from 'react-native';

export const Layout = {
  // Bottom tab bar height (including safe area)
  tabBarHeight: Platform.OS === 'ios' ? 85 : 65,
  
  // Padding to add to bottom of screens to avoid tab bar overlap
  screenPaddingBottom: Platform.OS === 'ios' ? 95 : 75,
  
  // Safe area insets
  safeAreaTop: Platform.OS === 'ios' ? 44 : 0,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 0,
};

export default Layout;