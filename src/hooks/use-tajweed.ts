import { useState } from "react";
import { haptics } from "@/lib/haptics";

const STORAGE_KEY = "tajweedColors";

/** Colour-coded tajweed, on by default. Fluent readers can switch it off. */
export function useTajweed() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) !== "off");

  const toggle = () => {
    setEnabled((on) => {
      localStorage.setItem(STORAGE_KEY, on ? "off" : "on");
      return !on;
    });
    haptics.light();
  };

  return { enabled, toggle };
}
