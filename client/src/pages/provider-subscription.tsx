import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Crown, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type Plan = { id: "monthly" | "yearly"; title: string; days: number; amount: number; description: string };
type Subscription = { approved: boolean; plan: "monthly" | "yearly" | null; expiresAt: string | null; active: boolean; payments: Array<{ id: number; status: string; plan: string }> };

export default function ProviderSubscription() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiRequest("/subscription-plans"), apiRequest("/providers/me/subscription")])
      .then(([planData, subscription]) => {
        const rawPlans = Array.isArray(planData) ? planData : planData?.plans ?? [];
        setPlans(rawPlans
          .filter((plan: any) => plan.id === "monthly" || plan.id === "yearly")
          .map((plan: any) => ({ id: plan.id, title: plan.title ?? plan.name, days: plan.days ?? (plan.id === "yearly" ? 365 : 30), amount: plan.amount ?? plan.monthlyPrice ?? 0, description: plan.description ?? "" })));
        setStatus(subscription);
      })
      .catch(error => toast({ title: "تعذر تحميل الاشتراك", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const checkout = async () => {
    setSaving(true);
    try {
      await apiRequest("/subscriptions/checkout", { method: "POST", body: JSON.stringify({ plan: selected }) });
      toast({ title: "تم تسجيل طلب الاشتراك", description: "سيتم تفعيل الباقة بعد مراجعة تأكيد السداد من الإدارة." });
      const next = await apiRequest("/providers/me/subscription");
      setStatus(next);
    } catch (error) { toast({ title: "تعذر تسجيل الاشتراك", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[70dvh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (status && !status.approved) return <main className="mx-auto max-w-xl px-4 py-10 text-center" dir="rtl"><div className="rounded-[30px] border border-amber-200 bg-amber-50 p-8"><Clock3 className="mx-auto h-14 w-14 text-amber-600" /><h1 className="mt-5 text-2xl font-black text-primary">حسابك قيد المراجعة</h1><p className="mt-3 text-sm leading-7 text-amber-900">ستظهر خيارات الاشتراك بعد اعتماد مستنداتك من فريق فزعة. يمكنك تعديل ملفك ومتابعة حالة الطلب من لوحة المهني.</p><Button className="mt-6 rounded-2xl" onClick={() => navigate("/provider-dashboard")}>العودة إلى اللوحة</Button></div></main>;

  return <main className="mx-auto max-w-2xl space-y-6 px-4 py-8" dir="rtl"><header><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 text-xs font-bold text-primary"><Crown className="h-4 w-4 text-accent" /> خطوة التفعيل الأخيرة</div><h1 className="text-3xl font-black text-primary">اختر باقة الاشتراك</h1><p className="mt-2 text-sm leading-7 text-muted-foreground">بعد اعتماد حسابك، فعّل الاشتراك ليظهر ملفك للعملاء وتستقبل الطلبات.</p></header>{status?.active && <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="h-5 w-5" /> اشتراكك {status.plan === "yearly" ? "السنوي" : "الشهري"} فعال حتى {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString("ar-YE") : ""}.</div>}<div className="grid gap-4 sm:grid-cols-2">{plans.map(plan => <button key={plan.id} type="button" onClick={() => setSelected(plan.id)} className={`rounded-[26px] border p-5 text-right transition ${selected === plan.id ? "border-primary bg-primary text-white shadow-xl" : "border-border bg-card hover:border-primary/40"}`}><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{plan.title}</h2><p className={`mt-1 text-xs ${selected === plan.id ? "text-white/70" : "text-muted-foreground"}`}>{plan.description}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${selected === plan.id ? "bg-accent text-primary" : "bg-accent/20 text-primary"}`}>{plan.days} يوم</span></div><p className="mt-6 text-3xl font-black">{plan.amount}<span className="mr-1 text-sm font-bold">وحدة</span></p></button>)}</div><div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground"><ShieldCheck className="mb-2 h-5 w-5 text-primary" />بعد اعتماد الدفع، يصبح حسابك <b className="text-primary">معتمدًا ونشطًا</b> ويظهر في البحث فقط خلال مدة الاشتراك.</div><Button className="h-14 w-full rounded-2xl text-base font-black" onClick={checkout} disabled={saving || status?.active}>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : status?.active ? "الباقة مفعلة" : "إرسال طلب الاشتراك"}</Button></main>;
}
