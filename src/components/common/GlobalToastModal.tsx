import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from './ToastConfig';
import { subscribeToastVisibility } from '../../utils/toast';

/**
 * GlobalToastModal renders react-native-toast-message inside a transparent native Modal.
 * Because native Modals stack on top of previously opened windows, this ensures toasts
 * appear on top of all screens AND native Modals (e.g. Admin/SuperAdmin dialogs).
 */
export const GlobalToastModal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToastVisibility((isVis: boolean) => {
      setVisible(isVis);
    });
    return unsubscribe;
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      pointerEvents="box-none"
    >
      <View style={styles.container} pointerEvents="box-none">
        <Toast config={toastConfig} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    pointerEvents: 'box-none',
  },
});

export default GlobalToastModal;
