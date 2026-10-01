import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@/lib/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const loginSchema = z.object({
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user as any);
        toast({ title: "مرحباً بك مجدداً", description: "تم تسجيل الدخول بنجاح" });
        setLocation("/");
      },
      onError: () => toast({ title: "تعذر تسجيل الدخول", description: "تأكد من رقم الهاتف وكلمة المرور ثم حاول مرة أخرى", variant: "destructive" }),
    });
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f6f8fb] text-[#182d53]" dir="rtl">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#dfeafa] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#fff0c8] blur-3xl" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-7 pt-6 sm:max-w-lg sm:px-9">
        <header className="flex items-center justify-between">
          <Link href="/welcome" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9e1ea] bg-white shadow-sm transition hover:bg-[#f0f4f8]" aria-label="العودة"><ArrowRight className="h-4 w-4" /></Link>
          <BrandLogo className="h-16 w-24 object-contain" />
          <span className="h-2 w-2 rounded-full bg-[#f0b046]" aria-hidden="true" />
        </header>

        <section className="mt-8 flex-1">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f0b046]/30 bg-[#fff7df] px-3 py-2 text-[10px] font-extrabold text-[#9a6b18]"><Sparkles className="h-3.5 w-3.5" /> دخول آمن وسريع</span>
            <h1 className="mt-4 text-[34px] font-black leading-tight tracking-[-0.04em]">أهلاً بعودتك<span className="block text-[#b57920]">إلى فزعة</span></h1>
            <p className="mt-3 max-w-sm text-sm leading-7 text-[#68778d]">سجّل دخولك وتابع طلباتك، محادثاتك، وخدماتك من مكان واحد.</p>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#dfe6ee] bg-white/80 p-2 shadow-[0_10px_26px_rgba(24,45,83,0.05)]">
            {[{ icon: ShieldCheck, label: "حساب محمي" }, { icon: Phone, label: "دخول سهل" }, { icon: KeyRound, label: "خصوصية تامة" }].map(({ icon: Icon, label }) => <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-[#f8fafc] py-2 text-center"><Icon className="h-4 w-4 text-[#b57920]" /><span className="text-[10px] font-bold text-[#66758a]">{label}</span></div>)}
          </div>

          <div className="rounded-[28px] border border-[#dfe6ee] bg-white p-5 shadow-[0_18px_42px_rgba(24,45,83,0.09)]">
            <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#182d53] text-[#f0b046]"><LockKeyhole className="h-5 w-5" /></div><div><h2 className="text-base font-black">بيانات الدخول</h2><p className="mt-0.5 text-[11px] text-[#8793a3]">أدخل بيانات حسابك المسجلة</p></div></div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel className="text-xs font-extrabold">رقم الهاتف</FormLabel><FormControl><div className="relative"><Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input placeholder="7xxxxxxxx" type="tel" dir="ltr" className="h-13 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] pr-10 text-left text-base shadow-none focus-visible:ring-[#f0b046]" {...field} /></div></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="password" render={({ field }) => <FormItem><div className="flex items-center justify-between"><FormLabel className="text-xs font-extrabold">كلمة المرور</FormLabel><Link href="/forgot-password" className="text-[11px] font-bold text-[#b57920] hover:underline">نسيت كلمة المرور؟</Link></div><FormControl><div className="relative"><LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6b5]" /><Input placeholder="••••••••" type={showPassword ? "text" : "password"} dir="ltr" className="h-13 rounded-2xl border-[#d7e0ea] bg-[#fbfcfe] px-10 text-left text-base shadow-none focus-visible:ring-[#f0b046]" {...field} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8793a3]" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>} />
                <Button type="submit" className="h-14 w-full rounded-2xl bg-[#182d53] text-base font-black text-white shadow-[0_14px_28px_rgba(24,45,83,0.18)] hover:bg-[#223c69]" disabled={loginMutation.isPending}>{loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>دخول إلى حسابي <ArrowLeft className="mr-2 h-4 w-4 text-[#f0b046]" /></>}</Button>
              </form>
            </Form>
          </div>

          <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-[#dce3eb]" /><span className="text-[10px] font-bold text-[#9aa6b5]">أو</span><div className="h-px flex-1 bg-[#dce3eb]" /></div>
          <Link href="/auth/phone?mode=login&role=client" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d8e1eb] bg-white text-sm font-extrabold text-[#182d53] shadow-sm transition hover:border-[#b8c8dc]"><Phone className="h-4 w-4 text-[#b57920]" /> الدخول برقم الهاتف ورمز التحقق</Link>
        </section>
        <p className="mt-6 text-center text-sm text-[#78879a]">ليس لديك حساب؟ <Link href="/welcome" className="font-black text-[#b57920] hover:underline">أنشئ حسابك الآن</Link></p>
      </div>
    </main>
  );
}
