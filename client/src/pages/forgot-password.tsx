import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, KeyRound, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Stage = "request" | "reset" | "done";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState<Stage>("request");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function requestReset() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast({ title: "خطأ", description: "أدخل بريدًا إلكترونيًا صحيحًا", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      if (data.resetToken) {
        setToken(data.resetToken);
        setStage("reset");
        toast({ title: "تم إنشاء رمز الاستعادة", description: "رمز التطوير ظاهر في الحقل التالي مؤقتًا." });
      } else {
        setStage("reset");
        toast({ title: "تم إرسال الطلب", description: "إذا كان البريد مسجلاً، ستصلك تعليمات الاستعادة." });
      }
    } catch (err: any) {
      toast({ title: "تعذر إرسال الطلب", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    if (!/^[a-f0-9]{64}$/i.test(token.trim())) {
      toast({ title: "رمز غير صحيح", description: "أدخل رمز الاستعادة المرسل إليك.", variant: "destructive" });
      return;
    }
    if (password.length < 6 || password !== confirmPassword) {
      toast({ title: "تحقق من كلمة المرور", description: "يجب أن تتكون من 6 أحرف أو أرقام وأن تتطابق مع التأكيد.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify({ token: token.trim(), password }) });
      setStage("done");
    } catch (err: any) {
      toast({ title: "تعذر تغيير كلمة المرور", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col" dir="rtl">
      <div className="flex items-center gap-4 p-4 pt-safe">
        <button onClick={() => navigate("/auth/email?mode=login&role=client")} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted" aria-label="رجوع"><ArrowRight className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">استعادة كلمة المرور</h1>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        {stage === "done" ? (
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 text-green-600" /></div>
            <h2 className="text-xl font-bold">تم تغيير كلمة المرور</h2><p className="text-muted-foreground text-sm">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
            <Button onClick={() => navigate("/auth/email?mode=login&role=client")} className="w-full h-12 rounded-2xl">العودة لتسجيل الدخول</Button>
          </motion.div>
        ) : stage === "request" ? (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Mail className="w-7 h-7 text-primary" /></div>
            <div><h2 className="text-xl font-bold mb-2">نسيت كلمة المرور؟</h2><p className="text-muted-foreground text-sm leading-6">أدخل بريد حساب العميل للحصول على رمز استعادة صالح لمدة 15 دقيقة.</p></div>
            <Input type="email" placeholder="بريدك الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" dir="ltr" autoComplete="email" onKeyDown={e => e.key === "Enter" && requestReset()} />
            <Button onClick={requestReset} disabled={loading} className="w-full h-14 rounded-2xl text-lg font-bold">{loading ? "جاري إرسال الرمز..." : "إرسال رمز الاستعادة"}</Button>
          </motion.div>
        ) : (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><KeyRound className="w-7 h-7 text-primary" /></div>
            <div><h2 className="text-xl font-bold mb-2">أدخل رمز الاستعادة</h2><p className="text-muted-foreground text-sm leading-6">أدخل الرمز ثم اختر كلمة مرور جديدة لحساب العميل.</p></div>
            <Input value={token} onChange={e => setToken(e.target.value.replace(/[^a-f0-9]/gi, "").slice(0, 64))} placeholder="رمز الاستعادة" className="h-12 rounded-xl font-mono text-xs" dir="ltr" />
            <div className="relative"><LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="h-12 rounded-xl pr-10" dir="ltr" autoComplete="new-password" /></div>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" className="h-12 rounded-xl" dir="ltr" autoComplete="new-password" />
            <Button onClick={resetPassword} disabled={loading} className="w-full h-14 rounded-2xl text-lg font-bold">{loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}</Button>
            <button onClick={() => setStage("request")} className="w-full text-center text-sm text-primary font-semibold">طلب رمز جديد</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
