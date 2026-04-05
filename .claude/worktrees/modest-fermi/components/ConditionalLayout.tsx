"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/layout/MainLayout/Header";
import Sidebar from "@/layout/MainLayout/Sidebar";
import ContentWrapper from "@/components/ContentWrapper";
import CategorySidebar from "@/components/modules/trending/CategorySidebar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  locale: string;
}

// Pages that should not show sidebar and header
const authPages = [
  "/login",
  "/register",
  "/forget-password",
  "/reset-password",
  "/password-reset-verify",
  "/otp-verify",
];

export default function ConditionalLayout({
  children,
  locale,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = authPages.includes(pathname ?? "");
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);

  // Listen for category sidebar open/close events from header (hover-based)
  useEffect(() => {
    const handleOpenCategorySidebar = () => {
      setIsCategorySidebarOpen(true);
    };

    const handleCloseCategorySidebar = () => {
      setIsCategorySidebarOpen(false);
    };

    window.addEventListener("openCategorySidebar", handleOpenCategorySidebar);
    window.addEventListener("closeCategorySidebar", handleCloseCategorySidebar);

    return () => {
      window.removeEventListener(
        "openCategorySidebar",
        handleOpenCategorySidebar,
      );
      window.removeEventListener(
        "closeCategorySidebar",
        handleCloseCategorySidebar,
      );
    };
  }, []);

  if (isAuthPage) {
    // For auth pages, render children without sidebar, header, or content wrapper padding
    return <>{children}</>;
  }

  // For regular pages, render with sidebar, header, and content wrapper
  return (
    <>
      <Sidebar />
      <Header locale={locale} />
      {/* Category Sidebar - Global for all pages */}
      <CategorySidebar
        isOpen={isCategorySidebarOpen}
        onClose={() => setIsCategorySidebarOpen(false)}
        onCategorySelect={(categoryId) => {
          router.push(`/trending?category=${categoryId}`);
          setIsCategorySidebarOpen(false);
        }}
      />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}

