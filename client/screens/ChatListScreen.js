import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function ChatListScreen({ route, navigation }) {
  const { user } = route.params;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/users`)
      .then((res) => {
        const others = res.data.filter((u) => u.id !== user.id);
        setUsers(others);
      })
      .catch((err) => console.error("Users fetch error:", err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hello, {user.username}!</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate("ChatRoom", { user, partner: item })
            }
          >
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No other users yet.</Text>
        }
      />
      <TouchableOpacity
        style={styles.logout}
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, marginBottom: 12, fontWeight: "500" },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  username: { fontSize: 16 },
  empty: { textAlign: "center", marginTop: 20, color: "#666" },
  logout: { marginTop: 20, alignItems: "center" },
  logoutText: { color: "red", fontWeight: "500" },
});
