"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AppRouteGuardProps {
  children: React.ReactNode;
}

const PROTECTED_ROUTE_PREFIXES = ["/profile"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function AppRouteGuard({ children }: AppRouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const protectedPath = isProtectedPath(pathname || "");

  useEffect(() => {
    if (!isLoading && protectedPath && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isLoading, protectedPath, isAuthenticated, router]);

  if (protectedPath && (isLoading || !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
