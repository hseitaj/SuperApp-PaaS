/* screens/LoginScreen.js */
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function login() {
    setErrorMsg("");
    try {
      const { data } = await axios.post(`${SERVER_URL}/login`, {
        username,
        password,
      });
      navigation.replace("ChatList", { user: data });
    } catch (e) {
      setErrorMsg(
        e.response?.data?.error || "Server unreachable, try again later."
      );
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={login}>
            <Text style={styles.btnTxt}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Don’t have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
  },
  logo: { width: 80, height: 80, alignSelf: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  error: { color: "red", textAlign: "center", marginBottom: 12 },
  btn: {
    backgroundColor: "#0066CC",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  btnTxt: { color: "#fff", fontWeight: "600" },
  link: { color: "#0066CC", textAlign: "center" },
});
