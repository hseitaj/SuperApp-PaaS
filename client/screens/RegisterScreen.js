// superapp-paas/client/screens/RegisterScreen.js
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const signup = async () => {
    setErrorMsg("");
    if (username.trim().length < 3)
      return setErrorMsg("Username must be ≥3 chars.");
    if (password.length < 4) return setErrorMsg("Password must be ≥4 chars.");

    try {
      const res = await axios.post(
        `${SERVER_URL}/signup`,
        { username: username.trim(), password },
        { headers: { "Content-Type": "application/json" } }
      );
      navigation.replace("ChatList", { user: res.data });
    } catch (e) {
      console.error("Signup error:", e.response?.data || e.message);
      setErrorMsg(
        e.response?.data?.error ||
          (e.request ? "Server unreachable" : e.message)
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              errorMsg && setErrorMsg("");
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              errorMsg && setErrorMsg("");
            }}
          />
          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
          <TouchableOpacity style={styles.button} onPress={signup}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  error: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0066CC",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  linkText: { color: "#0066CC", textAlign: "center" },
});
