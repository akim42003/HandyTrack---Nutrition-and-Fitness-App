import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { foodScreenStyles as styles } from '../../styles/foodScreenStyles';

interface DeleteConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.deleteConfirmModal}>
          <Text style={styles.deleteConfirmTitle}>Delete Food Entry</Text>
          <Text style={styles.deleteConfirmText}>
            Are you sure you want to delete this food entry? This action cannot be undone.
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmDeleteButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};