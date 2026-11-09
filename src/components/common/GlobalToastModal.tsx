import React from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from './ToastConfig';

/**
 * GlobalToast renders react-native-toast-message at the root level with pointerEvents="box-none".
 * It avoids wrapping in a native Modal so that touches are never blocked, allowing the app
 * to remain immediately accessible and responsive after any action.
 */
export const GlobalToastModal: React.FC = () => {
  return <Toast config={toastConfig} />;
};

export default GlobalToastModal;

