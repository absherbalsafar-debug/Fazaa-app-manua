import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  ListFilter,
  LoaderCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { useListRequests } from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const statusConfig = {
  pending: {
    label: "قيد الانتظار",
    color: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3,
  },
  accepted: {
    label: "تم القبول",
    color: "border-blue-200 bg-blue-50 text-blue-800",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "جاري التنفيذ",
    color: "border-purple-200 bg-purple-50 text-purple-800",
    icon: PlayCircle,
  },
  completed: {
    label: "مكتمل",
    color: "border-green-200 bg-green-50 text-green-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "مرفوض",
    color: "border-red-200 bg-red-50 text-red-800",
    icon: XCircle,
  },
  cancelled: {
    label: "ملغي",
    color: "border-border bg-muted text-muted-foreground",
    icon: AlertCircle,
  },
} as const;

const filters = [
  ["all", "الكل"],
  ["active", "النشطة"],
  ["completed", "المكتملة"],
] as const;

type RequestFilter = (typeof filters)[number][0];

export default function MyRequests() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const isProvider = user?.role === "provider";

  const {
    data: requests,
    isLoading,
    isError,
    refetch,
  } = useListRequests(
    { role: isProvider ? "provider" : "client" },
    { query: { queryKey: ["requests", user?.role] } }
  );

  const safeRequests = Array.isArray(requests) ? requests : [];
  const visibleRequests = safeRequests.filter(request => {
    if (filter === "completed") return request.status === "completed";
    if (filter === "active") {
      return ["pending", "accepted", "in_progress"].includes(request.status);
    }
    return true;
  });
  const activeCount = safeRequests.filter(request =>
    ["pending", "accepted", "in_progress"].includes(request.status)
  ).length;
  const completedCount = safeRequests.filter(
    request => request.status === "completed"
  ).length;

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <AppPage width="content" className="app-stage premium-surface space-y-7">
        <PageHeading
          eyebrow="مساحة المتابعة"
          title="طلباتي"
          description={
            isProvider
              ? "تابع الطلبات الواردة إليك واتخذ الخطوة المناسبة في الوقت المناسب."
              : "كل طلبات الخدمة الخاصة بك في مكان واحد، بوضوح واطمئنان."
          }
          action={
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:h-14 sm:w-14">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </span>
          }
          className="mb-0"
        />

        {!isLoading && !isError && safeRequests.length > 0 && (
          <div
            className="grid grid-cols-3 gap-2 sm:gap-3"
            aria-label="ملخص الطلبات"
          >
            <SurfaceCard className="p-3 text-center sm:p-4">
              <p className="text-xl font-black text-primary sm:text-2xl">
                {safeRequests.length}
              </p>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground sm:text-xs">
                إجمالي الطلبات
              </p>
            </SurfaceCard>
            <SurfaceCard className="p-3 text-center sm:p-4">
              <p className="text-xl font-black text-primary sm:text-2xl">
                {activeCount}
              </p>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground sm:text-xs">
                طلبات نشطة
              </p>
            </SurfaceCard>
            <SurfaceCard className="p-3 text-center sm:p-4">
              <p className="text-xl font-black text-primary sm:text-2xl">
                {completedCount}
              </p>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground sm:text-xs">
                طلبات مكتملة
              </p>
            </SurfaceCard>
          </div>
        )}

        {!isLoading && !isError && safeRequests.length > 0 && (
          <section>
            <SectionHeading
              title="تصفية الطلبات"
              description="اعرض ما تحتاجه الآن بسرعة."
              action={
                <ListFilter
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />
              }
              className="mb-3"
            />
            <SurfaceCard className="p-1.5 sm:p-2">
              <div
                className="grid grid-cols-3 gap-1.5"
                role="tablist"
                aria-label="تصفية الطلبات"
              >
                {filters.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={filter === value}
                    onClick={() => setFilter(value)}
                    className={`min-h-11 rounded-xl px-2 text-xs font-black transition-colors sm:text-sm ${
                      filter === value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </SurfaceCard>
          </section>
        )}

        {isLoading ? (
          <SurfaceCard className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <LoaderCircle
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm font-bold text-foreground">
              نجهز طلباتك
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              لحظات ونظهر لك آخر المستجدات.
            </p>
          </SurfaceCard>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="تعذر تحميل الطلبات"
            description="حدثت مشكلة مؤقتة أثناء جلب بياناتك. حاول مرة أخرى."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"
              >
                إعادة المحاولة
              </button>
            }
          />
        ) : safeRequests.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="لا توجد طلبات بعد"
            description={
              isProvider
                ? "لم تتلقَّ أي طلبات عمل بعد. ستظهر الطلبات الجديدة هنا."
                : "لم تقم بطلب أي خدمة بعد. ستظهر طلباتك الجديدة هنا."
            }
          />
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="لا توجد طلبات في هذا التصنيف"
            description="غيّر التصفية لرؤية بقية طلباتك."
          />
        ) : (
          <section>
            <SectionHeading
              title={
                filter === "completed"
                  ? "الطلبات المكتملة"
                  : filter === "active"
                    ? "الطلبات النشطة"
                    : "كل الطلبات"
              }
              description="اضغط على أي طلب لعرض تفاصيله."
            />
            <div className="space-y-3">
              {visibleRequests.map(request => {
                const config =
                  statusConfig[request.status] ?? statusConfig.pending;
                const StatusIcon = config.icon;
                const otherName = isProvider
                  ? request.clientName
                  : request.providerName;
                const otherAvatar = isProvider
                  ? request.clientAvatarUrl
                  : request.providerAvatarUrl;

                return (
                  <Link key={request.id} href={`/my-requests/${request.id}`}>
                    <article className="group app-surface-card overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/20 px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${config.color}`}
                          >
                            <StatusIcon
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {config.label}
                          </Badge>
                          <h3 className="mt-3 truncate text-base font-black text-foreground sm:text-lg">
                            {request.serviceType}
                          </h3>
                          {request.createdAt && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock3
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {format(
                                new Date(request.createdAt),
                                "dd MMMM yyyy - hh:mm a",
                                { locale: ar }
                              )}
                            </p>
                          )}
                        </div>
                        {request.isImmediate && (
                          <Badge className="shrink-0 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-black text-destructive-foreground hover:bg-destructive/90">
                            عاجل
                          </Badge>
                        )}
                      </div>
                      <div className="flex min-h-[76px] items-center gap-3 px-4 py-4 sm:px-5">
                        <Avatar className="h-11 w-11 shrink-0 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={otherAvatar || ""}
                            alt={otherName || ""}
                          />
                          <AvatarFallback className="bg-primary/10 font-black text-primary">
                            {otherName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-muted-foreground">
                            {isProvider ? "طالب الخدمة" : "المهني"}
                          </p>
                          <p className="truncate text-sm font-black text-foreground sm:text-base">
                            {otherName || "غير محدد"}
                          </p>
                        </div>
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"
                          aria-hidden="true"
                        >
                          <span className="text-lg leading-none">←</span>
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </AppPage>
    </div>
  );
}
