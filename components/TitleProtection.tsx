"use client";

import { useEffect, useRef } from "react";

/**
 * Component to protect the site name "Ultrasooq" in the browser tab title
 * from being translated
 */
export default function TitleProtection() {
  const lastGoodTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const protectTitle = () => {
      const titleEl = document.querySelector("title");
      if (!titleEl) return;

      const currentText = titleEl.textContent || "";

      // Always ensure translate="no" is set on the title
      titleEl.setAttribute("translate", "no");

      // If current title contains "Ultrasooq", store it as the last good title
      if (currentText.includes("Ultrasooq")) {
        lastGoodTitleRef.current = currentText;
      } 
      // If title doesn't contain "Ultrasooq" but we have a stored good title, restore it
      else if (lastGoodTitleRef.current && !currentText.includes("Ultrasooq")) {
        // Check if this might be a legitimate title change (new page) by checking if structure is similar
        // If the title has "|" but missing Ultrasooq, it was likely translated
        if (currentText.includes("|")) {
          // Restore Ultrasooq by replacing what comes after "|"
          const parts = currentText.split("|");
          if (parts.length >= 2) {
            titleEl.textContent = `${parts[0].trim()} | Ultrasooq`;
            lastGoodTitleRef.current = titleEl.textContent;
          }
        } else if (lastGoodTitleRef.current) {
          // Title structure changed completely, restore the last good title
          titleEl.textContent = lastGoodTitleRef.current;
        }
      }
    };

    // Initialize
    const titleEl = document.querySelector("title");
    if (titleEl) {
      protectTitle();
    }

    // Watch for title changes
    const observer = new MutationObserver(() => {
      protectTitle();
    });

    if (titleEl) {
      observer.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    // Monitor periodically
    const intervalId = setInterval(protectTitle, 500);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  return null;
}

