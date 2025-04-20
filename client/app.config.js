// superapp-paas/client/app.config.js
import "dotenv/config";
export default ({ config }) => ({
  ...config,
  extra: {
    SERVER_URL: process.env.SERVER_URL || "http://192.168.1.196:3000",
  },
  platforms: ["ios", "android", "web"],
});
