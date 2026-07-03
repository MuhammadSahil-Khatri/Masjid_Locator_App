/**
 * Global toast helper utilities.
 * Uses react-native-toast-message under the hood.
 * Import these helpers anywhere — no context needed.
 */
import Toast from 'react-native-toast-message';

export const showSuccess = (message: string, title = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showError = (message: string, title = 'Error') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
  });
};

export const showInfo = (message: string, title = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};
