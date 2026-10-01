import { defineConfig } from "vitest/config";
import { linkyUi } from "@linky-fit/ui/vite";

export default defineConfig({
  plugins: [linkyUi()],
  test: {
    // Node cannot load React Native sources; inlining sends them through the react-native-web aliases.
    server: {
      deps: { inline: [/tamagui/, /react-native/, /lucide-react-native/] },
    },
  },
});
