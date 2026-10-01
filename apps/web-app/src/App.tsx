import { UIProvider } from "@linky-fit/ui";
import AppShell from "./app/AppShell";

export default function App() {
  return (
    <UIProvider mode="dark">
      <AppShell />
    </UIProvider>
  );
}
