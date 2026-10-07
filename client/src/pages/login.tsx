import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getFirstLoginPath, type RegistrationRole } from "@/lib/registration";
import { BrandLogo } from "@/components/brand-logo";

type AuthMethod = "phone" | "email";
type PortalView = "login" | "register";

const roleOptions: Array<{ role: RegistrationRole; title: string; description: string; detail: string }> = [
  { role: "client", title: "هل أنت عميل؟", description: "ابحث عن الخدمة المناسبة واطلبها بثقة", detail: "إنشاء حساب عميل", },
  { role: "provider", title: "هل أنت مهني؟", description: "اعرض تخصصك واستقبل طلبات العملاء", detail: "إنشاء حساب مهني", },
];

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const initialMethod = searchParams.get("method") === "email" ? "email" : "phone";
  const initialRole = searchParams.get("role") === "client" ? "client" : null;
  const [view, setView] = useState<PortalView>(() => searchParams.get("view") === "register" ? "register" : "login");
  const [method, setMethod] = useState<AuthMethod>(initialMethod);
  const [registerRole, setRegisterRole] = useState<RegistrationRole | null>(initialRole);
  const [registerMethod, setRegisterMethod] = useState<AuthMethod | null>(() => searchParams.get("view") === "register" && initialRole === "client" && initialMethod === "email" ? "email" : null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loginWithEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast({ title: "أكمل بيانات الدخول", description: "أدخل بريدك الإلكتروني وكلمة المرور بشكل صحيح.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login/email", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      login(data.token, data.user);
      navigate(getFirstLoginPath(data.user.role === "provider" ? "provider" : "client"));
    } catch (error: any) {
      toast({ title: "تعذر تسجيل الدخول", description: error?.message || "تأكد من بياناتك ثم حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function registerWithEmail(event: React.FormEvent) {
    event.preventDefault();
    if (registerName.trim().split(/\s+/).filter(Boolean).length < 4 || !email.trim() || registerPassword.length < 6) {
      toast({ title: "أكمل بيانات التسجيل", description: "أدخل الاسم الرباعي والبريد وكلمة مرور من 6 أحرف على الأقل.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/register/email", { method: "POST", body: JSON.stringify({ name: registerName.trim(), email: email.trim(), password: registerPassword, role: "client" }) });
      login(data.token, data.user);
      navigate(getFirstLoginPath("client"));
    } catch (error: any) {
      toast({ title: "تعذر إنشاء الحساب", description: error?.message || "حاول مرة أخرى.", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function continueWithPhone(event: React.FormEvent) {
    event.preventDefault();
    if (phone.trim().length < 7) {
      toast({ title: "رقم الجوال غير صحيح", description: "أدخل رقم جوال صحيحًا للمتابعة برمز التحقق.", variant: "destructive" });
      return;
    }
    navigate(`/auth/phone?mode=login&role=client&phone=${encodeURIComponent(phone.trim())}`);
  }

  function chooseRole(role: RegistrationRole) {
    if (role === "provider") navigate(`/auth/phone?mode=register&role=${role}`);
    else { setRegisterRole(role); setRegisterMethod(null); }
  }

  function handleBack() {
    if (view === "register") {
      if (registerMethod) { setRegisterMethod(null); return; }
      if (registerRole) { setRegisterRole(null); return; }
      setView("login");
      return;
    }
    navigate("/welcome");
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground" dir="rtl">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-7 pt-6 sm:max-w-lg sm:px-9">
        <header className="relative flex h-36 items-start justify-between">
          {view === "register" ? <button type="button" onClick={handleBack} className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e1ea] bg-white shadow-sm transition hover:bg-[#f0f4f8]" aria-label="العودة"><ArrowRight className="h-4 w-4" /></button> : <span className="h-10 w-10" aria-hidden="true" />}
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <BrandLogo className="auth-logo h-36 w-32 object-contain drop-shadow-[0_10px_20px_rgba(240,176,70,0.2)]" />
          </div>
          <span className="mt-5 h-2 w-2 rounded-full bg-[#F5B335]" aria-hidden="true" />
        </header>

        <section className="mt-8 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F5B335]/30 bg-[#fff7df] px-3 py-2 text-[10px] font-extrabold text-[#9a6b18]"><Sparkles className="h-3.5 w-3.5" /> دخول آمن وسريع</span>
          <h1 className="mt-4 text-[34px] font-black leading-tight tracking-[-0.04em]">{view === "login" ? <>أهلاً بعودتك<span className="block text-[#b57920]">إلى فزعة</span></> : <>أنشئ حسابك<span className="block text-[#b57920]">في فزعة</span></>}</h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[#68778d]">{view === "login" ? "سجّل دخولك برقم الجوال أو البريد الإلكتروني وتابع خدماتك من مكان واحد." : "اختر نوع الحساب المناسب لك، وسنكمل معك بيانات التسجيل الحالية خطوة بخطوة."}</p>

          {view === "login" ? (
            <div className="mt-7 rounded-[28px] border border-[#dfe6ee] bg-white p-5 shadow-[0_18px_42px_rgba(24,45,83,0.09)]">
              <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102443] text-[#F5B335]"><LockKeyhole className="h-5 w-5" /></div><div><h2 className="text-base font-black">بيانات الدخول</h2><p className="mt-0.5 text-[11px] text-[#8793a3]">اختر الطريقة المناسبة لك</p></div></div>
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f8fb] p-1">
                <button type="button" onClick={() => setMethod("phone")} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${method === "phone" ? "bg-[#102443] text-white shadow-sm" : "text-[#738197]"}`}><Phone className="h-4 w-4" />رقم الجوال</button>
                <button type="button" onClick={() => setMethod("email")} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${method === "email" ? "bg-[#102443] text-white shadow-sm" : "text-[#738197]"}`}><Mail className="h-4 w-4" />البريد الإلكتروني</button>
              </div>

              {method === "phone" ? (
                <form onSubmit={continueWithPhone} className="space-y-4">
                  <label className="block text-xs font-extrabold">رقم الجوال</label>
                  <div className="relative"><Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="7xxxxxxxx" type="tel" dir="ltr" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] pr-10 text-left text-base shadow-none focus-visible:ring-[#F5B335]" /></div>
                  <p className="text-[11px] leading-5 text-[#8793a3]">سيظهر رمز التحقق على الشاشة حاليًا للاختبار، ولن يتغير هذا التدفق عند ربط SMS لاحقًا.</p>
                  <Button type="submit" className="h-14 w-full rounded-2xl bg-[#102443] text-base font-black text-white shadow-[0_14px_28px_rgba(24,45,83,0.18)] hover:bg-[#223c69]">المتابعة برمز التحقق <ArrowLeft className="mr-2 h-4 w-4 text-[#F5B335]" /></Button>
                </form>
              ) : (
                <form onSubmit={loginWithEmail} className="space-y-4">
                  <label className="block text-xs font-extrabold">البريد الإلكتروني</label>
                  <div className="relative"><Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" dir="ltr" autoComplete="email" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] pr-10 text-left text-base shadow-none focus-visible:ring-[#F5B335]" /></div>
                  <div className="relative"><label className="mb-2 block text-xs font-extrabold">كلمة المرور أو الرمز السري</label><LockKeyhole className="pointer-events-none absolute right-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="أدخل كلمة المرور" type={showPassword ? "text" : "password"} dir="ltr" autoComplete="current-password" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] px-10 text-left text-base shadow-none focus-visible:ring-[#F5B335]" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-[#8793a3]" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                  <Link href="/auth/forgot-password" className="flex items-center gap-1 text-xs font-bold text-[#b57920] hover:underline"><KeyRound className="h-3.5 w-3.5" />نسيت كلمة المرور أو الرمز السري؟</Link>
                  <Button type="submit" className="h-14 w-full rounded-2xl bg-[#102443] text-base font-black text-white shadow-[0_14px_28px_rgba(24,45,83,0.18)] hover:bg-[#223c69]" disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>دخول إلى حسابي <ArrowLeft className="mr-2 h-4 w-4 text-[#F5B335]" /></>}</Button>
                </form>
              )}
            </div>
          ) : registerRole === "client" && registerMethod === "email" ? (
            <form onSubmit={registerWithEmail} className="mt-7 space-y-4 rounded-[28px] border border-[#dfe6ee] bg-white p-5 shadow-[0_18px_42px_rgba(24,45,83,0.09)]">
              <button type="button" onClick={() => setRegisterMethod(null)} className="flex items-center gap-2 text-xs font-extrabold text-[#b57920]"><ArrowRight className="h-4 w-4" /> طرق التسجيل</button>
              <div><label className="mb-2 block text-xs font-extrabold">الاسم الرباعي</label><Input value={registerName} onChange={event => setRegisterName(event.target.value)} placeholder="الاسم الأول واسم الأب والجد والعائلة" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] text-sm shadow-none focus-visible:ring-[#F5B335]" /></div>
              <div><label className="mb-2 block text-xs font-extrabold">البريد الإلكتروني</label><Input value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" type="email" dir="ltr" autoComplete="email" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] text-left text-base shadow-none focus-visible:ring-[#F5B335]" /></div>
              <div className="relative"><label className="mb-2 block text-xs font-extrabold">كلمة المرور</label><LockKeyhole className="pointer-events-none absolute right-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input value={registerPassword} onChange={event => setRegisterPassword(event.target.value)} placeholder="6 أحرف أو أرقام على الأقل" type={showRegisterPassword ? "text" : "password"} dir="ltr" autoComplete="new-password" className="h-14 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] px-10 text-left text-base shadow-none focus-visible:ring-[#F5B335]" /><button type="button" onClick={() => setShowRegisterPassword(value => !value)} className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-[#8793a3]" aria-label="إظهار أو إخفاء كلمة المرور">{showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-[#102443] text-base font-black text-white hover:bg-[#223c69]">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>إنشاء حساب العميل <ArrowLeft className="mr-2 h-4 w-4 text-[#F5B335]" /></>}</Button>
            </form>
          ) : registerRole === "client" && !registerMethod ? (
            <div className="mt-7 space-y-3">
              <button type="button" onClick={() => { setRegisterMethod("phone"); navigate("/auth/phone?mode=register&role=client"); }} className="flex w-full items-center gap-4 rounded-[24px] border border-[#dfe6ee] bg-white p-5 text-right shadow-[0_12px_28px_rgba(24,45,83,0.06)]"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4d2] text-[#b57920]"><Phone className="h-6 w-6" /></span><span><b className="block text-[15px]">التسجيل برقم الجوال</b><small className="mt-1 block text-xs text-[#777f8c]">تحقق برمز يظهر على الشاشة حاليًا</small></span></button>
              <button type="button" onClick={() => setRegisterMethod("email")} className="flex w-full items-center gap-4 rounded-[24px] border border-[#dfe6ee] bg-white p-5 text-right shadow-[0_12px_28px_rgba(24,45,83,0.06)]"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4d2] text-[#b57920]"><Mail className="h-6 w-6" /></span><span><b className="block text-[15px]">التسجيل بالبريد الإلكتروني</b><small className="mt-1 block text-xs text-[#777f8c]">أنشئ حسابك بكلمة مرور خاصة بك</small></span></button>
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#dfe6ee] bg-white px-4 py-3 text-xs text-[#68778d]"><ShieldCheck className="h-5 w-5 shrink-0 text-[#b57920]" /><span>اختر نوع الحساب، وبعدها ستظهر لك بيانات التسجيل الحالية دون تغيير.</span></div>
              {roleOptions.map(({ role, title, description, detail }) => {
                const Icon = role === "provider" ? BriefcaseBusiness : UserRound;
                return <button key={role} type="button" onClick={() => chooseRole(role)} className="group flex w-full items-center gap-4 rounded-[24px] border border-[#dfe6ee] bg-white p-4 text-right shadow-[0_12px_28px_rgba(24,45,83,0.06)] transition hover:-translate-y-0.5 hover:border-[#102443] hover:shadow-[0_18px_36px_rgba(24,45,83,0.12)]"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff4d2] text-[#b57920] transition group-hover:bg-[#102443] group-hover:text-[#F5B335]"><Icon className="h-6 w-6" /></span><span className="min-w-0 flex-1"><b className="block text-[15px] text-[#102443]">{title}</b><small className="mt-1 block text-xs text-[#777f8c]">{description}</small><small className="mt-2 block text-[10px] font-bold text-[#b57920]">{detail}</small></span><span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d5dfe9] text-transparent transition group-hover:border-[#F5B335] group-hover:bg-[#F5B335] group-hover:text-[#102443]"><Check className="h-4 w-4" /></span></button>;
              })}
            </div>
          )}
        </section>

        <p className="mt-7 text-center text-sm text-[#78879a]">{view === "login" ? <>ليس لديك حساب؟ <button type="button" onClick={() => { setView("register"); setRegisterRole(null); setRegisterMethod(null); }} className="font-black text-[#b57920] hover:underline">أنشئ حسابًا جديدًا</button></> : <>لديك حساب بالفعل؟ <button type="button" onClick={() => { setView("login"); setRegisterRole(null); setRegisterMethod(null); }} className="font-black text-[#b57920] hover:underline">تسجيل الدخول</button></>}</p>
        <p className="mt-4 text-center text-[10px] text-[#9aa6b5]">فزعة FAZAAH · تجربة آمنة ومصممة لك</p>
      </div>
    </main>
  );
}
