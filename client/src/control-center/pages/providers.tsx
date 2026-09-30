import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, ShieldAlert, ShieldCheck, FileText, Image as ImageIcon, Clock3, BriefcaseBusiness, ArrowLeftRight } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type VerificationRequest = {
  id: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  provider: { id: number; name: string; phone: string; city: string | null; categoryId: number | null; specialty: string | null; bio: string | null; yearsExperience: number | null };
  documents: { type: string; objectPath: string; originalName: string; url: string }[];
};

type CategoryChangeRequest = {
  id: number;
  status: "pending";
  submittedAt: string;
  currentCategoryName: string;
  currentSpecialty: string | null;
  requestedCategoryName: string;
  requestedSpecialty: string;
  provider: { id: number; name: string; phone: string; city: string | null; district: string | null };
};

type ReviewTab = "verification" | "specialty";
const statusLabel = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" } as const;

export default function AdminProviders() {
  const { toast } = useToast();
  const [tab, setTab] = useState<ReviewTab>("verification");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<CategoryChangeRequest[]>([]);
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
      toast({ title: "تعذر تحميل طلبات التوثيق", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
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
      toast({ title: "تعذر تحميل طلبات تغيير التخصص", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "verification") void loadVerifications();
    else void loadCategoryChanges();
  }, [tab, loadVerifications, loadCategoryChanges]);

  async function updateVerificationStatus(id: number, status: "approved" | "rejected") {
    setUpdating(id);
    try {
      await apiRequest(`/admin/provider-verifications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast({ title: status === "approved" ? "تم اعتماد المهني" : "تم رفض طلب التوثيق" });
      await loadVerifications();
    } catch (error) {
      toast({ title: "تعذر تحديث الطلب", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  }

  async function reviewCategoryChange(id: number, status: "approved" | "rejected") {
    if (status === "rejected" && rejectionReason.trim().length < 5) {
      toast({ title: "أدخل سبب الرفض", description: "يجب أن يتكون السبب من خمسة أحرف على الأقل.", variant: "destructive" });
      return;
    }
    setUpdating(id);
    try {
      await apiRequest(`/admin/provider-category-changes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(status === "rejected" ? { rejectionReason: rejectionReason.trim() } : {}) }),
      });
      toast({ title: status === "approved" ? "تم اعتماد المجال والتخصص الجديدين" : "تم رفض طلب تغيير التخصص" });
      setRejectingId(null);
      setRejectionReason("");
      await loadCategoryChanges();
    } catch (error) {
      toast({ title: "تعذر حفظ قرار المراجعة", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  }

  const isLoading = loading;
  const emptyMessage = tab === "verification" ? "لا توجد طلبات توثيق حتى الآن." : "لا توجد طلبات تغيير تخصص قيد المراجعة.";

  return (
    <div className="space-y-5 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">إدارة ملفات المهنيين</h1>
          <p className="mt-1 text-sm text-muted-foreground">راجع مستندات التوثيق وطلبات تغيير المجال والتخصص قبل اعتمادها.</p>
        </div>
        <Button variant="outline" onClick={() => tab === "verification" ? void loadVerifications() : void loadCategoryChanges()} disabled={isLoading}><RefreshCw className="ml-2 h-4 w-4" />تحديث</Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        <button type="button" onClick={() => setTab("verification")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "verification" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
          <ShieldCheck className="h-4 w-4" />طلبات التوثيق
        </button>
        <button type="button" onClick={() => { setRejectingId(null); setRejectionReason(""); setTab("specialty"); }} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === "specialty" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
          <ArrowLeftRight className="h-4 w-4" />طلبات تغيير التخصص
          {categoryRequests.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">{categoryRequests.length}</span>}
        </button>
      </div>

      {isLoading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div> : tab === "verification" ? (
        requests.length === 0 ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">{emptyMessage}</div> :
          <div className="space-y-4">{requests.map(item => (
            <section key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><h2 className="text-lg font-black">{item.provider.name}</h2><Badge variant="outline" className={item.status === "approved" ? "border-green-200 bg-green-50 text-green-700" : item.status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{item.status === "approved" ? <ShieldCheck className="ml-1 h-3 w-3" /> : <ShieldAlert className="ml-1 h-3 w-3" />}{statusLabel[item.status]}</Badge></div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.provider.phone} · {item.provider.city || "الموقع غير محدد"} · {item.provider.specialty || "التخصص غير محدد"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">رقم الطلب #{item.id} · {new Date(item.submittedAt).toLocaleString("ar-YE")}</p>
                </div>
                {item.status === "pending" && <div className="flex gap-2"><Button size="sm" onClick={() => void updateVerificationStatus(item.id, "approved")} disabled={updating === item.id}>اعتماد</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => void updateVerificationStatus(item.id, "rejected")} disabled={updating === item.id}>رفض</Button></div>}
              </div>
              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm leading-6"><b>النبذة:</b> {item.provider.bio || "لا توجد نبذة"}<span className="mx-2 text-muted-foreground">•</span><b>الخبرة:</b> {item.provider.yearsExperience ?? 0} سنوات</div>
              <div className="mt-4 flex flex-wrap gap-2">{item.documents.map(document => <a key={`${item.id}-${document.objectPath}`} href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary/50">{document.type === "portfolio" ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}{document.originalName}</a>)}</div>
            </section>
          ))}</div>
      ) : categoryRequests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">{categoryRequests.map(item => (
          <section key={item.id} className="rounded-2xl border border-amber-200 bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><h2 className="text-lg font-black">{item.provider.name}</h2><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800"><Clock3 className="ml-1 h-3 w-3" />قيد المراجعة</Badge></div>
                <p className="mt-2 text-sm text-muted-foreground">{item.provider.phone} · {item.provider.city || "الموقع غير محدد"}{item.provider.district ? ` · ${item.provider.district}` : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">طلب #{item.id} · {new Date(item.submittedAt).toLocaleString("ar-YE")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void reviewCategoryChange(item.id, "approved")} disabled={updating === item.id}><ShieldCheck className="ml-1 h-4 w-4" />اعتماد التغيير</Button>
                <Button size="sm" variant="outline" className="text-red-700" onClick={() => { setRejectingId(rejectingId === item.id ? null : item.id); setRejectionReason(""); }} disabled={updating === item.id}><ShieldAlert className="ml-1 h-4 w-4" />رفض مع سبب</Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-bold text-muted-foreground">التخصص الحالي</p><p className="mt-1 font-black">{item.currentCategoryName} <span className="text-muted-foreground">/</span> {item.currentSpecialty || "غير محدد"}</p></div>
              <ArrowLeftRight className="mx-auto hidden h-5 w-5 text-primary sm:block" />
              <div className="rounded-xl bg-primary/5 p-4"><p className="text-xs font-bold text-primary">التغيير المطلوب</p><p className="mt-1 font-black">{item.requestedCategoryName} <span className="text-muted-foreground">/</span> {item.requestedSpecialty}</p></div>
            </div>
            {rejectingId === item.id && (
              <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-red-50/70 p-4">
                <label className="block space-y-2 text-sm font-bold text-red-900">سبب رفض التغيير<Textarea value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} maxLength={2000} rows={3} placeholder="اكتب ملاحظة واضحة للمهني حول سبب الرفض أو ما يجب تعديله..." className="w-full rounded-xl border-red-200 bg-white text-sm font-normal text-foreground focus-visible:ring-red-300" /></label>
                <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { setRejectingId(null); setRejectionReason(""); }} disabled={updating === item.id}>إلغاء</Button><Button size="sm" className="bg-red-700 hover:bg-red-800" onClick={() => void reviewCategoryChange(item.id, "rejected")} disabled={updating === item.id || rejectionReason.trim().length < 5}>{updating === item.id ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}تأكيد الرفض</Button></div>
              </div>
            )}
          </section>
        ))}</div>
      )}
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><BriefcaseBusiness className="ml-1 inline h-3.5 w-3.5" />الموافقة على تغيير التخصص تحدث بيانات المهني النشطة وتُرسل له إشعاراً. الرفض يتطلب سبباً يظهر للمهني داخل ملفه.</div>
    </div>
  );
}
