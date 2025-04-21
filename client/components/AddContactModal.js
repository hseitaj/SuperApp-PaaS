// client/components/AddContactModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const search = async (q) => {
    setQuery(q);
    if (q.length < 2) return setResults([]);
    const { data } = await axios.get(
      `${SERVER_URL}/search?username=${q}`
    );
    setResults(data.filter((u) => u.id !== currentId));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => null}>
          <Text style={styles.title}>Find someone</Text>

          <TextInput
            value={query}
            onChangeText={search}
            placeholder="Type username…"
            style={styles.input}
            autoCapitalize="none"
          />

          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => onPicked(item)}
              >
                <Text>{item.username}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center" }}>No match</Text>
            }
          />
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
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    maxHeight: "80%",
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
