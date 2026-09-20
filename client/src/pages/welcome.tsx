import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Clock3,
  Code2,
  Construction,
  Droplets,
  Mail,
  Paintbrush,
  Phone,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { buildGoogleAuthPayload, getFirstLoginPath, getPostAuthPath, type RegistrationRole } from "@/lib/registration";
import { BrandLogo } from "@/components/brand-logo";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const ONBOARDING_COMPLETED_KEY = "fazaah_onboarding_completed_v1";
const ONBOARDING_ROLE_KEY = "fazaah_onboarding_role_v1";

type Role = "client" | "provider";

const roleCopy: Record<Role, { title: string; description: string; detail: string }> = {
  client: { title: "أبحث عن خدمة", description: "أصل إلى الشخص المناسب بثقة", detail: "اطلب، تابع، وقيّم تجربتك من مكان واحد" },
  provider: { title: "أقدّم خدمة", description: "أحوّل خبرتي إلى فرص حقيقية", detail: "اعرض مهارتك واستقبل طلبات من حولك" },
};

const services = [
  { label: "سباكة", icon: Wrench },
  { label: "كهرباء", icon: Sparkles },
  { label: "تكييف", icon: Snowflake },
  { label: "برمجة", icon: Code2 },
  { label: "دهان", icon: Paintbrush },
  { label: "تصميم", icon: Sparkles },
  { label: "مقاولات", icon: Construction },
  { label: "صيانة عامة", icon: Wrench },
];

function GoogleButton({ role }: { role: RegistrationRole }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split(".")[1]));
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify(buildGoogleAuthPayload(payload, role)),
      });
      login(data.token, data.user);
      navigate(getFirstLoginPath(data.user.role === "provider" ? "provider" : "client"));
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#d9dfe7] bg-white text-sm font-bold text-[#182d53] shadow-[0_8px_24px_rgba(14,47,98,0.05)] transition-colors hover:bg-[#f7f8fa]"
        onClick={() => window.alert("يرجى تكوين VITE_GOOGLE_CLIENT_ID لتفعيل تسجيل الدخول بجوجل")}
      >
        <span className="text-lg font-black text-[#4285F4]">G</span>
        المتابعة باستخدام جوجل
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl [&>div]:w-full">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => undefined} size="large" width="100%" text="continue_with" shape="rectangular" />
      </GoogleOAuthProvider>
    </div>
  );
}

function ProgressDots({ active }: { active: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`المرحلة ${active + 1} من 3`}>
      {[0, 1, 2].map((dot) => (
        <span key={dot} className={`h-2 rounded-full transition-all duration-300 ${dot === active ? "w-8 bg-[#f0b046]" : "w-2 bg-[#c8d3e1]"}`} />
      ))}
    </div>
  );
}

function FeatureBenefits() {
  const benefits = [
    { icon: UsersRound, title: "مهنيون محترفون", detail: "في مختلف المجالات" },
    { icon: Clock3, title: "تواصل سريع", detail: "ومباشر" },
    { icon: ShieldCheck, title: "موثوقون", detail: "ومعتمدون" },
  ];
  return <div className="mt-2 grid w-full grid-cols-3 divide-x divide-x-reverse divide-[#dbe4ef] rounded-2xl bg-white/75 px-2 py-3 shadow-[0_8px_24px_rgba(24,45,83,0.06)]">{benefits.map(({ icon: Icon, title, detail }) => <div key={title} className="flex flex-col items-center gap-1 px-1 text-center"><Icon className="h-6 w-6 text-[#182d53]" /><b className="text-[9px] text-[#182d53]">{title}</b><span className="text-[8px] text-[#637087]">{detail}</span></div>)}</div>;
}

function PhonePreview({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className={`relative mx-auto w-full max-w-[255px] ${detailed ? "rotate-[1deg]" : "-rotate-2"}`}>
      <div className="absolute -inset-3 rounded-[42px] bg-[#182d53]/10 blur-2xl" />
      <div className="relative rounded-[35px] border-[7px] border-[#182d53] bg-[#182d53] p-1.5 shadow-[0_28px_60px_rgba(14,47,98,0.25)]">
        <div className="relative overflow-hidden rounded-[27px] bg-[#f7f8fa]">
          <div className="flex items-center justify-center bg-[#182d53] py-2">
            <div className="h-1.5 w-14 rounded-full bg-white/40" />
          </div>
          <div className="px-4 pb-5 pt-4" dir="rtl">
            <div className="flex items-center justify-between">
              <BrandLogo className="h-9 w-11 object-contain" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#182d53] shadow-sm"><UserRound className="h-4 w-4" /></div>
            </div>
            {detailed ? (
              <>
                <p className="mt-4 text-[10px] font-bold text-[#637087]">مرحباً بك في فزعة</p>
                <div className="mt-2 flex h-9 items-center gap-2 rounded-xl border border-[#dfe5ec] bg-white px-3 text-[9px] text-[#8c897f] shadow-sm"><Search className="h-3.5 w-3.5" /> ابحث عن خدمة أو مهني</div>
                <p className="mt-4 text-xs font-black text-[#182d53]">ما الخدمة التي تحتاجها؟</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {services.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex min-h-[57px] flex-col items-center justify-center gap-1 rounded-xl border border-[#e2e9f1] bg-white p-1 text-center shadow-[0_4px_12px_rgba(14,47,98,0.05)]">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fff5db] text-[#b57920]"><Icon className="h-3.5 w-3.5" /></div>
                      <span className="text-[7px] font-bold text-[#60728a]">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-[#182d53] p-3 text-white"><p className="text-[9px] font-bold">مهنيون موثوقون بالقرب منك</p><p className="mt-1 text-[7px] text-white/65">اختر، تواصل، وأنجز احتياجك بأمان</p></div>
              </>
            ) : (
              <>
                <div className="mt-7 rounded-2xl bg-[#182d53] p-4 text-white"><p className="text-[10px] text-[#f0b046]">خدماتك أقرب</p><p className="mt-2 text-lg font-black leading-7">الشخص المناسب<br />في الوقت المناسب</p><div className="mt-5 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#f0b046]" /><span className="text-[8px] text-white/70">فزعة توصلك بثقة</span></div></div>
                <div className="mt-4 grid grid-cols-2 gap-2"><div className="h-16 rounded-2xl bg-[#fff2c6]" /><div className="h-16 rounded-2xl bg-[#dfeafa]" /></div>
              </>
            )}
          </div>
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-[#182d53]/35" />
        </div>
      </div>
    </div>
  );
}

export default function Welcome() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role>("client");
  const [isLaunchingAuth, setIsLaunchingAuth] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
    const savedRole = localStorage.getItem(ONBOARDING_ROLE_KEY) === "provider" ? "provider" : "client";
    if (completed) {
      navigate(`/auth/phone?mode=login&role=${savedRole}`, { replace: true });
    }
  }, [navigate]);

  function completeOnboarding(role: Role = selectedRole) {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    localStorage.setItem(ONBOARDING_ROLE_KEY, role);
  }

  const authPath = (type: "phone" | "email") => {
    completeOnboarding();
    return type === "phone" ? `/auth/phone?mode=register&role=${selectedRole}` : `/auth/email?role=${selectedRole}`;
  };
  const launchAuth = (type: "phone" | "email") => {
    const destination = authPath(type);
    setIsLaunchingAuth(true);
    window.setTimeout(() => navigate(destination), 520);
  };
  const goToRoleSelection = () => {
    completeOnboarding();
    setStep(2);
  };
  const skipOnboarding = () => {
    completeOnboarding("client");
    setIsLaunchingAuth(true);
    window.setTimeout(() => navigate("/auth/phone?mode=register&role=client"), 520);
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f7f8fa] text-[#182d53]" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="intro" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.35 }} className="relative min-h-[100dvh]">
            <div className="onboarding-wave absolute inset-x-0 bottom-0 h-[24%] overflow-hidden bg-[#182d53]"><span className="onboarding-wave-gold" /></div>
            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-5 pt-7 sm:max-w-lg sm:px-9">
              <header className="flex items-center justify-between"><span className="text-[11px] font-bold text-[#182d53]">9:41</span><BrandLogo className="h-24 w-28 object-contain" /><span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-[#182d53]" /><span className="h-2 w-2 rounded-full bg-[#f0b046]" /></span></header>
              <div className="flex flex-1 flex-col items-center text-center">
                <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#f0b046]/30 bg-[#fff5db] px-3 py-2 text-[10px] font-bold text-[#b57920]"><Sparkles className="h-3.5 w-3.5" /> خدمة تستحق الثقة</span>
                <h1 className="mt-5 text-[34px] font-black leading-[1.25] tracking-[-0.04em] sm:text-[42px]">أهلاً وسهلاً بك في <span className="block text-[#b57920]">فزعة</span></h1>
                <p className="mt-3 max-w-[20rem] text-sm leading-7 text-[#637087]">منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.</p>
                <div className="mt-5 w-full"><PhonePreview /></div><FeatureBenefits />
              </div>
              <div className="relative z-10 mt-5 space-y-4">
                <Button type="button" onClick={() => setStep(1)} className="group h-14 w-full justify-between rounded-2xl bg-[#f0b046] px-5 text-base font-black text-[#182d53] shadow-[0_14px_28px_rgba(245,185,22,0.24)] hover:bg-[#ffca3a]"><span>لنبدأ</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182d53]/10"><ChevronLeft className="h-5 w-5" /></span></Button>
                <ProgressDots active={0} />
                <button type="button" onClick={skipOnboarding} className="block w-full text-center text-xs font-semibold text-white/70 hover:text-white">تخطي</button>
              </div>
            </div>
          </motion.section>
        )}

        {step === 1 && (
          <motion.section key="discover" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.35 }} className="relative min-h-[100dvh] bg-[#f7f8fa]">
            <div className="onboarding-wave absolute inset-x-0 bottom-0 h-[27%] overflow-hidden bg-[#182d53]"><span className="onboarding-wave-gold" /></div>
            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-5 pt-7 sm:max-w-lg sm:px-9">
              <header className="flex items-center justify-between"><button type="button" onClick={() => setStep(0)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white text-[#182d53]" aria-label="العودة"><ArrowRight className="h-4 w-4" /></button><BrandLogo className="h-20 w-24 object-contain" /><span className="text-[10px] font-bold text-[#182d53]">9:41</span></header>
              <div className="flex flex-1 flex-col items-center text-center">
                <h2 className="mt-5 text-[31px] font-black leading-[1.3] tracking-[-0.04em]">تواصل مباشرة مع <span className="block text-[#b57920]">المهني المناسب</span></h2>
                <p className="mt-3 max-w-[20rem] text-sm leading-7 text-[#637087]">اختر نوع الخدمة، وتواصل مع أفضل المهنيين المعتمدين لإنجاز احتياجك بسهولة وأمان.</p>
                <div className="mt-5 w-full"><PhonePreview detailed /></div><FeatureBenefits />
              </div>
              <div className="relative z-10 mt-5 space-y-4">
                <Button type="button" onClick={goToRoleSelection} className="group h-14 w-full justify-between rounded-2xl bg-[#f0b046] px-5 text-base font-black text-[#182d53] shadow-[0_14px_28px_rgba(245,185,22,0.24)] hover:bg-[#ffca3a]"><span>التالي</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182d53]/10"><ChevronLeft className="h-5 w-5" /></span></Button>
                <ProgressDots active={1} />
                <button type="button" onClick={skipOnboarding} className="block w-full text-center text-xs font-semibold text-white/70 hover:text-white">تخطي</button>
              </div>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="role" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.35 }} className="min-h-[100dvh] bg-[#f7f8fa]">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-7 pt-7 sm:max-w-lg sm:px-9">
              <header className="flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white text-[#182d53]" aria-label="العودة"><ArrowRight className="h-4 w-4" /></button><BrandLogo className="h-20 w-24 object-contain" /><span className="text-[10px] font-bold text-[#182d53]">9:41</span></header>
              <div className="flex flex-1 flex-col pt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b57920]">الخطوة الأخيرة</p>
                <h2 className="mt-3 text-[32px] font-black leading-[1.25] tracking-[-0.04em]">اختر تجربتك،<span className="block text-[#b57920]">ونبدأ معاً.</span></h2>
                <p className="mt-4 max-w-[19rem] text-sm leading-7 text-[#777f8c]">أخبرنا كيف ستستخدم فزعة لنجهز لك رحلة تناسب احتياجك من أول خطوة.</p>
                <div className="mt-7 space-y-3">{(Object.entries(roleCopy) as [Role, (typeof roleCopy)[Role]][]).map(([role, item]) => { const Icon = role === "provider" ? BriefcaseBusiness : UserRound; const selected = selectedRole === role; return <motion.button key={role} type="button" whileTap={{ scale: 0.985 }} onClick={() => setSelectedRole(role)} className={`relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border p-4 text-right transition-all ${selected ? "border-[#182d53] bg-[#182d53] text-white shadow-[0_16px_32px_rgba(14,47,98,0.16)]" : "border-[#dedad1] bg-white text-[#182d53] hover:border-[#c9b77c]"}`}><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-[#f0b046] text-[#182d53]" : "bg-[#fff4d2] text-[#b57920]"}`}><Icon className="h-6 w-6" /></span><span className="min-w-0 flex-1"><b className="block text-[15px]">{item.title}</b><small className={`mt-1 block text-xs ${selected ? "text-white/70" : "text-[#77766f]"}`}>{item.description}</small><small className={`mt-2 block text-[10px] ${selected ? "text-[#f0b046]" : "text-[#b57920]"}`}>{item.detail}</small></span><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-[#f0b046] bg-[#f0b046] text-[#182d53]" : "border-[#d4d0c6] text-transparent"}`}><Check className="h-3.5 w-3.5" /></span></motion.button>; })}</div>
                <div className="mt-auto pt-7"><p className="mb-3 text-center text-[11px] font-semibold text-[#8b98a8]">ابدأ بطريقتك المفضلة</p><Button type="button" onClick={() => launchAuth("phone")} className="h-14 w-full rounded-2xl bg-[#182d53] text-[15px] font-extrabold text-white shadow-[0_14px_28px_rgba(14,47,98,0.16)] hover:bg-[#182d53]"><Phone className="ml-2 h-5 w-5 text-[#f0b046]" />التسجيل برقم الهاتف<ArrowLeft className="mr-auto h-4 w-4" /></Button><div className="my-3 flex items-center gap-3"><div className="h-px flex-1 bg-[#dedad1]" /><span className="text-[10px] font-bold text-[#9a978e]">أو</span><div className="h-px flex-1 bg-[#dedad1]" /></div><GoogleButton role={selectedRole} /><Button type="button" variant="outline" onClick={() => launchAuth("email")} className="mt-3 h-12 w-full rounded-2xl border-[#d9e1ea] bg-transparent text-sm font-bold text-[#3a4a48] hover:bg-white"><Mail className="ml-2 h-4 w-4 text-[#b57920]" />التسجيل بالبريد الإلكتروني</Button><button type="button" onClick={() => navigate(`/auth/phone?mode=login&role=${selectedRole}`)} className="mt-5 block w-full text-center text-xs text-[#8b98a8]">لديك حساب بالفعل؟ <span className="font-extrabold text-[#b57920]">تسجيل الدخول برقم الهاتف</span></button></div>
              </div>
              <div className="mt-5"><ProgressDots active={2} /><p className="mt-3 text-center text-[10px] leading-5 text-[#9a978e]">بالاستمرار توافق على شروط الاستخدام وسياسة الخصوصية</p></div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLaunchingAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#182d53]"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.72, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="absolute h-72 w-72 rounded-full bg-[#f0b046]/20 blur-3xl"
            />
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="relative flex flex-col items-center gap-5 text-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-white p-3 shadow-[0_18px_55px_rgba(0,0,0,0.2)]">
                <BrandLogo className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-lg font-black text-white">نجهّز لك تجربة فزعة</p>
                <p className="mt-2 text-xs text-white/60">لحظات ونبدأ معك</p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((dot) => <motion.span key={dot} animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }} transition={{ repeat: Infinity, duration: 1, delay: dot * 0.16 }} className="h-2 w-2 rounded-full bg-[#f0b046]" />)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
