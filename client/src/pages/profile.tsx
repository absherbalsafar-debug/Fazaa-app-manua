import { useEffect, useState } from "react";
import { apiRequest, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import {
  LogOut,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  Settings,
  Bell,
  Heart,
  ClipboardList,
  Phone,
  Mail,
  Award,
  TrendingUp,
  Wallet,
  Star,
  Briefcase,
  Camera,
  Edit3,
  Save,
  X,
  Clock3,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { useUpdateProvider, useGetMyProvider } from "@/lib/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ProfessionalProfileEditor } from "@/components/professional-profile-editor";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: providerDetails, refetch } = useGetMyProvider({
    query: {
      enabled: user?.role === "provider",
      queryKey: ["my-provider-profile", user?.id],
      refetchOnMount: "always",
    },
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
    const profile = providerDetails as typeof providerDetails & {
      governorate?: string | null;
      district?: string | null;
      whatsapp?: string | null;
    };
    setProfileGovernorate(profile?.governorate ?? "");
    setProfileDistrict(profile?.district ?? "");
    setProfileWhatsapp(profile?.whatsapp ?? "");
    setProfileEditorOpen(true);
  }

  async function saveProfile() {
    if (user?.role === "provider") {
      toast({
        title: "استخدم محرر الملف المهني",
        description: "لا يمكن تعديل الاسم أو رقم تسجيل الدخول.",
        variant: "destructive",
      });
      return;
    }
    if (profileName.trim().length < 3) {
      toast({
        title: "أدخل الاسم الكامل",
        description: "يجب أن يتكون الاسم من 3 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileName.trim(),
          city: profileCity.trim(),
          governorate: profileGovernorate.trim(),
          district: profileDistrict.trim(),
          whatsapp: profileWhatsapp.trim(),
        }),
      });
      updateUser(updated);
      setProfileEditorOpen(false);
      toast({
        title: "تم تحديث ملفك الشخصي",
        description: "حُفظت بياناتك الجديدة بنجاح",
      });
    } catch (error) {
      toast({
        title: "تعذر حفظ البيانات",
        description: error instanceof Error ? error.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  const handleAvailabilityToggle = (checked: boolean) => {
    if (!user || !providerDetails) return;
    updateProvider.mutate(
      { id: providerDetails.id, data: { isAvailable: checked } },
      {
        onSuccess: () => {
          toast({ title: "✓ تم تحديث حالة التوفر" });
          refetch();
        },
      }
    );
  };

  if (!user) return null;

  const isProvider = user.role === "provider";
  const providerProfile = providerDetails as
    | (typeof providerDetails & {
        governorate?: string | null;
        country?: string | null;
        email?: string | null;
        verificationStatus?: "pending" | "approved" | "rejected" | null;
        verificationRejectionReason?: string | null;
        providerAccountStatus?: string | null;
        phone?: string | null;
        name?: string | null;
        id?: number;
        categoryChangeRequest?: {
          status: "pending" | "approved" | "rejected";
          requestedSpecialty: string;
          requestedCategoryName?: string;
          currentCategoryName?: string;
          rejectionReason?: string | null;
          requestedCategoryId?: number;
        } | null;
      })
    | undefined;
  const professionallyVerified = Boolean(
    providerProfile?.isVerified &&
      providerProfile?.providerAccountStatus === "approved" &&
      providerProfile?.verificationStatus === "approved"
  );

  const clientMenu = [
    {
      icon: ClipboardList,
      label: "طلباتي",
      sub: "تتبع حالة طلباتك",
      href: "/my-requests",
      color: "bg-primary/8 text-primary",
    },
    {
      icon: Heart,
      label: "المفضلة",
      sub: "المهنيون المحفوظون",
      href: "/favorites",
      color: "bg-rose-50 text-rose-600",
    },
    {
      icon: Bell,
      label: "الإشعارات",
      sub: "إدارة التنبيهات",
      href: "/notifications",
      color: "bg-accent/15 text-amber-700",
    },
    {
      icon: Wallet,
      label: "وسائل الدفع",
      sub: "بطاقات وأرصدة",
      href: "/wallet",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: Settings,
      label: "الإعدادات",
      sub: "الحساب والأمان",
      href: "/settings",
      color: "bg-secondary text-secondary-foreground",
    },
  ];

  const providerMenu = [
    {
      icon: TrendingUp,
      label: "إحصائياتي",
      sub: "الأداء والأرباح",
      href: "/my-requests",
      color: "bg-primary/8 text-primary",
    },
    {
      icon: ClipboardList,
      label: "الطلبات",
      sub: "طلبات العملاء",
      href: "/my-requests",
      color: "bg-violet-50 text-violet-700",
    },
    {
      icon: Wallet,
      label: "أرباحي",
      sub: "الرصيد وعمليات السحب",
      href: "/earnings",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: ShieldCheck,
      label: "التوثيق",
      sub: "رفع المستندات",
      href: "/verify",
      color: "bg-accent/15 text-amber-700",
    },
    {
      icon: Bell,
      label: "الإشعارات",
      sub: "تنبيهات الطلبات",
      href: "/notifications",
      color: "bg-rose-50 text-rose-600",
    },
    {
      icon: Settings,
      label: "الإعدادات",
      sub: "الحساب والأمان",
      href: "/settings",
      color: "bg-secondary text-secondary-foreground",
    },
  ];

  const menuItems = isProvider ? providerMenu : clientMenu;

  function handleLogout() {
    const nativeBridge = window as unknown as {
      FazaaNativeLogout?: { requestLogout: () => void };
    };
    if (nativeBridge.FazaaNativeLogout) {
      nativeBridge.FazaaNativeLogout.requestLogout();
      return;
    }
    logout();
    navigate("/welcome");
  }

  return (
    <div className="app-stage min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile" className="pt-5 sm:pt-8">
        <PageHeading
          eyebrow="فزعة"
          title="حسابي"
          description={
            isProvider
              ? "ملفك المهني ومساحتك لإدارة الطلبات والأرباح."
              : "بياناتك وطرق الوصول السريعة في مكان واحد."
          }
          action={
            <button
              onClick={openProfileEditor}
              aria-label="تعديل الملف الشخصي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <Settings className="h-5 w-5" />
            </button>
          }
        />

        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <SurfaceCard className="overflow-hidden p-0">
            <div className="gradient-primary relative overflow-hidden px-5 pb-12 pt-5 text-primary-foreground">
              <div className="absolute -left-14 -top-16 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-20 right-8 h-44 w-44 rounded-full bg-accent/10" />
              <div className="relative flex items-start gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 rounded-2xl border-4 border-white/90 shadow-lg sm:h-24 sm:w-24">
                    <AvatarImage
                      src={user.avatarUrl || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-2xl bg-white/15 text-2xl font-bold text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    aria-label="تغيير الصورة الشخصية"
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-primary bg-accent text-primary shadow-md"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  {isProvider && professionallyVerified && (
                    <span
                      className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-accent text-primary"
                      aria-label="حساب موثق"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-black">{user.name}</h2>
                    {isProvider && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${professionallyVerified ? "border-emerald-200/50 bg-emerald-400/20 text-white" : providerProfile?.verificationStatus === "pending" ? "border-amber-200/50 bg-amber-300/20 text-white" : providerProfile?.verificationStatus === "rejected" ? "border-red-200/50 bg-red-300/20 text-white" : "border-white/20 bg-white/10 text-white"}`}
                      >
                        {professionallyVerified ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : providerProfile?.verificationStatus ===
                          "pending" ? (
                          <Clock3 className="h-3 w-3" />
                        ) : providerProfile?.verificationStatus ===
                          "rejected" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {professionallyVerified
                          ? "موثق"
                          : providerProfile?.verificationStatus === "pending"
                            ? "قيد المراجعة"
                            : providerProfile?.verificationStatus === "rejected"
                              ? "بحاجة لاستكمال"
                              : "غير موثق"}
                      </span>
                    )}
                  </div>
                  <span className="mt-2 inline-flex rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold text-white/90">
                    {isProvider
                      ? "مقدم خدمة"
                      : user.role === "admin"
                        ? "مدير"
                        : "عميل"}
                  </span>
                </div>
                <button
                  onClick={openProfileEditor}
                  aria-label="تحرير الملف"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative -mt-7 mx-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:mx-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                  <span dir="ltr" className="truncate">
                    {user.phone}
                  </span>
                </p>
                {(providerProfile?.email || user.email) && (
                  <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                    <span className="truncate">
                      {providerProfile?.email || user.email}
                    </span>
                  </p>
                )}
                {(providerProfile?.city || user.city) && (
                  <p className="flex min-w-0 items-center gap-2 text-muted-foreground sm:col-span-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                    <span>{providerProfile?.city || user.city}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="h-5" />
          </SurfaceCard>
        </motion.div>

        {isProvider ? (
          <ProfessionalProfileEditor
            open={profileEditorOpen}
            onOpenChange={setProfileEditorOpen}
            profile={
              providerProfile
                ? {
                    ...providerProfile,
                    id: providerProfile.id ?? user.id,
                    name: providerProfile.name ?? user.name,
                    phone: providerProfile.phone ?? user.phone,
                  }
                : null
            }
            onSaved={async () => {
              await refetch();
              try {
                updateUser(await apiRequest("/auth/me"));
              } catch {
                /* the profile query remains authoritative */
              }
            }}
          />
        ) : (
          profileEditorOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-3xl border border-primary/10 bg-card p-5 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-foreground">
                    تعديل الملف الشخصي
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    حدّث بياناتك بسهولة متى شئت
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileEditorOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold">الاسم الكامل</span>
                  <Input
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="اكتب اسمك الكامل"
                    className="h-12 rounded-xl"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">المدينة</span>
                  <Input
                    value={profileCity}
                    onChange={e => setProfileCity(e.target.value)}
                    placeholder="مثال: صنعاء"
                    className="h-12 rounded-xl"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-bold">المحافظة</span>
                    <Input
                      value={profileGovernorate}
                      onChange={e => setProfileGovernorate(e.target.value)}
                      placeholder="المحافظة"
                      className="h-12 rounded-xl"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">الحي</span>
                    <Input
                      value={profileDistrict}
                      onChange={e => setProfileDistrict(e.target.value)}
                      placeholder="الحي"
                      className="h-12 rounded-xl"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-bold">رقم واتساب</span>
                  <Input
                    value={profileWhatsapp}
                    onChange={e => setProfileWhatsapp(e.target.value)}
                    inputMode="tel"
                    dir="ltr"
                    placeholder="777000000"
                    className="h-12 rounded-xl"
                  />
                </label>
                <Button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="h-12 rounded-xl bg-primary font-bold"
                >
                  <Save className="ml-2 h-4 w-4" />
                  {profileSaving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </Button>
              </div>
            </motion.div>
          )
        )}

        {isProvider && providerDetails ? (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            <SurfaceCard className="mt-5 overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-3 w-3 rounded-full ${providerDetails.isAvailable ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/35"}`}
                  />
                  <div>
                    <p className="font-extrabold">
                      {providerDetails.isAvailable ? "متاح للعمل" : "غير متاح"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      استقبال طلبات جديدة
                    </p>
                  </div>
                </div>
                <Switch
                  checked={providerDetails.isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                />
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-border/70 rtl:divide-x-reverse sm:grid-cols-4 sm:divide-y-0">
                {[
                  {
                    icon: Star,
                    label: "التقييم",
                    value: providerDetails.rating?.toFixed(1) ?? "—",
                    sub: `من ٥`,
                  },
                  {
                    icon: Briefcase,
                    label: "مشاريع",
                    value: `${providerDetails.completedJobs}`,
                    sub: "منجزة",
                  },
                  {
                    icon: Award,
                    label: "الخبرة",
                    value: `${providerDetails.yearsExperience}`,
                    sub: "سنوات",
                  },
                  {
                    icon: TrendingUp,
                    label: "المراجعات",
                    value: `${providerDetails.reviewCount}`,
                    sub: "تقييم",
                  },
                ].map(s => (
                  <div key={s.label} className="p-4 text-center">
                    <s.icon className="mx-auto mb-2 h-4 w-4 text-accent" />
                    <p className="text-lg font-black text-foreground">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.label} · {s.sub}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/70 px-5 py-4">
                <p className="text-sm font-extrabold">المجال والتخصص</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-3 py-2 font-bold text-primary">
                    {providerDetails.categoryName || "لم يحدد المجال"}
                  </span>
                  <span className="text-muted-foreground">←</span>
                  <span className="rounded-full bg-accent/20 px-3 py-2 font-bold text-amber-800">
                    {(
                      providerDetails as typeof providerDetails & {
                        specialty?: string;
                      }
                    ).specialty || "لم يحدد التخصص الفرعي"}
                  </span>
                </div>
              </div>
              {providerProfile?.categoryChangeRequest && (
                <div
                  className={`border-t px-5 py-4 ${providerProfile.categoryChangeRequest.status === "pending" ? "border-amber-100 bg-amber-50/70" : providerProfile.categoryChangeRequest.status === "rejected" ? "border-red-100 bg-red-50/70" : "border-green-100 bg-green-50/70"}`}
                >
                  <p
                    className={`flex items-center gap-2 text-sm font-bold ${providerProfile.categoryChangeRequest.status === "pending" ? "text-amber-900" : providerProfile.categoryChangeRequest.status === "rejected" ? "text-red-900" : "text-green-900"}`}
                  >
                    {providerProfile.categoryChangeRequest.status ===
                    "pending" ? (
                      <Clock3 className="h-4 w-4" />
                    ) : providerProfile.categoryChangeRequest.status ===
                      "rejected" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                    {providerProfile.categoryChangeRequest.status === "pending"
                      ? "طلب تغيير التخصص قيد المراجعة"
                      : providerProfile.categoryChangeRequest.status ===
                          "rejected"
                        ? "طلب تغيير التخصص مرفوض"
                        : "تم اعتماد تغيير التخصص"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {providerProfile.categoryChangeRequest.status === "pending"
                      ? `طلبت التغيير إلى ${providerProfile.categoryChangeRequest.requestedCategoryName || "مجال جديد"} · ${providerProfile.categoryChangeRequest.requestedSpecialty}. تخصصك الحالي يظل ظاهراً حتى الموافقة.`
                      : providerProfile.categoryChangeRequest.status ===
                          "rejected"
                        ? providerProfile.categoryChangeRequest
                            .rejectionReason ||
                          "يمكنك فتح تعديل الملف لقراءة الملاحظة أو إرسال طلب جديد."
                        : `المجال المعتمد: ${providerProfile.categoryChangeRequest.requestedCategoryName || "المجال الجديد"} · ${providerProfile.categoryChangeRequest.requestedSpecialty}.`}
                  </p>
                </div>
              )}
              <div className="border-t border-border/70 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">أرقام التواصل</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      رقم الدخول ثابت؛ حدّث رقم واتساب من محرر الملف المهني
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-xl"
                    onClick={openProfileEditor}
                  >
                    تعديل الملف
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="rounded-xl bg-muted/45 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      رقم تسجيل الدخول
                    </span>
                    <br />
                    <b dir="ltr">{providerProfile?.phone ?? user.phone}</b>
                  </p>
                  <p className="rounded-xl bg-muted/45 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      واتساب
                    </span>
                    <br />
                    <b dir="ltr">{providerProfile?.whatsapp || "غير مضاف"}</b>
                  </p>
                </div>
              </div>
              {!professionallyVerified && (
                <button
                  onClick={() => navigate("/verify")}
                  className={`flex min-h-[92px] w-full items-start gap-3 border-t px-5 py-4 text-right transition-colors ${providerProfile?.verificationStatus === "rejected" ? "border-red-100 bg-red-50 hover:bg-red-100/70" : "border-amber-100 bg-amber-50 hover:bg-amber-100/70"}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${providerProfile?.verificationStatus === "rejected" ? "bg-red-100" : "bg-amber-100"}`}
                  >
                    {providerProfile?.verificationStatus === "pending" ? (
                      <Clock3 className="h-5 w-5 text-amber-700" />
                    ) : providerProfile?.verificationStatus === "rejected" ? (
                      <AlertCircle className="h-5 w-5 text-red-700" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                    )}
                  </span>
                  <span className="flex-1">
                    <p
                      className={`text-sm font-bold ${providerProfile?.verificationStatus === "rejected" ? "text-red-800" : "text-amber-800"}`}
                    >
                      {providerProfile?.verificationStatus === "pending"
                        ? "طلب التوثيق قيد المراجعة"
                        : providerProfile?.verificationStatus === "rejected"
                          ? "طلب التوثيق يحتاج إلى تعديل"
                          : "ابدأ توثيق حسابك المهني"}
                    </p>
                    <p
                      className={`mt-1 text-xs leading-5 ${providerProfile?.verificationStatus === "rejected" ? "text-red-700" : "text-amber-700"}`}
                    >
                      {providerProfile?.verificationStatus === "pending"
                        ? "تظهر الشارة بعد اعتماد الإدارة للمستندات."
                        : providerProfile?.verificationStatus === "rejected"
                          ? providerProfile.verificationRejectionReason ||
                            "اضغط لمراجعة الملاحظات وإعادة إرسال المستندات."
                          : "ارفع مستنداتك لتأكيد مهنتك وزيادة ثقة العملاء."}
                    </p>
                  </span>
                  <ChevronLeft className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
                </button>
              )}
            </SurfaceCard>
          </motion.div>
        ) : !isProvider ? (
          <section className="mt-6">
            <SectionHeading
              title="ملخص الحساب"
              description="وصول سريع إلى أهم مساحاتك"
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: ClipboardList,
                  label: "الطلبات",
                  value: "—",
                  href: "/my-requests",
                  color: "bg-primary/8 text-primary",
                },
                {
                  icon: Star,
                  label: "التقييمات",
                  value: "—",
                  href: "/profile",
                  color: "bg-accent/15 text-amber-700",
                },
                {
                  icon: Heart,
                  label: "المفضلة",
                  value: "—",
                  href: "/favorites",
                  color: "bg-rose-50 text-rose-600",
                },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.href)}
                  className="rounded-2xl border border-border bg-card p-3.5 text-center shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.02]"
                >
                  <span
                    className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}
                  >
                    <s.icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="text-lg font-black">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.label}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <SectionHeading
            title="الوصول السريع"
            description={
              isProvider
                ? "أدِر نشاطك المهني من هنا"
                : "كل ما تحتاجه لإدارة حسابك"
            }
          />
          <SurfaceCard className="overflow-hidden p-0">
            {menuItems.map((item, idx) => (
              <button
                key={item.href + item.label}
                onClick={() => navigate(item.href)}
                className={`flex min-h-[68px] w-full items-center gap-3.5 px-4 text-right transition-colors hover:bg-muted/45 ${idx < menuItems.length - 1 ? "border-b border-border/60" : ""}`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-extrabold text-foreground">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.sub}
                  </span>
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            ))}
          </SurfaceCard>
        </section>

        <button
          onClick={handleLogout}
          className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-card text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
        <p className="pb-2 pt-1 text-center text-[11px] text-muted-foreground/60">
          فزعة © 2026 · الإصدار 1.0.0
        </p>
      </AppPage>
    </div>
  );
}
