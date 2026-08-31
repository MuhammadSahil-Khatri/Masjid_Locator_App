import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 80;
const SPRING_CONFIG = {
  damping: 22,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 160,
};

interface AnimatedBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoint?: number;
  backgroundColor?: string;
}

export const AnimatedBottomSheet: React.FC<AnimatedBottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  snapPoint = 560,
  backgroundColor = '#ffffff',
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, SPRING_CONFIG);
  };

  useEffect(() => {
    if (isVisible) {
      scrollTo(-snapPoint);
    } else {
      scrollTo(SCREEN_HEIGHT);
    }
  }, [isVisible, snapPoint]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, MAX_TRANSLATE_Y);
    })
    .onEnd(() => {
      if (translateY.value > -snapPoint / 2) {
        scrollTo(SCREEN_HEIGHT);
        runOnJS(onClose)();
      } else {
        scrollTo(-snapPoint);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bottomSheetContainer,
        { height: snapPoint, maxHeight: snapPoint, backgroundColor },
        rBottomSheetStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleRow}>
          <View style={styles.line} />
        </View>
      </GestureDetector>

      <View style={styles.contentWrapper}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    width: '100%',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 100,
    overflow: 'hidden',
  },
  handleRow: {
    height: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  line: {
    width: 50,
    height: 5,
    backgroundColor: '#C5D0DC',
    borderRadius: 10,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
});

