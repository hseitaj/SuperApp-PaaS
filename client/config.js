// client/config.js
import Constants from "expo-constants";

// on Snack/Expo Go newer SDKs use expoConfig.extra
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

export const SERVER_URL =
  extra.SERVER_URL || "https://superapp-paas.onrender.com";
