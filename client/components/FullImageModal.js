import React from "react";
import { Modal, Image, Pressable, StyleSheet } from "react-native";

export default function FullImageModal({ uri, onClose }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.img}
            resizeMode="contain"      // never larger than the screen
          />
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.9)",
    justifyContent: "center",
  },
  img: { width: "100%", height: "80%" },
});
