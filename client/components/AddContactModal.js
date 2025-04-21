/* client/components/AddContactModal.js */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function AddContactModal({
  visible,
  onClose,
  currentId,
  onPicked,
}) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!visible) return;
    axios
      .get(`${SERVER_URL}/rooms/${currentId}`)
      .then(({ data }) => setData(data))
      .catch(console.warn);
  }, [visible, currentId]);

  const renderRow = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        onPicked(item);
      }}
    >
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add a contact</Text>

          <FlatList
            data={data}
            renderItem={renderRow}
            keyExtractor={(i) => i.id}
            style={{ maxHeight: 320 }}
          />

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
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 16 },
  close: { marginTop: 12, alignSelf: "flex-end" },
});
