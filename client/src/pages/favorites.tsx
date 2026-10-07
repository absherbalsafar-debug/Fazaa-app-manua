import { useListFavorites } from "@/lib/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "@/components/app-ui";

export default function Favorites() {
  const {
    data: favorites,
    isLoading,
    isError,
    refetch,
  } = useListFavorites({
    query: { queryKey: ["favorites"] },
  });

  return (
    <div className="app-stage min-h-[100dvh] bg-background" dir="rtl">
      <AppPage width="mobile">
        <PageHeading
          eyebrow="مساحتك المحفوظة"
          title="المفضلة"
          description="ارجع إلى المهنيين الذين تثق بهم وابدأ طلبك بسهولة."
        />

        {isLoading ? (
          <SurfaceCard className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <div>
              <p className="font-extrabold">جارٍ تحميل المفضلة</p>
              <p className="mt-1 text-sm text-muted-foreground">
                لحظات ونجهز لك القائمة.
              </p>
            </div>
          </SurfaceCard>
        ) : isError ? (
          <EmptyState
            icon={RefreshCw}
            title="تعذر تحميل المفضلة"
            description="تحقق من اتصالك بالإنترنت وحاول مرة أخرى."
            action={
              <Button
                type="button"
                onClick={() => refetch()}
                className="min-h-11 rounded-xl bg-primary px-5 font-bold"
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
            }
          />
        ) : !favorites || favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="لا يوجد مهنيون مفضلون"
            description="قم بإضافة المهنيين إلى المفضلة للرجوع إليهم لاحقاً."
          />
        ) : (
          <section aria-label="المهنيون المفضلون" className="space-y-4">
            {favorites.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </section>
        )}
      </AppPage>
    </div>
  );
}
