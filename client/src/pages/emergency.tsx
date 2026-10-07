import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Droplets,
  Lock,
  MapPin,
  Phone,
  Zap,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const EMERGENCY_SERVICES = [
  {
    id: 1,
    icon: Zap,
    label: "كهربائي طارئ",
    color: "bg-yellow-500",
    categoryId: 2,
    desc: "مشكلة كهربائية خطيرة",
  },
  {
    id: 2,
    icon: Droplets,
    label: "سباك طارئ",
    color: "bg-blue-500",
    categoryId: 1,
    desc: "تسرب مياه أو انسداد",
  },
  {
    id: 3,
    icon: Lock,
    label: "فتح أقفال",
    color: "bg-gray-700",
    categoryId: null,
    desc: "فتح باب أو قفل",
  },
];

export default function Emergency() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function sendEmergency(serviceId: number) {
    setSelected(serviceId);
    const service = EMERGENCY_SERVICES.find(s => s.id === serviceId)!;
    setSending(true);
    try {
      const query = new URLSearchParams({ limit: "20" });
      if (service.categoryId)
        query.set("categoryId", String(service.categoryId));
      const providersPage = await apiRequest(`/providers?${query.toString()}`);
      const provider =
        providersPage.providers.find(
          (item: { isAvailable: boolean }) => item.isAvailable
        ) ?? providersPage.providers[0];
      if (!provider) throw new Error("لا يوجد مهني متاح لهذا النوع حالياً");
      await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({
          providerId: provider.id,
          serviceType: service.label,
          description: `طلب طارئ: ${service.desc}`,
          city: user?.city ?? "صنعاء",
          district: "",
          scheduledAt: null,
          isImmediate: true,
        }),
      });
      setSent(true);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="min-h-[100dvh] bg-primary px-4 py-8 text-primary-foreground"
        dir="rtl"
      >
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg items-center justify-center">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180 }}
            className="w-full text-center"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-accent text-primary shadow-xl shadow-black/10">
              <CheckCircle className="h-12 w-12" />
            </div>
            <p className="mt-7 text-xs font-extrabold text-accent">طلب عاجل</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
              تم إرسال طلبك!
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-white/70">
              نبحث الآن عن أقرب مهني متاح في منطقتك.
            </p>
            <div className="mx-auto mt-8 max-w-xs rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs text-white/60">متوسط وقت الاستجابة</p>
              <p className="mt-1 text-3xl font-black text-white">١٥ دقيقة</p>
            </div>
            <Button
              onClick={() => navigate("/my-requests")}
              className="mt-8 h-14 w-full max-w-xs rounded-2xl bg-accent text-base font-black text-primary shadow-lg shadow-black/10 hover:bg-accent/90"
            >
              تتبع الطلب
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="border-b border-red-200/70 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/25">
        <div className="mx-auto max-w-3xl px-4 pb-5 pt-safe sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              aria-label="العودة للرئيسية"
              className="h-11 w-11 rounded-2xl border-red-200 bg-card text-red-700 dark:border-red-900/60 dark:text-red-300"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold text-red-700 dark:text-red-300">
                  استجابة سريعة
                </p>
                <h1 className="text-lg font-black text-foreground">
                  خدمة الطوارئ
                </h1>
              </div>
            </div>
          </div>
          <p className="max-w-xl pr-1 text-sm leading-6 text-red-900/70 dark:text-red-100/70">
            اختر نوع الطارئ وسنرسل طلبك إلى أقرب مهني متاح فورًا.
          </p>
        </div>
      </header>

      <AppPage width="mobile" className="app-stage premium-surface">
        <PageHeading
          title="ما الذي حدث؟"
          description="اختر الخيار الأقرب لحالتك. لا تحتاج إلى تعبئة نموذج طويل في الحالات العاجلة."
          className="mb-6"
        />

        <section>
          <SectionHeading
            title="اختر نوع الخدمة"
            description="اضغط مرة واحدة لإرسال طلب الطوارئ."
          />
          <div className="space-y-3" aria-busy={sending}>
            {EMERGENCY_SERVICES.map(service => {
              const Icon = service.icon;
              const isSelected = selected === service.id;
              return (
                <motion.button
                  key={service.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !sending && sendEmergency(service.id)}
                  disabled={sending}
                  className={`flex min-h-[88px] w-full items-center gap-4 rounded-3xl border p-4 text-right transition-all ${isSelected ? "border-red-500 bg-red-50/70 shadow-md shadow-red-900/5 dark:bg-red-950/20" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"}`}
                  aria-label={`طلب ${service.label}`}
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${service.color} shadow-sm`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black text-foreground">
                      {service.label}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      {service.desc}
                    </span>
                  </span>
                  {isSelected && sending ? (
                    <Loader2
                      className="h-6 w-6 shrink-0 animate-spin text-red-600"
                      aria-label="جارٍ الإرسال"
                    />
                  ) : (
                    <ArrowRight
                      className="h-5 w-5 shrink-0 rotate-180 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
          {sending && (
            <p
              className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-primary"
              role="status"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> جارٍ البحث عن أقرب
              مهني...
            </p>
          )}
        </section>

        <SurfaceCard className="mt-7 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-foreground">
                موقعك الحالي
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {user?.city ?? "صنعاء"} — سيتم تحديد الموقع الدقيق عند الإرسال
              </p>
            </div>
          </div>
        </SurfaceCard>

        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50/70 p-5 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <Phone className="mx-auto h-5 w-5 text-red-600 dark:text-red-300" />
          <p className="mt-2 text-sm font-bold text-red-800 dark:text-red-200">
            في حالات الخطر الشديد
          </p>
          <a
            href="tel:199"
            className="mt-1 block text-2xl font-black text-red-600 underline decoration-red-300 underline-offset-4 dark:text-red-300"
          >
            اتصل 199
          </a>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="h-4 w-4 text-primary" /> نرسل طلبك للمهني
          الأقرب دون تأخير
        </div>
      </AppPage>
    </div>
  );
}
