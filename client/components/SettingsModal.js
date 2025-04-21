import React from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";

export default function SettingsModal({ visible, onClose, onLogout }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => null}>
          <Text style={styles.title}>Settings</Text>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Log out</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    justifyContent: "center",
  },
  card: {
    marginHorizontal: 32,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  title: { fontSize: 18, marginBottom: 16, fontWeight: "600" },
  logoutBtn: {
    backgroundColor: "#cc0000",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
});
