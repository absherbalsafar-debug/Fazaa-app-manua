import { useGetAdminStats, useGetServiceStats } from "@/lib/api-client-react";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import {
  Users,
  BriefcaseBusiness,
  ClipboardList,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isStatsError,
  } = useGetAdminStats({
    query: { queryKey: ["adminStats"] },
  });

  const {
    data: serviceStats,
    isLoading: isLoadingServices,
    isError: isServicesError,
  } = useGetServiceStats({
    query: { queryKey: ["serviceStats"] },
  });

  if (isLoadingStats || isLoadingServices) {
    return (
      <AppPage width="wide">
        <PageHeading
          title="لوحة التحكم"
          description="نظرة سريعة على حركة منصة فزعة وأداء خدماتها."
        />
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="جارٍ تحميل الإحصاءات"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl border border-border bg-card/80"
            />
          ))}
        </div>
        <div className="mt-6 h-[22rem] animate-pulse rounded-3xl border border-border bg-card/80" />
      </AppPage>
    );
  }

  if (isStatsError || isServicesError) {
    return (
      <AppPage width="wide">
        <PageHeading
          title="لوحة التحكم"
          description="نظرة سريعة على حركة منصة فزعة وأداء خدماتها."
        />
        <EmptyState
          icon={ShieldAlert}
          title="تعذر تحميل بيانات لوحة التحكم"
          description="حدثت مشكلة أثناء جلب الإحصاءات. حاول تحديث الصفحة مرة أخرى."
        />
      </AppPage>
    );
  }

  if (!stats) {
    return (
      <AppPage width="wide">
        <PageHeading title="لوحة التحكم" />
        <EmptyState icon={Activity} title="لا توجد بيانات للعرض حاليًا" />
      </AppPage>
    );
  }

  const statCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      tone: "bg-primary/8 text-primary",
    },
    {
      title: "مزودي الخدمة",
      value: stats.totalProviders,
      icon: BriefcaseBusiness,
      tone: "bg-amber-100 text-amber-700",
    },
    {
      title: "العملاء",
      value: stats.totalClients,
      icon: Users,
      tone: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.totalRequests,
      icon: ClipboardList,
      tone: "bg-sky-100 text-sky-700",
    },
    {
      title: "الطلبات المنجزة",
      value: stats.completedRequests,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "مهنيين بانتظار التوثيق",
      value: stats.pendingProviders,
      icon: ShieldAlert,
      tone: "bg-red-100 text-red-700",
    },
  ];

  return (
    <AppPage width="wide">
      <PageHeading
        eyebrow="مركز الإدارة"
        title="لوحة التحكم"
        description="نظرة سريعة على حركة منصة فزعة وأداء خدماتها."
      />

      <section>
        <SectionHeading
          title="ملخص المنصة"
          description="الأرقام الحالية للحسابات والطلبات والمهنيين."
          className="mb-4"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(stat => {
            const Icon = stat.icon;
            return (
              <SurfaceCard
                key={stat.title}
                className="group p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-6 text-muted-foreground">
                      {stat.title}
                    </p>
                    <p
                      className="mt-3 text-3xl font-black tracking-tight text-foreground"
                      dir="ltr"
                    >
                      {stat.value.toLocaleString("ar-YE")}
                    </p>
                  </div>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.tone}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <SurfaceCard className="mt-7 overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <SectionHeading
            title="إحصائيات الخدمات"
            description="مقارنة بين عدد الطلبات والمهنيين في كل مجال."
            className="mb-0"
          />
        </div>
        <div className="h-[21rem] px-2 py-5 sm:h-[25rem] sm:px-6" dir="ltr">
          {serviceStats && serviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={240}>
              <BarChart
                data={serviceStats}
                margin={{ top: 12, right: 8, left: 4, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="categoryName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{
                    direction: "rtl",
                    borderRadius: "16px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    boxShadow: "0 10px 30px rgb(16 36 67 / 0.12)",
                  }}
                />
                <Bar
                  dataKey="requestCount"
                  name="عدد الطلبات"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="providerCount"
                  name="عدد المهنيين"
                  fill="hsl(var(--accent))"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="لا توجد بيانات متاحة"
              description="ستظهر إحصائيات الخدمات عند توفر طلبات أو مهنيين في المنصة."
              className="h-full"
            />
          )}
        </div>
      </SurfaceCard>
    </AppPage>
  );
}
