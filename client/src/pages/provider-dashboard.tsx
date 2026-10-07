import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Megaphone,
  Settings2,
  ShieldCheck,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useListRequests, useUpdateProvider } from "@/lib/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/brand-logo";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

interface ProviderProfile {
  id: number;
  name: string;
  categoryName: string;
  city: string;
  bio: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsExperience: number;
  isVerified: boolean;
  isAvailable: boolean;
}

const statusLabel: Record<string, string> = {
  pending: "بانتظار ردك",
  accepted: "تم القبول",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch,
  } = useListRequests(
    { role: "provider" },
    {
      query: {
        queryKey: ["provider-requests", user?.id],
        refetchOnMount: "always",
        staleTime: 15_000,
      },
    }
  );
  const updateProvider = useUpdateProvider();
  const safeRequests = Array.isArray(requests) ? requests : [];

  useEffect(() => {
    let active = true;
    apiRequest("/providers/me")
      .then(data => {
        if (active) setProfile(data as ProviderProfile);
      })
      .catch((error: Error) => {
        if (active)
          toast({
            title: "تعذر تحميل الملف المهني",
            description: error.message,
            variant: "destructive",
          });
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const stats = useMemo(() => {
    const pending = safeRequests.filter(
      request => request.status === "pending"
    ).length;
    const active = safeRequests.filter(request =>
      ["accepted", "in_progress"].includes(request.status)
    ).length;
    const completed = safeRequests.filter(
      request => request.status === "completed"
    ).length;
    return { pending, active, completed };
  }, [safeRequests]);

  const toggleAvailability = (isAvailable: boolean) => {
    if (!profile) return;
    updateProvider.mutate(
      { id: profile.id, data: { isAvailable } },
      {
        onSuccess: updated => {
          setProfile(current =>
            current ? { ...current, isAvailable: updated.isAvailable } : current
          );
          toast({
            title: isAvailable
              ? "أنت متاح لاستقبال الطلبات"
              : "تم إيقاف استقبال الطلبات",
          });
        },
        onError: error =>
          toast({
            title: "تعذر تحديث الحالة",
            description: error.message,
            variant: "destructive",
          }),
      }
    );
  };

  if (profileLoading || requestsLoading) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-background text-primary"
        dir="rtl"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-bold shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري تجهيز لوحة المهني...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-background px-4 pt-8" dir="rtl">
        <EmptyState
          icon={BriefcaseBusiness}
          title="أكمل ملفك المهني"
          description="أنشئ ملفك حتى تبدأ باستقبال طلبات العملاء."
          action={
            <Link href="/profile">
              <Button className="min-h-11 rounded-xl px-5">
                الانتقال إلى الملف
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const firstName = profile.name.trim().split(/\s+/)[0] || "بك";
  const statsItems = [
    {
      label: "طلبات جديدة",
      value: stats.pending,
      icon: Clock3,
      tone: "bg-accent/15 text-accent-foreground",
    },
    {
      label: "أعمال نشطة",
      value: stats.active,
      icon: BriefcaseBusiness,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "أعمال مكتملة",
      value: (Number(profile.completedJobs) || 0) + stats.completed,
      icon: CheckCircle2,
      tone: "bg-emerald-500/12 text-emerald-700",
    },
    {
      label: "التقييم",
      value: (Number(profile.rating) || 0).toFixed(1),
      icon: Star,
      tone: "bg-accent/15 text-accent-foreground",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <BrandLogo className="mb-5 h-11 w-24 object-contain brightness-0 invert" />
              <p className="text-xs font-bold text-white/65">لوحة المهني</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                أهلًا {firstName}
              </h1>
              <p className="mt-2 text-sm text-white/75">
                {profile.categoryName}{" "}
                <span className="mx-1 text-white/40">·</span> {profile.city}
              </p>
              {profile.bio && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                  {profile.bio}
                </p>
              )}
            </div>
            <Link
              href="/settings"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition hover:bg-white/15"
              aria-label="الإعدادات"
            >
              <Settings2 className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${profile.isAvailable ? "animate-pulse bg-emerald-300" : "bg-white/35"}`}
              />
              <div>
                <p className="text-sm font-black">
                  {profile.isAvailable ? "متاح الآن" : "غير متاح"}
                </p>
                <p className="mt-1 text-xs text-white/65">
                  استقبال طلبات جديدة
                </p>
              </div>
            </div>
            <Switch
              checked={profile.isAvailable}
              onCheckedChange={toggleAvailability}
              disabled={updateProvider.isPending}
            />
          </div>
        </div>
      </header>

      <AppPage
        width="content"
        className="relative -mt-12 space-y-5 pt-0 sm:-mt-14"
      >
        <section
          aria-label="ملخص الأداء"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {statsItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <SurfaceCard className="h-full p-4 sm:p-5">
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  {item.label}
                </p>
              </SurfaceCard>
            </motion.div>
          ))}
        </section>

        <Link
          href="/provider-business"
          className="group flex items-center gap-4 rounded-3xl border border-primary/15 bg-primary/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.1] sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Megaphone className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-foreground">
              الاشتراك والإعلانات
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              تابع أداء ملفك، فعّل اشتراكك وأنشئ إعلاناً مدفوعاً.
            </span>
          </span>
          <ArrowUpLeft className="h-5 w-5 shrink-0 text-primary transition group-hover:-translate-x-1" />
        </Link>

        <section className="grid gap-3 sm:grid-cols-2">
          <SurfaceCard className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-bold">الأرباح</span>
            </div>
            <p className="mt-4 text-lg font-black text-foreground">
              قيد التفعيل
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              ستظهر بعد اكتمال أول طلب
            </p>
          </SurfaceCard>
          <SurfaceCard className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold">الخبرة</span>
            </div>
            <p className="mt-4 text-lg font-black text-foreground">
              {profile.yearsExperience} سنوات
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {profile.reviewCount} تقييم موثق
            </p>
          </SurfaceCard>
        </section>

        {!profile.isVerified && (
          <Link
            href="/verify"
            className="flex items-start gap-3 rounded-3xl border border-accent/35 bg-accent/10 p-4 text-accent-foreground transition hover:bg-accent/15 sm:p-5"
          >
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-accent-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">
                وثّق ملفك لزيادة الثقة
              </span>
              <span className="mt-1 block text-xs leading-5 opacity-80">
                ارفع الهوية والشهادات لإظهار شارة التوثيق.
              </span>
            </span>
            <ArrowUpLeft className="mt-1 h-4 w-4 shrink-0" />
          </Link>
        )}

        <SurfaceCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div>
              <SectionHeading
                title="آخر الطلبات"
                description="تابع أعمالك ورد على العملاء"
                className="mb-0"
              />
            </div>
            <Link
              href="/my-requests"
              className="shrink-0 text-xs font-black text-primary hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          {safeRequests.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="لا توجد طلبات حتى الآن"
              description="ستظهر طلبات العملاء هنا عند وصولها."
              className="rounded-none border-0 bg-transparent py-12"
            />
          ) : (
            <div className="divide-y divide-border">
              {safeRequests.slice(0, 4).map(request => (
                <Link
                  key={request.id}
                  href={`/my-requests/${request.id}`}
                  className="flex min-h-[72px] items-center gap-3 p-4 transition-colors hover:bg-muted/40 sm:px-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Eye className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">
                      {request.serviceType}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {request.clientName} <span className="mx-1">·</span>{" "}
                      {request.city}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                    {statusLabel[request.status] ?? request.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SurfaceCard>
        <Button
          variant="outline"
          className="min-h-11 w-full rounded-xl bg-card font-bold"
          onClick={() => refetch()}
        >
          تحديث الطلبات
        </Button>
      </AppPage>
    </div>
  );
}
