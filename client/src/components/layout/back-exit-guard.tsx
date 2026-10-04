import { useEffect, useRef, useState } from "react";
import { LogOut, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function BackExitGuard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const guardReady = useRef(false);

  useEffect(() => {
    if (!user) return;

    const homePath = user.role === "provider" ? "/provider-dashboard" : user.role === "admin" ? "/control-center" : "/";
    window.history.pushState({ fazaaBackGuard: true }, "", window.location.href);
    guardReady.current = true;

    const handlePopState = () => {
      if (!guardReady.current) return;
      navigate(homePath);
      window.history.pushState({ fazaaBackGuard: true }, "", `${window.location.origin}${homePath}`);
      setOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      guardReady.current = false;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, user]);

  if (!open) return null;

  function confirmExit() {
    setOpen(false);
    void Promise.resolve(logout()).finally(() => navigate("/welcome"));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#071226]/60 p-4 pb-6 backdrop-blur-sm sm:items-center" role="presentation">
      <div className="w-full max-w-sm rounded-[30px] border border-border bg-card p-5 text-foreground shadow-[0_24px_70px_rgba(7,18,38,0.28)]" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground"><LogOut className="h-5 w-5" /></div>
          <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70" aria-label="إلغاء"><X className="h-4 w-4" /></button>
        </div>
        <h2 id="exit-dialog-title" className="text-lg font-black">هل تريد الخروج من التطبيق؟</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">ستعود إلى شاشة الدخول، ويمكنك الرجوع في أي وقت.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setOpen(false)} className="h-12 rounded-2xl border border-border bg-background text-sm font-black text-foreground transition hover:bg-muted">لا، البقاء</button>
          <button type="button" onClick={confirmExit} className="h-12 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary/90">نعم، الخروج</button>
        </div>
      </div>
    </div>
  );
}
