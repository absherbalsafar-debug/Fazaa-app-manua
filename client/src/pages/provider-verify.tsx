import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle,
  FileCheck2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";

type DocumentType =
  | "selfie"
  | "id_front"
  | "id_back"
  | "portfolio"
  | "certificate";
const docs: Array<{
  type: DocumentType;
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
}> = [
  {
    type: "selfie",
    title: "الصورة الشخصية",
    description: "صورة واضحة لوجهك بإضاءة جيدة",
    accept: "image/*",
  },
  {
    type: "id_front",
    title: "الهوية من الأمام",
    description: "صورة كاملة وواضحة للوجه الأمامي",
    accept: "image/*,application/pdf",
  },
  {
    type: "id_back",
    title: "الهوية من الخلف",
    description: "صورة كاملة وواضحة للوجه الخلفي",
    accept: "image/*,application/pdf",
  },
  {
    type: "portfolio",
    title: "صور الأعمال السابقة",
    description: "صور حقيقية من أعمالك المنجزة",
    accept: "image/*",
    multiple: true,
  },
  {
    type: "certificate",
    title: "الشهادات والتراخيص",
    description: "اختياري: أرفق ما يثبت خبرتك",
    accept: "image/*,application/pdf",
    multiple: true,
  },
];

export default function ProviderVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Partial<Record<DocumentType, File[]>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const current = docs[step];
  const progress = Math.round(((step + 1) / docs.length) * 100);
  const requiredReady = useMemo(
    () =>
      Boolean(files.id_front?.length && files.id_back?.length && termsAccepted),
    [files, termsAccepted]
  );

  useEffect(() => {
    let active = true;
    if (localStorage.getItem("fazaah_verification_submitted") === "true")
      setSubmitted(true);
    apiRequest("/providers/me/verification-status")
      .then(status => {
        if (active && status?.submitted) setSubmitted(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const selectFiles = (type: DocumentType, selected: FileList | null) => {
    const list = Array.from(selected ?? []);
    if (!list.length) return;
    const valid = list.filter(
      file =>
        file.size <= 10 * 1024 * 1024 &&
        (file.type.startsWith("image/") || file.type === "application/pdf")
    );
    if (valid.length !== list.length)
      toast({
        title: "ملف غير صالح",
        description: "يسمح بالصور أو PDF حتى 10 ميجابايت.",
        variant: "destructive",
      });
    setFiles(old => ({ ...old, [type]: valid }));
  };

  const submit = async () => {
    if (!requiredReady) {
      toast({
        title: "أكمل متطلبات الاعتماد",
        description:
          "صورة الهوية الأمامية والخلفية والموافقة على التعهد مطلوبة.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      for (const item of docs) {
        for (const file of files[item.type] ?? []) {
          const upload = await apiRequest("/storage/uploads/request-url", {
            method: "POST",
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              contentType: file.type,
            }),
          });
          const response = await fetch(upload.uploadURL, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!response.ok) throw new Error("تعذر رفع أحد الملفات");
          await apiRequest("/providers/me/verification-documents", {
            method: "POST",
            body: JSON.stringify({
              type: item.type,
              objectPath: upload.objectPath,
              originalName: file.name,
            }),
          });
        }
      }
      localStorage.setItem("fazaah_verification_submitted", "true");
      setSubmitted(true);
      toast({
        title: "تم إرسال طلب الاعتماد بنجاح",
        description: "سيتم مراجعة بياناتك ومستنداتك وإشعارك فور اعتماد حسابك.",
      });
    } catch (error) {
      toast({
        title: "تعذر إرسال التوثيق",
        description: error instanceof Error ? error.message : "حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (submitted)
    return (
      <main
        className="app-stage premium-surface min-h-[100dvh] bg-background"
        dir="rtl"
      >
        <AppPage
          width="mobile"
          className="flex min-h-[100dvh] items-center py-8"
        >
          <EmptyState
            icon={CheckCircle}
            title="طلبك قيد المراجعة"
            description="راجع فريق فزعة مستنداتك. لن يظهر ملفك للعملاء قبل اعتماد الهوية والبيانات."
            className="w-full border-green-200/70 bg-card px-5 py-10 shadow-[0_18px_45px_rgba(14,47,98,0.08)] [&>span]:bg-green-100 [&>span]:text-green-700"
            action={
              <Button
                className="h-12 w-full rounded-xl"
                onClick={() => navigate("/provider-dashboard")}
              >
                العودة إلى لوحة المهني
              </Button>
            }
          />
        </AppPage>
      </main>
    );

  return (
    <main
      className="app-stage premium-surface min-h-[100dvh] bg-background"
      dir="rtl"
    >
      <AppPage width="mobile" className="pt-4 sm:pt-8">
        <PageHeading
          eyebrow="حماية العملاء تبدأ من التوثيق"
          title="طلب اعتماد مهني"
          description="أكمل الخطوات التالية ليتمكن فريق فزعة من مراجعة ملفك بأمان."
          action={
            <button
              type="button"
              onClick={() => navigate("/profile")}
              aria-label="العودة إلى الملف الشخصي"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition hover:border-primary/40"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          }
          className="mb-6 items-center"
        />

        <div className="space-y-4">
          <SurfaceCard className="border-primary/10 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs font-extrabold text-muted-foreground">
              <span>
                المرحلة {step + 1} من {docs.length}
              </span>
              <span className="text-primary">{progress}% مكتمل</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              aria-label={`نسبة الإنجاز ${progress}%`}
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
              {docs.map((item, index) => (
                <span
                  key={item.type}
                  className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="flex items-start gap-3 border-amber-200/70 bg-amber-50/80 p-4 text-amber-950 shadow-none sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="text-sm leading-6">
              <b>حسابك سيبقى قيد المراجعة.</b>
              <br />
              <span className="text-amber-900/80">
                لن يظهر للعملاء ولن يستقبل طلبات حتى تعتمد الإدارة ثم تفعل
                اشتراكك.
              </span>
            </p>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden p-5 shadow-[0_16px_40px_rgba(14,47,98,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                {current.type === "portfolio" ? (
                  <ImagePlus className="h-6 w-6" />
                ) : (
                  <FileCheck2 className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-foreground">
                  {current.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {current.description}
                </p>
              </div>
            </div>

            <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/[0.035] px-4 text-center transition hover:border-primary/50 hover:bg-primary/[0.06]">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                <Upload className="h-6 w-6" />
              </span>
              <span className="font-extrabold text-foreground">
                اضغط لاختيار {current.multiple ? "الملفات" : "الملف"}
              </span>
              <span className="text-xs leading-5 text-muted-foreground">
                JPG أو PNG أو WEBP أو PDF — حتى 10 ميجابايت
              </span>
              <input
                type="file"
                accept={current.accept}
                multiple={current.multiple}
                className="sr-only"
                onChange={event =>
                  selectFiles(current.type, event.target.files)
                }
              />
            </label>

            {files[current.type]?.length ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-900">
                <b>تم اختيار {files[current.type]?.length} ملف:</b>{" "}
                {files[current.type]?.map(file => file.name).join("، ")}
              </div>
            ) : null}

            {step === docs.length - 1 && (
              <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4">
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={event => setTermsAccepted(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-primary"
                  />
                  <span>
                    أوافق على التعهد والشروط والأحكام.{" "}
                    <button
                      type="button"
                      className="font-bold text-primary underline underline-offset-2"
                      onClick={() =>
                        window.alert(
                          "أتعهد بأن جميع البيانات والمستندات صحيحة، وأوافق على مراجعتها من فريق فزعة."
                        )
                      }
                    >
                      قراءة التعهد
                    </button>
                  </span>
                </label>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => setStep(step - 1)}
                >
                  رجوع
                </Button>
              )}
              {step < docs.length - 1 ? (
                <Button
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => setStep(step + 1)}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  className="h-12 flex-1 rounded-xl"
                  onClick={submit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جارٍ الإرسال
                    </>
                  ) : (
                    "إرسال طلب الاعتماد"
                  )}
                </Button>
              )}
            </div>
          </SurfaceCard>
        </div>
      </AppPage>
    </main>
  );
}
