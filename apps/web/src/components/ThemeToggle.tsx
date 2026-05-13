import { useTheme } from "../context/theme-context";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {theme === "light" ? (
        <>
          <Moon size={16} /> Dark
        </>
      ) : (
        <>
          <Sun size={16} /> Light
        </>
      )}
    </motion.button>
  );
}