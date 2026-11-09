import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../ui/Text';
import { colors, typography } from '../../theme';

interface BackgroundRefreshBarProps {
  isRefreshing: boolean;
  message?: string;
}

export const BackgroundRefreshBar: React.FC<BackgroundRefreshBarProps> = ({
  isRefreshing,
  message = 'Updating in background...',
}) => {
  if (!isRefreshing) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 107, 115, 0.90)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignSelf: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fonts.english.medium,
  },
});

