/* App.js */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatRoomScreen from "./screens/ChatRoomScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // header hidden by default; we’ll enable it per‑screen below
        screenOptions={{ headerShown: false }}
      >
        {/* -------- AUTH -------- */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* -------- MAIN LIST (needs header) -------- */}
        <Stack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{ headerShown: true, title: "Chats" }}
        />

        {/* -------- INDIVIDUAL CHAT ROOM -------- */}
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params?.room?.name ?? "Chat",
            headerBackTitleVisible: false, // cleaner look on iOS
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
