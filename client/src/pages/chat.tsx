import { useState, useRef, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetMessages, useSendMessage } from "@/lib/api-client-react";
import { apiRequest, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Loader2,
  Phone,
  MoreVertical,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
interface ChatTarget {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl?: string | null;
  otherUserPhone?: string | null;
}
function getApiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "الرجاء المحاولة مرة أخرى";
}
export default function Chat() {
  const [, params] = useRoute("/messages/:id");
  const [, setLocation] = useLocation();
  const otherUserId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<ChatTarget | null>(null);
  const [isResolvingTarget, setIsResolvingTarget] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    setTarget(null);
    setIsResolvingTarget(true);
    if (!otherUserId) {
      setIsResolvingTarget(false);
      return;
    }
    apiRequest(`/conversations/with/${otherUserId}`, { method: "POST" })
      .then(c => {
        if (!cancelled) setTarget(c as ChatTarget);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          toast({
            title: "تعذر فتح المحادثة",
            description:
              error instanceof Error
                ? error.message
                : "الرجاء المحاولة مرة أخرى",
            variant: "destructive",
          });
      })
      .finally(() => {
        if (!cancelled) setIsResolvingTarget(false);
      });
    return () => {
      cancelled = true;
    };
  }, [otherUserId, toast]);
  const {
    data: messages,
    isLoading: isMessagesLoading,
    refetch,
  } = useGetMessages(target?.id ?? 0, {
    query: {
      enabled: !!target?.id,
      queryKey: ["messages", target?.id],
      refetchInterval: 3000,
    },
  });
  const sendMutation = useSendMessage();
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !target?.id) return;
    sendMutation.mutate(
      { id: target.id, data: { content: trimmed } },
      {
        onSuccess: () => {
          setContent("");
          refetch();
          inputRef.current?.focus();
        },
        onError: error =>
          toast({
            title: "تعذر إرسال الرسالة",
            description:
              error instanceof Error
                ? error.message
                : "الرجاء المحاولة مرة أخرى",
            variant: "destructive",
          }),
      }
    );
  };
  const otherMessage = messages?.find(m => m.senderId === otherUserId);
  const otherName =
    target?.otherUserName || otherMessage?.senderName || "مستخدم";
  const otherAvatar = target?.otherUserAvatarUrl || "";
  const handleCall = () => {
    if (target?.otherUserId) {
      apiRequest("/calls", {
        method: "POST",
        body: JSON.stringify({ calleeId: target.otherUserId }),
      })
        .then(call => setLocation(`/call/${(call as { id: string }).id}`))
        .catch(error =>
          toast({
            title: "تعذر بدء المكالمة",
            description: getApiErrorMessage(error),
            variant: "destructive",
          })
        );
      return;
    }
    toast({ title: "تعذر تحديد المستخدم", variant: "destructive" });
  };
  if (isResolvingTarget || isMessagesLoading)
    return (
      <div
        className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-6 text-center"
        dir="rtl"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="h-7 w-7 animate-spin" />
        </span>
        <p className="text-sm font-bold text-muted-foreground">
          جاري فتح المحادثة...
        </p>
      </div>
    );
  return (
    <div className="flex h-[100dvh] flex-col bg-background" dir="rtl">
      <header className="shrink-0 border-b border-border/60 bg-card px-4 pb-3 pt-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/messages">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl"
              aria-label="العودة للرسائل"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-11 w-11 shrink-0 border border-border">
            <AvatarImage src={otherAvatar} />
            <AvatarFallback className="bg-primary/10 font-extrabold text-primary">
              {otherName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-extrabold text-foreground">
              {otherName}
            </h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              محادثة آمنة داخل فزعة
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCall}
            className="h-11 w-11 shrink-0 rounded-2xl text-primary"
            aria-label="اتصال"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 shrink-0 rounded-2xl sm:inline-flex"
            aria-label="المزيد"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-background px-4 py-5 sm:px-6"
      >
        <div className="mx-auto max-w-3xl space-y-3">
          {messages?.length === 0 && (
            <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <MessageCircle className="h-7 w-7" />
              </span>
              <p className="text-sm font-bold text-muted-foreground">
                أرسل أول رسالة لبدء المحادثة
              </p>
              <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                تواصل مع مقدم الخدمة بسهولة ووضوح.
              </p>
            </div>
          )}
          {messages?.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            const showTime =
              i === 0 ||
              (messages[i - 1] && msg.senderId !== messages[i - 1].senderId);
            return (
              <AnimatePresence key={msg.id}>
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end gap-2 ${isMe ? "justify-start" : "justify-end"}`}
                >
                  {!isMe && showTime && (
                    <Avatar className="mb-0.5 h-7 w-7 shrink-0">
                      <AvatarImage src={otherAvatar} />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {otherName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isMe && !showTime && <div className="w-7 shrink-0" />}
                  <div
                    className={`flex max-w-[84%] flex-col gap-1 sm:max-w-[72%] ${isMe ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${isMe ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border border-border/70 bg-card text-foreground"}`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`flex items-center gap-1 ${isMe ? "pr-1" : "pl-1"}`}
                    >
                      <time className="text-[9px] text-muted-foreground">
                        {msg.createdAt
                          ? format(new Date(msg.createdAt), "hh:mm a", {
                              locale: ar,
                            })
                          : ""}
                      </time>
                      {isMe && (
                        <CheckCheck className="h-3 w-3 text-primary/60" />
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 border-t border-border/60 bg-card px-3 py-3 pb-safe sm:px-6">
        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="h-12 flex-1 rounded-2xl border-border/70 bg-background text-sm focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="نص الرسالة"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!content.trim() || sendMutation.isPending}
            aria-label="إرسال الرسالة"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 rtl:-scale-x-100" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
