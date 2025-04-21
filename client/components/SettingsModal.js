/* client/components/SettingsModal.js */
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

export default function SettingsModal({ visible, onClose, onLogout }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>

          <TouchableOpacity style={styles.item} onPress={onLogout}>
            <Text style={styles.itemTxt}>Log‑out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={{ color: "#0066CC" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  item: { paddingVertical: 10 },
  itemTxt: { fontSize: 16 },
  close: { marginTop: 12, alignSelf: "flex-end" },
});
