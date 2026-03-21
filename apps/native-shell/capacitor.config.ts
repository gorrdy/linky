import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "fit.linky.app",
  appName: "Linky",
  webDir: "../web-app/dist",
  android: {
    backgroundColor: "#ffffff",
  },
  ios: {
    backgroundColor: "#ffffff",
  },
  server: {
    url: "http://127.0.0.1:5174/",
    cleartext: true,
    androidScheme: "http",
    iosScheme: "https",
  },
};

export default config;
