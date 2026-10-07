import { useState } from "react";
import {
  useListAdminUsers,
  useUpdateUserStatus,
  UserStatusUpdateStatus,
} from "@/lib/api-client-react";
import {
  AppPage,
  EmptyState,
  PageHeading,
  SectionHeading,
  SurfaceCard,
} from "@/components/app-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ban,
  Check,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const roleLabel = (role: string) =>
  role === "client" ? "عميل" : role === "provider" ? "مزود خدمة" : "مدير";
const statusLabel = (status: string) =>
  status === "active" ? "نشط" : status === "banned" ? "محظور" : "قيد الانتظار";
const statusClass = (status: string) =>
  status === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "banned"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
const canShowActions = (phone: string, status: string, userRole: string) =>
  Boolean(phone && (status !== "active" || userRole !== "admin"));

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const { toast } = useToast();

  const {
    data: usersPage,
    isLoading,
    isError,
    refetch,
  } = useListAdminUsers(
    {
      search: search || undefined,
      role: role !== "all" ? role : undefined,
    },
    { query: { queryKey: ["adminUsers", search, role] } }
  );

  const updateStatusMutation = useUpdateUserStatus();

  const handleUpdateStatus = (id: number, status: UserStatusUpdateStatus) => {
    updateStatusMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث حالة المستخدم" });
          refetch();
        },
        onError: () =>
          toast({
            title: "تعذر تحديث حالة المستخدم",
            description: "حاول مرة أخرى.",
            variant: "destructive",
          }),
      }
    );
  };

  const renderActions = (
    id: number,
    phone: string,
    status: string,
    userRole: string
  ) => (
    <div className="flex flex-wrap gap-2">
      {phone && status !== "active" && (
        <Button
          size="sm"
          variant="outline"
          className="min-h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => handleUpdateStatus(id, "active")}
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          تنشيط
        </Button>
      )}
      {phone && status !== "banned" && userRole !== "admin" && (
        <Button
          size="sm"
          variant="outline"
          className="min-h-10 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => handleUpdateStatus(id, "banned")}
          disabled={updateStatusMutation.isPending}
        >
          <Ban className="h-4 w-4" />
          حظر
        </Button>
      )}
    </div>
  );

  const users = usersPage?.users ?? [];
  const hasUsers = users.length > 0;

  return (
    <AppPage width="wide">
      <PageHeading
        eyebrow="مركز الإدارة"
        title="إدارة المستخدمين"
        description="ابحث في حسابات المنصة وراجع أدوار المستخدمين وحالاتهم بأمان."
        action={
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="تحديث قائمة المستخدمين"
          >
            <RefreshCw
              className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        }
      />

      <SurfaceCard className="mb-6 p-4 sm:p-5">
        <SectionHeading
          title="البحث والتصفية"
          description="استخدم كلمة واضحة أو حدّد نوع الحساب للوصول بسرعة."
          className="mb-4"
        />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">بحث بالاسم أو رقم الهاتف</span>
            <Search
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="h-12 rounded-2xl pl-4 pr-12"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <div className="relative">
            <SlidersHorizontal
              className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-12 w-full rounded-2xl pr-11">
                <SelectValue placeholder="تصفية حسب نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل أنواع الحسابات</SelectItem>
                <SelectItem value="client">عميل</SelectItem>
                <SelectItem value="provider">مزود خدمة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SurfaceCard>

      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading
          title="قائمة الحسابات"
          description={
            hasUsers
              ? `${usersPage?.total ?? users.length} حساب في النتائج`
              : "لا توجد نتائج مطابقة"
          }
          className="mb-0"
        />
        <span className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-primary/8 text-primary sm:flex">
          <UsersRound className="h-5 w-5" />
        </span>
      </div>

      {isLoading ? (
        <SurfaceCard className="flex min-h-64 items-center justify-center p-8">
          <div
            className="text-center"
            role="status"
            aria-label="جارٍ تحميل المستخدمين"
          >
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-bold text-muted-foreground">
              جارٍ تحميل قائمة المستخدمين...
            </p>
          </div>
        </SurfaceCard>
      ) : isError ? (
        <EmptyState
          icon={UsersRound}
          title="تعذر تحميل المستخدمين"
          description="تحقق من الاتصال وحاول تحديث القائمة مرة أخرى."
          action={
            <Button onClick={() => refetch()} className="min-h-11">
              إعادة المحاولة
            </Button>
          }
        />
      ) : !hasUsers ? (
        <EmptyState
          icon={UserRound}
          title="لا يوجد مستخدمين"
          description={
            search || role !== "all"
              ? "جرّب تغيير كلمات البحث أو نوع الحساب."
              : "ستظهر الحسابات الجديدة هنا عند تسجيلها في المنصة."
          }
        />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {users.map(u => (
              <SurfaceCard key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 font-black text-primary">
                      {u.name?.charAt(0) || "م"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-foreground">
                        {u.name}
                      </p>
                      <p
                        dir="ltr"
                        className="mt-1 text-right text-sm text-muted-foreground"
                      >
                        {u.phone || "لا يوجد رقم هاتف"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusClass(u.status)}>
                    {statusLabel(u.status)}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <Badge variant="outline">{roleLabel(u.role)}</Badge>
                  <span>
                    التسجيل:{" "}
                    {format(new Date(u.createdAt), "yyyy/MM/dd", {
                      locale: ar,
                    })}
                  </span>
                </div>
                {canShowActions(u.phone, u.status, u.role) && (
                  <div className="mt-4">
                    {renderActions(u.id, u.phone, u.status, u.role)}
                  </div>
                )}
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="hidden overflow-hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="px-5 text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="px-5 text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="hover:bg-muted/20">
                    <TableCell className="px-5 py-4 font-bold">
                      {u.name}
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="text-right text-muted-foreground"
                    >
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(u.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(u.createdAt), "yyyy/MM/dd", {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusClass(u.status)}
                      >
                        {statusLabel(u.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5">
                      {renderActions(u.id, u.phone, u.status, u.role)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SurfaceCard>
        </>
      )}
    </AppPage>
  );
}
