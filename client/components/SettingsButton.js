import React, { useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SettingsModal from "./SettingsModal";

export default function SettingsButton({ navigation }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ paddingHorizontal: 12 }}>
        <Ionicons name="settings-outline" size={22} color="#fff" />
      </Pressable>

      <SettingsModal
        visible={open}
        onClose={() => setOpen(false)}
        onLogout={() => {
          setOpen(false);
          navigation.replace("Login");
        }}
      />
    </>
  );
}
