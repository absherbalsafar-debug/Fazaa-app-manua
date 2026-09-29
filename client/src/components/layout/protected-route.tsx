import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps { children: ReactNode; allowedRoles?: string[]; }

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb]" dir="rtl"><div className="h-7 w-7 animate-spin rounded-full border-2 border-[#102443] border-t-transparent" /></div>;
  if (!user) return <Redirect to="/control-center/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/control-center/login" />;
  return <>{children}</>;
}
