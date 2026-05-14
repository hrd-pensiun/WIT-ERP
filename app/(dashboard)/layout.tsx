"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { insForge } from "@/lib/insforge";
import { useAuth } from "@/hooks/useAuth";

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: "easeIn" as const } },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!insForge) {
      router.replace("/login");
      return;
    }

    let mounted = true;
    insForge.auth.getCurrentUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setIsCheckingAuth(false);
    });

    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) return;
    const normalizedRole = (user?.profileRole ?? "").trim().toLowerCase();
    const isStaffOrManager = normalizedRole === "employee" || normalizedRole === "manager";
    if (!isStaffOrManager) return;
    if (pathname.startsWith("/performance") && !pathname.startsWith("/performance/360-feedback")) {
      router.replace("/performance/360-feedback");
    }
  }, [isCheckingAuth, pathname, router, user?.profileRole]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-xs text-muted-foreground tracking-wide">Authenticating…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Sidebar — position:fixed; width controlled by collapsed state */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main content area — margin tracks sidebar width */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 60 : 256 }}
      >
        <div className="lg:hidden h-14" />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <div>
            <Breadcrumbs />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
