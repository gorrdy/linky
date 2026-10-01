import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useBookFonts } from "./fonts";
import * as UI from "@linky-fit/ui";
import { componentSections, tokens } from "./sections";

export default function App() {
  const [mode, setMode] = useState<UI.ColorMode>("light");
  const [loaded, error] = useBookFonts();
  return (
    <SafeAreaProvider>
      <UI.UIProvider mode={mode}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: UI.themes[mode].background }}
        >
          {error ? (
            <UI.Text>Could not load Manrope: {error.message}</UI.Text>
          ) : loaded ? (
            <Book mode={mode} onModeChange={setMode} />
          ) : (
            <UI.LoadingState label="Loading fonts" />
          )}
        </SafeAreaView>
      </UI.UIProvider>
    </SafeAreaProvider>
  );
}

function Book({
  mode,
  onModeChange,
}: {
  mode: UI.ColorMode;
  onModeChange: (mode: UI.ColorMode) => void;
}) {
  return (
    <UI.ScrollView flex={1} keyboardShouldPersistTaps="handled">
      <UI.Screen
        width="100%"
        maxWidth="$contentWidth"
        alignSelf="center"
        gap="$xxxl"
      >
        <UI.Stack gap="$md">
          <UI.Row justifyContent="space-between">
            <UI.Text variant="heading" role="heading">
              Linky UI book
            </UI.Text>
            <UI.Switch
              accessibilityLabel="Dark mode"
              value={mode === "dark"}
              onValueChange={(dark) => onModeChange(dark ? "dark" : "light")}
            />
          </UI.Row>
          <UI.Text color="$colorMuted">
            Every element, grouped by category. Fictional data, local state.
          </UI.Text>
          <UI.Text variant="caption" color="$colorMuted">
            {mode === "dark" ? "Dark" : "Light"} mode ·{" "}
            {componentSections.reduce(
              (count, section) => count + Object.keys(section.entries).length,
              0,
            )}{" "}
            components
          </UI.Text>
        </UI.Stack>
        {[tokens, ...componentSections].map((section) => (
          <UI.Stack
            key={section.title}
            gap="$xl"
            testID={`category-${section.title}`}
          >
            <UI.Text variant="heading" role="heading">
              {section.title}
            </UI.Text>
            {Object.entries(section.entries).map(([name, Example]) => (
              <UI.Stack key={name} gap="$md" testID={`entry-${name}`}>
                <UI.Text variant="label" role="heading" color="$colorMuted">
                  {name}
                </UI.Text>
                <Example mode={mode} />
                <UI.Divider marginTop="$sm" />
              </UI.Stack>
            ))}
          </UI.Stack>
        ))}
      </UI.Screen>
    </UI.ScrollView>
  );
}
