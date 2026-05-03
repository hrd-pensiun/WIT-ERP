"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { insForge } from "@/lib/insforge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

    return () => {
      mounted = false;
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Sidebar is position:fixed (w-64); main column uses lg:ml-64 so content does not slide under it */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content — offset by sidebar width on lg+ so content does not sit under fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        <div className="lg:hidden h-16" /> {/* Spacer for mobile header */}
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
