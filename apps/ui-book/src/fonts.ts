import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from "@expo-google-fonts/manrope";

export function useBookFonts() {
  return useFonts({ Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold });
}
