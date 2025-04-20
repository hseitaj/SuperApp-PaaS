// superapp-paas/client/config.js
import Constants from "expo-constants";
export const SERVER_URL =
  Constants.expoConfig?.extra?.SERVER_URL || "http://192.168.1.196:3000";
