import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getFirstLoginPath, type RegistrationRole } from "@/lib/registration";
import { BrandLogo } from "@/components/brand-logo";
import { AppPage, PageHeading, SurfaceCard } from "@/components/app-ui";

type AuthMethod = "phone" | "email";
type PortalView = "login" | "register";

const roleOptions: Array<{
  role: RegistrationRole;
  title: string;
  description: string;
  detail: string;
}> = [
  {
    role: "client",
    title: "هل أنت عميل؟",
    description: "ابحث عن الخدمة المناسبة واطلبها بثقة",
    detail: "إنشاء حساب عميل",
  },
  {
    role: "provider",
    title: "هل أنت مهني؟",
    description: "اعرض تخصصك واستقبل طلبات العملاء",
    detail: "إنشاء حساب مهني",
  },
];

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const initialMethod =
    searchParams.get("method") === "email" ? "email" : "phone";
  const initialRole = searchParams.get("role") === "client" ? "client" : null;
  const [view, setView] = useState<PortalView>(() =>
    searchParams.get("view") === "register" ? "register" : "login"
  );
  const [method, setMethod] = useState<AuthMethod>(initialMethod);
  const [registerRole, setRegisterRole] = useState<RegistrationRole | null>(
    initialRole
  );
  const [registerMethod, setRegisterMethod] = useState<AuthMethod | null>(() =>
    searchParams.get("view") === "register" &&
    initialRole === "client" &&
    initialMethod === "email"
      ? "email"
      : null
  );
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
      toast({
        title: "أكمل بيانات الدخول",
        description: "أدخل بريدك الإلكتروني وكلمة المرور بشكل صحيح.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login/email", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      login(data.token, data.user);
      navigate(
        getFirstLoginPath(data.user.role === "provider" ? "provider" : "client")
      );
    } catch (error: any) {
      toast({
        title: "تعذر تسجيل الدخول",
        description: error?.message || "تأكد من بياناتك ثم حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function registerWithEmail(event: React.FormEvent) {
    event.preventDefault();
    if (
      registerName.trim().split(/\s+/).filter(Boolean).length < 4 ||
      !email.trim() ||
      registerPassword.length < 6
    ) {
      toast({
        title: "أكمل بيانات التسجيل",
        description:
          "أدخل الاسم الرباعي والبريد وكلمة مرور من 6 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/register/email", {
        method: "POST",
        body: JSON.stringify({
          name: registerName.trim(),
          email: email.trim(),
          password: registerPassword,
          role: "client",
        }),
      });
      login(data.token, data.user);
      navigate(getFirstLoginPath("client"));
    } catch (error: any) {
      toast({
        title: "تعذر إنشاء الحساب",
        description: error?.message || "حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function continueWithPhone(event: React.FormEvent) {
    event.preventDefault();
    if (phone.trim().length < 7) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "أدخل رقم جوال صحيحًا للمتابعة برمز التحقق.",
        variant: "destructive",
      });
      return;
    }
    navigate(
      `/auth/phone?mode=login&role=client&phone=${encodeURIComponent(phone.trim())}`
    );
  }

  function chooseRole(role: RegistrationRole) {
    if (role === "provider") navigate(`/auth/phone?mode=register&role=${role}`);
    else {
      setRegisterRole(role);
      setRegisterMethod(null);
    }
  }

  function handleBack() {
    if (view === "register") {
      if (registerMethod) {
        setRegisterMethod(null);
        return;
      }
      if (registerRole) {
        setRegisterRole(null);
        return;
      }
      setView("login");
      return;
    }
    navigate("/welcome");
  }

  const headingTitle =
    view === "login" ? "أهلاً بعودتك إلى فزعة" : "أنشئ حسابك في فزعة";
  const headingDescription =
    view === "login"
      ? "سجّل دخولك برقم الجوال أو البريد الإلكتروني وتابع خدماتك من مكان واحد."
      : "اختر نوع الحساب المناسب لك، وسنكمل معك بيانات التسجيل الحالية خطوة بخطوة.";

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -right-32 -top-28 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-accent/[0.12] blur-3xl" />
      <AppPage
        width="mobile"
        className="relative flex min-h-[100dvh] flex-col px-5 pb-8 pt-5 sm:px-8 sm:pt-8"
      >
        <header
          className="flex items-center justify-between"
          aria-label="رأس الصفحة"
        >
          {view === "register" ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-secondary"
              aria-label="العودة"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <span className="h-11 w-11" aria-hidden="true" />
          )}
          <div className="flex h-16 w-24 items-center justify-center rounded-2xl bg-card/80 px-2 shadow-sm ring-1 ring-border/70">
            <BrandLogo className="auth-logo h-16 w-20 object-contain" />
          </div>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-accent" />
          </span>
        </header>

        <section className="mt-9 flex-1">
          <PageHeading
            eyebrow="فزعة · دخول آمن"
            title={headingTitle}
            description={headingDescription}
            className="mb-7"
          />

          {view === "login" ? (
            <SurfaceCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-accent">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">
                    بيانات الدخول
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    اختر الطريقة المناسبة لك
                  </p>
                </div>
              </div>
              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/70 p-1">
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${method === "phone" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Phone className="h-4 w-4" />
                  رقم الجوال
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${method === "email" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </button>
              </div>

              {method === "phone" ? (
                <form onSubmit={continueWithPhone} className="space-y-4">
                  <label className="block text-xs font-extrabold text-foreground">
                    رقم الجوال
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      placeholder="7xxxxxxxx"
                      type="tel"
                      dir="ltr"
                      className="h-14 rounded-2xl border-input bg-background pr-10 text-left text-base shadow-none focus-visible:ring-accent"
                    />
                  </div>
                  <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                    سيظهر رمز التحقق على الشاشة حاليًا للاختبار، ولن يتغير هذا
                    التدفق عند ربط SMS لاحقًا.
                  </p>
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90"
                  >
                    المتابعة برمز التحقق{" "}
                    <ArrowLeft className="mr-2 h-4 w-4 text-accent" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={loginWithEmail} className="space-y-4">
                  <label className="block text-xs font-extrabold text-foreground">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      dir="ltr"
                      autoComplete="email"
                      className="h-14 rounded-2xl border-input bg-background pr-10 text-left text-base shadow-none focus-visible:ring-accent"
                    />
                  </div>
                  <div className="relative">
                    <label className="mb-2 block text-xs font-extrabold text-foreground">
                      كلمة المرور أو الرمز السري
                    </label>
                    <LockKeyhole className="pointer-events-none absolute right-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="أدخل كلمة المرور"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      autoComplete="current-password"
                      className="h-14 rounded-2xl border-input bg-background px-10 text-left text-base shadow-none focus-visible:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(value => !value)}
                      className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-muted-foreground"
                      aria-label={
                        showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="flex items-center gap-1 text-xs font-bold text-accent-foreground hover:underline"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    نسيت كلمة المرور أو الرمز السري؟
                  </Link>
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        دخول إلى حسابي{" "}
                        <ArrowLeft className="mr-2 h-4 w-4 text-accent" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </SurfaceCard>
          ) : registerRole === "client" && registerMethod === "email" ? (
            <SurfaceCard className="mt-1 p-5 sm:p-6">
              <form onSubmit={registerWithEmail} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setRegisterMethod(null)}
                  className="flex items-center gap-2 text-xs font-extrabold text-accent-foreground"
                >
                  <ArrowRight className="h-4 w-4" /> طرق التسجيل
                </button>
                <div>
                  <label className="mb-2 block text-xs font-extrabold">
                    الاسم الرباعي
                  </label>
                  <Input
                    value={registerName}
                    onChange={event => setRegisterName(event.target.value)}
                    placeholder="الاسم الأول واسم الأب والجد والعائلة"
                    className="h-14 rounded-2xl border-input bg-background text-sm shadow-none focus-visible:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-extrabold">
                    البريد الإلكتروني
                  </label>
                  <Input
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    className="h-14 rounded-2xl border-input bg-background text-left text-base shadow-none focus-visible:ring-accent"
                  />
                </div>
                <div className="relative">
                  <label className="mb-2 block text-xs font-extrabold">
                    كلمة المرور
                  </label>
                  <LockKeyhole className="pointer-events-none absolute right-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={registerPassword}
                    onChange={event => setRegisterPassword(event.target.value)}
                    placeholder="6 أحرف أو أرقام على الأقل"
                    type={showRegisterPassword ? "text" : "password"}
                    dir="ltr"
                    autoComplete="new-password"
                    className="h-14 rounded-2xl border-input bg-background px-10 text-left text-base shadow-none focus-visible:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(value => !value)}
                    className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-muted-foreground"
                    aria-label="إظهار أو إخفاء كلمة المرور"
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      إنشاء حساب العميل{" "}
                      <ArrowLeft className="mr-2 h-4 w-4 text-accent" />
                    </>
                  )}
                </Button>
              </form>
            </SurfaceCard>
          ) : registerRole === "client" && !registerMethod ? (
            <div className="mt-1 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setRegisterMethod("phone");
                  navigate("/auth/phone?mode=register&role=client");
                }}
                className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
                  <Phone className="h-6 w-6" />
                </span>
                <span>
                  <b className="block text-[15px]">التسجيل برقم الجوال</b>
                  <small className="mt-1 block text-xs text-muted-foreground">
                    تحقق برمز يظهر على الشاشة حاليًا
                  </small>
                </span>
                <ArrowLeft className="mr-auto h-4 w-4 text-muted-foreground transition group-hover:text-accent-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setRegisterMethod("email")}
                className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
                  <Mail className="h-6 w-6" />
                </span>
                <span>
                  <b className="block text-[15px]">
                    التسجيل بالبريد الإلكتروني
                  </b>
                  <small className="mt-1 block text-xs text-muted-foreground">
                    أنشئ حسابك بكلمة مرور خاصة بك
                  </small>
                </span>
                <ArrowLeft className="mr-auto h-4 w-4 text-muted-foreground transition group-hover:text-accent-foreground" />
              </button>
            </div>
          ) : (
            <div className="mt-1 space-y-3">
              <div className="flex items-start gap-3 rounded-3xl border border-accent/25 bg-accent/10 p-4 text-xs leading-6 text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
                <span>
                  اختر نوع الحساب، وبعدها ستظهر لك بيانات التسجيل الحالية دون
                  تغيير.
                </span>
              </div>
              {roleOptions.map(({ role, title, description, detail }) => {
                const Icon =
                  role === "provider" ? BriefcaseBusiness : UserRound;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => chooseRole(role)}
                    className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground transition group-hover:bg-primary group-hover:text-accent">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15px] text-foreground">
                        {title}
                      </b>
                      <small className="mt-1 block text-xs text-muted-foreground">
                        {description}
                      </small>
                      <small className="mt-2 block text-[10px] font-bold text-accent-foreground">
                        {detail}
                      </small>
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-transparent transition group-hover:border-accent group-hover:bg-accent group-hover:text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {view === "login" ? (
            <>
              ليس لديك حساب؟{" "}
              <button
                type="button"
                onClick={() => {
                  setView("register");
                  setRegisterRole(null);
                  setRegisterMethod(null);
                }}
                className="font-black text-accent-foreground hover:underline"
              >
                أنشئ حسابًا جديدًا
              </button>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{" "}
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setRegisterRole(null);
                  setRegisterMethod(null);
                }}
                className="font-black text-accent-foreground hover:underline"
              >
                تسجيل الدخول
              </button>
            </>
          )}
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent-foreground" /> فزعة FAZAAH ·
          تجربة آمنة ومصممة لك
        </p>
      </AppPage>
    </main>
  );
}
