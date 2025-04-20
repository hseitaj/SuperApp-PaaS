// app.config.js
import "dotenv/config";

export default ({ config }) => ({
  ...config,
  extra: {
    // if you have .env locally, this will be your private IP;
    // if not (e.g. Snack), we fall back to a safe public placeholder:
    SERVER_URL: process.env.SERVER_URL || "https://my‑public‑mock‑api.com",
  },
});
