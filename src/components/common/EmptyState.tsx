import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { colors, spacing, typography } from '../../theme';
import { WifiOff } from 'lucide-react-native';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  retryText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  isOffline = false,
  onRetry,
  retryLabel = 'Retry',
  retryText,
}) => {
  const effectiveDescription = description || message;
  const effectiveRetryText = retryText || retryLabel;

  if (isOffline) {
    return (
      <View style={styles.container}>
        <View style={styles.offlineCard}>
          <View style={styles.offlineIconWrapper}>
            <WifiOff size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.offlineTitle}>{title}</Text>
          {effectiveDescription ? <Text style={styles.offlineDescription}>{effectiveDescription}</Text> : null}
          {onRetry ? (
            <TouchableOpacity style={styles.offlineRetryBtn} onPress={onRetry} activeOpacity={0.8}>
              <Text style={styles.offlineRetryBtnText}>{effectiveRetryText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.normalCard}>
        {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
        <Text style={styles.normalTitle}>{title}</Text>
        {effectiveDescription ? <Text style={styles.normalDescription}>{effectiveDescription}</Text> : null}
        {onRetry ? (
          <TouchableOpacity style={styles.normalRetryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.normalRetryBtnText}>{effectiveRetryText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    width: '100%',
  },
  // ── Offline Card: Uses high contrast dark teal with 100% WHITE TEXT ──
  offlineCard: {
    backgroundColor: '#0F6B73',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: '#03BECD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  offlineIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF', // Strict requirement: white text
    textAlign: 'center',
    marginBottom: 8,
  },
  offlineDescription: {
    fontSize: 13,
    color: '#FFFFFF', // Strict requirement: white text
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.92,
  },
  offlineRetryBtn: {
    marginTop: 18,
    backgroundColor: '#0088A5',
    borderWidth: 1,
    borderColor: '#03BECD',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  offlineRetryBtnText: {
    color: '#FFFFFF', // Strict requirement: white text
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Normal Empty State Card ──
  normalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  normalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D3B6D',
    textAlign: 'center',
    marginBottom: 8,
  },
  normalDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  normalRetryBtn: {
    marginTop: 18,
    backgroundColor: '#03BECD',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  normalRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

