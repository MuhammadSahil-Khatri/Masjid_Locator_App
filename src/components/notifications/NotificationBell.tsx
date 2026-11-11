import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../navigation/NavigationContext';

interface NotificationBellProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 20,
  color = '#1D3B6D',
  style,
  onPress,
}) => {
  const { hasUnread } = useNotifications();
  const { navigate } = useNavigation();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Horizontal shaking animation loop for the red dot
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (hasUnread) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -2.5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 2.5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -2.5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 2.5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.delay(2500), // Pause between shake cycles
        ])
      );
      animation.start();
    } else {
      shakeAnim.setValue(0);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [hasUnread, shakeAnim]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigate('Notifications');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <Bell size={size} color={color} strokeWidth={2} />

      {/* Fixed-position horizontally shaking red dot (No unread count displayed) */}
      {hasUnread && (
        <Animated.View
          style={[
            styles.redDot,
            {
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Subtle shadow matching app card styles
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  redDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E44848', // Red dot
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
});

