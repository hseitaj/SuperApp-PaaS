/* screens/ChatListScreen.js */
import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons"; // ✅ Snack‑friendly import
import { SERVER_URL } from "../config";
import AddContactModal from "../components/AddContactModal"; // ✅ default import
import axios from "axios";

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);

  /* header with log‑out */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16 }}
          onPress={() => navigation.replace("Login")}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: "#0066CC" },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  /* fetch conversations */
  useEffect(() => {
    axios
      .get(`${SERVER_URL}/rooms/${user.id}`)
      .then(({ data }) => setRooms(data))
      .catch(console.warn);
  }, [user.id]);

  /* list row */
  const renderRow = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("ChatRoom", { user, room: item })}
      >
        <Text style={styles.rowTxt}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [navigation, user]
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
        <View style={styles.empty}>
          <Text>No conversations yet.</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={{ color: "#fff" }}>Add someone</Text>
          </TouchableOpacity>
        </View>
      )}

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
  row: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  rowTxt: { fontSize: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  addBtn: {
    marginTop: 16,
    backgroundColor: "#0066CC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
});
