"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("proofi-theme") as Theme | null;
    setTheme(saved === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("proofi-theme", next);
      return next;
    });
  };

  // Avoid flash: render with dark class until mounted
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className={mounted ? (theme === "dark" ? "dark" : "") : "dark"}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
