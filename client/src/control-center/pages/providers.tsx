import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  Clock3,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type VerificationRequest = {
  id: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  provider: {
    id: number;
    name: string;
    phone: string;
    city: string | null;
    categoryId: number | null;
    specialty: string | null;
    bio: string | null;
    yearsExperience: number | null;
  };
  documents: {
    type: string;
    objectPath: string;
    originalName: string;
    url: string;
  }[];
};

type CategoryChangeRequest = {
  id: number;
  status: "pending";
  submittedAt: string;
  currentCategoryName: string;
  currentSpecialty: string | null;
  requestedCategoryName: string;
  requestedSpecialty: string;
  provider: {
    id: number;
    name: string;
    phone: string;
    city: string | null;
    district: string | null;
  };
};

type ReviewTab = "verification" | "specialty";
const statusLabel = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
} as const;

function RequestMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 text-xs leading-5 text-muted-foreground">{children}</p>
  );
}

export default function AdminProviders() {
  const { toast } = useToast();
  const [tab, setTab] = useState<ReviewTab>("verification");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<
    CategoryChangeRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/provider-verifications");
      setRequests(data.requests ?? []);
    } catch (error) {
      toast({
        title: "تعذر تحميل طلبات التوثيق",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCategoryChanges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/provider-category-changes");
      setCategoryRequests(data.requests ?? []);
    } catch (error) {
      toast({
        title: "تعذر تحميل طلبات تغيير التخصص",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "verification") void loadVerifications();
    else void loadCategoryChanges();
  }, [tab, loadVerifications, loadCategoryChanges]);

  async function updateVerificationStatus(
    id: number,
    status: "approved" | "rejected"
  ) {
    setUpdating(id);
    try {
      await apiRequest(`/admin/provider-verifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({
        title:
          status === "approved" ? "تم اعتماد المهني" : "تم رفض طلب التوثيق",
      });
      await loadVerifications();
    } catch (error) {
      toast({
        title: "تعذر تحديث الطلب",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  async function reviewCategoryChange(
    id: number,
    status: "approved" | "rejected"
  ) {
    if (status === "rejected" && rejectionReason.trim().length < 5) {
      toast({
        title: "أدخل سبب الرفض",
        description: "يجب أن يتكون السبب من خمسة أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }
    setUpdating(id);
    try {
      await apiRequest(`/admin/provider-category-changes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(status === "rejected"
            ? { rejectionReason: rejectionReason.trim() }
            : {}),
        }),
      });
      toast({
        title:
          status === "approved"
            ? "تم اعتماد المجال والتخصص الجديدين"
            : "تم رفض طلب تغيير التخصص",
      });
      setRejectingId(null);
      setRejectionReason("");
      await loadCategoryChanges();
    } catch (error) {
      toast({
        title: "تعذر حفظ قرار المراجعة",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  const refresh =
    tab === "verification" ? loadVerifications : loadCategoryChanges;

  return (
    <div dir="rtl" className="min-h-full">
      <AppPage width="wide">
        <PageHeading
          eyebrow="مركز الإدارة"
          title="إدارة ملفات المهنيين"
          description="راجع مستندات التوثيق وطلبات تغيير المجال والتخصص قبل اعتمادها."
          action={
            <Button
              variant="outline"
              className="min-h-11 rounded-xl bg-card"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw
                className={`ml-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          }
        />

        <SurfaceCard className="mb-7 p-2">
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="tablist"
            aria-label="نوع الطلبات"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "verification"}
              onClick={() => setTab("verification")}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-colors ${tab === "verification" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              طلبات التوثيق
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "specialty"}
              onClick={() => {
                setRejectingId(null);
                setRejectionReason("");
                setTab("specialty");
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-colors ${tab === "specialty" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              طلبات تغيير التخصص
              {categoryRequests.length > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${tab === "specialty" ? "bg-primary-foreground/15 text-primary-foreground" : "bg-accent/25 text-foreground"}`}
                >
                  {categoryRequests.length}
                </span>
              )}
            </button>
          </div>
        </SurfaceCard>

        {loading ? (
          <div className="grid gap-4" aria-label="جارٍ تحميل الطلبات">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-3xl border border-border bg-card/70"
              />
            ))}
          </div>
        ) : tab === "verification" ? (
          <section aria-labelledby="verification-heading">
            <SectionHeading
              title="طلبات التوثيق"
              description="تحقق من بيانات المهني ومستنداته قبل منح شارة الاعتماد."
              className="mb-4"
            />
            {requests.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="لا توجد طلبات توثيق حتى الآن"
                description="ستظهر الطلبات الجديدة هنا عند إرسال مهني ملفه للمراجعة."
              />
            ) : (
              <div className="space-y-4">
                {requests.map(item => (
                  <SurfaceCard
                    key={item.id}
                    as="article"
                    className="overflow-hidden"
                  >
                    <div className="border-b border-border px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black text-foreground">
                              {item.provider.name}
                            </h2>
                            <Badge
                              variant="outline"
                              className={
                                item.status === "approved"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : item.status === "rejected"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                              }
                            >
                              {item.status === "approved" ? (
                                <ShieldCheck className="ml-1 h-3.5 w-3.5" />
                              ) : (
                                <ShieldAlert className="ml-1 h-3.5 w-3.5" />
                              )}
                              {statusLabel[item.status]}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.provider.phone}{" "}
                            <span className="mx-1 text-border">·</span>{" "}
                            {item.provider.city || "الموقع غير محدد"}{" "}
                            <span className="mx-1 text-border">·</span>{" "}
                            {item.provider.specialty || "التخصص غير محدد"}
                          </p>
                          <RequestMeta>
                            رقم الطلب #{item.id} ·{" "}
                            {new Date(item.submittedAt).toLocaleString("ar-YE")}
                          </RequestMeta>
                        </div>
                        {item.status === "pending" && (
                          <div className="grid grid-cols-2 gap-2 sm:flex">
                            <Button
                              className="min-h-11 rounded-xl"
                              onClick={() =>
                                void updateVerificationStatus(
                                  item.id,
                                  "approved"
                                )
                              }
                              disabled={updating === item.id}
                            >
                              {updating === item.id ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="ml-2 h-4 w-4" />
                              )}
                              اعتماد
                            </Button>
                            <Button
                              className="min-h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                              variant="outline"
                              onClick={() =>
                                void updateVerificationStatus(
                                  item.id,
                                  "rejected"
                                )
                              }
                              disabled={updating === item.id}
                            >
                              <ShieldAlert className="ml-2 h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4 px-5 py-5 sm:px-6">
                      <div className="rounded-2xl bg-muted/45 px-4 py-3.5 text-sm leading-7">
                        <b>النبذة:</b> {item.provider.bio || "لا توجد نبذة"}
                        <span className="mx-2 text-muted-foreground">•</span>
                        <b>الخبرة:</b> {item.provider.yearsExperience ?? 0}{" "}
                        سنوات
                      </div>
                      <div
                        className="flex flex-wrap gap-2"
                        aria-label="مستندات الطلب"
                      >
                        {item.documents.map(document => (
                          <a
                            key={`${item.id}-${document.objectPath}`}
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-extrabold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-primary">
                              {document.type === "portfolio" ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </span>
                            {document.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section aria-labelledby="specialty-heading">
            <SectionHeading
              title="طلبات تغيير التخصص"
              description="قارن المجال الحالي بالتغيير المطلوب، ثم اتخذ قرارًا واضحًا للمهني."
              className="mb-4"
            />
            {categoryRequests.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="لا توجد طلبات تغيير تخصص"
                description="لا توجد طلبات قيد المراجعة في الوقت الحالي."
              />
            ) : (
              <div className="space-y-4">
                {categoryRequests.map(item => (
                  <SurfaceCard
                    key={item.id}
                    as="article"
                    className="overflow-hidden border-amber-200/80"
                  >
                    <div className="border-b border-border px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black text-foreground">
                              {item.provider.name}
                            </h2>
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-800"
                            >
                              <Clock3 className="ml-1 h-3.5 w-3.5" />
                              قيد المراجعة
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.provider.phone}{" "}
                            <span className="mx-1 text-border">·</span>{" "}
                            {item.provider.city || "الموقع غير محدد"}
                            {item.provider.district
                              ? ` · ${item.provider.district}`
                              : ""}
                          </p>
                          <RequestMeta>
                            طلب #{item.id} ·{" "}
                            {new Date(item.submittedAt).toLocaleString("ar-YE")}
                          </RequestMeta>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                          <Button
                            className="min-h-11 rounded-xl"
                            onClick={() =>
                              void reviewCategoryChange(item.id, "approved")
                            }
                            disabled={updating === item.id}
                          >
                            <ShieldCheck className="ml-1 h-4 w-4" />
                            اعتماد التغيير
                          </Button>
                          <Button
                            className="min-h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                            variant="outline"
                            onClick={() => {
                              setRejectingId(
                                rejectingId === item.id ? null : item.id
                              );
                              setRejectionReason("");
                            }}
                            disabled={updating === item.id}
                          >
                            <ShieldAlert className="ml-1 h-4 w-4" />
                            رفض مع سبب
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-5 sm:px-6">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <div className="rounded-2xl border border-border bg-muted/35 p-4">
                          <p className="text-xs font-extrabold text-muted-foreground">
                            التخصص الحالي
                          </p>
                          <p className="mt-1.5 font-black text-foreground">
                            {item.currentCategoryName}{" "}
                            <span className="text-muted-foreground">/</span>{" "}
                            {item.currentSpecialty || "غير محدد"}
                          </p>
                        </div>
                        <ArrowLeftRight
                          className="mx-auto hidden h-5 w-5 text-primary sm:block"
                          aria-hidden="true"
                        />
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                          <p className="text-xs font-extrabold text-primary">
                            التغيير المطلوب
                          </p>
                          <p className="mt-1.5 font-black text-foreground">
                            {item.requestedCategoryName}{" "}
                            <span className="text-muted-foreground">/</span>{" "}
                            {item.requestedSpecialty}
                          </p>
                        </div>
                      </div>
                      {rejectingId === item.id && (
                        <div className="mt-4 space-y-3 rounded-2xl border border-red-100 bg-red-50/70 p-4">
                          <label className="block space-y-2 text-sm font-extrabold text-red-900">
                            سبب رفض التغيير
                            <Textarea
                              value={rejectionReason}
                              onChange={event =>
                                setRejectionReason(event.target.value)
                              }
                              maxLength={2000}
                              rows={3}
                              placeholder="اكتب ملاحظة واضحة للمهني حول سبب الرفض أو ما يجب تعديله..."
                              className="min-h-24 w-full resize-y rounded-xl border-red-200 bg-white text-sm font-normal text-foreground focus-visible:ring-red-300"
                            />
                          </label>
                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                              className="min-h-11 rounded-xl"
                              variant="outline"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason("");
                              }}
                              disabled={updating === item.id}
                            >
                              إلغاء
                            </Button>
                            <Button
                              className="min-h-11 rounded-xl bg-red-700 hover:bg-red-800"
                              onClick={() =>
                                void reviewCategoryChange(item.id, "rejected")
                              }
                              disabled={
                                updating === item.id ||
                                rejectionReason.trim().length < 5
                              }
                            >
                              {updating === item.id ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              ) : null}
                              تأكيد الرفض
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            )}
          </section>
        )}
        <div className="mt-7 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-6 text-muted-foreground">
          <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          الموافقة على تغيير التخصص تحدث بيانات المهني النشطة وتُرسل له إشعاراً.
          الرفض يتطلب سبباً يظهر للمهني داخل ملفه.
        </div>
      </AppPage>
    </div>
  );
}
