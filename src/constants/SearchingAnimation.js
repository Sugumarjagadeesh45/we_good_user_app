import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';

const SearchingAnimation = () => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  const createRipple = (animation, delay) => {
    return Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
  };

  useEffect(() => {
    createRipple(anim1, 0).start();
    createRipple(anim2, 1000).start();
    createRipple(anim3, 2000).start();
  }, []);

  const renderRipple = (animation) => {
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 3],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 0],
    });

    return (
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderRipple(anim1)}
      {renderRipple(anim2)}
      {renderRipple(anim3)}
      <View style={styles.centerCircle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ripple: {
    position: 'absolute',
    width: 40,   // reduced from 150 → medium size
    height: 40,  // reduced from 150 → medium size
    borderRadius: 35,
    backgroundColor: '#cbcbcb',
    left:60,
    bottom:30,
  },
  centerCircle: {
    width: 40,   // reduced from 80 → proportional medium size
    height: 40,
    borderRadius: 27.5,
  
  },
});


export default SearchingAnimation;
