/* client/screens/ChatListScreen.js */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import axios from "axios";
import dayjs from "dayjs";
import { SERVER_URL } from "../config";
import AddContactModal from "../components/AddContactModal";
import SettingsButton from "../components/SettingsButton";
import { Ionicons } from "@expo/vector-icons";

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [inbox, setInbox] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadRooms = useCallback(async () => {
    const { data: people } = await axios.get(`${SERVER_URL}/rooms/${user.id}`);

    const enriched = await Promise.all(
      people.map(async (p) => {
        const { data: msgs } = await axios.get(
          `${SERVER_URL}/messages/${user.id}/${p.id}`
        );
        const last = msgs[msgs.length - 1];
        return {
          ...p,
          lastLine: last
            ? (last.sender === user.id ? "You: " : `${p.name}: `) +
              (last.type === "text" ? last.content.slice(0, 50) : "📷 Photo")
            : "No messages yet",
          lastTs: last ? last.timestamp : 0,
        };
      })
    );

    enriched.sort((a, b) => b.lastTs - a.lastTs);
    setInbox(enriched);
  }, [user.id]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadRooms);
    return unsub;
  }, [navigation, loadRooms]);

  /* header buttons */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ paddingHorizontal: 12 }}>
            <Ionicons name="person-add" size={22} color="#fff" />
          </TouchableOpacity>
          <SettingsButton navigation={navigation} />
        </View>
      ),
    });
  }, [navigation]);

  const row = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate("ChatRoom", { user, room: item })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastLine}
        </Text>
      </View>
      {item.lastTs ? (
        <Text style={styles.time}>{dayjs.unix(item.lastTs).format("HH:mm")}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      {inbox.length ? (
        <FlatList
          data={inbox}
          renderItem={row}
          keyExtractor={(r) => r.id}
        />
      ) : (
        <View style={styles.empty}>
          <Text>No conversations yet.</Text>
        </View>
      )}

      <AddContactModal
        visible={showAdd}
        currentId={user.id}
        onClose={() => setShowAdd(false)}
        onPicked={(c) => {
          setShowAdd(false);
          navigation.navigate("ChatRoom", { user, room: c });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 16, fontWeight: "600" },
  preview: { fontSize: 13, color: "#666", marginTop: 2 },
  time: { fontSize: 12, color: "#999", marginLeft: 6 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
});
