/* client/screens/ChatRoomScreen.js */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import io from "socket.io-client";
import dayjs from "dayjs";
import axios from "axios";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SERVER_URL } from "../config";

export default function ChatRoomScreen({ navigation, route }) {
  const { user, room } = route.params;
  const [list, setList] = useState([]);
  const [text, setText] = useState("");
  const flat = useRef(null);

  /* realtime --------------------------------------------------------------- */
  useEffect(() => {
    const s = io(SERVER_URL, { transports: ["websocket"] });
    s.emit("join", user.id);
    s.on("message", (m) => {
      // only keep messages for THIS room
      if (
        (m.sender === user.id && m.receiver === room.id) ||
        (m.sender === room.id && m.receiver === user.id)
      ) {
        setList((p) => [...p, m]);
        flat.current?.scrollToEnd({ animated: true });
      }
    });
    return () => s.disconnect();
  }, [user.id, room.id]);

  /* history ---------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const { data } = await axios.get(
        `${SERVER_URL}/messages/${user.id}/${room.id}`
      );
      setList(data);
      setTimeout(() => flat.current?.scrollToEnd({ animated: false }), 50);
    })();
  }, [user.id, room.id]);

  /* helpers ---------------------------------------------------------------- */
  const timestamp = () => Math.floor(Date.now() / 1000);

  const pushLocal = (payload) => {
    setList((p) => [...p, payload]);
    flat.current?.scrollToEnd({ animated: true });
  };

  const sendText = async () => {
    if (!text.trim()) return;
    const payload = {
      sender: user.id,
      receiver: room.id,
      content: text.trim(),
      type: "text",
      timestamp: timestamp(),
    };
    pushLocal(payload);
    setText("");
    axios.post(`${SERVER_URL}/messages`, payload).catch(console.warn);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled) return;

    const localUri = res.assets[0].uri;
    const form     = new FormData();
    form.append("file", {
      uri: localUri,
      name: localUri.split("/").pop(),
      type: "image/jpeg",
    });

    try {
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const payload = {
        sender: user.id,
        receiver: room.id,
        content: data.url,
        type: "image",
        timestamp: timestamp(),
      };
      pushLocal(payload);
      axios.post(`${SERVER_URL}/messages`, payload);
    } catch (err) {
      console.warn("Image pick failed", err.message);
    }
  };

  /* row -------------------------------------------------------------------- */
  const render = ({ item }) => {
    const mine = item.sender === user.id;
    const wrap = [styles.bubble, mine ? styles.mine : styles.theirs];

    return (
      <View style={{ alignSelf: mine ? "flex-end" : "flex-start" }}>
        {item.type === "image" ? (
          <Image source={{ uri: item.content }} style={styles.img} />
        ) : (
          <View style={wrap}>
            <Text style={{ color: mine ? "#fff" : "#000" }}>{item.content}</Text>
          </View>
        )}
        <Text style={styles.time}>
          {dayjs.unix(item.timestamp).format("HH:mm")}
        </Text>
      </View>
    );
  };

  /* ui --------------------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={flat}
        data={list}
        renderItem={render}
        keyExtractor={(it, idx) => it.id || String(idx)}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
      />

      {/* composer */}
      <View style={styles.composer}>
        <TouchableOpacity onPress={pickImage} style={styles.utilBtn}>
          <MaterialIcons name="photo" size={22} color="#0066CC" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={sendText}
        />

        <TouchableOpacity onPress={sendText} style={styles.utilBtn}>
          <Ionicons name="send" size={22} color="#0066CC" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "80%",
    marginBottom: 4,
  },
  mine: { backgroundColor: "#0066CC" },
  theirs: { backgroundColor: "#E4E6EB" },
  time: { fontSize: 11, color: "#777", marginBottom: 6, alignSelf: "flex-end" },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 6,
  },
  utilBtn: { padding: 6 },
  img: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
  },
});
