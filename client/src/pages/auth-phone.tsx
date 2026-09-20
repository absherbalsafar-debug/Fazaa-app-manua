import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Camera, Check, CheckCircle2, ChevronDown, FileText, ImagePlus, Loader2, MessageCircle, Phone, ShieldCheck, Upload, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker, type CustomerLocation } from "@/components/LocationPicker";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getFirstLoginPath, getRegistrationRole, type RegistrationRole } from "@/lib/registration";
import { BrandLogo } from "@/components/brand-logo";

type Step = "phone" | "otp" | "name";
type Category = { id: number; name: string; icon?: string | null; specialties?: string[] };

const roleLabels: Record<RegistrationRole, { title: string; description: string }> = {
  client: { title: "أبحث عن خدمة", description: "ستظهر لك أفضل الخدمات والمهنيين" },
  provider: { title: "أقدّم خدمة", description: "ستستقبل طلبات العملاء وتدير عملك" },
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

export default function AuthPhone() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [role, setRole] = useState<RegistrationRole>(() => getRegistrationRole(window.location.search));
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState<{ requestId: number; reviewTime: string } | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [providerSessionReady, setProviderSessionReady] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const mode = new URLSearchParams(window.location.search).get("mode") === "login" ? "login" : "register";
  const selectedRole = roleLabels[role];
  const RoleIcon = role === "provider" ? BriefcaseBusiness : UserRound;
  const selectedCategory = categories.find((category) => String(category.id) === categoryId);
  const namePartsCount = name.trim().split(/\s+/).filter(Boolean).length;
  const clientProfileReady = namePartsCount >= 4 && customerLocation !== null;

  useEffect(() => {
    if (role !== "provider" || step !== "name") return;
    let active = true;
    setCategoriesLoading(true);
    apiRequest("/categories")
      .then((data) => {
        if (active) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (active) toast({ title: "تعذر تحميل مجالات الخدمة", description: err.message, variant: "destructive" });
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role, step, toast]);

  async function sendOtp() {
    if (phone.trim().length < 7) {
      toast({ title: "خطأ", description: "أدخل رقم هاتف صحيح", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), role, mode }),
      });
      if (data.otp) setDevOtp(data.otp);
      setOtpSent(true);
      toast({ title: "تم الإرسال", description: "تم إرسال رمز التحقق إلى هاتفك" });
    } catch (err: any) {
      const message = err?.message || "تعذر إرسال رمز التحقق";
      toast({ title: message.includes("هذا الرقم") ? "لا يمكن استخدام هذا الرقم" : "خطأ", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      toast({ title: "خطأ", description: "أدخل الرمز المكون من 6 أرقام", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), code: otp, role, mode }),
      });
      if (data.needsRegistration) {
        setStep("name");
      } else {
        const authenticatedUser = role === "provider" ? { ...data.user, role: "provider" } : data.user;
        login(data.token, authenticatedUser);
        navigate(getFirstLoginPath(role));
      }
    } catch (err: any) {
      const message = err?.message || "رمز التحقق غير صحيح";
      toast({ title: message.includes("هذا الرقم") ? "لا يمكن استخدام هذا الرقم" : "رمز خاطئ", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function completeRegistration() {
    if (role === "client" && namePartsCount < 4) {
      toast({ title: "الاسم الرباعي مطلوب", description: "يرجى إدخال الاسم الرباعي كاملاً", variant: "destructive" });
      return;
    }
    if (role === "client" && !customerLocation) {
      toast({ title: "الموقع مطلوب", description: "يجب تحديد موقعك للعثور على المهنيين القريبين منك", variant: "destructive" });
      return;
    }
    if (role === "provider" && !customerLocation) {
      toast({ title: "موقع العمل مطلوب", description: "حدد موقع عملك بدقة من خلال GPS أو الخريطة قبل إكمال التسجيل", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "خطأ", description: "أدخل اسمك", variant: "destructive" });
      return;
    }
    if (role === "provider" && !categoryId) {
      toast({ title: "حدد مجال خدمتك", description: "اختر المجال الذي ستقدم خدماته للعملاء", variant: "destructive" });
      return;
    }
    if (role === "provider" && selectedCategory?.specialties?.length && !specialty) {
      toast({ title: "حدد تخصصك الفرعي", description: "اختر التخصص الأدق داخل مجال خدمتك", variant: "destructive" });
      return;
    }
    if (role === "provider" && namePartsCount < 4) { toast({ title: "الاسم الرباعي مطلوب", description: "أدخل أربعة أسماء كاملة على الأقل", variant: "destructive" }); return; }
    if (role === "provider" && !/^\d{11}$/.test(nationalId)) { toast({ title: "الرقم الوطني غير صحيح", description: "يجب إدخال 11 رقماً بالضبط", variant: "destructive" }); return; }
    if (role === "provider" && (!selfieFile || !idFrontFile || !idBackFile)) { toast({ title: "الصور المطلوبة ناقصة", description: "أرفق صورتك الشخصية وصورة الهوية الوطنية من الأمام والخلف", variant: "destructive" }); return; }
    if (role === "provider" && !/^7\d{8}$/.test(whatsapp)) { toast({ title: "رقم واتساب غير صحيح", description: "أدخل رقمًا يمنيًا من 9 أرقام يبدأ بالرقم 7", variant: "destructive" }); return; }
    if (role === "provider" && (bio.trim().length < 50 || bio.trim().length > 1000)) { toast({ title: "وصف التخصص غير مكتمل", description: "يجب أن يكون الوصف بين 50 و1000 حرف", variant: "destructive" }); return; }
    if (role === "provider" && !termsAccepted) { toast({ title: "الموافقة مطلوبة", description: "وافق على التعهد والشروط والأحكام للمتابعة", variant: "destructive" }); return; }
    setLoading(true);
    if (role === "provider") {
      setUploadProgress(0);
      setUploadStage("جاري تجهيز مستندات الاعتماد...");
    }
    try {
      if (!providerSessionReady) {
        const data = await apiRequest('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({
            phone: phone.trim(),
            code: otp,
            name: name.trim(),
            role,
            mode,
            city: customerLocation?.city || undefined,
            country: customerLocation?.country || undefined,
            governorate: customerLocation?.governorate || undefined,
            district: customerLocation?.district || undefined,
            latitude: customerLocation?.latitude,
            longitude: customerLocation?.longitude,
            categoryId: categoryId ? Number(categoryId) : undefined,
            specialty: specialty.trim() || undefined,
            bio: bio.trim() || undefined,
            yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
            nationalId: role === "provider" ? nationalId : undefined,
            whatsapp: role === "provider" ? whatsapp : undefined,
            termsAccepted: role === "provider" ? termsAccepted : undefined,
          }),
        });
        login(data.token, role === "provider" ? { ...data.user, role: "provider" } : data.user);
        if (role === "provider") setProviderSessionReady(true);
      }
      try {
        if (role === "provider" && selfieFile && idFrontFile && idBackFile) {
          const documents = [
            ["selfie", "الصورة الشخصية", selfieFile],
            ["id_front", "الهوية — الأمام", idFrontFile],
            ["id_back", "الهوية — الخلف", idBackFile],
          ] as const;
          let requestId: number | null = null;
          for (let index = 0; index < documents.length; index += 1) {
            const [type, label, file] = documents[index];
            setUploadStage(`جاري رفع ${label} (${index + 1} من ${documents.length})`);
            const uploadResult = await apiRequest("/providers/me/verification-documents/base64", {
              method: "POST",
              body: JSON.stringify({ type, originalName: file.name, contentType: file.type || "image/jpeg", dataBase64: await fileToDataUrl(file) }),
            });
            if (typeof uploadResult.requestId === "number") requestId = uploadResult.requestId;
            setUploadProgress(Math.round(((index + 1) / documents.length) * 100));
          }
          setUploadStage("اكتمل رفع جميع المستندات");
          if (requestId !== null) {
            setVerificationSuccess({ requestId, reviewTime: "عادةً خلال 1 إلى 3 أيام عمل" });
            return;
          }
        }
      } catch (uploadError) {
        throw new Error(uploadError instanceof Error ? `تعذر رفع مستندات الاعتماد: ${uploadError.message}` : "تعذر رفع مستندات الاعتماد");
      }
      navigate(getFirstLoginPath(role));
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = step === "phone" ? "٠١" : step === "otp" ? "٠٢" : "٠٣";
  const stepTitle = step === "phone" ? "أدخل رقم هاتفك" : step === "otp" ? "تحقق من هاتفك" : "أكمل بياناتك";

  return (
    <main className="min-h-[100dvh] bg-[#f5f3ee] text-primary" dir="rtl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-y-auto px-5 pb-8 pt-6 sm:max-w-lg sm:px-9">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => step === "phone" ? navigate("/welcome") : setStep(step === "otp" ? "phone" : "otp")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white text-primary transition-colors hover:bg-[#ebe8e0]"
            aria-label="رجوع"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <BrandLogo className="h-16 w-24 object-contain" />
          <span className="rounded-full border border-[#d9d5cd] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8e8b82]">
            {stepNumber} <span className="mx-1 text-[#b57920]">/</span> ٠٣
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b57920]">التحقق الآمن</p>
              <h1 className="mt-3 text-[32px] font-black leading-tight tracking-[-0.04em]">{stepTitle}</h1>
              <p className="mt-3 text-sm leading-7 text-[#77766f]">
                {step === "phone" && "سنرسل رمزاً قصيراً إلى رقمك لتبدأ تجربتك بأمان."}
                {step === "otp" && "أدخل الرمز الذي وصل إلى هاتفك لإكمال الدخول."}
                {step === "name" && (role === "provider"
                  ? "عرّف العملاء بخدمتك حتى تصل إليك الطلبات المناسبة."
                  : "أكمل بياناتك: أدخل اسمك الحقيقي وحدد موقعك لنتمكن من عرض أفضل المهنيين والخدمات القريبة منك.")}
              </p>
            </div>

            {step === "phone" && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-primary/10 text-primary shadow-[0_12px_28px_rgba(14,47,98,0.08)]">
                  <Phone className="h-9 w-9" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-extrabold text-primary">كيف ستستخدم فزعة؟</p>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="نوع الحساب">
                    {(Object.entries(roleLabels) as [RegistrationRole, (typeof roleLabels)[RegistrationRole]][]).map(([option, copy]) => {
                      const OptionIcon = option === "provider" ? BriefcaseBusiness : UserRound;
                      const isSelected = role === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setRole(option)}
                          className={`rounded-2xl border p-3 text-right transition-colors ${isSelected ? "border-primary bg-primary text-white" : "border-[#d4d9df] bg-white text-primary hover:border-primary/40"}`}
                        >
                          <OptionIcon className={`mb-2 h-5 w-5 ${isSelected ? "text-accent" : "text-[#b57920]"}`} />
                          <span className="block text-xs font-extrabold">{copy.title}</span>
                          <span className={`mt-1 block text-[10px] leading-4 ${isSelected ? "text-white/75" : "text-[#77766f]"}`}>{copy.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center text-lg font-semibold shadow-sm focus-visible:ring-primary"
                  dir="ltr"
                  disabled={loading}
                  onKeyDown={e => e.key === "Enter" && sendOtp()}
                />
                <Button onClick={sendOtp} disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                  {loading ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري إرسال الرمز...</> : <>{otpSent ? "إعادة إرسال الرمز" : "إرسال رمز التحقق"}<ArrowLeft className="mr-2 h-4 w-4" /></>}
                </Button>
                {otpSent && (
                  <div className="space-y-4 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                    <div>
                      <p className="mb-2 text-sm text-[#77766f]">أدخل رمز التأكيد هنا لإكمال الدخول</p>
                      {devOtp && (
                        <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-[#8a6925]">
                          رمز التأكيد: <span className="font-mono text-base font-bold tracking-widest">{devOtp}</span>
                        </p>
                      )}
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center font-mono text-2xl tracking-[0.5em] shadow-sm focus-visible:ring-primary"
                        dir="ltr"
                        disabled={loading}
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && verifyOtp()}
                      />
                    </div>
                    <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                      {loading ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري التحقق...</> : <>تأكيد الدخول<Check className="mr-2 h-4 w-4" /></>}
                    </Button>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-xs font-bold text-[#b57920]"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b57920]" />
                        نتحقق من الرمز ونجهز حسابك...
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}

            {step === "otp" && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-accent/20 text-[#b57920] shadow-[0_12px_28px_rgba(161,123,41,0.08)]">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <div>
                  <p className="mb-3 text-sm text-[#77766f]">
                    أرسلنا الرمز إلى <span className="font-bold text-primary" dir="ltr">{phone}</span>
                  </p>
                  {devOtp && (
                    <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-[#8a6925]">
                      رمز التطوير: <span className="font-mono font-bold">{devOtp}</span>
                    </p>
                  )}
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center font-mono text-2xl tracking-[0.5em] shadow-sm focus-visible:ring-primary"
                    dir="ltr"
                  />
                </div>
                <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                  {loading ? "جاري التحقق..." : "تأكيد الرمز"}
                  <Check className="mr-2 h-4 w-4" />
                </Button>
                <button type="button" onClick={sendOtp} className="w-full text-center text-sm font-bold text-[#b57920]">
                  إعادة إرسال الرمز
                </button>
              </>
            )}

            {step === "name" && (
              <>
                <div className="rounded-[26px] border border-primary/10 bg-primary p-4 text-white shadow-[0_16px_32px_rgba(14,47,98,0.14)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                      <RoleIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold">{selectedRole.title}</p>
                      <p className="mt-1 text-xs text-white/65">{selectedRole.description}</p>
                    </div>
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[10px] font-medium text-white/55">
                    تم حفظ اختيارك ولن نطلب منك تحديده مرة أخرى.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="customer-four-part-name" className="block text-sm font-black text-primary">الاسم الرباعي <span className="text-red-500">*</span></label>
                  <Input
                    id="customer-four-part-name"
                    placeholder="أدخل اسمك الرباعي"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-14 rounded-2xl border-[#d4d9df] bg-white text-base shadow-sm focus-visible:ring-primary"
                    autoFocus
                  />
                  <p className="text-[11px] leading-5 text-[#8b897f]">الاسم الأول، اسم الأب، اسم الجد، واسم العائلة</p>
                  {role === "client" && name.trim() && namePartsCount < 4 && <p className="text-xs font-bold text-red-600">يرجى إدخال الاسم الرباعي كاملاً</p>}
                </div>
                {role === "provider" && (
                  <div className="space-y-3 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                    <p className="text-sm font-extrabold text-primary">التحقق من الهوية والتواصل</p>
                    <div className="flex gap-2"><Input inputMode="numeric" maxLength={11} placeholder="الرقم الوطني — 11 رقمًا" value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, ""))} className="h-12 rounded-xl" dir="ltr" /><div className="flex h-12 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-white"><Camera className="h-4 w-4 text-accent" /> الرقم الوطني</div></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {([['selfie', 'الصورة الشخصية', selfieFile, setSelfieFile], ['front', 'صورة الهوية — الأمام', idFrontFile, setIdFrontFile], ['back', 'صورة الهوية — الخلف', idBackFile, setIdBackFile]] as const).map(([side, label, file, setter]) => (
                        <label key={side} className="group flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cfd5dd] bg-[#fbfaf7] px-3 py-3 text-center transition hover:border-primary/50 hover:bg-primary/[0.03]">
                          {file ? <CheckCircle2 className="h-7 w-7 text-emerald-600" /> : <ImagePlus className="h-7 w-7 text-[#b57920]" />}
                          <span className="text-[11px] font-black text-primary">{file ? file.name : label}</span>
                          <span className="flex items-center gap-1 text-[10px] text-[#8b897f]"><Upload className="h-3 w-3" /> {file ? "تغيير الصورة" : "إرفاق صورة واضحة"}</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture={side === "selfie" ? "user" : "environment"} className="sr-only" onChange={event => { const selected = event.target.files?.[0]; if (!selected) return; if (selected.size > 10 * 1024 * 1024) { toast({ title: "الملف كبير", description: "يجب ألا يتجاوز حجم الصورة 10 ميجابايت", variant: "destructive" }); return; } setter(selected); }} aria-label={label} />
                        </label>
                      ))}
                    </div>
                    <div className="flex h-12 items-center gap-2 rounded-xl border border-[#d4d9df] bg-[#fbfaf7] px-3 focus-within:border-[#25d366] focus-within:ring-2 focus-within:ring-[#25d366]/15">
                      <MessageCircle className="h-5 w-5 shrink-0 text-[#25d366]" aria-hidden="true" />
                      <Input inputMode="numeric" maxLength={9} placeholder="أدخل رقم الواتس اب" value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))} className="h-10 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" dir="ltr" aria-label="رقم الواتس اب" />
                    </div>
                  </div>
                )}

                {role === "provider" && (
                  <div className="space-y-4 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-[#b57920]">
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-primary">اختر تخصصك أو مجالك</p>
                        <p className="mt-0.5 text-[10px] text-[#8b897f]">اختر المجال والتخصص الفرعي واكتب وصفًا مختصرًا لخدمتك</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button type="button" disabled={categoriesLoading} aria-expanded={categoryOpen} onClick={() => { setCategoryOpen(open => !open); setSpecialtyOpen(false); }} className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#d4d9df] bg-background px-4 text-right text-sm font-bold text-foreground outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60">
                        <span>{categoriesLoading ? "جاري تحميل مجالات الخدمة..." : selectedCategory ? `${selectedCategory.icon ? `${selectedCategory.icon} ` : ""}${selectedCategory.name}` : "اختر مجال خدمتك"}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {categoryOpen && !categoriesLoading && <div role="listbox" className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl">
                        {categories.map((category) => <button key={category.id} type="button" role="option" aria-selected={String(category.id) === categoryId} onClick={() => { setCategoryId(String(category.id)); setSpecialty(""); setCategoryOpen(false); }} className="flex w-full items-center rounded-xl px-3 py-3 text-right text-sm font-bold transition hover:bg-accent hover:text-accent-foreground">{category.icon ? `${category.icon} ` : ""}{category.name}</button>)}
                      </div>}
                    </div>
                    {selectedCategory?.specialties?.length ? <div className="relative"><button type="button" aria-expanded={specialtyOpen} onClick={() => { setSpecialtyOpen(open => !open); setCategoryOpen(false); }} className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#d4d9df] bg-background px-4 text-right text-sm font-bold text-foreground outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10"><span>{specialty || "اختر تخصصك الفرعي"}</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></button>{specialtyOpen && <div role="listbox" className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl">{selectedCategory.specialties.map((item) => <button key={item} type="button" role="option" aria-selected={item === specialty} onClick={() => { setSpecialty(item); setSpecialtyOpen(false); }} className="flex w-full items-center rounded-xl px-3 py-3 text-right text-sm font-bold transition hover:bg-accent hover:text-accent-foreground">{item}</button>)}</div>}</div> : null}
                    <div className="relative">
                      <FileText className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#b57920]" />
                      <Textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="اكتب وصف تخصصك أو مجالك، مثل: أقدم خدمات السباكة المنزلية وإصلاح التسربات..."
                        className="min-h-[96px] resize-none rounded-2xl border-[#d4d9df] bg-[#fbfaf7] pr-11 pt-3 text-sm leading-6 shadow-none focus-visible:ring-primary"
                        maxLength={1000}
                      />
                      <span className="mt-1 block text-left text-[10px] text-[#aaa69b]">{bio.length}/1000</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      inputMode="numeric"
                      placeholder="سنوات الخبرة (اختياري)"
                      value={yearsExperience}
                      onChange={(event) => setYearsExperience(event.target.value)}
                      className="h-14 rounded-2xl border-[#d4d9df] bg-[#fbfaf7] text-sm shadow-none focus-visible:ring-primary"
                    />
                  </div>
                )}
                <LocationPicker
                  value={customerLocation}
                  onChange={setCustomerLocation}
                  title={role === "provider" ? "حدد موقع عملك بدقة" : "حدد موقعك"}
                  description={role === "provider" ? "اسمح للتطبيق بالوصول إلى موقعك الحالي ليتم تحديد منطقة عملك بدقة." : "نحتاج موقعك لعرض أقرب المهنيين والخدمات المتاحة حولك."}
                />
                {role === "provider" && <div className="rounded-[26px] border border-[#e5dcc5] bg-gradient-to-br from-[#fffdf7] to-[#f8f4e9] p-4 shadow-[0_12px_28px_rgba(14,47,98,0.05)]"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0b046]/20 text-[#a8731d]"><ShieldCheck className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-primary">إقرار وتعهد المهني</p><p className="mt-1 text-[11px] leading-5 text-[#737066]">نحتاج موافقتك على صحة البيانات والمستندات قبل إرسال طلب الاعتماد.</p></div></div><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6dfd0] bg-white/80 p-3 text-xs leading-6 text-[#596273]"><input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#182d53]" /><span>أقر بأن بياناتي ومستنداتي صحيحة، وأوافق على مراجعتها وفق شروط منصة فزعة. <button type="button" className="font-black text-[#a8731d] underline underline-offset-4" onClick={() => setTermsOpen(true)}>قراءة نص التعهد</button></span></label></div>}
                {termsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 backdrop-blur-sm sm:items-center"><div role="dialog" aria-modal="true" aria-labelledby="terms-title" className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-[#a8731d]"><ShieldCheck className="h-5 w-5" /></div><h2 id="terms-title" className="text-base font-black text-primary">نص الإقرار والتعهد</h2></div><button type="button" onClick={() => setTermsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f3ee] text-[#667085]" aria-label="إغلاق"><X className="h-4 w-4" /></button></div><p className="mt-4 rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-7 text-[#596273]">أتعهد بأن جميع البيانات والمستندات التي أقدمها صحيحة ومملوكة لي، وأوافق على قيام منصة فزعة بمراجعتها والتحقق منها وفق شروط الاستخدام وسياسة الخصوصية. وأتحمل مسؤولية أي معلومات غير صحيحة.</p><Button type="button" onClick={() => { setTermsAccepted(true); setTermsOpen(false); }} className="mt-4 h-12 w-full rounded-2xl bg-primary font-extrabold">أوافق وأغلق</Button></div></div>}
                {role === "provider" && loading && uploadStage && <div className="rounded-[24px] border border-primary/10 bg-[#182d53] p-4 text-white shadow-[0_14px_30px_rgba(14,47,98,0.16)]" role="status" aria-live="polite"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0b046]/20 text-[#f0b046]"><Loader2 className="h-5 w-5 animate-spin" /></div><div className="min-w-0"><p className="text-sm font-black">رفع مستندات الاعتماد</p><p className="mt-1 truncate text-[11px] text-white/70">{uploadStage}</p></div></div><span className="shrink-0 text-lg font-black text-[#f0b046]">{uploadProgress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-l from-[#f0b046] to-[#ffd978] transition-all duration-500" style={{ width: `${Math.max(uploadProgress, 7)}%` }} /></div><div className="mt-3 flex justify-between text-[10px] text-white/55"><span className={uploadProgress >= 33 ? "text-[#f0b046]" : ""}>الصورة الشخصية</span><span className={uploadProgress >= 66 ? "text-[#f0b046]" : ""}>الهوية الأمامية</span><span className={uploadProgress >= 100 ? "text-[#f0b046]" : ""}>الهوية الخلفية</span></div></div>}
                {verificationSuccess ? <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="relative space-y-4 overflow-hidden rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-[0_14px_30px_rgba(16,185,129,0.10)]" role="status" aria-live="polite"><motion.div initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.18 }} className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></motion.div><div><p className="text-lg font-black text-primary">تم إرسال طلب الاعتماد بنجاح</p><p className="mt-2 text-sm leading-6 text-[#596273]">تم استلام مستنداتك وستتم مراجعتها من فريق فزعة.</p></div><div className="grid grid-cols-2 gap-3 text-right"><div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100"><p className="text-[10px] font-bold text-[#8b897f]">رقم الطلب</p><p className="mt-1 text-lg font-black text-primary" dir="ltr">#{verificationSuccess.requestId}</p></div><div className="rounded-2xl bg-white p-3"><p className="text-[10px] font-bold text-[#8b897f]">المدة المتوقعة</p><p className="mt-1 text-xs font-black leading-5 text-primary">{verificationSuccess.reviewTime}</p></div></div><Button type="button" onClick={() => navigate(getFirstLoginPath("provider"))} className="h-13 w-full rounded-2xl bg-primary font-extrabold text-primary-foreground hover:bg-primary/90">الانتقال إلى حسابي <ArrowLeft className="mr-2 h-4 w-4" /></Button></motion.div> : <Button onClick={completeRegistration} disabled={loading || !name.trim() || !clientProfileReady} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "جاري إنشاء الحساب..." : "المتابعة"}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>}
              </>
            )}
          </motion.div>
        </div>

        <p className="text-center text-[10px] leading-5 text-[#aaa69b]">
          بياناتك محمية، وبالاستمرار توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </main>
  );
}
