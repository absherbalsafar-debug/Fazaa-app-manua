import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock3, FileText, Image as ImageIcon, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type VerificationDecision = { id: number; adminOpenId: string; status: "approved" | "rejected"; note: string | null; createdAt: string };
type VerificationRequest = {
  id: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  provider: { id: number; name: string; phone: string; city: string | null; categoryId: number | null; specialty: string | null; bio: string | null; yearsExperience: number | null };
  documents: { type: string; objectPath: string; originalName: string; url: string }[];
  decisions: VerificationDecision[];
};

const statusLabel = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" } as const;

export default function AdminProviders() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/provider-verifications");
      setRequests(data.requests ?? []);
    } catch (error) {
      toast({ title: "تعذر تحميل طلبات التوثيق", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: number, status: "approved" | "rejected") {
    setUpdating(id);
    try {
      await apiRequest(`/admin/provider-verifications/${id}`, { method: "PATCH", body: JSON.stringify({ status, note: notes[id]?.trim() || undefined }) });
      toast({ title: status === "approved" ? "تم اعتماد المهني" : "تم رفض الطلب" });
      await load();
    } catch (error) {
      toast({ title: "تعذر تحديث الطلب", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally { setUpdating(null); }
  }

  return <div className="space-y-5 p-6" dir="rtl">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-black">طلبات توثيق المهنيين</h1><p className="mt-1 text-sm text-muted-foreground">راجع بيانات المهني والمستندات المرفوعة، ثم اتخذ قراراً محفوظاً في السجل.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="ml-2 h-4 w-4" />تحديث</Button></div>
    {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div> : requests.length === 0 ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">لا توجد طلبات توثيق حتى الآن.</div> : <div className="space-y-4">{requests.map((item) => <section key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-black">{item.provider.name}</h2><Badge variant="outline" className={item.status === "approved" ? "border-green-200 bg-green-50 text-green-700" : item.status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{item.status === "approved" ? <ShieldCheck className="ml-1 h-3 w-3" /> : <ShieldAlert className="ml-1 h-3 w-3" />}{statusLabel[item.status]}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{item.provider.phone} · {item.provider.city || "الموقع غير محدد"} · {item.provider.specialty || "التخصص غير محدد"}</p><p className="mt-1 text-xs text-muted-foreground">رقم الطلب #{item.id} · أُرسل في {new Date(item.submittedAt).toLocaleString("ar-YE")}</p></div>{item.status === "pending" && <div className="flex gap-2"><Button size="sm" onClick={() => void updateStatus(item.id, "approved")} disabled={updating === item.id}>اعتماد</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => void updateStatus(item.id, "rejected")} disabled={updating === item.id}>رفض</Button></div>}</div>
      <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm leading-6"><b>النبذة:</b> {item.provider.bio || "لا توجد نبذة"}<span className="mx-2 text-muted-foreground">•</span><b>الخبرة:</b> {item.provider.yearsExperience ?? 0} سنوات</div>
      {item.status === "pending" && <textarea value={notes[item.id] ?? ""} onChange={(event) => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="ملاحظة القرار (اختيارية، وتظهر في السجل)" className="mt-4 min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />}
      <div className="mt-4 flex flex-wrap gap-2">{item.documents.map((document) => <a key={`${item.id}-${document.objectPath}`} href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary/50">{document.type === "portfolio" ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}{document.originalName}</a>)}</div>
      <div className="mt-5 rounded-2xl border border-border bg-background p-4"><div className="mb-3 flex items-center gap-2 text-sm font-black"><Clock3 className="h-4 w-4 text-primary" />سجل قرارات المراجعة</div>{item.decisions?.length ? <div className="space-y-3">{item.decisions.map((decision) => <div key={decision.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted/35 p-3 text-xs"><div><Badge variant="outline" className={decision.status === "approved" ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}>{decision.status === "approved" ? "قبول" : "رفض"}</Badge>{decision.note && <p className="mt-2 leading-5 text-muted-foreground">{decision.note}</p>}</div><span className="text-muted-foreground">{new Date(decision.createdAt).toLocaleString("ar-YE")}</span></div>)}</div> : <p className="text-xs text-muted-foreground">لم يُسجّل قرار بعد.</p>}</div>
    </section>)}</div>}
  </div>;
}
