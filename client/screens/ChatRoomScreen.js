import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import io from "socket.io-client";
import { SERVER_URL } from "../config";

export default function ChatRoomScreen({ route }) {
  const { user, partner } = route.params;
  const roomId = [user.id, partner.id].sort().join("_");

  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true }),
    });

    axios
      .get(`${SERVER_URL}/messages/${roomId}`)
      .then((res) => setChats(res.data))
      .catch(console.error);

    const s = io(SERVER_URL);
    s.emit("join", roomId);
    s.on("message", (msg) => {
      if (msg.sender !== user.username) {
        setChats((prev) => [...prev, msg]);
      }
      Notifications.scheduleNotificationAsync({
        content: {
          title: `New from ${msg.sender}`,
          body: msg.type === "text" ? msg.content : msg.type.toUpperCase(),
        },
        trigger: null,
      });
    });
    setSocket(s);

    return () => {
      s.disconnect();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, []);

  const sendMessage = (content, type = "text") => {
    socket.emit("message", {
      sender: user.id,
      receiver: partner.id,
      content,
      type,
    });
    setChats((prev) => [...prev, { sender: user.username, content, type }]);
    setMessage("");
  };

  const pickImage = async () => {
    const { assets } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });
    if (!assets?.length) return;
    const uri = assets[0].uri;
    const form = new FormData();
    form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" });
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
        {item.sender}: {item.content}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={chats}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.container}
        renderItem={renderItem}
      />
      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Send" onPress={() => sendMessage(message)} />
        <Button title="📷" onPress={pickImage} />
        <Button
          title={recording ? "Stop 📼" : "Record 🎙️"}
          onPress={toggleRecording}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 12, flexGrow: 1 },
  text: { marginVertical: 4 },
  media: { width: 200, height: 200, marginVertical: 8 },
  audio: { color: "#0066CC", marginVertical: 8 },
  footer: {
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
    marginRight: 8,
    padding: 8,
    borderRadius: 4,
  },
});
