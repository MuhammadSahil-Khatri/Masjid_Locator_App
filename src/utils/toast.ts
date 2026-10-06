/**
 * Global toast helper utilities.
 * Uses react-native-toast-message under the hood.
 * Import these helpers anywhere — no context needed.
 */
import Toast from 'react-native-toast-message';

type VisibilityListener = (visible: boolean) => void;
const listeners: Set<VisibilityListener> = new Set();
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const subscribeToastVisibility = (listener: VisibilityListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (visible: boolean) => {
  listeners.forEach((listener) => listener(visible));
};

const triggerToast = (
  type: 'success' | 'error' | 'info',
  text2: string,
  text1: string,
  duration: number
) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  notifyListeners(true);
  Toast.show({
    type,
    text1,
    text2,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    onHide: () => {
      notifyListeners(false);
    },
  });

  hideTimer = setTimeout(() => {
    notifyListeners(false);
  }, duration + 500);
};

export const showSuccess = (message: string, title = 'Success') => {
  triggerToast('success', message, title, 3000);
};

export const showError = (message: string, title = 'Error') => {
  triggerToast('error', message, title, 4000);
};

export const showInfo = (message: string, title = 'Info') => {
  triggerToast('info', message, title, 3000);
};
