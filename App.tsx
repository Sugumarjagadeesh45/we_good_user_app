// /Users/webasebrandings/Downloads/new_far-main 2/App.tsx
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/constants/LanguageContext';
import { CartProvider } from './src/Screen1/Shopping/ShoppingContent';
import { AddressProvider } from './src/Screen1/Shopping/AddressContext';
import { WalletProvider } from './src/context/WalletContext';
import Screen1 from './src/Screen1';
import SplashScreen from './src/SplashScreen';
import WelcomeScreen1 from './src/WelcomeScreen1';
import WelcomeScreen2 from './src/WelcomeScreen2';
import WelcomeScreen3 from './src/WelcomeScreen3';
import ProfileScreen from './src/Screen1/Menuicon/ProfileScreen';
import Setting from './src/Screen1/Menuicon/Setting';
import MyOrders from './src/Screen1/Menuicon/MyOrders';

import BuyNow from './src/Screen1/Shopping/BuyNow';



import ReportDriver from './src/Screen1/Menuicon/ReportDriver';
import Cart from './src/Screen1/Shopping/icons/Cart';

import AddressManagement from './src/Screen1/Shopping/AddressManagement';

// Import the new enhanced components
import EnhancedBuying from './src/Screen1/Shopping/EnhancedBuying';
import EnhancedCart from './src/Screen1/Shopping/EnhancedCart';
import EnhancedMyOrders from './src/Screen1/Shopping/EnhancedMyOrders';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  SplashScreen: undefined;
  WelcomeScreen1: undefined;
  WelcomeScreen2: undefined;
  WelcomeScreen3: undefined;
  Screen1: { isNewUser?: boolean; phone?: string; refresh?: boolean };
  ProfileScreen: undefined;
  Setting: undefined;
  ReportDriver: undefined;
  Cart: undefined;
  Buying: { product: any };
  Order: undefined;
  TopSale: undefined;
  ViewAll: { title: string; products: any[]; addToCart: any };
  AddressManagement: undefined;
  // Enhanced shopping screens
  EnhancedBuying: { product: any };
  EnhancedCart: undefined;
  EnhancedMyOrders: undefined;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAppState = async () => {
      try {
        setIsLoading(true);
        
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
        
        setUserToken(token);
        setIsFirstLaunch(hasLaunched !== 'true');
        
        if (!hasLaunched) {
          await AsyncStorage.setItem('hasLaunched', 'true');
        }
      } catch (error) {
        console.error('Error checking app state:', error);
        setIsFirstLaunch(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAppState();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (userToken) {
      return "Screen1";
    } else if (isFirstLaunch) {
      return "SplashScreen";
    } else {
      return "WelcomeScreen3";
    }
  };

  return (
    <LanguageProvider>
      <WalletProvider>
        <AddressProvider>
          <CartProvider>
            <NavigationContainer>
            <Stack.Navigator 
              initialRouteName={getInitialRoute()}
              screenOptions={{ headerShown: false }}
            >
              {/* App Intro & Auth Screens */}
              <Stack.Screen name="SplashScreen" component={SplashScreen} />
              <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
              <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
              <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
              
              {/* Main App Screen */}
              <Stack.Screen name="Screen1" component={Screen1} />
              
              {/* Menu & Profile Screens */}
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen name="Setting" component={Setting} />
              <Stack.Screen name="ReportDriver" component={ReportDriver} />
              
              {/* Shopping Screens - Original */}
              <Stack.Screen name="Cart" component={Cart} />

          <Stack.Screen name="BuyNow" component={BuyNow} />



              <Stack.Screen name="AddressManagement" component={AddressManagement} />
              
              {/* Enhanced Shopping Screens */}
              <Stack.Screen name="EnhancedBuying" component={EnhancedBuying} />
              <Stack.Screen name="EnhancedCart" component={EnhancedCart} />
              <Stack.Screen name="EnhancedMyOrders" component={EnhancedMyOrders} />


                <Stack.Screen name="Shopping" component={Screen1} />
            </Stack.Navigator>
          </NavigationContainer>
        </CartProvider>
      </AddressProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});



// // /Users/webasebrandings/Downloads/new_far-main 2/App.tsx
// import 'react-native-gesture-handler';
// import React, { useState, useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { LanguageProvider } from './src/constants/LanguageContext';
// import { CartProvider } from './src/Screen1/Shopping/ShoppingContent';
// import { AddressProvider } from './src/Screen1/Shopping/AddressContext';
// import Screen1 from './src/Screen1';
// import SplashScreen from './src/SplashScreen';
// import WelcomeScreen1 from './src/WelcomeScreen1';
// import WelcomeScreen2 from './src/WelcomeScreen2';
// import WelcomeScreen3 from './src/WelcomeScreen3';
// import ProfileScreen from './src/Screen1/Menuicon/ProfileScreen';
// import Setting from './src/Screen1/Menuicon/Setting';
// import ReportDriver from './src/Screen1/Menuicon/ReportDriver';
// import Cart from './src/Screen1/Shopping/icons/Cart';
// import Buying from './src/Screen1/Shopping/icons/Buying';
// import Order from './src/Screen1/Shopping/icons/Order';
// import TopSale from './src/Screen1/Shopping/icons/TopSale';
// import ViewAll from './src/Screen1/Shopping/ViewAll';
// import AddressManagement from './src/Screen1/Shopping/AddressManagement';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { View, ActivityIndicator, StyleSheet } from 'react-native';

// const Stack = createNativeStackNavigator();

// export type RootStackParamList = {
//   SplashScreen: undefined;
//   WelcomeScreen1: undefined;
//   WelcomeScreen2: undefined;
//   WelcomeScreen3: undefined;
//   Screen1: { isNewUser?: boolean; phone?: string; refresh?: boolean };
//   ProfileScreen: undefined;
//   Setting: undefined;
//   ReportDriver: undefined;
//   Cart: undefined;
//   Buying: { product: any };
//   Order: undefined;
//   TopSale: undefined;
//   ViewAll: { title: string; products: any[]; addToCart: any };
//   AddressManagement: undefined;
// };

// export default function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
//   const [userToken, setUserToken] = useState<string | null>(null);

//   useEffect(() => {
//     const checkAppState = async () => {
//       try {
//         setIsLoading(true);
        
//         const hasLaunched = await AsyncStorage.getItem('hasLaunched');
//         const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
        
//         setUserToken(token);
//         setIsFirstLaunch(hasLaunched !== 'true');
        
//         if (!hasLaunched) {
//           await AsyncStorage.setItem('hasLaunched', 'true');
//         }
//       } catch (error) {
//         console.error('Error checking app state:', error);
//         setIsFirstLaunch(true);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAppState();
//   }, []);

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#28a745" />
//       </View>
//     );
//   }

//   const getInitialRoute = () => {
//     if (userToken) {
//       return "Screen1";
//     } else if (isFirstLaunch) {
//       return "SplashScreen";
//     } else {
//       return "WelcomeScreen3";
//     }
//   };

//   return (
//     <LanguageProvider>
//       <AddressProvider>
//         <CartProvider>
//           <NavigationContainer>
//             <Stack.Navigator 
//               initialRouteName={getInitialRoute()}
//               screenOptions={{ headerShown: false }}
//             >
//               <Stack.Screen name="SplashScreen" component={SplashScreen} />
//               <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
//               <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
//               <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
//               <Stack.Screen name="Screen1" component={Screen1} />
//               <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
//               <Stack.Screen name="Setting" component={Setting} />
//               <Stack.Screen name="ReportDriver" component={ReportDriver} />
//               <Stack.Screen name="Cart" component={Cart} />
//               <Stack.Screen name="Buying" component={Buying} />
//               <Stack.Screen name="Order" component={Order} />
//               <Stack.Screen name="TopSale" component={TopSale} />
//               <Stack.Screen name="ViewAll" component={ViewAll} />
//               <Stack.Screen name="AddressManagement" component={AddressManagement} />
//             </Stack.Navigator>
//           </NavigationContainer>
//         </CartProvider>
//       </AddressProvider>
//     </LanguageProvider>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
// });

