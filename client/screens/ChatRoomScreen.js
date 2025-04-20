// client/screens/ChatRoomScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import io from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { SERVER_URL } from "../config";

export default function ChatRoomScreen({ route, navigation }) {
  /* ───────── params ───────── */
  const { user, room, friendName = "Chat" } = route.params;

  /* ───────── state ───────── */
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [text, setText] = useState("");
  const flatRef = useRef(null);
  const recordingRef = useRef(null);

  /* ───────── header title ───────── */
  useEffect(() => {
    navigation.setOptions({ title: friendName });
  }, [friendName, navigation]);

  /* ───────── connect & history ───────── */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await axios.get(`${SERVER_URL}/messages/${room}`);
        if (alive) setChats(data);
      } catch (e) {
        console.warn("History load failed:", e.message);
      }
    })();

    const s = io(SERVER_URL, { transports: ["websocket"] });
    s.emit("join", room);
    s.on("message", (m) => setChats((p) => [...p, m]));
    setSocket(s);

    return () => {
      alive = false;
      s.disconnect();
    };
  }, [room]);

  /* ───────── helpers ───────── */
  const scrollToEnd = () => flatRef.current?.scrollToEnd({ animated: true });

  const send = (content, type = "text") => {
    if (!socket) return;
    const msg = {
      sender: user.username,
      receiver: room,
      content,
      type,
    };
    socket.emit("message", msg);
    setChats((p) => [...p, msg]);
    scrollToEnd();
  };

  /* ───────── UI actions ───────── */
  const handleSendText = () => {
    if (!text.trim()) return;
    send(text.trim());
    setText("");
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!res.assets?.length) return;
      const uri = res.assets[0].uri;
      // 🔒 Snack can’t POST files to your server; on device this works.
      const form = new FormData();
      form.append("file", { uri, name: "img.jpg", type: "image/jpeg" });
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      send(data.url, "image");
    } catch (e) {
      console.warn("Image pick failed:", e.message);
    }
  };

  const toggleAudio = async () => {
    if (!recordingRef.current) {
      await Audio.requestPermissionsAsync();
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      recordingRef.current = recording;
    } else {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      const form = new FormData();
      form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      send(data.url, "audio");
    }
  };

  /* ───────── renderers ───────── */
  const renderItem = ({ item }) => {
    const mine = item.sender === user.username;
    const wrap = [styles.bubble, mine ? styles.mine : styles.theirs];

    if (item.type === "image") {
      return (
        <View style={wrap}>
          <Image source={{ uri: item.content }} style={styles.image} />
        </View>
      );
    }

    if (item.type === "audio") {
      return (
        <TouchableOpacity
          style={wrap}
          onPress={async () => {
            const { sound } = await Audio.Sound.createAsync({
              uri: item.content,
            });
            await sound.playAsync();
          }}
        >
          <Text style={styles.audio}>🔊 Play audio</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={wrap}>
        <Text style={styles.text}>{item.content}</Text>
      </View>
    );
  };

  /* ───────── component ───────── */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <SafeAreaView style={styles.container}>
        <FlatList
          ref={flatRef}
          data={chats}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          onContentSizeChange={scrollToEnd}
          contentContainerStyle={{ padding: 8 }}
        />

        {/* input bar */}
        <View style={styles.bar}>
          <TouchableOpacity onPress={pickImage} style={styles.barBtn}>
            <Text>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Message…"
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
          />

          <TouchableOpacity onPress={toggleAudio} style={styles.barBtn}>
            <Text>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendText} style={styles.sendBtn}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  /* bubbles */
  bubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  mine: { alignSelf: "flex-end", backgroundColor: "#0066CC" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#eee" },
  text: { color: "#000" },
  image: { width: 180, height: 180, borderRadius: 8 },
  audio: { color: "#0066CC", fontWeight: "600" },
  /* bar */
  bar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 6,
  },
  barBtn: { padding: 6 },
  sendBtn: {
    backgroundColor: "#0066CC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
