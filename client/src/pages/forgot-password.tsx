import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleSubmit() {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "أدخل بريدك الإلكتروني",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (data.resetToken) setDevToken(data.resetToken);
      setSent(true);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-background text-foreground" dir="rtl">
      <AppPage
        width="mobile"
        className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-5 sm:px-8 sm:pt-8"
      >
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/login?method=email")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-secondary"
            aria-label="العودة لتسجيل الدخول"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-accent-foreground">
              مساعدة الحساب
            </p>
            <h1 className="text-lg font-black tracking-tight">
              استعادة كلمة المرور
            </h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          {sent ? (
            <SurfaceCard className="p-6 sm:p-7">
              <EmptyState
                icon={CheckCircle}
                title="تم إرسال رابط الاستعادة"
                description="إذا كان البريد مسجلاً ستصلك رسالة لإعادة تعيين كلمة المرور."
                className="border-0 bg-transparent px-0 py-3"
              />
              {devToken && (
                <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-right text-xs text-accent-foreground">
                  <p className="mb-1 font-black">رمز التطوير:</p>
                  <p className="break-all font-mono" dir="ltr">
                    {devToken}
                  </p>
                </div>
              )}
              <Button
                onClick={() => navigate("/login?method=email")}
                className="mt-6 h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground hover:bg-primary/90"
              >
                العودة لتسجيل الدخول{" "}
                <ArrowLeft className="mr-2 h-4 w-4 text-accent" />
              </Button>
            </SurfaceCard>
          ) : (
            <>
              <PageHeading
                eyebrow="خطوة بسيطة وآمنة"
                title="نسيت كلمة المرور؟"
                description="أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة."
                className="mb-7"
              />
              <SurfaceCard className="p-5 sm:p-6">
                <div className="mb-6 flex items-start gap-3 rounded-2xl bg-secondary/65 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-accent">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <p className="text-xs leading-6 text-muted-foreground">
                    سنرسل تعليمات آمنة إلى بريدك الإلكتروني إذا كان مرتبطًا
                    بحساب فزعة.
                  </p>
                </div>
                <label className="mb-2 block text-xs font-extrabold">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="بريدك الإلكتروني"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-14 rounded-2xl border-input bg-background pr-10 text-left text-base shadow-none focus-visible:ring-accent"
                    dir="ltr"
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-5 h-14 w-full rounded-2xl bg-primary text-base font-black text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري
                      الإرسال...
                    </>
                  ) : (
                    <>
                      إرسال رابط الاستعادة{" "}
                      <ArrowLeft className="mr-2 h-4 w-4 text-accent" />
                    </>
                  )}
                </Button>
              </SurfaceCard>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground" />{" "}
                لن نكشف ما إذا كان البريد مسجلاً أم لا
              </p>
            </>
          )}
        </div>
      </AppPage>
    </main>
  );
}
