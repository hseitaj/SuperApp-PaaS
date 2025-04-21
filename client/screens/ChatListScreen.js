import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";
import AddContactModal from "../components/AddContactModal";
import SettingsButton from "../components/SettingsButton";

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ▸ gear only on this screen */
  useEffect(() => {
    navigation.setOptions({
      title: "Chats",
      headerRight: () => <SettingsButton navigation={navigation} />,
    });
  }, [navigation]);

  /* ▸ fetch rooms + lite polling */
  const loadRooms = useCallback(() => {
    setLoading(true);
    axios
      .get(`${SERVER_URL}/roomsWithMeta/${user.id}`)
      .then(({ data }) => setRooms(data))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    loadRooms();
    const id = setInterval(loadRooms, 8_000);
    return () => clearInterval(id);
  }, [loadRooms]);

  /* ▸ render one conversation row */
  const renderRow = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("ChatRoom", { user, room: item })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text numberOfLines={1} style={styles.preview}>
            {item.lastMsg || "Start the conversation…"}
          </Text>
        </View>
        {item.unseen ? <View style={styles.dot} /> : null}
      </TouchableOpacity>
    ),
    [navigation, user]
  );

  if (loading)
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {rooms.length ? (
        <FlatList
          data={rooms}
          renderItem={renderRow}
          keyExtractor={(r) => r.id}
        />
      ) : (
        <View style={styles.center}>
          <Text>No conversations yet.</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={{ color: "#fff" }}>Add someone</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── modal for searching users  */}
      <AddContactModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        currentId={user.id}
        onPicked={(contact) => {
          setShowModal(false);
          navigation.navigate("ChatRoom", { user, room: contact });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 16, fontWeight: "600" },
  preview: { fontSize: 13, color: "#777", marginTop: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff3b30",
    marginLeft: 8,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  addBtn: {
    marginTop: 16,
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
});
