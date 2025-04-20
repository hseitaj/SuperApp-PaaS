// superapp-paas/client/screens/ChatListScreen.js
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

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/rooms/${user.id}`)
      .then((r) => setRooms(r.data))
      .catch(() => setError("Failed to load rooms."));
  }, []);

  const logout = () => navigation.replace("Login");

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.room}
      onPress={() => navigation.navigate("ChatRoom", { user, room: item.id })}
    >
      <Text style={styles.roomText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user.username}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No chats yet. Start one!</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "600" },
  logout: { color: "red" },
  room: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  roomText: { fontSize: 16 },
  empty: { textAlign: "center", marginTop: 24, color: "#666" },
  error: { color: "red", textAlign: "center", marginBottom: 12 },
});
