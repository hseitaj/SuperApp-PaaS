import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function ChatListScreen({ route, navigation }) {
  const { user } = route.params;
  const [rooms, setRooms] = useState([]);

  /** fetch every time we navigate back */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      axios
        .get(`${SERVER_URL}/rooms/${user.id}`)
        .then((res) => setRooms(res.data))
        .catch(console.error);
    });
    return unsubscribe;
  }, [navigation, user.id]);

  /** single row */
  const renderRow = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate("ChatRoom", {
            user,
            room: item.id,
            name: item.friendName,
          })
        }
      >
        <Text style={styles.title}>{item.friendName}</Text>
      </TouchableOpacity>
    ),
    [navigation, user]
  );

  /** empty-state component */
  const Empty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTxt}>No conversations yet.</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate("AddFriend", { user })}
      >
        <Text style={styles.btnTxt}>➕ Start a chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.replace("Login")}
        style={{ padding: 12 }}
      >
        <Text style={{ color: "#0066CC" }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListEmptyComponent={Empty}
        contentContainerStyle={rooms.length ? null : { flex: 1 }}
      />
      {/* floating add‑button even when list NOT empty */}
      {rooms.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddFriend", { user })}
        >
          <Text style={{ fontSize: 28, color: "#fff" }}>＋</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: { fontSize: 16, fontWeight: "600" },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTxt: { marginBottom: 24, color: "#777" },
  primaryBtn: {
    backgroundColor: "#0066CC",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  btnTxt: { color: "#fff", fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});
