/* screens/ChatRoomScreen.js */
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Audio } from "expo-av";
import io from "socket.io-client";
import axios from "axios";
import { SERVER_URL } from "../config";
import MessageBubble from "../components/MessageBubble";
import FullImageModal from "../components/FullImageModal";

export default function ChatRoomScreen({ navigation, route }) {
  const { user, room } = route.params;
  const [socket] = useState(() => io(SERVER_URL));
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [fullImg, setFullImg] = useState(null);
  const listRef = useRef(null);

  /* header title */
  useEffect(() => {
    navigation.setOptions({ title: room.name || "Chat" });
  }, [navigation, room]);

  /* join + history */
  useEffect(() => {
    socket.emit("join", user.id);
    socket.on("message", (msg) => {
      if (msg.sender === room.id) markSeen();
      setMessages((m) => [...m, msg]);
    });
    axios
      .get(`${SERVER_URL}/messages/${room.id}/${user.id}`)
      .then(({ data }) => {
        setMessages(data);
        markSeen();
      });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSeen = () =>
    socket.emit("seen", { viewer: user.id, partner: room.id });

  /* helpers */
  const send = (content, type = "text") => {
    socket.emit("message", {
      sender: user.id,
      receiver: room.id,
      content,
      type,
    });
    setMessages((m) => [
      ...m,
      {
        id: Date.now().toString(),
        sender: user.id,
        receiver: room.id,
        content,
        type,
        createdAt: Date.now(),
        delivered: 1,
        seen: 1,
      },
    ]);
    setText("");
    listRef.current?.scrollToEnd({ animated: true });
  };

  /* ---------- image ---------- */
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission required");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (res.canceled) return;
    const asset = res.assets[0];

    // resize down to 1080px wide
    const manip = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const form = new FormData();
    form.append("file", {
      uri: manip.uri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    try {
      const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      send(data.url, "image");
    } catch (e) {
      console.warn("Image pick failed:", e.message);
    }
  };

  /* ---------- voice ---------- */
  const [recording, setRecording] = useState(null);
  const toggleRec = async () => {
    if (Platform.OS === "web") return alert("Voice only on device");
    if (!recording) {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();
      setRecording(rec);
    } else {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      const form = new FormData();
      form.append("file", { uri, type: "audio/m4a", name: "v.m4a" });
      try {
        const { data } = await axios.post(`${SERVER_URL}/upload`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        send(data.url, "audio");
      } catch (e) {
        console.warn("Audio upload failed", e);
      }
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble me={user} msg={item} onImage={setFullImg} />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage}>
            <Ionicons name="image-outline" size={28} color="#0066CC" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleRec} style={{ marginLeft: 8 }}>
            <Ionicons
              name={recording ? "stop-circle" : "mic-outline"}
              size={28}
              color={recording ? "red" : "#0066CC"}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textIn}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            onSubmitEditing={() => text.trim() && send(text.trim())}
            returnKeyType="send"
          />

          <TouchableOpacity
            onPress={() => text.trim() && send(text.trim())}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="send" size={26} color="#0066CC" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <FullImageModal uri={fullImg} onClose={() => setFullImg(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  textIn: {
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
});
