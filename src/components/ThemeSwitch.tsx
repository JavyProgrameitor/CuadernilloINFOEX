import { useEffect, useState } from "react";

/** Selector de tema con daisyUI (forest / cyberpunk) con persistencia en localStorage */
export default function ThemeSwitch() {
  const KEY = "theme";
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "forest";
    return localStorage.getItem(KEY) || "forest";
  });

  // Aplica el tema al cargar y cuando cambie
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  // Si prefieres usar los "theme-controller" de daisyUI, también marcamos el radio correspondiente
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(`input.theme-controller[value="${theme}"]`);
    if (input) input.checked = true;
  }, [theme]);

  return (
    <div className="join">
      <input
        type="radio"
        name="theme"
        value="forest"
        aria-label="Oscuro"
        className="theme-controller btn join-item"
        onChange={() => setTheme("forest")}
        defaultChecked={theme === "forest"}
      />
      <input
        type="radio"
        name="theme"
        value="cyberpunk"
        aria-label="Claro"
        className="theme-controller btn join-item"
        onChange={() => setTheme("cyberpunk")}
        defaultChecked={theme === "cyberpunk"}
      />
    </div>
  );
}