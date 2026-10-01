import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";

export function useBookFonts() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const faces = Object.entries({
      400: Manrope_400Regular,
      600: Manrope_600SemiBold,
      700: Manrope_700Bold,
    }).map(
      ([weight, source]) =>
        new FontFace("Manrope", `url("${Asset.fromModule(source).uri}")`, {
          weight,
        }),
    );
    Promise.all(faces.map((face) => face.load())).then(
      (fonts) => {
        if (!active) return;
        fonts.forEach((font) => document.fonts.add(font));
        setLoaded(true);
      },
      (cause: Error) => {
        if (active) setError(cause);
      },
    );
    return () => {
      active = false;
      faces.forEach((font) => document.fonts.delete(font));
    };
  }, []);
  return [loaded, error] as const;
}
