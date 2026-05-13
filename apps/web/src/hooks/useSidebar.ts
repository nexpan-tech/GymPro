import { useState, useEffect } from "react";

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar", String(!prev));
      return !prev;
    });
  };

  return { collapsed, toggle };
}
