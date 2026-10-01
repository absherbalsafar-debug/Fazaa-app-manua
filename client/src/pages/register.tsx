import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegister } from "@/lib/api-client-react";
import { useAuth, apiRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, FileCheck2, ImagePlus, Loader2, MapPin, ShieldCheck, Sparkles, UserRound, Wrench } from "lucide-react";

const schema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["client", "provider"]),
  categoryId: z.coerce.number().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  yearsExperience: z.coerce.number().optional().nullable(),
  specializationIds: z.array(z.number()).optional(),
  serviceIds: z.array(z.number()).optional(),
});
type FormValues = z.infer<typeof schema>;

const steps = [
  { title: "الأساسيات", icon: UserRound },
  { title: "المهنة", icon: BriefcaseBusiness },
  { title: "الأعمال", icon: ImagePlus },
  { title: "التوثيق", icon: FileCheck2 },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [step, setStep] = useState(1);
  const [portfolioFiles, setPortfolioFiles] = useState<string[]>([]);
  const [taxonomy, setTaxonomy] = useState<any[]>([]);
  const [specializationIds, setSpecializationIds] = useState<number[]>([]);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [primarySpecializationId, setPrimarySpecializationId] = useState<number | null>(null);
  useEffect(() => { apiRequest("/taxonomy").then(setTaxonomy).catch(() => undefined); }, []);
  const form = useForm<FormValues>({ defaultValues: { name: "", phone: "", password: "", role: new URLSearchParams(window.location.search).get("role") === "provider" ? "provider" : "client", categoryId: null, city: "", district: "", bio: "", yearsExperience: 1 } });
  const role = form.watch("role");
  const selectedCategory = taxonomy.find((category) => category.id === form.watch("categoryId"));

  const next = async () => {
    if (step === 1 && (!form.getValues("name") || !form.getValues("phone") || !form.getValues("password"))) { toast({ title: "أكمل المعلومات الأساسية", description: "الاسم والهاتف وكلمة المرور مطلوبة.", variant: "destructive" }); return; }
    if (step === 2 && (!form.getValues("categoryId") || !form.getValues("city") || !primarySpecializationId || !serviceIds.length)) { toast({ title: "أكمل بياناتك المهنية", description: "اختر القسم والتخصص الرئيسي وخدمة واحدة على الأقل.", variant: "destructive" }); return; }
    if (step === 1 && role === "client") {
      const values = form.getValues();
      registerMutation.mutate({ data: { ...values, role: "client" } as any }, { onSuccess: (res) => { setAuth(res.token, res.user as any); setLocation("/"); }, onError: (error) => toast({ title: "تعذر إنشاء الحساب", description: error.message, variant: "destructive" }) });
      return;
    }
    if (step < 4) { setStep(step + 1); return; }
    const values = form.getValues();
    const parsed = schema.safeParse(values);
    if (!parsed.success) { toast({ title: "راجع البيانات", description: parsed.error.issues[0]?.message, variant: "destructive" }); return; }
    registerMutation.mutate({ data: { ...values, categoryId: values.categoryId || undefined, city: values.city || undefined, district: values.district || undefined, bio: values.bio || undefined, yearsExperience: values.yearsExperience || undefined } as any }, { onSuccess: async (res) => { setAuth(res.token, res.user as any); await apiRequest("/providers/me/taxonomy", { method: "PUT", body: JSON.stringify({ primarySpecializationId, specializationIds, serviceIds }) }); setStep(5); toast({ title: "تم إنشاء ملفك", description: "حسابك الآن قيد مراجعة فريق فزعة." }); }, onError: (error) => toast({ title: "تعذر إنشاء الحساب", description: error.message, variant: "destructive" }) });
  };

  if (step === 5) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f8fb] p-5" dir="rtl"><div className="w-full max-w-md rounded-[30px] border border-[#dfe6ee] bg-white p-7 text-center shadow-[0_20px_50px_rgba(24,45,83,0.12)]"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#e8f7ef] text-[#16945d]"><Check className="h-10 w-10" /></div><h1 className="mt-5 text-2xl font-black text-[#182d53]">تم حفظ طلبك بنجاح</h1><p className="mt-3 text-sm leading-7 text-[#718096]">ملفك غير ظاهر للعملاء حاليًا. أكمل التوثيق ليراجع فريق فزعة بياناتك ومستنداتك.</p><div className="mt-6 space-y-3"><Button className="h-13 w-full rounded-2xl bg-[#182d53] font-black" onClick={() => setLocation("/provider-verify")}>إكمال التوثيق الآن <ArrowLeft className="mr-2 h-4 w-4 text-[#f0b046]" /></Button><Button variant="outline" className="h-13 w-full rounded-2xl font-bold" onClick={() => setLocation("/provider-business")}>اختيار الاشتراك لاحقًا</Button></div></div></main>;

  return (
    <main className="min-h-[100dvh] bg-[#f6f8fb] text-[#182d53]" dir="rtl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-7 pt-6 sm:max-w-lg sm:px-9">
        <header className="flex items-center justify-between"><Link href="/welcome" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e1ea] bg-white shadow-sm"><ArrowRight className="h-4 w-4" /></Link><div className="text-center"><p className="text-[10px] font-bold text-[#9a6b18]">رحلة فزعة</p><h1 className="text-sm font-black">إنشاء حساب جديد</h1></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182d53] text-[#f0b046]"><Sparkles className="h-4 w-4" /></span></header>
        <section className="mt-7 flex-1">
          <div className="mb-6"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#b57920]">المرحلة {step} من 4</p><div className="mt-3 flex items-center gap-1.5">{steps.map((item, index) => { const Icon = item.icon; const active = index + 1 <= step; return <div key={item.title} className="flex flex-1 items-center gap-1.5"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#182d53] text-[#f0b046]" : "bg-white text-[#9aa6b5]"}`}><Icon className="h-4 w-4" /></div>{index < steps.length - 1 && <div className={`h-1 flex-1 rounded-full ${index + 1 < step ? "bg-[#f0b046]" : "bg-[#dfe6ee]"}`} />}</div>; })}</div><div className="mt-2 grid grid-cols-4 text-center text-[9px] font-bold text-[#8793a3]">{steps.map((item) => <span key={item.title}>{item.title}</span>)}</div></div>
          <div className="mb-5 rounded-[24px] bg-[#182d53] p-5 text-white shadow-[0_16px_32px_rgba(24,45,83,0.16)]"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0b046] text-[#182d53]">{role === "provider" ? <BriefcaseBusiness className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><div><p className="text-[10px] text-white/60">أنت تنشئ حساب</p><p className="mt-1 font-black">{role === "provider" ? "مهني في فزعة" : "عميل في فزعة"}</p></div></div><p className="mt-4 text-xs leading-6 text-white/65">بياناتك محفوظة، ونرشدك خطوة بخطوة حتى تكتمل تجربتك.</p></div>
          <div className="rounded-[28px] border border-[#dfe6ee] bg-white p-5 shadow-[0_18px_42px_rgba(24,45,83,0.08)]">
            {step === 1 && <div className="space-y-4"><div><h2 className="text-xl font-black">لنبدأ من الأساسيات</h2><p className="mt-1 text-xs text-[#8793a3]">أدخل بياناتك الأساسية لإنشاء حسابك.</p></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => form.setValue("role", "client")} className={`rounded-2xl border p-3 text-sm font-black transition ${role === "client" ? "border-[#182d53] bg-[#182d53] text-white" : "border-[#dfe6ee] bg-[#fbfcfe]"}`}><UserRound className="mx-auto mb-1 h-5 w-5" />عميل</button><button type="button" onClick={() => form.setValue("role", "provider")} className={`rounded-2xl border p-3 text-sm font-black transition ${role === "provider" ? "border-[#182d53] bg-[#182d53] text-white" : "border-[#dfe6ee] bg-[#fbfcfe]"}`}><BriefcaseBusiness className="mx-auto mb-1 h-5 w-5" />مهني</button></div><label className="block space-y-1.5"><span className="text-xs font-extrabold">الاسم الكامل</span><Input className="h-13 rounded-2xl bg-[#fbfcfe]" placeholder="مثال: محمد أحمد علي" {...form.register("name")} /></label><label className="block space-y-1.5"><span className="text-xs font-extrabold">رقم الهاتف</span><Input className="h-13 rounded-2xl bg-[#fbfcfe] text-left" placeholder="7xxxxxxxx" dir="ltr" {...form.register("phone")} /></label><label className="block space-y-1.5"><span className="text-xs font-extrabold">كلمة المرور</span><Input className="h-13 rounded-2xl bg-[#fbfcfe] text-left" type="password" placeholder="6 أحرف على الأقل" dir="ltr" {...form.register("password")} /></label></div>}
            {step === 2 && <div className="space-y-4"><div><h2 className="text-xl font-black">عرّفنا بخدمتك</h2><p className="mt-1 text-xs text-[#8793a3]">اختر مجال العمل والتخصصات التي تتقنها.</p></div><Select value={String(form.watch("categoryId") ?? "")} onValueChange={(value) => { form.setValue("categoryId", Number(value)); setSpecializationIds([]); setServiceIds([]); setPrimarySpecializationId(null); }}><SelectTrigger className="h-13 rounded-2xl bg-[#fbfcfe]"><SelectValue placeholder="اختر مجال الخدمة الرئيسي" /></SelectTrigger><SelectContent>{taxonomy.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</SelectItem>)}</SelectContent></Select><div className="space-y-2"><p className="text-xs font-black">التخصصات الفرعية</p><div className="grid grid-cols-2 gap-2">{selectedCategory?.specializations?.map((specialization: any) => <button type="button" key={specialization.id} onClick={() => { setSpecializationIds((old) => old.includes(specialization.id) ? old.filter((id) => id !== specialization.id) : [...old, specialization.id]); setPrimarySpecializationId((old) => old ?? specialization.id); }} className={`rounded-xl border p-2 text-right text-xs ${specializationIds.includes(specialization.id) ? "border-[#182d53] bg-[#eef3fa] font-bold" : "border-[#dfe6ee]"}`}>{specialization.name}{primarySpecializationId === specialization.id ? " — رئيسي" : ""}</button>)}</div></div><div className="space-y-2"><p className="text-xs font-black">الخدمات التي تنفذها</p><div className="grid grid-cols-2 gap-2">{selectedCategory?.specializations?.filter((item: any) => specializationIds.includes(item.id)).flatMap((item: any) => item.services).map((service: any) => <button type="button" key={service.id} onClick={() => setServiceIds((old) => old.includes(service.id) ? old.filter((id) => id !== service.id) : [...old, service.id])} className={`rounded-xl border p-2 text-right text-xs ${serviceIds.includes(service.id) ? "border-[#182d53] bg-[#eef3fa] font-bold" : "border-[#dfe6ee]"}`}>{service.name}</button>)}</div></div><div className="grid grid-cols-2 gap-2"><Input className="h-12 rounded-xl bg-[#fbfcfe]" placeholder="المدينة" {...form.register("city")} /><Input className="h-12 rounded-xl bg-[#fbfcfe]" placeholder="الحي" {...form.register("district")} /></div><Input className="h-12 rounded-xl bg-[#fbfcfe]" type="number" placeholder="سنوات الخبرة" {...form.register("yearsExperience")} /><Textarea className="min-h-24 rounded-2xl bg-[#fbfcfe]" placeholder="اكتب نبذة قصيرة عن خبرتك وخدماتك" {...form.register("bio")} /></div>}
            {step === 3 && <div className="space-y-4"><div><h2 className="text-xl font-black">أظهر جودة أعمالك</h2><p className="mt-1 text-xs leading-6 text-[#8793a3]">أضف صورًا من أعمالك السابقة لتمنح العملاء ثقة أكبر. يمكنك تخطي هذه الخطوة واستكمالها لاحقًا.</p></div><label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-[#c8d5e4] bg-[#f8fafc] text-center transition hover:border-[#b57920]"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2cc] text-[#b57920]"><ImagePlus className="h-7 w-7" /></span><span className="text-sm font-black">إضافة صور الأعمال</span><span className="text-[11px] text-[#8793a3]">يمكنك اختيار أكثر من صورة</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setPortfolioFiles(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>{portfolioFiles.length > 0 && <div className="rounded-2xl bg-[#eaf7f0] p-3 text-xs font-bold text-[#14794e]">تم اختيار {portfolioFiles.length} صور: {portfolioFiles.join("، ")}</div>}<div className="flex gap-2 rounded-2xl bg-[#f8fafc] p-3 text-xs leading-5 text-[#748399]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b57920]" />لن تظهر صورك للعملاء قبل مراجعة ملفك واعتماده.</div></div>}
            {step === 4 && <div className="space-y-5"><div><h2 className="text-xl font-black">خطوة الثقة الأخيرة</h2><p className="mt-1 text-xs leading-6 text-[#8793a3]">أكمل التوثيق بعد إنشاء الحساب ليظهر ملفك للعملاء.</p></div><div className="space-y-3">{["هوية شخصية أمامية وخلفية", "صورة شخصية واضحة", "صور أعمال سابقة", "شهادات أو تراخيص إن وجدت"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#e2e8ef] bg-[#fbfcfe] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3fa] text-[#182d53]">{index < 2 ? <FileCheck2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}</span><span className="text-sm font-bold">{label}</span><Check className="mr-auto h-4 w-4 text-[#b57920]" /></div>)}</div><div className="rounded-2xl border border-[#f0dfad] bg-[#fffaf0] p-4 text-xs leading-6 text-[#83621c]">بعد الضغط على إنشاء الحساب سننقلك مباشرة إلى شاشة رفع الهوية والتوثيق.</div></div>}
            <div className="mt-7 flex gap-3">{step > 1 && <Button type="button" variant="outline" className="h-13 flex-1 rounded-2xl font-bold" onClick={() => setStep(step - 1)}><ArrowRight className="ml-2 h-4 w-4" />رجوع</Button>}<Button type="button" className="h-13 flex-1 rounded-2xl bg-[#182d53] font-black text-white hover:bg-[#223c69]" onClick={next} disabled={registerMutation.isPending}>{registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : step === 4 ? "إنشاء الحساب" : role === "client" ? "إنشاء حسابي" : <>التالي <ArrowLeft className="mr-2 h-4 w-4 text-[#f0b046]" /></>}</Button></div>
          </div>
        </section>
        <p className="mt-6 text-center text-sm text-[#78879a]">لديك حساب بالفعل؟ <Link href="/login" className="font-black text-[#b57920]">سجل الدخول</Link></p>
      </div>
    </main>
  );
}
