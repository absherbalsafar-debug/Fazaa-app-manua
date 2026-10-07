import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  CreditCard,
  Loader2,
  Megaphone,
  RefreshCw,
  WalletCards,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import { useToast } from "@/hooks/use-toast";
import {
  useListAdminPaymentWallets,
  useListAdminSubscriptionPayments,
  useReviewAdvertisement,
  useReviewSubscriptionPayment,
  useUpdatePaymentWallet,
  type PaymentWalletSetting,
} from "@/lib/api-client-react";

const walletNames: Record<string, string> = {
  jeeb: "جيب",
  floosk: "فلوسك",
  jawali: "جوالي",
  cash: "كاش",
  one_cash: "ون كاش",
  hasib: "حاسب",
  easy: "إيزي",
};

export default function AdminBusiness() {
  const { toast } = useToast();
  const {
    data: payments = [],
    isLoading,
    refetch,
  } = useListAdminSubscriptionPayments();
  const { data: walletSettings = [], refetch: refetchWalletSettings } =
    useListAdminPaymentWallets();
  const reviewPayment = useReviewSubscriptionPayment();
  const reviewAd = useReviewAdvertisement();
  const updateWallet = useUpdatePaymentWallet();
  const [note, setNote] = useState("");
  const [adId, setAdId] = useState("");
  const [walletDrafts, setWalletDrafts] = useState<
    Record<string, Omit<PaymentWalletSetting, "wallet">>
  >({});

  useEffect(() => {
    setWalletDrafts(
      Object.fromEntries(
        walletSettings.map(setting => [
          setting.wallet,
          {
            displayName: setting.displayName,
            logoUrl: setting.logoUrl ?? null,
            description: setting.description,
            usage: setting.usage,
            sortOrder: setting.sortOrder,
            merchantName: setting.merchantName,
            merchantAccount: setting.merchantAccount,
            instructions: setting.instructions,
            isActive: setting.isActive,
          },
        ])
      )
    );
  }, [walletSettings]);

  const reviewPaymentRequest = (
    id: number,
    status: "approved" | "rejected"
  ) => {
    reviewPayment.mutate(
      { id, data: { status, adminNote: note.trim() || null } },
      {
        onSuccess: () => {
          setNote("");
          refetch();
          toast({
            title:
              status === "approved" ? "تم اعتماد الاشتراك" : "تم رفض العملية",
          });
        },
        onError: error =>
          toast({
            title: "تعذر تحديث العملية",
            description: error.message,
            variant: "destructive",
          }),
      }
    );
  };

  const reviewAdvertisementRequest = (status: "active" | "rejected") => {
    const id = Number(adId);
    if (!Number.isInteger(id)) {
      toast({ title: "أدخل رقم الإعلان", variant: "destructive" });
      return;
    }
    reviewAd.mutate(
      { id, data: { status, reviewNote: note.trim() || null } },
      {
        onSuccess: () => {
          setAdId("");
          setNote("");
          toast({
            title: status === "active" ? "تم تفعيل الإعلان" : "تم رفض الإعلان",
          });
        },
        onError: error =>
          toast({
            title: "تعذر تحديث الإعلان",
            description: error.message,
            variant: "destructive",
          }),
      }
    );
  };

  const saveWallet = (setting: PaymentWalletSetting) => {
    const draft = walletDrafts[setting.wallet];
    if (!draft) return;
    updateWallet.mutate(
      { wallet: setting.wallet, data: draft },
      {
        onSuccess: () => {
          refetchWalletSettings();
          toast({
            title: `تم حفظ إعدادات محفظة ${walletNames[setting.wallet]}`,
          });
        },
        onError: error =>
          toast({
            title: "تعذر حفظ إعدادات المحفظة",
            description: error.message,
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <div dir="rtl" className="min-h-full">
      <AppPage width="wide">
        <PageHeading
          eyebrow="مركز الإدارة"
          title="الاشتراكات والإعلانات"
          description="راجع التحويلات قبل تفعيل الاشتراكات، واعتمد الإعلانات قبل نشرها."
          action={
            <Button
              variant="outline"
              className="min-h-11 rounded-xl bg-card"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`ml-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
          }
        />

        <SurfaceCard className="mb-7 overflow-hidden">
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <SectionHeading
              title="اعتماد إعلان برقم"
              description="استخدم رقم الإعلان من طلب المهني، ثم اختر قرار المراجعة."
              className="mb-0"
            />
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="grid gap-3 px-5 py-5 sm:px-6 md:grid-cols-[160px_1fr_auto_auto]">
            <Input
              value={adId}
              onChange={event => setAdId(event.target.value)}
              placeholder="رقم الإعلان"
              inputMode="numeric"
              className="min-h-11 rounded-xl"
            />
            <Textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="ملاحظة الإدارة (اختيارية)"
              className="min-h-11 rounded-xl md:min-h-11"
            />
            <Button
              className="min-h-11 rounded-xl"
              onClick={() => reviewAdvertisementRequest("active")}
              disabled={reviewAd.isPending}
            >
              {reviewAd.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="ml-2 h-4 w-4" />
              )}
              تفعيل
            </Button>
            <Button
              className="min-h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
              variant="outline"
              onClick={() => reviewAdvertisementRequest("rejected")}
              disabled={reviewAd.isPending}
            >
              <X className="ml-2 h-4 w-4" />
              رفض
            </Button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="mb-7 overflow-hidden">
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <SectionHeading
              title="أرقام وحسابات المحافظ"
              description="تظهر البيانات المفعلة للمهني عند اختيار المحفظة أثناء الدفع اليدوي."
              className="mb-0"
            />
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          {walletSettings.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                icon={CreditCard}
                title="لا توجد محافظ مضافة"
                description="ستظهر إعدادات المحافظ المتاحة للدفع اليدوي هنا."
              />
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
              {walletSettings.map(setting => {
                const draft = walletDrafts[setting.wallet] ?? setting;
                return (
                  <div
                    key={setting.wallet}
                    className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-foreground">
                          {walletNames[setting.wallet]}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          بيانات التحويل اليدوي
                        </p>
                      </div>
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 text-xs font-bold text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={event =>
                            setWalletDrafts(current => ({
                              ...current,
                              [setting.wallet]: {
                                ...draft,
                                isActive: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 accent-[hsl(var(--primary))]"
                        />
                        مفعلة
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={draft.merchantName}
                        onChange={event =>
                          setWalletDrafts(current => ({
                            ...current,
                            [setting.wallet]: {
                              ...draft,
                              merchantName: event.target.value,
                            },
                          }))
                        }
                        placeholder="اسم التاجر (اختياري)"
                        className="min-h-11 rounded-xl"
                      />
                      <Input
                        value={draft.merchantAccount}
                        onChange={event =>
                          setWalletDrafts(current => ({
                            ...current,
                            [setting.wallet]: {
                              ...draft,
                              merchantAccount: event.target.value,
                            },
                          }))
                        }
                        placeholder="رقم أو حساب التاجر"
                        className="min-h-11 rounded-xl text-left"
                        dir="ltr"
                      />
                      <Textarea
                        value={draft.instructions}
                        onChange={event =>
                          setWalletDrafts(current => ({
                            ...current,
                            [setting.wallet]: {
                              ...draft,
                              instructions: event.target.value,
                            },
                          }))
                        }
                        placeholder="تعليمات التحويل (اختيارية)"
                        className="min-h-24 resize-y rounded-xl"
                      />
                      <Button
                        className="min-h-11 w-full rounded-xl"
                        onClick={() => saveWallet(setting)}
                        disabled={updateWallet.isPending}
                      >
                        {updateWallet.isPending ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : null}
                        حفظ إعدادات {walletNames[setting.wallet]}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <SectionHeading
              title="طلبات تحويل الاشتراك"
              description="التحويلات لا تفعّل الاشتراك آلياً."
              className="mb-0"
            />
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          {isLoading ? (
            <div className="grid gap-3 p-5 sm:p-6">
              <div className="h-28 animate-pulse rounded-2xl bg-muted/50" />
              <div className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                icon={WalletCards}
                title="لا توجد طلبات دفع"
                description="ستظهر تحويلات الاشتراك الجديدة هنا للمراجعة."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map(payment => (
                <article
                  key={payment.id}
                  className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-[1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-foreground">
                        #{payment.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          payment.status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-border"
                        }
                      >
                        {payment.status === "pending"
                          ? "قيد المراجعة"
                          : payment.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6">
                      المهني #{payment.providerId} ·{" "}
                      {payment.plan === "yearly" ? "سنوي" : "شهري"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      محفظة {walletNames[payment.wallet] ?? payment.wallet} ·
                      رقم العملية:{" "}
                      <b dir="ltr">{payment.transactionReference}</b>
                    </p>
                    {payment.receiptUrl && (
                      <a
                        className="mt-2 inline-flex min-h-10 items-center font-bold text-primary underline underline-offset-4"
                        href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${payment.receiptUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        فتح الإيصال
                      </a>
                    )}
                  </div>
                  <div className="rounded-xl bg-muted/35 px-3 py-2 text-xs leading-6 text-muted-foreground">
                    {payment.adminNote || "لا توجد ملاحظة"}
                    <p className="mt-1">
                      {new Date(payment.createdAt).toLocaleString("ar-YE")}
                    </p>
                  </div>
                  {payment.status === "pending" ? (
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Button
                        className="min-h-11 rounded-xl"
                        onClick={() =>
                          reviewPaymentRequest(payment.id, "approved")
                        }
                        disabled={reviewPayment.isPending}
                      >
                        {reviewPayment.isPending ? (
                          <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="ml-1 h-4 w-4" />
                        )}
                        اعتماد
                      </Button>
                      <Button
                        className="min-h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                        variant="outline"
                        onClick={() =>
                          reviewPaymentRequest(payment.id, "rejected")
                        }
                        disabled={reviewPayment.isPending}
                      >
                        <X className="ml-1 h-4 w-4" />
                        رفض
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      تمت المراجعة
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </SurfaceCard>
      </AppPage>
    </div>
  );
}
