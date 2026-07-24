"use client";

import { useEffect } from "react";

export function ScrollToHash() {
  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return null;
}
