export const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    transition: background-color 0.3s ease;
  }

  .custom-scrollbar:hover::-webkit-scrollbar-thumb,
  .custom-scrollbar.scrolling::-webkit-scrollbar-thumb {
    background-color: #9ca3af;
  }

  .custom-scrollbar:hover::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar.scrolling::-webkit-scrollbar-thumb:hover {
    background-color: #6b7280;
  }
`;

export function injectScrollbarStyles() {
  if (typeof document !== "undefined") {
    const styleId = "category-sidebar-scrollbar-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = scrollbarStyles;
      document.head.appendChild(style);
    }
  }
}
