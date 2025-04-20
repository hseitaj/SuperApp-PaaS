/* screens/ChatRoomScreen.js */
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import axios from "axios";
import io from "socket.io-client";
import { SERVER_URL } from "../config";

export default function ChatRoomScreen({ navigation, route }) {
  const { user, room } = route.params;
  const socketRef = useRef();
  const [chats, setChats] = useState([]);
  const [msg, setMsg] = useState("");

  // --- mount ---------------------------------------------------------------
  useEffect(() => {
    navigation.setOptions({ title: room.name });
    (async () => {
      const { data } = await axios.get(`${SERVER_URL}/messages/${room.id}`);
      setChats(data);
    })();

    const s = io(SERVER_URL);
    socketRef.current = s;
    s.emit("join", room.id);
    s.on("message", (m) => setChats((prev) => [...prev, m]));

    return () => s.disconnect();
  }, [navigation, room.id, room.name]);

  // -------------------------------------------------------------------------
  function send(content, type = "text") {
    socketRef.current.emit("message", {
      sender: user.username,
      receiver: room.id,
      content,
      type,
    });
    // rely on socket echo; no local push → fixes double
  }

  async function pickImage() {
    try {
      const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
      });
      if (canceled || !assets?.length) return;

      const img = assets[0];
      const form = new FormData();
      form.append("file", {
        uri: img.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      send(data.url, "image");
    } catch (e) {
      Alert.alert("Image pick failed", e.message);
    }
  }

  async function sendAudio() {
    if (Platform.OS === "web") {
      Alert.alert("Not supported on web");
      return;
    }
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await rec.startAsync();
    Alert.alert("Recording…", "Tap OK to stop when done", [
      {
        text: "OK",
        onPress: async () => {
          await rec.stopAndUnloadAsync();
          const uri = rec.getURI();
          const form = new FormData();
          form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" });
          const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          send(data.url, "audio");
        },
      },
    ]);
  }

  function renderItem({ item }) {
    if (item.type === "image")
      return <Image source={{ uri: item.content }} style={{ height: 200 }} />;
    if (item.type === "audio")
      return (
        <TouchableOpacity
          onPress={async () => {
            const { sound } = await Audio.Sound.createAsync({
              uri: item.content,
            });
            await sound.playAsync();
          }}
        >
          <Text>🔊 Tap to play audio</Text>
        </TouchableOpacity>
      );
    return (
      <Text>
        {item.sender}: {item.content}
      </Text>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 12 }}>
        <FlatList
          data={chats}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={{ gap: 8 }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 6,
            }}
            placeholder="Message"
            value={msg}
            onChangeText={setMsg}
            onSubmitEditing={() => {
              if (msg.trim()) send(msg.trim());
              setMsg("");
            }}
          />
          <TouchableOpacity
            onPress={() => msg.trim() && (send(msg.trim()), setMsg(""))}
          >
            <Text style={{ fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={{ fontSize: 18 }}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendAudio}>
            <Text style={{ fontSize: 18 }}>🎤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
