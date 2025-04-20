/* components/AddContactModal.js */
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
  const [loading, setLoading] = useState(false);

  /* search whenever query changes (debounced 300 ms) */
  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const id = setTimeout(() => {
      setLoading(true);
      axios
        .get(`${SERVER_URL}/search?username=${encodeURIComponent(query)}`)
        .then(({ data }) => setResults(data.filter((u) => u.id !== currentId)))
        .catch(console.warn)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [query, currentId]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Find someone</Text>
          <TextInput
            style={styles.input}
            placeholder="Type a username"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {loading && <ActivityIndicator style={{ marginVertical: 8 }} />}
          <FlatList
            data={results}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.result}
                onPress={() => onPicked(item)}
              >
                <Text>{item.username}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading && query ? (
                <Text style={{ textAlign: "center", marginTop: 8 }}>
                  No matches
                </Text>
              ) : null
            }
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  result: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  close: { marginTop: 16, alignSelf: "center" },
});
