import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { X, ChevronDown } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;
const SPRING_CONFIG = {
  damping: 20,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 150,
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
  snapPoint = 340,
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
      translateY.value = Math.max(translateY.value, MAX_TRANSLATE_Y); // prevent dragging too far up
    })
    .onEnd(() => {
      if (translateY.value > -snapPoint / 2) {
        // Dragged down enough, close it
        scrollTo(SCREEN_HEIGHT);
        runOnJS(onClose)();
      } else if (translateY.value < -snapPoint * 1.2) {
        // Dragged up enough, expand more if needed (or just return to snapPoint)
        scrollTo(-snapPoint - 150); // Expanded state
      } else {
        // Return to default snap point
        scrollTo(-snapPoint);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle, { backgroundColor }]}>
        <View style={styles.handleRow}>
          {/* <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close bottom sheet"
            activeOpacity={0.7}
          >
            <ChevronDown size={20} color="#64748b" />
          </TouchableOpacity> */}
          <View style={styles.line} />
        </View>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  handleRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  // closeBtn: {
  //   position: 'absolute',
  //   backgroundColor: '#86868671',
  //   top: 6,
  //   left: 2,
  //   padding: 8,
  //   width: 30,
  //   height: 30,
  //   borderRadius: 15,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
});
