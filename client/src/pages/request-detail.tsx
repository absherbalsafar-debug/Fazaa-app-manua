import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlignLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  PlayCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useGetRequest, useUpdateRequest } from "@/lib/api-client-react";
import { ServiceRequestUpdateStatus } from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AppPage,
  EmptyState,
  PageHeading,
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
    icon: LoaderCircle,
  },
  completed: {
    label: "مكتمل",
    color: "border-green-200 bg-green-50 text-green-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "مرفوض",
    color: "border-red-200 bg-red-50 text-red-800",
    icon: X,
  },
  cancelled: {
    label: "ملغي",
    color: "border-border bg-muted text-muted-foreground",
    icon: AlertCircle,
  },
} as const;

export default function RequestDetail() {
  const [, params] = useRoute("/my-requests/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useGetRequest(id, {
    query: { enabled: !!id, queryKey: ["request", id] },
  });
  const updateMutation = useUpdateRequest();

  const handleUpdateStatus = (status: ServiceRequestUpdateStatus) => {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث حالة الطلب" });
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
        <AppPage
          width="mobile"
          className="flex min-h-[70vh] items-center justify-center"
        >
          <SurfaceCard className="flex w-full flex-col items-center px-6 py-12 text-center">
            <LoaderCircle
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm font-bold">نجهز تفاصيل الطلب</p>
            <p className="mt-1 text-xs text-muted-foreground">
              لحظات ونظهر لك كل المعلومات.
            </p>
          </SurfaceCard>
        </AppPage>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
        <AppPage
          width="mobile"
          className="flex min-h-[70vh] items-center justify-center"
        >
          <EmptyState
            icon={AlertCircle}
            title={isError ? "تعذر تحميل الطلب" : "لم يتم العثور على الطلب"}
            description={
              isError
                ? "حدثت مشكلة مؤقتة أثناء جلب التفاصيل. حاول مرة أخرى."
                : "قد يكون الطلب غير متاح أو لم يعد موجودًا."
            }
            action={
              isError ? (
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"
                >
                  إعادة المحاولة
                </button>
              ) : (
                <Link href="/my-requests">
                  <Button className="min-h-11 rounded-2xl px-5 font-black">
                    العودة إلى طلباتي
                  </Button>
                </Link>
              )
            }
          />
        </AppPage>
      </div>
    );
  }

  const isProvider = user?.role === "provider";
  const otherName = isProvider ? request.clientName : request.providerName;
  const otherAvatar = isProvider
    ? request.clientAvatarUrl
    : request.providerAvatarUrl;
  const config = statusConfig[request.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  const isUpdating = updateMutation.isPending;

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/my-requests">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl"
              aria-label="العودة إلى طلباتي"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="flex-1 text-sm font-black sm:text-base">
            تفاصيل الطلب
          </h1>
          <Badge
            variant="outline"
            className={`gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${config.color}`}
          >
            <StatusIcon
              className={`h-3.5 w-3.5 ${request.status === "in_progress" ? "animate-pulse" : ""}`}
              aria-hidden="true"
            />
            {config.label}
          </Badge>
        </div>
      </div>

      <AppPage
        width="content"
        className="app-stage premium-surface space-y-6 pt-6 sm:pt-8"
      >
        <PageHeading
          eyebrow={`الطلب رقم #${request.id}`}
          title={request.serviceType}
          description={
            request.createdAt
              ? `أُرسل في ${format(new Date(request.createdAt), "dd MMMM yyyy - hh:mm a", { locale: ar })}`
              : "تفاصيل الخدمة المطلوبة"
          }
          className="mb-0"
        />

        <SurfaceCard className="relative overflow-hidden border-primary/10 p-5 sm:p-6">
          <div
            className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-card shadow-md sm:h-20 sm:w-20">
              <AvatarImage
                src={otherAvatar || ""}
                alt={otherName || ""}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-xl font-black text-primary sm:text-2xl">
                {otherName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground">
                {isProvider ? "طالب الخدمة" : "المهني"}
              </p>
              <p className="mt-1 truncate text-lg font-black text-foreground sm:text-xl">
                {otherName || "غير محدد"}
              </p>
              {!isProvider && request.providerCategoryName && (
                <p className="mt-1 text-sm font-bold text-primary">
                  {request.providerCategoryName}
                </p>
              )}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border/70 pb-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                الخدمة المطلوبة
              </p>
              <h2 className="mt-1 text-lg font-black text-foreground">
                {request.serviceType}
              </h2>
            </div>
            {request.isImmediate && (
              <Badge className="shrink-0 rounded-full bg-destructive px-3 py-1 text-xs font-black text-destructive-foreground hover:bg-destructive/90">
                عاجل
              </Badge>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <AlignLeft className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-muted-foreground">
                  الوصف
                </p>
                <p className="mt-1.5 text-sm leading-7 text-foreground">
                  {request.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-muted-foreground">
                  الموقع
                </p>
                <p className="mt-1.5 text-sm leading-6 text-foreground">
                  {request.city}، {request.district}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-muted-foreground">
                  الموعد
                </p>
                {request.isImmediate ? (
                  <p className="mt-1.5 text-sm font-black text-destructive">
                    عاجل (الآن)
                  </p>
                ) : request.scheduledAt ? (
                  <p className="mt-1.5 text-sm leading-6 text-foreground">
                    {format(
                      new Date(request.scheduledAt),
                      "dd MMMM yyyy - hh:mm a",
                      { locale: ar }
                    )}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    غير محدد
                  </p>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {(isProvider &&
          ["pending", "accepted", "in_progress"].includes(request.status)) ||
        (!isProvider && ["pending", "accepted"].includes(request.status)) ? (
          <SurfaceCard className="p-4 sm:p-5">
            <p className="mb-3 text-sm font-black text-foreground">
              الخطوة التالية
            </p>
            {isProvider && request.status === "pending" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  className="min-h-12 rounded-xl bg-green-600 font-black text-white hover:bg-green-700"
                  onClick={() => handleUpdateStatus("accepted")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  قبول الطلب
                </Button>
                <Button
                  variant="outline"
                  className="min-h-12 rounded-xl border-destructive font-black text-destructive hover:bg-destructive/10"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                  رفض
                </Button>
              </div>
            )}
            {isProvider && request.status === "accepted" && (
              <Button
                className="min-h-12 w-full rounded-xl font-black"
                onClick={() => handleUpdateStatus("in_progress")}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <PlayCircle className="h-5 w-5" />
                )}
                بدء التنفيذ
              </Button>
            )}
            {isProvider && request.status === "in_progress" && (
              <Button
                className="min-h-12 w-full rounded-xl bg-green-600 font-black text-white hover:bg-green-700"
                onClick={() => handleUpdateStatus("completed")}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                إكمال الخدمة
              </Button>
            )}
            {!isProvider &&
              ["pending", "accepted"].includes(request.status) && (
                <Button
                  variant="outline"
                  className="min-h-12 w-full rounded-xl border-destructive font-black text-destructive hover:bg-destructive/10"
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                  إلغاء الطلب
                </Button>
              )}
          </SurfaceCard>
        ) : null}
      </AppPage>
    </div>
  );
}
