import { useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Moon,
  Sun,
  Bell,
  Lock,
  Trash2,
  LogOut,
  HelpCircle,
  Info,
  Shield,
  Globe,
  ChevronLeft,
  ShieldCheck,
  UserRound,
  Monitor,
  FileText,
  ScrollText,
  Fingerprint,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import {
  disableBiometric,
  enableBiometric,
  isBiometricEnabled,
} from "@/lib/biometric";
import { Switch } from "@/components/ui/switch";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

type ThemeOption = "system" | "light" | "dark";

export default function Settings() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("fazaah-notifications-enabled") !== "false"
  );
  const [biometricEnabled, setBiometricEnabled] = useState(() =>
    isBiometricEnabled()
  );
  const [biometricBusy, setBiometricBusy] = useState(false);

  function handleLogout() {
    const nativeBridge = window as unknown as {
      FazaaNativeLogout?: { requestLogout: () => void };
    };
    if (nativeBridge.FazaaNativeLogout) {
      nativeBridge.FazaaNativeLogout.requestLogout();
      return;
    }
    logout();
    navigate("/welcome");
    toast({ title: "تم تسجيل الخروج" });
  }

  function handlePhoneVerification() {
    if (user?.phoneVerified) {
      toast({
        title: "رقم الهاتف موثق بالفعل",
        description:
          "تم التحقق من رقمك عند إنشاء الحساب. لا حاجة لإعادة تسجيل الدخول أو التسجيل.",
      });
      return;
    }
    toast({
      title: "توثيق الهاتف غير متاح حالياً",
      description:
        "لم يتم ربط مزود SMS بعد. ستبقى جلستك محفوظة ولن نخرجك من التطبيق.",
      variant: "destructive",
    });
  }

  function handleNotificationsToggle(enabled: boolean) {
    setNotificationsEnabled(enabled);
    localStorage.setItem("fazaah-notifications-enabled", String(enabled));
    toast({
      title: enabled ? "تم تفعيل إشعارات الطلبات" : "تم إيقاف إشعارات الطلبات",
    });
  }

  async function handleBiometricToggle(enabled: boolean) {
    if (!enabled) {
      disableBiometric();
      setBiometricEnabled(false);
      toast({ title: "تم إيقاف تسجيل الدخول بالبصمة" });
      return;
    }
    if (!user) return;
    setBiometricBusy(true);
    try {
      await enableBiometric({ id: user.id, name: user.name });
      setBiometricEnabled(true);
      toast({
        title: "تم تفعيل البصمة",
        description: "سيطلب جهازك البصمة عند استخدام ميزة الدخول المدعوم.",
      });
    } catch (error) {
      setBiometricEnabled(false);
      toast({
        title: "تعذر تفعيل البصمة",
        description:
          error instanceof Error
            ? error.message
            : "تأكد من دعم الجهاز للبصمة والمحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setBiometricBusy(false);
    }
  }

  const Section = ({
    title,
    description,
    children,
    danger = false,
  }: {
    title: string;
    description?: string;
    children: ReactNode;
    danger?: boolean;
  }) => (
    <section className="mb-7">
      <SectionHeading
        title={title}
        description={description}
        className="px-1"
      />
      <SurfaceCard
        className={`overflow-hidden divide-y divide-border/70 ${danger ? "border-destructive/20" : ""}`}
      >
        {children}
      </SurfaceCard>
    </section>
  );

  const Item = ({
    icon: Icon,
    label,
    sub,
    iconColor = "text-primary",
    danger = false,
    onClick,
    right,
  }: {
    icon: LucideIcon;
    label: string;
    sub?: string;
    iconColor?: string;
    danger?: boolean;
    onClick?: () => void;
    right?: ReactNode;
  }) => {
    const content = (
      <>
        <span className={`app-icon-tile h-11 w-11 rounded-2xl ${iconColor}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-extrabold ${danger ? "text-destructive" : "text-foreground"}`}
          >
            {label}
          </span>
          {sub && (
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              {sub}
            </span>
          )}
        </span>
        <span className="ms-auto shrink-0">
          {right ?? (
            <ChevronLeft
              className="h-5 w-5 text-muted-foreground/45"
              aria-hidden="true"
            />
          )}
        </span>
      </>
    );
    if (!onClick)
      return (
        <div
          className={`flex min-h-[76px] w-full items-center gap-3 px-4 py-3.5 text-start sm:px-5 ${danger ? "text-destructive" : ""}`}
        >
          {content}
        </div>
      );
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[76px] w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-primary/[0.04] sm:px-5 ${danger ? "text-destructive" : ""}`}
      >
        {content}
      </button>
    );
  };

  const themeOptions: {
    value: ThemeOption;
    label: string;
    icon: LucideIcon;
  }[] = [
    { value: "system", label: "تلقائي", icon: Monitor },
    { value: "light", label: "نهاري", icon: Sun },
    { value: "dark", label: "ليلي", icon: Moon },
  ];

  return (
    <div className="premium-surface min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-safe">
        <PageHeading
          eyebrow="فزعة FAZAAH"
          title="الإعدادات"
          description="خصص تجربة فزعة كما تحب، وراجع حسابك وخصوصيتك بسهولة."
          action={
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-muted"
              aria-label="العودة إلى الملف الشخصي"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          }
          className="mb-5"
        />
        <SurfaceCard className="mb-7 overflow-hidden bg-primary p-5 text-primary-foreground sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-accent">حسابك في فزعة</p>
              <p className="mt-1 truncate text-lg font-black">
                {user?.name ?? "أهلاً بك"}
              </p>
              <p className="mt-1 text-xs leading-5 text-primary-foreground/70">
                إدارة الحساب والأمان والمظهر من مكان واحد.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <Section
          title="حسابي"
          description="الوصول إلى بياناتك الأساسية وتفاصيل ملفك."
        >
          <Item
            icon={UserRound}
            label="الملف الشخصي"
            sub={`${user?.name ?? "حسابك"} · المعلومات والبيانات`}
            onClick={() => navigate("/profile")}
          />
        </Section>

        <Section
          title="المظهر"
          description="اختر الطريقة الأنسب لعرض التطبيق على جهازك."
        >
          <Item
            icon={theme === "system" ? Monitor : theme === "dark" ? Moon : Sun}
            label="وضع التطبيق"
            sub={
              theme === "system"
                ? "يتبع إعدادات جهازك تلقائياً"
                : theme === "dark"
                  ? "الوضع الليلي مفعّل يدوياً"
                  : "الوضع النهاري مفعّل يدوياً"
            }
            right={
              <span className="text-xs font-extrabold text-primary">
                {theme === "system"
                  ? "تلقائي"
                  : theme === "dark"
                    ? "ليلي"
                    : "نهاري"}
              </span>
            }
          />
          <div className="grid grid-cols-3 gap-2 border-t border-border/70 bg-background/45 p-3 sm:p-4">
            {themeOptions.map(option => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-bold transition-colors ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <Item
            icon={Globe}
            label="اللغة"
            sub="العربية"
            onClick={() =>
              toast({ title: "قريباً", description: "سيتم دعم لغات إضافية" })
            }
          />
        </Section>

        <Section
          title="الإشعارات"
          description="تحكم في تنبيهات الطلبات وتحديثاتها."
        >
          <Item
            icon={Bell}
            label="إشعارات الطلبات"
            sub="تلقي تنبيهات عند تحديث الطلبات"
            right={
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsToggle}
                aria-label="إشعارات الطلبات"
                className="h-6 w-11 [&>span]:h-5 [&>span]:w-5 data-[state=checked]:[&>span]:translate-x-5"
              />
            }
          />
        </Section>

        <Section
          title="الأمان والخصوصية"
          description="خيارات تساعدك على حماية حسابك وبياناتك."
        >
          <Item
            icon={Lock}
            label="تغيير كلمة المرور"
            onClick={() => navigate("/auth/forgot-password")}
          />
          <Item
            icon={Fingerprint}
            label="تسجيل الدخول بالبصمة"
            sub={
              biometricBusy
                ? "جاري تجهيز بصمة الجهاز..."
                : biometricEnabled
                  ? "مفعّل على هذا الجهاز"
                  : "استخدم بصمة الجهاز أو قفل الشاشة"
            }
            right={
              biometricBusy ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-primary"
                  aria-label="جاري التحميل"
                />
              ) : (
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={enabled =>
                    void handleBiometricToggle(enabled)
                  }
                  aria-label="تسجيل الدخول بالبصمة"
                  className="h-6 w-11 [&>span]:h-5 [&>span]:w-5 data-[state=checked]:[&>span]:translate-x-5"
                />
              )
            }
          />
          <Item
            icon={Shield}
            label="توثيق رقم الهاتف"
            sub={user?.phoneVerified ? "موثق ✓" : "غير موثق"}
            onClick={handlePhoneVerification}
          />
          <Item
            icon={FileText}
            label="سياسة الخصوصية"
            sub="كيف نحمي بياناتك ونستخدمها"
            onClick={() => navigate("/privacy")}
          />
          <Item
            icon={ScrollText}
            label="شروط الاستخدام"
            sub="القواعد المنظمة لاستخدام فزعة"
            onClick={() => navigate("/terms")}
          />
        </Section>

        <Section
          title="الدعم والمساعدة"
          description="إجابات سريعة وطرق مباشرة للتواصل معنا."
        >
          <Item
            icon={HelpCircle}
            label="الأسئلة الشائعة والدعم"
            sub="إجابات وتواصل مباشر مع فريق فزعة"
            onClick={() => navigate("/help-support")}
          />
          <Item
            icon={Info}
            label="من نحن"
            onClick={() =>
              toast({ title: "فزعة — منصة الخدمات المهنية في اليمن" })
            }
          />
        </Section>
        <Section
          title="منطقة الخطر"
          description="إجراءات مهمة لا يمكن التراجع عن بعضها."
          danger
        >
          <Item
            icon={LogOut}
            label="تسجيل الخروج"
            iconColor="text-destructive"
            danger
            onClick={handleLogout}
          />
          <Item
            icon={Trash2}
            label="حذف الحساب"
            sub="هذا الإجراء لا يمكن التراجع عنه"
            iconColor="text-destructive"
            danger
            onClick={() =>
              toast({
                title: "تواصل مع الدعم",
                description: "لحذف الحساب تواصل مع فريق الدعم",
                variant: "destructive",
              })
            }
          />
        </Section>
        <p className="pb-4 text-center text-xs text-muted-foreground">
          فزعة FAZAAH v1.0.0 — صنعاء، اليمن
        </p>
      </AppPage>
    </div>
  );
}
