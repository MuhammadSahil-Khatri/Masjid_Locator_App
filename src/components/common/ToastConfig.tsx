/**
 * Custom toast configuration for react-native-toast-message.
 * Compact width (wraps content), larger fonts, clean pill style.
 * Pass this as the `config` prop on <Toast />.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { ToastConfig } from 'react-native-toast-message';

interface ToastProps {
  text1?: string;
  text2?: string;
}

const ToastBase: React.FC<{ color: string; icon: string } & ToastProps> = ({
  color,
  icon,
  text1,
  text2,
}) => (
  <View style={[styles.container, { borderLeftColor: color }]}>
    <Text style={styles.icon}>{icon}</Text>
    <View style={styles.textBlock}>
      {text1 ? <Text style={[styles.title, { color }]}>{text1}</Text> : null}
      {text2 ? <Text style={styles.message}>{text2}</Text> : null}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <ToastBase color="#22c55e" icon="✓" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }) => (
    <ToastBase color="#ef4444" icon="✕" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }) => (
    <ToastBase color="#3b82f6" icon="ℹ" text1={text1} text2={text2} />
  ),
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginHorizontal: 32,
    maxWidth: 470,
    minWidth: 250,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  textBlock: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
    marginTop: 2,
    flexWrap: 'wrap',
  },
});
