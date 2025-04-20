// superapp-paas/client/screens/ChatRoomScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import io from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { SERVER_URL } from "../config";

export default function ChatRoomScreen({ route, navigation }) {
  const { user, room } = route.params;
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: `Chat: ${room}` });

    Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true }),
    });

    axios
      .get(`${SERVER_URL}/messages/${room}`)
      .then((r) => setChats(r.data))
      .catch(console.error);

    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join", room);
    socket.on("message", (msg) => {
      setChats((prev) =>
        prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      Notifications.scheduleNotificationAsync({
        content: {
          title: `New from ${msg.sender}`,
          body: msg.type === "text" ? msg.content : msg.type,
        },
        trigger: null,
      });
    });
    return () => {
      socket.disconnect();
      recording?.stopAndUnloadAsync();
    };
  }, []);

  const sendMessage = (content, type = "text") => {
    const payload = { sender: user.username, receiver: room, content, type };
    socketRef.current.emit("message", payload);
    setChats((prev) => [...prev, { id: Date.now().toString(), ...payload }]);
  };

  const pickImage = async () => {
    const { assets } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.All,
    });
    if (!assets?.length) return;
    const uri = assets[0].uri;
    const form = new FormData();
    form.append("file", { uri, name: "upload.jpg", type: "image/jpeg" });
    const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    sendMessage(data.url, "image");
  };

  const toggleRecording = async () => {
    if (!recording) {
      await Audio.requestPermissionsAsync();
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(rec);
    } else {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const form = new FormData();
      form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendMessage(data.url, "audio");
      setRecording(null);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === "image") {
      return <Image source={{ uri: item.content }} style={styles.media} />;
    }
    if (item.type === "audio") {
      return (
        <TouchableOpacity
          onPress={async () => {
            const { sound } = await Audio.Sound.createAsync({
              uri: item.content,
            });
            await sound.playAsync();
          }}
        >
          <Text style={styles.audio}>🔊 Play Audio</Text>
        </TouchableOpacity>
      );
    }
    return (
      <Text style={styles.text}>
        <Text style={styles.bold}>{item.sender}: </Text>
        {item.content}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatList}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputRow}
      >
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor="#666"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            sendMessage(message);
            setMessage("");
          }}
        >
          <Text>🗨️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Text>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={toggleRecording}>
          <Text>{recording ? "⏹️" : "🎤"}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatList: { padding: 16 },
  text: { marginBottom: 8 },
  bold: { fontWeight: "600" },
  media: { width: 200, height: 200, marginBottom: 8 },
  audio: { color: "#0066CC", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  iconButton: { padding: 8 },
});
