/* components/MessageBubble.js */
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";

export default function MessageBubble({ me, msg, onImage }) {
  const itsMe = msg.sender === me.id;
  const statusIcon = itsMe
    ? msg.seen
      ? "checkmark-done"
      : msg.delivered
      ? "checkmark"
      : "time-outline"
    : undefined;

  return (
    <View style={[styles.row, itsMe && { justifyContent: "flex-end" }]}>
      <View
        style={[
          styles.bubble,
          itsMe ? styles.mine : styles.theirs,
          msg.type === "image" && { padding: 0 },
        ]}
      >
        {msg.type === "text" ? (
          <Text style={{ color: itsMe ? "#fff" : "#000" }}>{msg.content}</Text>
        ) : (
          <TouchableOpacity onPress={() => onImage(msg.content)}>
            <Image
              source={{ uri: msg.content }}
              style={{ width: 220, height: 220, borderRadius: 8 }}
            />
          </TouchableOpacity>
        )}
        <View style={styles.meta}>
          <Text style={styles.time}>{dayjs(msg.createdAt).format("HH:mm")}</Text>
          {statusIcon && (
            <Ionicons
              name={statusIcon}
              size={14}
              color={msg.seen ? "#34b7f1" : "#ccc"}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 8, marginVertical: 4 },
  bubble: {
    maxWidth: "70%",
    borderRadius: 8,
    padding: 10,
  },
  mine: { backgroundColor: "#0066CC" },
  theirs: { backgroundColor: "#eee" },
  meta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  time: { fontSize: 10, color: "#888" },
});
