import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { PageTransition } from "@/components/layout/page-transition";
import { BrandLoadingScreen } from "@/components/brand-loader";
import { BackExitGuard } from "@/components/layout/back-exit-guard";

// Auth Pages
const Welcome = lazy(() => import("@/pages/welcome"));
const AuthPhone = lazy(() => import("@/pages/auth-phone"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const Login = lazy(() => import("@/pages/login"));

// App Pages
const Home = lazy(() => import("@/pages/home"));
const Discover = lazy(() => import("@/pages/discover"));
const Providers = lazy(() => import("@/pages/providers"));
const ProviderDetail = lazy(() => import("@/pages/provider-detail"));
const NewRequest = lazy(() => import("@/pages/new-request"));
const MyRequests = lazy(() => import("@/pages/my-requests"));
const RequestDetail = lazy(() => import("@/pages/request-detail"));
const Favorites = lazy(() => import("@/pages/favorites"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const Emergency = lazy(() => import("@/pages/emergency"));
const ProviderVerify = lazy(() => import("@/pages/provider-verify"));
const ProviderSubscription = lazy(() => import("@/pages/provider-subscription"));

// Admin Pages
const ControlCenterLayout = lazy(() => import("@/control-center/ControlCenterLayout").then(module => ({ default: module.ControlCenterLayout })));
const AdminDashboard = lazy(() => import("@/control-center/pages/dashboard"));
const AdminUsers = lazy(() => import("@/control-center/pages/users"));
const AdminProviders = lazy(() => import("@/control-center/pages/providers"));
const AdminBusiness = lazy(() => import("@/control-center/pages/business"));
const AdminComplaints = lazy(() => import("@/control-center/pages/complaints"));
const AdminTaxonomy = lazy(() => import("@/control-center/pages/taxonomy"));
const ProviderDashboard = lazy(() => import("@/pages/provider-dashboard"));
const ProviderBusiness = lazy(() => import("@/pages/provider-business"));
const Earnings = lazy(() => import("@/pages/earnings"));
const Wallet = lazy(() => import("@/pages/wallet"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const HelpSupport = lazy(() => import("@/pages/help-support"));
const SponsoredPreview = lazy(() => import("@/pages/sponsored-preview"));

class RuntimeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Fazaa page error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f3ee] px-6 text-center" dir="rtl">
        <div className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-[0_18px_50px_rgba(14,47,98,0.12)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102443] text-2xl font-black text-[#F5B335]">ف</div>
          <h1 className="mt-5 text-xl font-black text-[#102443]">تعذر تحميل الصفحة</h1>
          <p className="mt-2 text-sm leading-6 text-[#66758a]">حدث خلل مؤقت. أعد المحاولة أو ارجع إلى الصفحة الرئيسية.</p>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => window.location.reload()} className="flex-1 rounded-2xl bg-[#102443] px-4 py-3 text-sm font-bold text-white">إعادة المحاولة</button>
            <a href="/welcome" className="flex-1 rounded-2xl border border-[#d9dfe7] px-4 py-3 text-sm font-bold text-[#102443]">البدء من جديد</a>
          </div>
        </div>
      </div>
    );
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function NavigationTransition() {
  const [location] = useLocation();
  const currentPath = location.split(/[?#]/, 1)[0] || "/";
  const previousPath = useRef(currentPath);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    if (previousPath.current === currentPath) return;
    previousPath.current = currentPath;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 360);
    return () => window.clearTimeout(timer);
  }, [currentPath]);

  return visible ? <BrandLoadingScreen overlay message="جارٍ الانتقال..." /> : null;
}

function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <>
      <main className={`app-stage premium-surface ${showNav ? "min-h-[100dvh] pb-20" : "min-h-[100dvh]"}`}>
        <RuntimeErrorBoundary><PageTransition>{children}</PageTransition></RuntimeErrorBoundary>
      </main>
      {showNav && <BottomNav />}
    </>
  );
}

function RoleHome() {
  const { user } = useAuth();
  return user?.role === "provider" ? <ProviderDashboard /> : <Home />;
}

function NativeLogoutBridge() {
  const { logout } = useAuth();

  useEffect(() => {
    const handleNativeLogout = () => {
      void Promise.resolve(logout()).finally(() => {
        window.location.replace("/welcome");
      });
    };
    window.addEventListener("native-logout", handleNativeLogout);
    return () => window.removeEventListener("native-logout", handleNativeLogout);
  }, [logout]);

  return null;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <BrandLoadingScreen message="جارٍ التحقق من حسابك..." />;
  }

  return (
    <Switch>
      {/* ── Auth Routes (public) ── */}
      <Route path="/welcome"><PageTransition><Welcome /></PageTransition></Route>
      <Route path="/auth/phone"><PageTransition><AuthPhone /></PageTransition></Route>
      <Route path="/auth/forgot-password"><PageTransition><ForgotPassword /></PageTransition></Route>
      {/* Legacy redirects */}
      <Route path="/login"><PageTransition><Login /></PageTransition></Route>
      <Route path="/register"><Redirect to="/login?view=register" /></Route>

      {/* ── Standalone Control Center ── */}
      <Route path="/control-center">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminDashboard /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/control-center/users">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminUsers /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/control-center/providers">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminProviders /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/control-center/business">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminBusiness /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/control-center/complaints">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminComplaints /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/control-center/taxonomy">
        <ProtectedRoute allowedRoles={["admin"]}><ControlCenterLayout><AdminTaxonomy /></ControlCenterLayout></ProtectedRoute>
      </Route>
      <Route path="/admin"><Redirect to="/control-center" /></Route>
      <Route path="/admin/:rest*"><Redirect to="/control-center" /></Route>

      {/* ── Protected App Routes ── */}
      <Route path="/">
        <ProtectedRoute>
          <AppShell><RoleHome /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/provider-dashboard">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell><ProviderDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
       <Route path="/provider-business">
         <ProtectedRoute allowedRoles={['provider']}>
           <AppShell><ProviderBusiness /></AppShell>
         </ProtectedRoute>
       </Route>
      <Route path="/discover">
        <ProtectedRoute>
          <AppShell><Discover /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/providers">
        <ProtectedRoute>
          <AppShell><Providers /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/providers/:id">
        <ProtectedRoute>
          <AppShell><ProviderDetail /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/sponsored-preview">
        <ProtectedRoute>
          <AppShell><SponsoredPreview /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/emergency">
        <ProtectedRoute>
          <AppShell showNav={false}><Emergency /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/request/new">
        <ProtectedRoute>
          <AppShell showNav={false}><NewRequest /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests">
        <ProtectedRoute>
          <AppShell><MyRequests /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests/:id">
        <ProtectedRoute>
          <AppShell showNav={false}><RequestDetail /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/favorites">
        <ProtectedRoute>
          <AppShell><Favorites /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <AppShell><Notifications /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <AppShell><Profile /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppShell showNav={false}><Settings /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/earnings">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell><Earnings /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute allowedRoles={['client']}>
          <AppShell><Wallet /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/privacy">
        <AppShell showNav={false}><Privacy /></AppShell>
      </Route>
      <Route path="/terms">
        <AppShell showNav={false}><Terms /></AppShell>
      </Route>
      <Route path="/help-support">
        <ProtectedRoute><AppShell showNav={false}><HelpSupport /></AppShell></ProtectedRoute>
      </Route>
      <Route path="/verify">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell showNav={false}><ProviderVerify /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/provider-subscription">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell showNav={false}><ProviderSubscription /></AppShell>
        </ProtectedRoute>
      </Route>

      {/* لا نعرض صفحة الخطأ الإنجليزية للمستخدم؛ أي رابط قديم يعيد إلى الدخول الآمن. */}
      <Route><Redirect to="/welcome" /></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fazaah-theme">
        <AuthProvider>
          <NativeLogoutBridge />
          <TooltipProvider>
            <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground font-sans">
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <BackExitGuard />
                <NavigationTransition />
                <Suspense fallback={<BrandLoadingScreen message="جارٍ تحميل الصفحة..." />}>
                  <Router />
                </Suspense>
              </WouterRouter>
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
