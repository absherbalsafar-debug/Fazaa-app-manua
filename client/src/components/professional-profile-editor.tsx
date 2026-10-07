import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, BriefcaseBusiness, Clock3, Loader2, LockKeyhole, MapPin, Save, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type RequestStatus = "pending" | "approved" | "rejected";
type Category = { id: number; name: string; icon: string; specialties: string[] };
type CategoryChangeRequest = {
  status: RequestStatus;
  requestedCategoryId?: number;
  requestedSpecialty: string;
  rejectionReason?: string | null;
  submittedAt?: string | Date | null;
};

type ProviderProfile = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  governorate?: string | null;
  district?: string | null;
  whatsapp?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  specialty?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  verificationStatus?: RequestStatus | null;
  verificationRejectionReason?: string | null;
  categoryChangeRequest?: CategoryChangeRequest | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: ProviderProfile | null;
  onSaved: () => void | Promise<void>;
};

const fieldClass = "h-11 rounded-xl border-border bg-background";

export function ProfessionalProfileEditor({ open, onOpenChange, profile, onSaved }: Props) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    if (!open) return;
    setCity(profile?.city ?? "");
    setGovernorate(profile?.governorate ?? "");
    setDistrict(profile?.district ?? "");
    setWhatsapp(profile?.whatsapp ?? "");
    setBio(profile?.bio ?? "");
    setYearsExperience(String(profile?.yearsExperience ?? 0));
    setCategoryId(profile?.categoryId ? String(profile.categoryId) : "");
    setSpecialty(profile?.specialty ?? "");
  }, [open, profile]);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    let cancelled = false;
    setCategoriesLoading(true);
    void apiRequest("/categories")
      .then((result: Category[]) => { if (!cancelled) setCategories(Array.isArray(result) ? result : []); })
      .catch((error) => {
        if (!cancelled) toast({ title: "تعذر تحميل قائمة التخصصات", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
      })
      .finally(() => { if (!cancelled) setCategoriesLoading(false); });
    return () => { cancelled = true; };
  }, [open, categories.length, toast]);

  const selectedCategory = useMemo(() => categories.find(item => item.id === Number(categoryId)), [categories, categoryId]);
  const legacyCurrentSpecialty = profile && selectedCategory && profile.categoryId === selectedCategory.id && profile.specialty && !selectedCategory.specialties.includes(profile.specialty)
    ? profile.specialty
    : null;
  const categoryRequest = profile?.categoryChangeRequest ?? null;
  const pendingCategoryRequest = categoryRequest?.status === "pending";
  const verificationRejected = profile?.verificationStatus === "rejected";
  const categoryChanged = Number(categoryId) !== (profile?.categoryId ?? 0) || specialty.trim() !== (profile?.specialty ?? "").trim();

  function changeCategory(value: string) {
    setCategoryId(value);
    setSpecialty("");
  }

  async function save() {
    const years = Number(yearsExperience);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      toast({ title: "قيمة الخبرة غير صحيحة", description: "أدخل عدداً من 0 إلى 60 سنة.", variant: "destructive" });
      return;
    }
    if (whatsapp.trim() && !/^\d{7,9}$/.test(whatsapp.trim())) {
      toast({ title: "رقم واتساب غير صحيح", description: "أدخل رقمًا من 7 إلى 9 أرقام.", variant: "destructive" });
      return;
    }
    if (bio.trim().length > 1200) {
      toast({ title: "النبذة طويلة", description: "الحد الأقصى للنبذة 1200 حرف.", variant: "destructive" });
      return;
    }
    if (categoryChanged && !pendingCategoryRequest && (!selectedCategory || !specialty || !selectedCategory.specialties.includes(specialty))) {
      toast({ title: "أكمل اختيار التخصص", description: "اختر المجال والتخصص الفرعي من القوائم.", variant: "destructive" });
      return;
    }

    const body: Record<string, unknown> = {
      city: city.trim(),
      governorate: governorate.trim(),
      district: district.trim(),
      whatsapp: whatsapp.trim(),
      bio: bio.trim(),
      yearsExperience: years,
    };
    if (categoryChanged && !pendingCategoryRequest) {
      body.categoryId = Number(categoryId);
      body.specialty = specialty;
    }

    setSaving(true);
    try {
      const result = await apiRequest("/providers/me/profile", { method: "PATCH", body: JSON.stringify(body) });
      await onSaved();
      onOpenChange(false);
      const submittedRequest = result?.categoryChangeRequest?.status === "pending";
      toast({
        title: submittedRequest ? "تم إرسال طلب تغيير التخصص" : "تم تحديث الملف الشخصي",
        description: submittedRequest
          ? "سيبقى تخصصك الحالي ظاهراً حتى تراجع الإدارة الطلب."
          : "حُفظت بياناتك بنجاح.",
      });
    } catch (error) {
      toast({ title: "تعذر حفظ الملف الشخصي", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const requestStatusMessage = categoryRequest?.status === "pending"
    ? "طلب تغيير المجال والتخصص قيد مراجعة الإدارة. سيظل تخصصك الحالي معروضاً إلى حين صدور القرار."
    : categoryRequest?.status === "rejected"
      ? `رُفض الطلب السابق${categoryRequest.rejectionReason ? `: ${categoryRequest.rejectionReason}` : ". يمكنك تقديم طلب جديد."}`
      : categoryRequest?.status === "approved"
        ? "اعتمدت الإدارة آخر طلب تغيير تخصص، وتم تحديث بياناتك المهنية."
        : "أي تغيير في المجال أو التخصص يُرسل إلى الإدارة للموافقة قبل تحديث ظهوره للعملاء.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto rounded-[28px] border-0 bg-[#f8f9fb] p-0 shadow-2xl" dir="rtl">
        <div className="rounded-t-[28px] bg-gradient-to-l from-[#152b50] to-[#254879] px-6 pb-6 pt-7 text-white">
          <DialogHeader className="text-right">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#F5B335]"><UserRound className="h-5 w-5" /></div>
            <DialogTitle className="text-xl font-black text-white">الملف المهني</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-white/75">راجع بياناتك وحدث معلوماتك المهنية من مكان واحد.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-foreground"><LockKeyhole className="h-4 w-4 text-primary" />بيانات الحساب الثابتة</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold text-muted-foreground">الاسم المسجل
                <Input value={profile?.name ?? ""} readOnly className={`${fieldClass} bg-muted/50 font-bold text-foreground`} />
              </label>
              <label className="space-y-1.5 text-xs font-bold text-muted-foreground">رقم تسجيل الدخول
                <Input value={profile?.phone ?? ""} readOnly dir="ltr" className={`${fieldClass} bg-muted/50 text-left font-bold text-foreground`} />
              </label>
              {profile?.email && <label className="space-y-1.5 text-xs font-bold text-muted-foreground sm:col-span-2">البريد الإلكتروني
                <Input value={profile.email} readOnly dir="ltr" className={`${fieldClass} bg-muted/50 text-left text-foreground`} />
              </label>}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-muted-foreground"><LockKeyhole className="h-3 w-3 shrink-0" />لا يمكن تعديل الاسم أو رقم تسجيل الدخول حفاظاً على موثوقية الحساب.</p>
          </section>

          {verificationRejected && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <div className="flex items-center gap-2 font-black"><AlertCircle className="h-4 w-4" />طلب التوثيق يحتاج إلى استكمال</div>
              <p className="mt-2 leading-6">{profile?.verificationRejectionReason || "راجِع مستنداتك وأعد إرسال طلب التوثيق."}</p>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black"><MapPin className="h-4 w-4 text-primary" />موقع الخدمة والتواصل</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold">المدينة<Input value={city} onChange={event => setCity(event.target.value)} maxLength={120} placeholder="مثال: صنعاء" className={fieldClass} /></label>
              <label className="space-y-1.5 text-xs font-bold">المحافظة<Input value={governorate} onChange={event => setGovernorate(event.target.value)} maxLength={120} placeholder="المحافظة" className={fieldClass} /></label>
              <label className="space-y-1.5 text-xs font-bold">الحي أو المنطقة<Input value={district} onChange={event => setDistrict(event.target.value)} maxLength={120} placeholder="الحي أو المنطقة" className={fieldClass} /></label>
              <label className="space-y-1.5 text-xs font-bold">رقم واتساب<Input value={whatsapp} onChange={event => setWhatsapp(event.target.value.replace(/\D/g, "").slice(0, 9))} inputMode="numeric" dir="ltr" placeholder="777000000" className={`${fieldClass} text-left`} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black"><BriefcaseBusiness className="h-4 w-4 text-primary" />المعلومات المهنية</div>
            <div className="space-y-3">
              <label className="block space-y-1.5 text-xs font-bold">نبذة مهنية
                <Textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={1200} rows={4} placeholder="عرّف العملاء بخبرتك ونوعية الخدمات التي تقدمها..." className="resize-y rounded-xl border-border bg-background leading-6" />
                <span className="block text-left font-normal text-muted-foreground">{bio.length}/1200</span>
              </label>
              <label className="block space-y-1.5 text-xs font-bold">سنوات الخبرة
                <div className="relative"><Clock3 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={yearsExperience} onChange={event => setYearsExperience(event.target.value)} type="number" min={0} max={60} className={`${fieldClass} pr-10`} /></div>
              </label>

              <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black"><ShieldCheck className="h-4 w-4 text-primary" />المجال والتخصص</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold">المجال
                    <select value={categoryId} disabled={categoriesLoading || pendingCategoryRequest} onChange={event => changeCategory(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50">
                      <option value="">{categoriesLoading ? "جارٍ تحميل المجالات..." : "اختر المجال"}</option>
                      {categories.map(item => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-bold">التخصص الفرعي
                    <select value={specialty} disabled={!selectedCategory || pendingCategoryRequest} onChange={event => setSpecialty(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50">
                      <option value="">اختر التخصص</option>
                      {legacyCurrentSpecialty && <option value={legacyCurrentSpecialty}>{legacyCurrentSpecialty} (التخصص الحالي)</option>}
                      {selectedCategory?.specialties.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                </div>
                {categoryRequest && (
                  <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs leading-5 ${categoryRequest.status === "pending" ? "bg-amber-50 text-amber-900" : categoryRequest.status === "rejected" ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}`}>
                    {categoryRequest.status === "pending" ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> : categoryRequest.status === "approved" ? <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{requestStatusMessage}</span>
                  </div>
                )}
                {!categoryRequest && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{requestStatusMessage}</p>}
                {categoryChanged && !pendingCategoryRequest && selectedCategory && specialty && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">سيُرسل طلب تغيير المجال والتخصص إلى الإدارة؛ لن يتغير ما يظهر للعملاء قبل الموافقة.</p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 pb-1 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 flex-1 rounded-xl">إلغاء</Button>
            <Button type="button" onClick={() => void save()} disabled={saving || categoriesLoading} className="h-11 flex-[1.4] rounded-xl bg-primary font-bold text-white">
              {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
