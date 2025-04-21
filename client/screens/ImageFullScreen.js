import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";

export default function ImageFullScreen({ route, navigation }) {
  const { uri } = route.params;
  return (
    <TouchableOpacity
      style={styles.center}
      activeOpacity={1}
      onPress={() => navigation.goBack()}
    >
      <Image source={{ uri }} style={styles.img} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  img: { width: "100%", height: "100%" },
});
