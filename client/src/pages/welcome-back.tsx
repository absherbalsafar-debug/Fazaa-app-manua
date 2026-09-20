import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BriefcaseBusiness, Check, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FIRST_LOGIN_WELCOME_KEY } from "@/lib/registration";

export default function WelcomeBack() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [leaving, setLeaving] = useState(false);
  const nextPath = useMemo(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : user?.role === "provider" ? "/provider-dashboard" : "/";
  }, [user?.role]);
  const isProvider = user?.role === "provider";

  function continueToApp() {
    localStorage.setItem(FIRST_LOGIN_WELCOME_KEY, "true");
    setLeaving(true);
    window.setTimeout(() => navigate(nextPath), 380);
  }

  useEffect(() => {
    const timer = window.setTimeout(continueToApp, 2600);
    return () => window.clearTimeout(timer);
  }, [nextPath]);

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f8fa] px-5 py-8 text-[#182d53]" dir="rtl">
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#182d53]" />
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.03 : 1 }} transition={{ duration: 0.35 }} className="relative z-10 w-full max-w-md">
        <div className="absolute -inset-6 rounded-[42px] bg-[#f0b046]/15 blur-3xl" />
        <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/95 px-6 py-8 text-center shadow-[0_28px_80px_rgba(24,45,83,0.2)] backdrop-blur-xl">
          <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#f7f8fa] p-3 shadow-[0_12px_30px_rgba(24,45,83,0.1)]">
            <BrandLogo className="h-full w-full object-contain" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#f0b046]/35 bg-[#fff5db] px-3 py-2 text-[10px] font-bold text-[#b57920]"><Sparkles className="h-3.5 w-3.5" /> أهلًا بك في عائلة فزعة</span>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">مرحبًا {user?.name?.split(" ")[0] || "بك"}</h1>
            <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-7 text-[#637087]">حسابك جاهز. استمتع بتجربة أسهل للوصول إلى الشخص المناسب بثقة.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.45 }} className="mt-7 grid grid-cols-3 gap-2 text-center">
            {[{ icon: isProvider ? BriefcaseBusiness : UserRound, label: isProvider ? "ملفك المهني" : "احتياجك" }, { icon: ShieldCheck, label: "تجربة آمنة" }, { icon: Check, label: "جاهز للبدء" }].map(({ icon: Icon, label }) => <div key={label} className="rounded-2xl bg-[#f7f8fa] px-2 py-3"><div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff5db] text-[#b57920]"><Icon className="h-4 w-4" /></div><p className="mt-2 text-[10px] font-bold text-[#637087]">{label}</p></div>)}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42, duration: 0.4 }} className="mt-7"><Button type="button" onClick={continueToApp} className="h-14 w-full justify-between rounded-2xl bg-[#f0b046] px-5 text-base font-black text-[#182d53] shadow-[0_14px_28px_rgba(240,176,70,0.28)] hover:bg-[#f5bf62]"><span>ابدأ تجربتك</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182d53]/10"><ArrowLeft className="h-5 w-5" /></span></Button><p className="mt-4 text-[10px] text-[#9a978e]">سيتم نقلك تلقائيًا خلال لحظات</p></motion.div>
        </section>
      </motion.div>
    </main>
  );
}
