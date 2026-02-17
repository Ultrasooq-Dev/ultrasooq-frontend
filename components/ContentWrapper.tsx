"use client";
import React, { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { getCookie } from "cookies-next";
import { PUREMOON_TOKEN_KEY } from "@/utils/constants";
import { cn } from "@/lib/utils";

interface ContentWrapperProps {
  children: React.ReactNode;
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({ children }) => {
  const { isHovered } = useSidebar();
  const { langDir } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const accessToken = getCookie(PUREMOON_TOKEN_KEY);

  // Ensure hydration matches - only calculate sidebar width after mount
  useEffect(() => {
    setMounted(true);
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate padding based on sidebar state
  // Mobile: no padding (sidebar slides in/out)
  // Desktop: Always 72px (collapsed width) - sidebar expands over content on hover
  // Use 0 during SSR to match initial client render
  // IMPORTANT: Use 0 during SSR to prevent hydration mismatch
  const sidebarWidth = mounted && accessToken && !isMobile ? 72 : 0;

  // Static className to prevent hydration mismatch - must match server and client exactly
  const baseClassName = "transition-all duration-300 ease-in-out min-h-screen w-full overflow-x-hidden";

  return (
    <div
      className={baseClassName}
      style={{
        ...(langDir === "rtl"
          ? { paddingRight: `${sidebarWidth}px` }
          : { paddingLeft: `${sidebarWidth}px` }),
      }}
    >
      {children}
    </div>
  );
};

export default ContentWrapper;

