/* client/screens/RegisterScreen.js */
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    try {
      const { data } = await axios.post(`${SERVER_URL}/signup`, {
        username,
        password,
      });
      navigation.replace("ChatList", { user: data });
    } catch (e) {
      setErr(e.response?.data?.error || "Network error");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[
        styles.root,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.card}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <TextInput
          placeholder="Username"
          placeholderTextColor="#888"
          style={styles.input}
          value={username}
          onChangeText={(t) => {
            setUsername(t);
            setErr("");
          }}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setErr("");
          }}
        />
        {!!err && <Text style={styles.err}>{err}</Text>}
        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnTxt}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0066CC", alignItems: "center" },
  card: {
    width: "90%",
    maxWidth: 420,
    padding: 28,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 4,
    gap: 14,
  },
  logo: { width: 80, height: 80, alignSelf: "center", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  err: { color: "red", textAlign: "center" },
  btn: {
    backgroundColor: "#0066CC",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  btnTxt: { color: "#fff", fontWeight: "600" },
  link: { color: "#0066CC", textAlign: "center", marginTop: 4 },
});
