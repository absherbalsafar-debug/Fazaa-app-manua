import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldBan,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { useToast } from "@/hooks/use-toast";

type Complaint = {
  id: number;
  clientName: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  providerId: number;
  evidence: Array<{ id: number; objectPath: string; originalName: string }>;
};

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("fazaah_token");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => null))?.error ?? "تعذر تنفيذ العملية"
    );
  return response.json();
}

const statusLabels: Record<string, string> = {
  under_review: "قيد المراجعة",
  resolved: "تم الحل",
  open: "مفتوحة",
  pending: "معلقة",
};
const priorityLabels: Record<string, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

export default function AdminComplaints() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const load = () => {
    setLoading(true);
    setError("");
    request("/admin/complaints")
      .then(setItems)
      .catch(error => {
        const message =
          error instanceof Error ? error.message : "حاول مرة أخرى بعد قليل";
        setError(message);
        toast({
          title: "تعذر تحميل الشكاوى",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const update = async (id: number, data: Record<string, unknown>) => {
    try {
      await request(`/admin/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      toast({ title: "تم تحديث الشكوى" });
      load();
    } catch (error) {
      toast({
        title: "تعذر التحديث",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  return (
    <AppPage width="wide" className="space-y-7">
      <PageHeading
        eyebrow="مركز الإدارة / حماية العملاء"
        title="الشكاوى والنزاعات"
        description="راجع الأدلة واحمِ العملاء واتخذ إجراءً موثقًا ضد المهنيين."
        action={
          <Button
            variant="outline"
            className="min-h-11 rounded-xl"
            onClick={load}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <SurfaceCard className="overflow-hidden border-primary/10 bg-gradient-to-l from-primary/[0.06] via-card to-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <SectionHeading
              title="مراجعة عادلة وموثقة"
              description="اطّلع على تفاصيل البلاغ والأدلة قبل اتخاذ أي إجراء على حساب المهني."
              className="mb-0"
            />
          </div>
        </div>
      </SurfaceCard>

      <section>
        <SectionHeading
          title="البلاغات الواردة"
          description={
            items.length
              ? `${items.length} ${items.length === 1 ? "شكوى مسجلة" : "شكاوى مسجلة"}`
              : "تابع الحالات التي تحتاج إلى مراجعة"
          }
        />
        {loading ? (
          <SurfaceCard className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-bold text-muted-foreground">
              جارٍ تحميل الشكاوى…
            </p>
          </SurfaceCard>
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="تعذر تحميل الشكاوى"
            description={error}
            action={
              <Button className="min-h-11 rounded-xl" onClick={load}>
                <RefreshCw className="ml-2 h-4 w-4" />
                المحاولة مجددًا
              </Button>
            }
          />
        ) : !items.length ? (
          <EmptyState
            icon={CheckCircle2}
            title="لا توجد شكاوى مسجلة"
            description="ستظهر البلاغات الجديدة هنا لمراجعتها واتخاذ الإجراء المناسب."
          />
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <SurfaceCard key={item.id} as="article" className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold tracking-wide text-muted-foreground">
                        بلاغ #{item.id}
                      </span>
                      <Badge
                        className="rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary"
                        variant="outline"
                      >
                        {statusLabels[item.status] ?? item.status}
                      </Badge>
                      <Badge
                        className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800"
                        variant="outline"
                      >
                        أولوية {priorityLabels[item.priority] ?? item.priority}
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-black leading-8 text-foreground sm:text-xl">
                      {item.subject}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-primary/70" />
                        العميل: {item.clientName}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ShieldBan className="h-4 w-4 text-primary/70" />
                        المهني: #{item.providerId}
                      </span>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto xl:min-w-[430px]">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 rounded-xl"
                      onClick={() =>
                        update(item.id, { status: "under_review" })
                      }
                    >
                      قيد المراجعة
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() =>
                        update(item.id, {
                          suspendProvider: true,
                          status: "resolved",
                          resolutionNote:
                            "تم إيقاف المهني مؤقتًا لحماية العملاء",
                        })
                      }
                    >
                      <ShieldBan className="ml-1 h-4 w-4" />
                      إيقاف مؤقت
                    </Button>
                    <Button
                      size="sm"
                      className="min-h-11 rounded-xl bg-green-600 hover:bg-green-700"
                      onClick={() => update(item.id, { status: "resolved" })}
                    >
                      <CheckCircle2 className="ml-1 h-4 w-4" />
                      حل الشكوى
                    </Button>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-border/70 bg-muted/45 p-4 sm:p-5">
                  <p className="text-sm leading-7 text-foreground/85">
                    {item.description}
                  </p>
                </div>
                {item.evidence?.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-extrabold text-muted-foreground">
                      الأدلة المرفقة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.evidence.map(file => (
                        <a
                          key={file.id}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.03] px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
                          href={`/api/storage/objects/${file.objectPath.replace(/^\/objects\//, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileText className="h-4 w-4" />
                          عرض الدليل: {file.originalName || "ملف"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </AppPage>
  );
}
