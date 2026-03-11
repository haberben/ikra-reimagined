import { useState, useEffect } from "react";

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("ikra_theme") === "dark");

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ikra_theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
