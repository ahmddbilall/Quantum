"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { buildAuthUrl } from "@/lib/auth-redirect";

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
  const searchParams = useSearchParams();

  const protectedPath = isProtectedPath(pathname || "");

  useEffect(() => {
    if (!isLoading && protectedPath && !isAuthenticated) {
      const query = searchParams.toString();
      const returnPath = `${pathname || "/"}${query ? `?${query}` : ""}`;
      router.replace(buildAuthUrl(returnPath));
    }
  }, [
    isLoading,
    protectedPath,
    isAuthenticated,
    pathname,
    searchParams,
    router,
  ]);

  if (protectedPath && (isLoading || !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
