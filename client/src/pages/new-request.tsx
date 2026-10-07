import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetProvider, useCreateRequest } from "@/lib/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AppPage,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";

const requestSchema = z.object({
  serviceType: z.string().min(2, "الرجاء تحديد نوع الخدمة"),
  description: z.string().min(10, "الرجاء كتابة وصف تفصيلي للمشكلة"),
  city: z.string().min(2, "الرجاء تحديد المدينة"),
  district: z.string().min(2, "الرجاء تحديد المنطقة"),
  isImmediate: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable(),
});

type RequestFormInput = z.input<typeof requestSchema>;
type RequestFormOutput = z.output<typeof requestSchema>;

export default function NewRequest() {
  const searchParams = new URLSearchParams(window.location.search);
  const providerId = searchParams.get("providerId")
    ? parseInt(searchParams.get("providerId")!)
    : 0;
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    data: provider,
    isLoading: isProviderLoading,
    isError: isProviderError,
  } = useGetProvider(providerId, {
    query: { enabled: !!providerId, queryKey: ["provider", providerId] },
  });
  const createRequestMutation = useCreateRequest();

  const form = useForm<RequestFormInput, unknown, RequestFormOutput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      serviceType: "",
      description: "",
      city: user?.city ?? "",
      district: "",
      isImmediate: true,
      scheduledAt: "",
    },
  });
  const isImmediate = form.watch("isImmediate");

  const onSubmit = (values: RequestFormOutput) => {
    if (!providerId) return;
    createRequestMutation.mutate(
      {
        data: {
          providerId,
          serviceType: values.serviceType,
          description: values.description,
          city: values.city,
          district: values.district,
          isImmediate: values.isImmediate,
          scheduledAt: values.isImmediate ? undefined : values.scheduledAt,
        },
      },
      {
        onSuccess: () => setIsSuccess(true),
        onError: error => {
          const apiError = error as {
            status?: number;
            data?: { error?: string };
          };
          const description =
            apiError.status === 401
              ? "انتهت جلسة الدخول، الرجاء تسجيل الدخول مرة أخرى"
              : apiError.data?.error ||
                "لم نتمكن من إرسال الطلب، الرجاء المحاولة مرة أخرى";
          toast({ title: "حدث خطأ", description, variant: "destructive" });
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] bg-background px-4 py-8" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg items-center justify-center">
          <SurfaceCard className="relative w-full overflow-hidden p-7 text-center sm:p-10">
            <div
              className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="relative mt-6 text-xs font-extrabold text-accent-foreground">
              تمت الخطوة بنجاح
            </p>
            <h1 className="relative mt-2 text-2xl font-black tracking-tight text-foreground">
              تم إرسال الطلب بنجاح!
            </h1>
            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              سيقوم المهني بمراجعة طلبك والرد عليك في أقرب وقت ممكن.
            </p>
            <div className="relative mt-8 space-y-3">
              <Link href="/my-requests" className="block w-full">
                <Button className="h-14 w-full rounded-2xl text-base font-black">
                  متابعة طلباتي
                </Button>
              </Link>
              <Link href="/" className="block w-full">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-primary/20 text-primary"
                >
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl border-primary/15 bg-card text-primary"
            onClick={() => window.history.back()}
            aria-label="العودة"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-accent-foreground">
              خطوة واحدة للبدء
            </p>
            <h1 className="truncate text-base font-black text-foreground sm:text-lg">
              طلب خدمة جديدة
            </h1>
          </div>
          <div
            className="mr-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8 text-primary"
            aria-hidden="true"
          >
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
      </header>

      <AppPage width="mobile" className="app-stage premium-surface">
        <PageHeading
          eyebrow="فزعة تساعدك"
          title="ما الخدمة التي تحتاجها؟"
          description="أرسل التفاصيل الأساسية، وسيتواصل معك المهني مباشرة للاتفاق على السعر والتنفيذ."
          className="mb-5"
        />

        {isProviderLoading && (
          <SurfaceCard className="mb-6 flex items-center gap-3 p-4">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
            </div>
            <Loader2
              className="h-5 w-5 animate-spin text-primary"
              aria-label="جارٍ التحميل"
            />
          </SurfaceCard>
        )}

        {provider && (
          <SurfaceCard className="mb-6 border-primary/10 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-card shadow-sm">
                <AvatarImage
                  src={provider.avatarUrl || ""}
                  alt={provider.name}
                />
                <AvatarFallback className="bg-primary/10 font-black text-primary">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">
                  طلب خدمة من
                </p>
                <p className="mt-0.5 truncate font-black text-foreground">
                  {provider.name}
                </p>
                <p className="mt-0.5 text-xs font-bold text-primary">
                  {provider.categoryName}
                </p>
              </div>
              <span className="mr-auto flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                موثوق
              </span>
            </div>
          </SurfaceCard>
        )}

        {(isProviderError || !providerId) && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50/70 p-4 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-6">
              تعذر تحميل بيانات المهني. يمكنك تعبئة الطلب، وسنحاول إكماله عند
              الإرسال.
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <SurfaceCard className="p-5 sm:p-6">
              <SectionHeading
                title="تفاصيل الخدمة"
                description="كلما كانت التفاصيل أوضح، ساعدنا المهني على فهم احتياجك بسرعة."
              />
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3.5 text-sm leading-6 text-primary">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  فزعة تربطك بالمهني فقط. سيتم الاتفاق على السعر والتنفيذ مباشرة
                  عبر الاتصال أو واتساب، ولا يتم الدفع مقابل الخدمة داخل
                  التطبيق.
                </p>
              </div>
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">
                        نوع الخدمة المطلوبة
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 rounded-xl bg-background"
                          placeholder="مثال: إصلاح تسريب مياه، تأسيس كهرباء..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">وصف المشكلة</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اشرح المشكلة بالتفصيل لمساعدة المهني على فهم المطلوب..."
                          className="min-h-32 resize-none rounded-xl bg-background leading-7"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <SectionHeading
                title="الموقع"
                description="أين تحتاج تنفيذ الخدمة؟"
              />
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-3 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>نستخدم موقعك لتسهيل وصول المهني المناسب.</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">المدينة</FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 rounded-xl bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">
                        المنطقة / الحي
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 rounded-xl bg-background"
                          placeholder="مثال: حدة، شعوب..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <SectionHeading
                title="الموعد"
                description="اختر الوقت الأنسب لتنفيذ الخدمة."
              />
              <FormField
                control={form.control}
                name="isImmediate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-primary">
                        <Clock3 className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-black">
                          أحتاج الخدمة الآن
                        </FormLabel>
                        <p className="text-xs leading-5 text-muted-foreground">
                          أريد من المهني الحضور في أسرع وقت ممكن
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="أحتاج الخدمة الآن"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {!isImmediate && (
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="mt-5">
                      <FormLabel className="font-bold">
                        موعد الزيارة المقترح
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 rounded-xl bg-background"
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </SurfaceCard>

            <Button
              type="submit"
              className="h-14 w-full rounded-2xl bg-accent text-base font-black text-primary shadow-lg shadow-accent/20 hover:bg-accent/90"
              disabled={createRequestMutation.isPending || !providerId}
            >
              {createRequestMutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Calendar className="h-5 w-5" /> تأكيد وإرسال الطلب
                </>
              )}
            </Button>
            {!providerId && (
              <p className="text-center text-xs text-muted-foreground">
                اختر مهنيًا أولاً حتى تتمكن من إرسال الطلب.
              </p>
            )}
          </form>
        </Form>
      </AppPage>
    </div>
  );
}
