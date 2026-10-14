import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_HEIGHT = Math.min(Math.round(SCREEN_HEIGHT * 0.8), 650);

const SPRING_CONFIG = {
  damping: 24,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 180,
};

interface AnimatedBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backgroundColor?: string;
}

export const AnimatedBottomSheet: React.FC<AnimatedBottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  backgroundColor = '#ffffff',
}) => {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, SPRING_CONFIG);
  };

  useEffect(() => {
    if (isVisible) {
      scrollTo(0);
    } else {
      scrollTo(SHEET_HEIGHT);
    }
  }, [isVisible]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newTranslateY = event.translationY + context.value.y;
      // Don't allow sheet to be dragged higher than 0 (its open position)
      translateY.value = Math.max(newTranslateY, 0);
    })
    .onEnd(() => {
      // If dragged down by more than 120px, close
      if (translateY.value > 120) {
        scrollTo(SHEET_HEIGHT);
        runOnJS(onClose)();
      } else {
        // Otherwise return to open position
        scrollTo(0);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.bottomSheetContainer,
        {
          height: SHEET_HEIGHT,
          backgroundColor,
        },
        rBottomSheetStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleRow}>
          <View style={styles.line} />
        </View>
      </GestureDetector>

      <ScrollView
        style={styles.contentWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    elevation: 16,
    zIndex: 100,
    overflow: 'hidden',
  },

  handleRow: {
    height: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});