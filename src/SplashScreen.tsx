import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const SplashScreen = ({ navigation }) => {
  // Animation values
  const logoGlow = new Animated.Value(0);
  const logoScale = new Animated.Value(0.5);
  
  // Icon positions for magnetic pull effect
  const icon1Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon2Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon3Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon4Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon5Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon6Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon7Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon8Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };
  const icon9Pos = { x: new Animated.Value(0), y: new Animated.Value(0) };

  useEffect(() => {
    // Logo glow and zoom animation
    Animated.parallel([
      Animated.timing(logoGlow, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // Magnetic pull animation - icons move toward center then back
    const createMagneticPull = (posObj, direction) => {
      const moveDistance = 35;
      const xMove = direction.x * moveDistance;
      const yMove = direction.y * moveDistance;

      return Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(posObj.x, {
            toValue: xMove,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(posObj.y, {
            toValue: yMove,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(posObj.x, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(posObj.y, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ]);
    };

    // Start all icon animations with directions toward center
    setTimeout(() => createMagneticPull(icon1Pos, { x: 0.7, y: 0.5 }).start(), 100);
    setTimeout(() => createMagneticPull(icon2Pos, { x: 0, y: 0.6 }).start(), 150);
    setTimeout(() => createMagneticPull(icon3Pos, { x: -0.7, y: 0.5 }).start(), 200);
    setTimeout(() => createMagneticPull(icon4Pos, { x: 0.5, y: 0.2 }).start(), 250);
    setTimeout(() => createMagneticPull(icon5Pos, { x: -0.5, y: 0.2 }).start(), 300);
    setTimeout(() => createMagneticPull(icon6Pos, { x: 0.7, y: -0.2 }).start(), 350);
    setTimeout(() => createMagneticPull(icon7Pos, { x: -0.7, y: -0.2 }).start(), 400);
    setTimeout(() => createMagneticPull(icon8Pos, { x: 0.5, y: -0.5 }).start(), 450);
    setTimeout(() => createMagneticPull(icon9Pos, { x: 0, y: -0.6 }).start(), 500);

    // Navigate after animation
    setTimeout(() => {
      navigation.replace('WelcomeScreen1');
    }, 4000);
  }, [navigation]); // Added navigation to dependencies

  const glowOpacity = logoGlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 1]
  });

  // Icon Components with proper JSX structure
  const CarIcon = ({ posObj }) => (
    <Animated.View style={{ transform: [{ translateX: posObj.x }, { translateY: posObj.y }] }}>
      <Svg width="42" height="42" viewBox="0 0 24 24" fill="#2E7D32">
        <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </Svg>
    </Animated.View>
  );

  const LocationIcon = ({ posObj }) => (
    <Animated.View style={{ transform: [{ translateX: posObj.x }, { translateY: posObj.y }] }}>
      <Svg width="38" height="38" viewBox="0 0 24 24" fill="#1565C0">
        <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </Svg>
    </Animated.View>
  );

  const ShoppingBagIcon = ({ posObj }) => (
    <Animated.View style={{ transform: [{ translateX: posObj.x }, { translateY: posObj.y }] }}>
      <Svg width="40" height="40" viewBox="0 0 24 24" fill="#6A1B9A">
        <Path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/>
      </Svg>
    </Animated.View>
  );

  const DeliveryBoxIcon = ({ posObj }) => (
    <Animated.View style={{ transform: [{ translateX: posObj.x }, { translateY: posObj.y }] }}>
      <Svg width="40" height="40" viewBox="0 0 24 24" fill="#E65100">
        <Path d="M19 7h-1.21a5.49 5.49 0 00-1-2H18c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1h.21A5.49 5.49 0 005.2 7H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h1c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
      </Svg>
    </Animated.View>
  );

  const CartIcon = ({ posObj }) => (
    <Animated.View style={{ transform: [{ translateX: posObj.x }, { translateY: posObj.y }] }}>
      <Svg width="40" height="40" viewBox="0 0 24 24" fill="#C62828">
        <Path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </Svg>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#f0fff0', '#ccffcc']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Icon grid with center logo */}
      <View style={styles.iconContainer}>
        {/* Top row: 3 icons */}
        <View style={styles.topRow}>
          <View style={styles.iconWrapper}><CarIcon posObj={icon1Pos} /></View>
          <View style={styles.iconWrapper}><LocationIcon posObj={icon2Pos} /></View>
          <View style={styles.iconWrapper}><ShoppingBagIcon posObj={icon3Pos} /></View>
        </View>

        {/* Middle row 1: 2 icons */}
        <View style={styles.middleRow1}>
          <View style={styles.iconWrapper}><DeliveryBoxIcon posObj={icon4Pos} /></View>
          <View style={styles.iconWrapper}><CartIcon posObj={icon5Pos} /></View>
        </View>

        {/* Center row: icon + LOGO + icon */}
        <View style={styles.centerRow}>
          <View style={styles.iconWrapper}><CarIcon posObj={icon6Pos} /></View>
          
          <Animated.View style={[styles.logoContainer, {
            opacity: glowOpacity,
            transform: [{ scale: logoScale }]
          }]}>
            <Text style={styles.logoText}>
              EAZY GO
            </Text>
          </Animated.View>
          
          <View style={styles.iconWrapper}><LocationIcon posObj={icon7Pos} /></View>
        </View>

        {/* Middle row 2: 2 icons */}
        <View style={styles.middleRow2}>
          <View style={styles.iconWrapper}><ShoppingBagIcon posObj={icon8Pos} /></View>
          <View style={styles.iconWrapper}><DeliveryBoxIcon posObj={icon9Pos} /></View>
        </View>

        {/* Bottom row: 1 icon */}
        <View style={styles.bottomRow}>
          <View style={styles.iconWrapper}><CartIcon posObj={icon1Pos} /></View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 50,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
  },
  middleRow1: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  middleRow2: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4caf50',
    letterSpacing: 2,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default SplashScreen;











































































































































































































































// import React, { useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
// import { Svg, Path } from 'react-native-svg';
// import LinearGradient from 'react-native-linear-gradient';

// const SplashScreen = ({ navigation }) => {
//   // Animation values
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const logoScale = useRef(new Animated.Value(0.5)).current;
//   const logoGlow = useRef(new Animated.Value(0)).current;
  
//   // Icon positions for magnetic pull effect
//   const icon1Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon2Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon3Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon4Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon5Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon6Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon7Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon8Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;
//   const icon9Pos = useRef({ x: new Animated.Value(0), y: new Animated.Value(0) }).current;

//   // **ICON COLOR - CHANGE THIS VALUE**
//   const ICON_COLOR = '#2e7d32'; // Dark green color for icons

//   useEffect(() => {
//     // Logo animations - soft glow and zoom
//     Animated.parallel([
//       Animated.timing(logoOpacity, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(logoScale, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),
//       Animated.timing(logoGlow, {
//         toValue: 1,
//         duration: 2500,
//         easing: Easing.inOut(Easing.ease),
//         useNativeDriver: true,
//       })
//     ]).start();

//     // Magnetic pull animation - slow and graceful
//     const createMagneticPull = (posObj, direction, delay) => {
//       const moveDistance = 40; // Movement distance
//       const xMove = direction.x * moveDistance;
//       const yMove = direction.y * moveDistance;

//       return Animated.sequence([
//         Animated.delay(delay),
//         Animated.parallel([
//           Animated.timing(posObj.x, {
//             toValue: xMove,
//             duration: 1200,
//             easing: Easing.inOut(Easing.ease),
//             useNativeDriver: true,
//           }),
//           Animated.timing(posObj.y, {
//             toValue: yMove,
//             duration: 1200,
//             easing: Easing.inOut(Easing.ease),
//             useNativeDriver: true,
//           })
//         ]),
//         Animated.parallel([
//           Animated.timing(posObj.x, {
//             toValue: 0,
//             duration: 1200,
//             easing: Easing.inOut(Easing.ease),
//             useNativeDriver: true,
//           }),
//           Animated.timing(posObj.y, {
//             toValue: 0,
//             duration: 1200,
//             easing: Easing.inOut(Easing.ease),
//             useNativeDriver: true,
//           })
//         ])
//       ]);
//     };

//     // Start all icon animations with staggered delays
//     Animated.parallel([
//       createMagneticPull(icon1Pos, { x: 0.7, y: 0.5 }, 600),
//       createMagneticPull(icon2Pos, { x: 0, y: 0.6 }, 700),
//       createMagneticPull(icon3Pos, { x: -0.7, y: 0.5 }, 800),
//       createMagneticPull(icon4Pos, { x: 0.5, y: 0.2 }, 900),
//       createMagneticPull(icon5Pos, { x: -0.5, y: 0.2 }, 1000),
//       createMagneticPull(icon6Pos, { x: 0.7, y: -0.2 }, 1100),
//       createMagneticPull(icon7Pos, { x: -0.7, y: -0.2 }, 1200),
//       createMagneticPull(icon8Pos, { x: 0.5, y: -0.5 }, 1300),
//       createMagneticPull(icon9Pos, { x: 0, y: -0.6 }, 1400),
//     ]).start();

//     // Navigate after animation
//     const timer = setTimeout(() => {
//       navigation.replace('WelcomeScreen1');
//     }, 4000);

//     return () => clearTimeout(timer);
//   }, [navigation]);

//   // Icon Components
//   const CarIcon = ({ posObj }) => (
//     <Animated.View style={{ 
//       transform: [
//         { translateX: posObj.x }, 
//         { translateY: posObj.y }
//       ] 
//     }}>
//       <Svg width="50" height="50" viewBox="0 0 24 24" fill={ICON_COLOR}>
//         <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
//       </Svg>
//     </Animated.View>
//   );

//   const LocationIcon = ({ posObj }) => (
//     <Animated.View style={{ 
//       transform: [
//         { translateX: posObj.x }, 
//         { translateY: posObj.y }
//       ] 
//     }}>
//       <Svg width="45" height="45" viewBox="0 0 24 24" fill={ICON_COLOR}>
//         <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
//       </Svg>
//     </Animated.View>
//   );

//   const ShoppingBagIcon = ({ posObj }) => (
//     <Animated.View style={{ 
//       transform: [
//         { translateX: posObj.x }, 
//         { translateY: posObj.y }
//       ] 
//     }}>
//       <Svg width="48" height="48" viewBox="0 0 24 24" fill={ICON_COLOR}>
//         <Path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/>
//       </Svg>
//     </Animated.View>
//   );

//   const DeliveryBoxIcon = ({ posObj }) => (
//     <Animated.View style={{ 
//       transform: [
//         { translateX: posObj.x }, 
//         { translateY: posObj.y }
//       ] 
//     }}>
//       <Svg width="48" height="48" viewBox="0 0 24 24" fill={ICON_COLOR}>
//         <Path d="M19 7h-1.21a5.49 5.49 0 00-1-2H18c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1h.21A5.49 5.49 0 005.2 7H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h1c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
//       </Svg>
//     </Animated.View>
//   );

//   const CartIcon = ({ posObj }) => (
//     <Animated.View style={{ 
//       transform: [
//         { translateX: posObj.x }, 
//         { translateY: posObj.y }
//       ] 
//     }}>
//       <Svg width="48" height="48" viewBox="0 0 24 24" fill={ICON_COLOR}>
//         <Path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
//       </Svg>
//     </Animated.View>
//   );

//   return (
//     <LinearGradient
//       colors={['#f0fff0', '#ccffcc']}
//       style={styles.container}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       <View style={styles.iconContainer}>
//         {/* Top row: 3 icons */}
//         <View style={styles.topRow}>
//           <View style={styles.iconWrapper}>
//             <CarIcon posObj={icon1Pos} />
//           </View>
//           <View style={styles.iconWrapper}>
//             <LocationIcon posObj={icon2Pos} />
//           </View>
//           <View style={styles.iconWrapper}>
//             <ShoppingBagIcon posObj={icon3Pos} />
//           </View>
//         </View>

//         {/* Middle row 1: 2 icons */}
//         <View style={styles.middleRow}>
//           <View style={styles.iconWrapper}>
//             <DeliveryBoxIcon posObj={icon4Pos} />
//           </View>
//           <View style={styles.iconWrapper}>
//             <CartIcon posObj={icon5Pos} />
//           </View>
//         </View>

//         {/* Center row: icon + LOGO + icon */}
//         <View style={styles.centerRow}>
//           <View style={styles.iconWrapper}>
//             <CarIcon posObj={icon6Pos} />
//           </View>
          
//           <Animated.View style={[
//             styles.logoContainer,
//             {
//               opacity: logoOpacity,
//               transform: [{ scale: logoScale }]
//             }
//           ]}>
//             <Animated.Text 
//               style={[
//                 styles.logoText,
//                 {
//                   opacity: logoGlow,
//                 }
//               ]}
//             >
//               EAZY GO
//             </Animated.Text>
//           </Animated.View>
          
//           <View style={styles.iconWrapper}>
//             <LocationIcon posObj={icon7Pos} />
//           </View>
//         </View>

//         {/* Middle row 2: 2 icons */}
//         <View style={styles.middleRow}>
//           <View style={styles.iconWrapper}>
//             <ShoppingBagIcon posObj={icon8Pos} />
//           </View>
//           <View style={styles.iconWrapper}>
//             <DeliveryBoxIcon posObj={icon9Pos} />
//           </View>
//         </View>

//         {/* Bottom row: 1 icon */}
//         <View style={styles.bottomRow}>
//           <View style={styles.iconWrapper}>
//             <CartIcon posObj={icon9Pos} />
//           </View>
//         </View>
//       </View>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   iconContainer: {
//     flex: 1,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingVertical: 60,
//     width: '100%',
//   },
//   topRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     paddingHorizontal: 40,
//   },
//   middleRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '70%',
//   },
//   centerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     width: '100%',
//     paddingHorizontal: 20,
//   },
//   bottomRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     width: '100%',
//   },
//   iconWrapper: {
//     padding: 10,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   logoText: {
//     fontSize: 42,
//     fontWeight: 'bold',
//     color: '#000000',
//     letterSpacing: 3,
//     textShadowColor: '#4caf50',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 20,
//   },
// });

// export default SplashScreen;
























// const ICON_COLOR = '#2d5016'; // Dark green color for icons
// // Dark Green (Nature/Eco-friendly)
// const ICON_COLOR = '#2d5016'; // Deep forest green

// // Medium Green (Balanced)
// const ICON_COLOR = '#388e3c'; // Medium green

// // Dark Gray/Black (Professional)
// const ICON_COLOR = '#1a1a1a'; // Almost black
// const ICON_COLOR = '#333333'; // Dark gray
// const ICON_COLOR = '#424242'; // Medium dark gray

// // Rich Green (Vibrant)
// const ICON_COLOR = '#1b5e20'; // Rich dark green
// const ICON_COLOR = '#2e7d32'; // Forest green

// // Blue-Green (Modern)
// const ICON_COLOR = '#00695c'; // Teal dark
// const ICON_COLOR = '#004d40'; // Deep teal