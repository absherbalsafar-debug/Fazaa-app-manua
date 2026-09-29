import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ControlCenterLayout } from "@/control-center/ControlCenterLayout";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const AdminDashboard = lazy(() => import("@/control-center/pages/dashboard"));
const AdminUsers = lazy(() => import("@/control-center/pages/users"));
const AdminProviders = lazy(() => import("@/control-center/pages/providers"));
const AdminBusiness = lazy(() => import("@/control-center/pages/business"));
const AdminComplaints = lazy(() => import("@/control-center/pages/complaints"));
const AdminTaxonomy = lazy(() => import("@/control-center/pages/taxonomy"));

class RuntimeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Control center error", error, info.componentStack); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] px-6 text-center" dir="rtl"><div className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102443] text-2xl font-black text-[#f0b046]">ف</div><h1 className="mt-5 text-xl font-black text-[#102443]">تعذر تحميل مركز الإدارة</h1><p className="mt-2 text-sm leading-6 text-[#66758a]">حدث خلل مؤقت. أعد المحاولة أو ارجع إلى تسجيل الدخول.</p><div className="mt-6 flex gap-2"><button type="button" onClick={() => window.location.reload()} className="flex-1 rounded-2xl bg-[#102443] px-4 py-3 text-sm font-bold text-white">إعادة المحاولة</button><a href="/control-center/login" className="flex-1 rounded-2xl border border-[#d9dfe7] px-4 py-3 text-sm font-bold text-[#102443]">تسجيل الدخول</a></div></div></div>;
  }
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function LoadingScreen() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb]" dir="rtl"><div className="flex flex-col items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102443] text-2xl font-black text-[#f0b046] shadow-lg">ف</div><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#102443] border-t-transparent" /></div></div>;
}

function AdminLogin() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!isLoading && user?.role === "admin") navigate("/control-center", { replace: true }); }, [isLoading, navigate, user]);
  if (isLoading) return <LoadingScreen />;
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] px-5 py-10" dir="rtl"><section className="w-full max-w-md rounded-[32px] border border-[#e4eaf2] bg-white p-7 shadow-[0_24px_70px_rgba(16,36,67,0.12)] sm:p-9"><div className="flex items-center justify-between"><BrandLogo className="h-12 w-28 object-contain" /><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102443] text-xl font-black text-[#f0b046]"><ShieldCheck className="h-6 w-6" /></div></div><p className="mt-10 text-xs font-black uppercase tracking-[0.18em] text-[#bd8427]">FAZAAH / CONTROL CENTER</p><h1 className="mt-3 text-3xl font-black leading-tight text-[#102443]">دخول آمن لمركز الإدارة</h1><p className="mt-3 text-sm leading-7 text-[#64748b]">استخدم حساب OAuth المصرّح به. البريد <b dir="ltr">fazaaapp440@gmail.com</b> يُمنح صلاحية المدير تلقائياً.</p><button type="button" onClick={() => window.location.assign(`/api/oauth/start?returnTo=${encodeURIComponent("/control-center")}`)} className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#102443] px-5 text-sm font-black text-white shadow-lg shadow-[#102443]/20 transition hover:bg-[#18345f]"><span>المتابعة عبر OAuth</span><ArrowLeft className="h-5 w-5" /></button><div className="mt-5 rounded-2xl bg-[#f5f7fb] p-4 text-xs leading-6 text-[#64748b]"><b className="text-[#102443]">تنبيه:</b> هذه المنصة مستقلة عن تطبيق Android وتطبيق المستخدمين. الوصول محصور بحسابات الإدارة.</div></section></main>;
}

function AccessDenied() {
  const { logout } = useAuth();
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f7fb] px-6 text-center" dir="rtl"><div className="max-w-md rounded-[28px] bg-white p-8 shadow-xl"><ShieldCheck className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-4 text-2xl font-black text-[#102443]">لا توجد صلاحية إدارية</h1><p className="mt-3 text-sm leading-7 text-[#64748b]">هذا الحساب مسجّل، لكنه لا يملك دور المدير المطلوب للوصول إلى مركز التحكم.</p><button type="button" onClick={logout} className="mt-6 rounded-2xl bg-[#102443] px-5 py-3 text-sm font-bold text-white">تسجيل الخروج</button></div></div>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout>{children}</ControlCenterLayout></ProtectedRoute>;
}

function Router() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return <Switch>
    <Route path="/control-center/login"><AdminLogin /></Route>
    <Route path="/"><Redirect to={user?.role === "admin" ? "/control-center" : "/control-center/login"} /></Route>
    <Route path="/control-center"><AdminRoute><AdminDashboard /></AdminRoute></Route>
    <Route path="/control-center/users"><AdminRoute><AdminUsers /></AdminRoute></Route>
    <Route path="/control-center/providers"><AdminRoute><AdminProviders /></AdminRoute></Route>
    <Route path="/control-center/business"><AdminRoute><AdminBusiness /></AdminRoute></Route>
    <Route path="/control-center/complaints"><AdminRoute><AdminComplaints /></AdminRoute></Route>
    <Route path="/control-center/taxonomy"><AdminRoute><AdminTaxonomy /></AdminRoute></Route>
    <Route><>{user && user.role !== "admin" ? <AccessDenied /> : <Redirect to="/control-center/login" />}</></Route>
  </Switch>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider defaultTheme="light" storageKey="fazaah-control-center-theme"><AuthProvider><TooltipProvider><div dir="rtl" className="min-h-[100dvh] bg-[#f5f7fb] text-[#162b4d] font-sans"><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Suspense fallback={<LoadingScreen />}><RuntimeErrorBoundary><Router /></RuntimeErrorBoundary></Suspense></WouterRouter></div><Toaster /></TooltipProvider></AuthProvider></ThemeProvider></QueryClientProvider>;
}
