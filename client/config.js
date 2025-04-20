// client/config.js
import Constants from "expo-constants";

const { expoConfig, manifest } = Constants;
const extra = expoConfig?.extra ?? manifest?.extra ?? {};

export const SERVER_URL = extra.SERVER_URL;
