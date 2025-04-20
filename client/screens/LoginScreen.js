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

  const login = async () => {
    setErrorMsg("");
    if (username.trim().length < 3) return setErrorMsg("Username ≥3 chars");
    if (password.length < 4) return setErrorMsg("Password ≥4 chars");
    try {
      const res = await axios.post(`${SERVER_URL}/login`, {
        username: username.trim(),
        password,
      });
      navigation.replace("ChatList", { user: res.data });
    } catch (e) {
      setErrorMsg(e.response?.data?.error || "Server unreachable");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (errorMsg) setErrorMsg("");
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errorMsg) setErrorMsg("");
            }}
          />
          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Don’t have an account? Register</Text>
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
  logo: { width: 80, height: 80, alignSelf: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
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
