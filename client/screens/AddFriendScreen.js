import React, { useState } from "react";
import {
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function AddFriendScreen({ route, navigation }) {
  const { user } = route.params;
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const searchAndOpen = async () => {
    if (query.trim().length < 3) return;
    setBusy(true);
    try {
      const { data } = await axios.get(
        `${SERVER_URL}/search?username=${encodeURIComponent(query.trim())}`
      );
      const match = data.find((u) => u.id !== user.id);
      if (!match) return Alert.alert("Not found", "No user with that name.");
      navigation.replace("ChatRoom", { user, room: match.id, name: match.username });
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <Text style={styles.h1}>Start a conversation</Text>
      <TextInput
        style={styles.input}
        placeholder="Friend’s username…"
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
        editable={!busy}
      />
      <TouchableOpacity
        style={[styles.btn, busy && { opacity: 0.6 }]}
        onPress={searchAndOpen}
        disabled={busy}
      >
        <Text style={styles.btnTxt}>{busy ? "Searching…" : "Start chat"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24 },
  h1: { fontSize: 20, marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#0066CC",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
  },
  btnTxt: { color: "#fff", fontWeight: "600" },
});
