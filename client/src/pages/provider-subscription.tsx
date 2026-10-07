import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

type Plan = {
  id: "monthly" | "yearly";
  title: string;
  days: number;
  amount: number;
  description: string;
};
type Subscription = {
  approved: boolean;
  plan: "monthly" | "yearly" | null;
  expiresAt: string | null;
  active: boolean;
  payments: Array<{ id: number; status: string; plan: string }>;
};

export default function ProviderSubscription() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      apiRequest("/subscription-plans"),
      apiRequest("/providers/me/subscription"),
    ])
      .then(([planData, subscription]) => {
        const rawPlans = Array.isArray(planData)
          ? planData
          : (planData?.plans ?? []);
        setPlans(
          rawPlans
            .filter(
              (plan: any) => plan.id === "monthly" || plan.id === "yearly"
            )
            .map((plan: any) => ({
              id: plan.id,
              title: plan.title ?? plan.name,
              days: plan.days ?? (plan.id === "yearly" ? 365 : 30),
              amount: plan.amount ?? plan.monthlyPrice ?? 0,
              description: plan.description ?? "",
            }))
        );
        setStatus(subscription);
      })
      .catch(error => {
        const message =
          error instanceof Error ? error.message : "حاول مرة أخرى";
        setLoadError(message);
        toast({
          title: "تعذر تحميل الاشتراك",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast, reloadKey]);

  const checkout = async () => {
    setSaving(true);
    try {
      await apiRequest("/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: selected }),
      });
      toast({
        title: "تم تسجيل طلب الاشتراك",
        description: "سيتم تفعيل الباقة بعد مراجعة تأكيد السداد من الإدارة.",
      });
      const next = await apiRequest("/providers/me/subscription");
      setStatus(next);
    } catch (error) {
      toast({
        title: "تعذر تسجيل الاشتراك",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <main
        className="app-stage premium-surface min-h-[100dvh] bg-background"
        dir="rtl"
      >
        <AppPage
          width="content"
          className="flex min-h-[65dvh] items-center justify-center"
        >
          <SurfaceCard className="flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">
              جارٍ تحميل باقات الاشتراك
            </p>
          </SurfaceCard>
        </AppPage>
      </main>
    );

  if (loadError)
    return (
      <main
        className="app-stage premium-surface min-h-[100dvh] bg-background"
        dir="rtl"
      >
        <AppPage width="mobile" className="flex min-h-[65dvh] items-center">
          <EmptyState
            icon={AlertCircle}
            title="تعذر تحميل الاشتراك"
            description={loadError}
            action={
              <Button
                className="h-12 rounded-xl px-8"
                onClick={() => setReloadKey(key => key + 1)}
              >
                إعادة المحاولة
              </Button>
            }
            className="w-full"
          />
        </AppPage>
      </main>
    );

  if (status && !status.approved)
    return (
      <main
        className="app-stage premium-surface min-h-[100dvh] bg-background"
        dir="rtl"
      >
        <AppPage width="mobile" className="flex min-h-[70dvh] items-center">
          <SurfaceCard className="w-full border-amber-200/70 bg-amber-50/80 p-7 text-center shadow-none sm:p-9">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock3 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-black text-primary">
              حسابك قيد المراجعة
            </h1>
            <p className="mt-3 text-sm leading-7 text-amber-950/80">
              ستظهر خيارات الاشتراك بعد اعتماد مستنداتك من فريق فزعة. يمكنك
              تعديل ملفك ومتابعة حالة الطلب من لوحة المهني.
            </p>
            <Button
              className="mt-7 h-12 rounded-2xl px-6"
              onClick={() => navigate("/provider-dashboard")}
            >
              العودة إلى اللوحة
            </Button>
          </SurfaceCard>
        </AppPage>
      </main>
    );

  return (
    <main
      className="app-stage premium-surface min-h-[100dvh] bg-background"
      dir="rtl"
    >
      <AppPage width="content">
        <PageHeading
          eyebrow="خطوة التفعيل الأخيرة"
          title="اختر باقة الاشتراك"
          description="بعد اعتماد حسابك، فعّل الاشتراك ليظهر ملفك للعملاء وتستقبل الطلبات."
          action={
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
              <Crown className="h-6 w-6" />
            </span>
          }
        />

        {status?.active && (
          <SurfaceCard className="mb-7 flex items-start gap-3 border-green-200/80 bg-green-50/80 p-4 text-sm text-green-900 sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p>
              اشتراكك {status.plan === "yearly" ? "السنوي" : "الشهري"} فعال حتى{" "}
              <b>
                {status.expiresAt
                  ? new Date(status.expiresAt).toLocaleDateString("ar-YE")
                  : ""}
              </b>
              .
            </p>
          </SurfaceCard>
        )}

        <section>
          <SectionHeading
            title="الباقات المتاحة"
            description="اختر المدة الأنسب لاستمرار ظهور ملفك في البحث."
          />
          {plans.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  aria-pressed={selected === plan.id}
                  className={`rounded-3xl border p-5 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === plan.id ? "border-primary bg-primary text-primary-foreground shadow-[0_16px_36px_rgba(14,47,98,0.18)]" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-black">{plan.title}</h2>
                      <p
                        className={`mt-1 text-xs leading-5 ${selected === plan.id ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {plan.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${selected === plan.id ? "bg-accent text-primary" : "bg-accent/20 text-primary"}`}
                    >
                      {plan.days} يوم
                    </span>
                  </div>
                  <p className="mt-7 text-3xl font-black">
                    {plan.amount}
                    <span className="mr-1 text-sm font-bold">وحدة</span>
                  </p>
                  <span
                    className={`mt-4 block text-xs font-bold ${selected === plan.id ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {selected === plan.id
                      ? "الباقة المختارة"
                      : "اختر هذه الباقة"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Crown}
              title="لا توجد باقات متاحة حالياً"
              description="حاول تحديث الصفحة لاحقاً أو تواصل مع فريق فزعة للمساعدة."
            />
          )}
        </section>

        <SurfaceCard className="mt-6 flex items-start gap-3 bg-muted/35 p-4 text-sm leading-7 text-muted-foreground">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p>
            بعد اعتماد الدفع، يصبح حسابك{" "}
            <b className="text-primary">معتمدًا ونشطًا</b> ويظهر في البحث فقط
            خلال مدة الاشتراك.
          </p>
        </SurfaceCard>
        <Button
          className="mt-5 h-14 w-full rounded-2xl text-base font-black"
          onClick={checkout}
          disabled={saving || status?.active || !plans.length}
        >
          {saving ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جارٍ تسجيل الطلب
            </>
          ) : status?.active ? (
            "الباقة مفعلة"
          ) : (
            "إرسال طلب الاشتراك"
          )}
        </Button>
      </AppPage>
    </main>
  );
}
