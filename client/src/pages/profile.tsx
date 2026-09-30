import { useEffect, useState } from "react";
import { apiRequest, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import {
  LogOut, ShieldCheck, MapPin, ChevronLeft, Settings, Bell,
  Heart, ClipboardList, Phone, Mail, Award,
  TrendingUp, Wallet, Star, Briefcase, Camera, Edit3, Save, X,
  Clock3, AlertCircle, BadgeCheck
} from "lucide-react";
import { useUpdateProvider, useGetMyProvider } from "@/lib/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ProfessionalProfileEditor } from "@/components/professional-profile-editor";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: providerDetails, refetch } = useGetMyProvider({
    query: { enabled: user?.role === 'provider', queryKey: ['my-provider-profile', user?.id], refetchOnMount: "always" }
  });

  const updateProvider = useUpdateProvider();
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileGovernorate, setProfileGovernorate] = useState("");
  const [profileDistrict, setProfileDistrict] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name ?? "");
    setProfileCity(user.city ?? "");
  }, [user]);

  function openProfileEditor() {
    setProfileName(user?.name ?? "");
    setProfileCity(providerDetails?.city ?? user?.city ?? "");
    const profile = providerDetails as typeof providerDetails & { governorate?: string | null; district?: string | null; whatsapp?: string | null };
    setProfileGovernorate(profile?.governorate ?? "");
    setProfileDistrict(profile?.district ?? "");
    setProfileWhatsapp(profile?.whatsapp ?? "");
    setProfileEditorOpen(true);
  }

  async function saveProfile() {
    if (user?.role === "provider") {
      toast({ title: "استخدم محرر الملف المهني", description: "لا يمكن تعديل الاسم أو رقم تسجيل الدخول.", variant: "destructive" });
      return;
    }
    if (profileName.trim().length < 3) {
      toast({ title: "أدخل الاسم الكامل", description: "يجب أن يتكون الاسم من 3 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await apiRequest("/auth/me", { method: "PATCH", body: JSON.stringify({ name: profileName.trim(), city: profileCity.trim(), governorate: profileGovernorate.trim(), district: profileDistrict.trim(), whatsapp: profileWhatsapp.trim() }) });
      updateUser(updated);
      setProfileEditorOpen(false);
      toast({ title: "تم تحديث ملفك الشخصي", description: "حُفظت بياناتك الجديدة بنجاح" });
    } catch (error) {
      toast({ title: "تعذر حفظ البيانات", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  }

  const handleAvailabilityToggle = (checked: boolean) => {
    if (!user || !providerDetails) return;
    updateProvider.mutate(
      { id: providerDetails.id, data: { isAvailable: checked } },
      { onSuccess: () => { toast({ title: "✓ تم تحديث حالة التوفر" }); refetch(); } }
    );
  };

  if (!user) return null;

  const isProvider = user.role === 'provider';
  const providerProfile = providerDetails as (typeof providerDetails & {
    governorate?: string | null;
    country?: string | null;
    email?: string | null;
    verificationStatus?: "pending" | "approved" | "rejected" | null;
    verificationRejectionReason?: string | null;
    providerAccountStatus?: string | null;
    phone?: string | null;
    name?: string | null;
    id?: number;
    categoryChangeRequest?: { status: "pending" | "approved" | "rejected"; requestedSpecialty: string; requestedCategoryName?: string; currentCategoryName?: string; rejectionReason?: string | null; requestedCategoryId?: number } | null;
  }) | undefined;
  const professionallyVerified = Boolean(providerProfile?.isVerified && providerProfile?.providerAccountStatus === "approved" && providerProfile?.verificationStatus === "approved");

  const clientMenu = [
    { icon: ClipboardList, label: "طلباتي", sub: "تتبع حالة طلباتك", href: "/my-requests", color: "bg-blue-50 text-blue-600" },
    { icon: Heart, label: "المفضلة", sub: "المهنيون المحفوظون", href: "/favorites", color: "bg-red-50 text-red-500" },
    { icon: Bell, label: "الإشعارات", sub: "إدارة التنبيهات", href: "/notifications", color: "bg-amber-50 text-amber-600" },
    { icon: Wallet, label: "وسائل الدفع", sub: "بطاقات وأرصدة", href: "/wallet", color: "bg-green-50 text-green-600" },
    { icon: Settings, label: "الإعدادات", sub: "الحساب والأمان", href: "/settings", color: "bg-gray-50 text-gray-600" },
  ];

  const providerMenu = [
    { icon: TrendingUp, label: "إحصائياتي", sub: "الأداء والأرباح", href: "/my-requests", color: "bg-blue-50 text-blue-600" },
    { icon: ClipboardList, label: "الطلبات", sub: "طلبات العملاء", href: "/my-requests", color: "bg-purple-50 text-purple-600" },
    { icon: Wallet, label: "أرباحي", sub: "الرصيد وعمليات السحب", href: "/earnings", color: "bg-green-50 text-green-600" },
    { icon: ShieldCheck, label: "التوثيق", sub: "رفع المستندات", href: "/verify", color: "bg-amber-50 text-amber-600" },
    { icon: Bell, label: "الإشعارات", sub: "تنبيهات الطلبات", href: "/notifications", color: "bg-red-50 text-red-500" },
    { icon: Settings, label: "الإعدادات", sub: "الحساب والأمان", href: "/settings", color: "bg-gray-50 text-gray-600" },
  ];

  const menuItems = isProvider ? providerMenu : clientMenu;

  function handleLogout() {
    const nativeBridge = window as unknown as { FazaaNativeLogout?: { requestLogout: () => void } };
    if (nativeBridge.FazaaNativeLogout) {
      nativeBridge.FazaaNativeLogout.requestLogout();
      return;
    }
    logout();
    navigate('/welcome');
  }

  return (
    <div className="pb-28 bg-background min-h-[100dvh]" dir="rtl">
      {/* ── Hero Header ── */}
      <div className="gradient-primary pt-10 pb-24 px-4 relative overflow-hidden">
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -top-8 -right-4 w-36 h-36 rounded-full bg-white/5" />
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">حسابي</h1>
            <button
              onClick={openProfileEditor}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Settings className="w-4.5 h-4.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-[-5rem] relative z-10 space-y-4">
        {/* ── Profile Card ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-5 border border-border card-shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 rounded-2xl border-4 border-white" style={{ boxShadow: '0 4px 16px rgba(15,32,66,0.15)' }}>
                <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-xl flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              {isProvider && professionallyVerified && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-extrabold text-foreground truncate">{user.name}</h2>
                {isProvider && (
                  <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${professionallyVerified ? "bg-green-50 text-green-700 border-green-200" : providerProfile?.verificationStatus === "pending" ? "bg-amber-50 text-amber-800 border-amber-200" : providerProfile?.verificationStatus === "rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {professionallyVerified ? <BadgeCheck className="w-2.5 h-2.5" /> : providerProfile?.verificationStatus === "pending" ? <Clock3 className="w-2.5 h-2.5" /> : providerProfile?.verificationStatus === "rejected" ? <AlertCircle className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                    {professionallyVerified ? "موثق" : providerProfile?.verificationStatus === "pending" ? "قيد المراجعة" : providerProfile?.verificationStatus === "rejected" ? "بحاجة لاستكمال" : "غير موثق"}
                  </span>
                )}
              </div>
              <span className="inline-block text-xs bg-primary/8 text-primary font-medium px-2 py-0.5 rounded-full mb-2">
                {isProvider ? 'مقدم خدمة' : user.role === 'admin' ? 'مدير' : 'عميل'}
              </span>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span dir="ltr">{user.phone}</span>
                </p>
                {(providerProfile?.email || user.email) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{providerProfile?.email || user.email}</span>
                  </p>
                )}
                {(providerProfile?.city || user.city) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {providerProfile?.city || user.city}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={openProfileEditor}
              className="shrink-0 w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {isProvider ? (
          <ProfessionalProfileEditor
            open={profileEditorOpen}
            onOpenChange={setProfileEditorOpen}
            profile={providerProfile ? { ...providerProfile, id: providerProfile.id ?? user.id, name: providerProfile.name ?? user.name, phone: providerProfile.phone ?? user.phone } : null}
            onSaved={async () => {
              await refetch();
              try { updateUser(await apiRequest("/auth/me")); } catch { /* the profile query remains authoritative */ }
            }}
          />
        ) : profileEditorOpen && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-primary/10 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-foreground">تعديل الملف الشخصي</h2>
                <p className="mt-1 text-xs text-muted-foreground">حدّث بياناتك بسهولة متى شئت</p>
              </div>
              <button type="button" onClick={() => setProfileEditorOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-label="إغلاق"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3">
              <label className="space-y-1.5"><span className="text-xs font-bold">الاسم الكامل</span><Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="اكتب اسمك الكامل" /></label>
              <label className="space-y-1.5"><span className="text-xs font-bold">المدينة</span><Input value={profileCity} onChange={e => setProfileCity(e.target.value)} placeholder="مثال: صنعاء" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5"><span className="text-xs font-bold">المحافظة</span><Input value={profileGovernorate} onChange={e => setProfileGovernorate(e.target.value)} placeholder="المحافظة" /></label>
                <label className="space-y-1.5"><span className="text-xs font-bold">الحي</span><Input value={profileDistrict} onChange={e => setProfileDistrict(e.target.value)} placeholder="الحي" /></label>
              </div>
              <label className="space-y-1.5"><span className="text-xs font-bold">رقم واتساب</span><Input value={profileWhatsapp} onChange={e => setProfileWhatsapp(e.target.value)} inputMode="tel" dir="ltr" placeholder="777000000" /></label>
              <Button type="button" onClick={saveProfile} disabled={profileSaving} className="h-11 rounded-xl bg-primary font-bold"><Save className="ml-2 h-4 w-4" />{profileSaving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</Button>
            </div>
          </motion.div>
        )}

        {/* ── Provider Stats / Client Stats ── */}
        {isProvider && providerDetails ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-border card-shadow overflow-hidden"
          >
            {/* Availability toggle */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${providerDetails.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-bold">{providerDetails.isAvailable ? 'متاح للعمل' : 'غير متاح'}</p>
                  <p className="text-xs text-muted-foreground">استقبال طلبات جديدة</p>
                </div>
              </div>
              <Switch
                checked={providerDetails.isAvailable}
                onCheckedChange={handleAvailabilityToggle}
              />
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 divide-x divide-border rtl:divide-x-reverse">
              {[
                { icon: Star, label: "التقييم", value: providerDetails.rating?.toFixed(1) ?? "—", sub: `من ٥` },
                { icon: Briefcase, label: "مشاريع", value: `${providerDetails.completedJobs}`, sub: "منجزة" },
                { icon: Award, label: "الخبرة", value: `${providerDetails.yearsExperience}`, sub: "سنوات" },
                { icon: TrendingUp, label: "المراجعات", value: `${providerDetails.reviewCount}`, sub: "تقييم" },
              ].map((s) => (
                <div key={s.label} className="p-3 text-center">
                  <p className="text-base font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 px-4 py-3">
              <p className="text-sm font-bold">المجال والتخصص</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 font-bold text-primary">{providerDetails.categoryName || "لم يحدد المجال"}</span>
                <span className="text-muted-foreground">←</span>
                <span className="rounded-full bg-accent/20 px-3 py-1.5 font-bold text-amber-800">{(providerDetails as typeof providerDetails & { specialty?: string }).specialty || "لم يحدد التخصص الفرعي"}</span>
              </div>
            </div>

            {providerProfile?.categoryChangeRequest && (
              <div className={`border-t px-4 py-3 ${providerProfile.categoryChangeRequest.status === "pending" ? "border-amber-100 bg-amber-50/70" : providerProfile.categoryChangeRequest.status === "rejected" ? "border-red-100 bg-red-50/70" : "border-green-100 bg-green-50/70"}`}>
                <p className={`flex items-center gap-2 text-sm font-bold ${providerProfile.categoryChangeRequest.status === "pending" ? "text-amber-900" : providerProfile.categoryChangeRequest.status === "rejected" ? "text-red-900" : "text-green-900"}`}>
                  {providerProfile.categoryChangeRequest.status === "pending" ? <Clock3 className="h-4 w-4" /> : providerProfile.categoryChangeRequest.status === "rejected" ? <AlertCircle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                  {providerProfile.categoryChangeRequest.status === "pending" ? "طلب تغيير التخصص قيد المراجعة" : providerProfile.categoryChangeRequest.status === "rejected" ? "طلب تغيير التخصص مرفوض" : "تم اعتماد تغيير التخصص"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {providerProfile.categoryChangeRequest.status === "pending"
                    ? `طلبت التغيير إلى ${providerProfile.categoryChangeRequest.requestedCategoryName || "مجال جديد"} · ${providerProfile.categoryChangeRequest.requestedSpecialty}. تخصصك الحالي يظل ظاهراً حتى الموافقة.`
                    : providerProfile.categoryChangeRequest.status === "rejected"
                      ? (providerProfile.categoryChangeRequest.rejectionReason || "يمكنك فتح تعديل الملف لقراءة الملاحظة أو إرسال طلب جديد.")
                      : `المجال المعتمد: ${providerProfile.categoryChangeRequest.requestedCategoryName || "المجال الجديد"} · ${providerProfile.categoryChangeRequest.requestedSpecialty}.`}
                </p>
              </div>
            )}

            <div className="border-t border-border/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">أرقام التواصل</p>
                  <p className="text-xs text-muted-foreground">رقم الدخول ثابت؛ حدّث رقم واتساب من محرر الملف المهني</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={openProfileEditor}
                >
                  تعديل الملف
                </Button>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="rounded-xl bg-muted/40 px-3 py-2"><span className="text-xs text-muted-foreground">رقم تسجيل الدخول</span><br /><b dir="ltr">{providerProfile?.phone ?? user.phone}</b></p>
                <p className="rounded-xl bg-muted/40 px-3 py-2"><span className="text-xs text-muted-foreground">واتساب</span><br /><b dir="ltr">{providerProfile?.whatsapp || "غير مضاف"}</b></p>
              </div>
            </div>

            {/* Verification banner */}
            {!professionallyVerified && (
              <button
                onClick={() => navigate('/verify')}
                className={`w-full flex items-start gap-3 px-4 py-3 border-t transition-colors ${providerProfile?.verificationStatus === "rejected" ? "bg-red-50 border-red-100 hover:bg-red-100/70" : providerProfile?.verificationStatus === "pending" ? "bg-amber-50 border-amber-100 hover:bg-amber-100/70" : "bg-amber-50 border-amber-100 hover:bg-amber-100/70"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${providerProfile?.verificationStatus === "rejected" ? "bg-red-100" : "bg-amber-100"}`}>
                  {providerProfile?.verificationStatus === "pending" ? <Clock3 className="w-5 h-5 text-amber-700" /> : providerProfile?.verificationStatus === "rejected" ? <AlertCircle className="w-5 h-5 text-red-700" /> : <ShieldCheck className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1 text-right">
                  <p className={`text-sm font-bold ${providerProfile?.verificationStatus === "rejected" ? "text-red-800" : "text-amber-800"}`}>
                    {providerProfile?.verificationStatus === "pending" ? "طلب التوثيق قيد المراجعة" : providerProfile?.verificationStatus === "rejected" ? "طلب التوثيق يحتاج إلى تعديل" : "ابدأ توثيق حسابك المهني"}
                  </p>
                  <p className={`text-xs leading-5 ${providerProfile?.verificationStatus === "rejected" ? "text-red-700" : "text-amber-700"}`}>
                    {providerProfile?.verificationStatus === "pending" ? "تظهر الشارة بعد اعتماد الإدارة للمستندات." : providerProfile?.verificationStatus === "rejected" ? (providerProfile.verificationRejectionReason || "اضغط لمراجعة الملاحظات وإعادة إرسال المستندات.") : "ارفع مستنداتك لتأكيد مهنتك وزيادة ثقة العملاء."}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-amber-500" />
              </button>
            )}
          </motion.div>
        ) : !isProvider ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: ClipboardList, label: "الطلبات", value: "—", href: "/my-requests", color: "bg-blue-50 text-blue-700" },
              { icon: Star, label: "التقييمات", value: "—", href: "/profile", color: "bg-amber-50 text-amber-700" },
              { icon: Heart, label: "المفضلة", value: "—", href: "/favorites", color: "bg-red-50 text-red-600" },
            ].map(s => (
              <button key={s.label} onClick={() => navigate(s.href)} className="bg-white rounded-2xl p-3 border border-border card-shadow text-center hover:border-primary/20 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-base font-extrabold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Menu ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-border card-shadow overflow-hidden"
        >
          {menuItems.map((item, idx) => (
            <button
              key={item.href + item.label}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/40 transition-colors text-right ${idx < menuItems.length - 1 ? 'border-b border-border/60' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.sub}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </motion.div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-2">فزعة © 2026 · الإصدار 1.0.0</p>
      </div>
    </div>
  );
}
