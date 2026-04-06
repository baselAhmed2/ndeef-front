"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatRequestPayload = {
  message: string;
  history: Array<{ role: string; content: string }>;
};

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function normalizeRole(role: ChatRole) {
  return role === "user" ? "user" : "assistant";
}

function isTableSeparatorLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return false;
  // e.g. |---|---|
  return /(\|)\s*:?-{3,}\s*:?\s*(\|)/.test(trimmed);
}

function formatHallucinatedOrders(text: string) {
  // Catch AI hallucinations where it outputs bullet points instead of an actual table
  if (!text.includes("طلب رقم") || text.includes("| رقم الطلب |")) return text;

  const lines = text.split("\n");
  const tableRows: string[] = [];
  const otherLines: string[] = [];

  const regex = /طلب رقم (.*?) من مغسلة (.*?)،\s*تكلفته (.*?)،\s*وحالته:\s*(.*)/;

  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      // Create a markdown table row out of the parsed text
      let status = match[4].trim();
      if (status.endsWith(".")) status = status.slice(0, -1);
      tableRows.push(`| ${match[1].trim()} | ${match[2].trim()} | ${match[3].trim()} | ${status} |`);
    } else {
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        // if it's a bullet but didn't match the regex, preserve it
        otherLines.push(line);
      } else {
        otherLines.push(line);
      }
    }
  }

  if (tableRows.length > 0) {
    const tableHeader = `\n| رقم الطلب | المغسلة | السعر | الحالة |\n|---|---|---|---|\n`;
    return otherLines.join("\n").replace(/•\s*$/, "").trim() + "\n" + tableHeader + tableRows.join("\n") + "\n";
  }

  return text;
}

function TableCell({ content }: { content: string }) {
  const s = content.trim();

  // Premium Status Badges
  if (s === "في انتظار الموافقة" || s === "في انتظار التأكيد" || s === "PendingConfirmation" || s === "قيد التنفيذ" || s === "Pending") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] shadow-sm whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mr-1.5 animate-pulse"></span>
        {s}
      </span>
    );
  }
  if (s === "مكتمل" || s === "تم التوصيل" || s === "Done" || s === "Completed" || s === "Delivered") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shadow-sm whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5"></span>
        {s}
      </span>
    );
  }
  if (s === "ملغي" || s === "Canceled" || s === "Cancelled") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#FEF2F2] text-[#E11D48] border border-[#FECDD3] shadow-sm whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] mr-1.5"></span>
        {s}
      </span>
    );
  }

  // Price Styling
  if (s.includes("جنيه") || s.includes("جم") || s.includes("EGP") || s.includes("LE") || /^\d+(\.\d+)?$/.test(s)) {
    return <span className="font-semibold text-[#059669] whitespace-nowrap">{s}</span>;
  }

  return <span className="text-slate-700 font-medium">{s}</span>;
}

function PaginatedTable({
  headerCells,
  bodyRows,
  pageSize = 6,
}: {
  headerCells: string[];
  bodyRows: string[][];
  pageSize?: number;
}) {
  const [page, setPage] = useState(1); // 1-based for display
  const totalPages = Math.max(1, Math.ceil(bodyRows.length / pageSize));

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  const pageRows = bodyRows.slice(start, start + pageSize);

  const showPagination = bodyRows.length > pageSize;

  return (
    <div className="w-full my-4 drop-shadow-sm font-sans">
      <div className="w-full overflow-x-auto rounded-xl ring-1 ring-slate-200 bg-white">
        <table className="w-full text-sm border-collapse text-right" dir="auto">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headerCells.map((h, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-slate-800 font-bold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((cells, rowIdx) => (
              <tr
                key={`${rowIdx}-${cells.join("|")}`}
                className="bg-white hover:bg-slate-50/70 transition-colors duration-150"
              >
                {cells.map((c, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 align-middle"
                  >
                    <TableCell content={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="mt-4 flex items-center justify-between gap-3 px-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
            className="text-[12px] font-bold text-slate-600 bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-1.5 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            السابق
          </button>
          <span className="text-[12px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1">
            صفحة {clampedPage} من {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
            className="text-[12px] font-bold text-white bg-[#0D47A1] shadow-sm rounded-lg px-4 py-1.5 disabled:opacity-50 hover:bg-[#0a367a] transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

function renderMarkdownWithTables(rawText: string) {
  const text = formatHallucinatedOrders(rawText);

  // If no table detected, render as a single whitespace-preserving block
  if (!text.includes("|")) {
    return <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">{text}</div>;
  }

  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]?.trim() ?? "";
    const next = (lines[i + 1] ?? "").trim();

    const currentLooksLikeTableRow = line.startsWith("|") && line.endsWith("|");
    if (currentLooksLikeTableRow && isTableSeparatorLine(next)) {
      // header row = line i
      const headerCells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      const bodyRows: string[][] = [];
      i += 2; // skip separator

      while (i < lines.length) {
        let rowLine = lines[i]?.trim() ?? "";
        // Support streaming gracefully: row might not end with pipe yet
        if (!rowLine.startsWith("|")) break;

        let contentStr = rowLine.slice(1);
        if (contentStr.endsWith("|")) {
          contentStr = contentStr.slice(0, -1);
        }

        const cells = contentStr
          .split("|")
          .map((c) => c.trim());

        bodyRows.push(cells);
        i += 1;
      }

      const tableKey = `tbl-${headerCells.join("~")}-${bodyRows.length}`;
      nodes.push(
        <PaginatedTable
          key={tableKey}
          headerCells={headerCells}
          bodyRows={bodyRows}
        />,
      );

      continue;
    }

    // Check for list items
    if (line.startsWith("•") || line.startsWith("-")) {
      nodes.push(
        <div key={`list-${i}`} className="flex items-start gap-2 break-words leading-relaxed mt-1">
          <span className="text-[#EBA050] text-lg leading-tight mt-0.5">•</span>
          <span className="whitespace-pre-wrap flex-1">{line.replace(/^[-•]\s*/, "")}</span>
        </div>
      );
      i += 1;
      continue;
    }

    // Default text line
    nodes.push(
      <div key={`text-${i}`} className="whitespace-pre-wrap break-words leading-relaxed mt-1">
        {lines[i]}
      </div>
    );
    i += 1;
  }

  return <div className="flex flex-col gap-1">{nodes}</div>;
}

function TypewriterText({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isStreaming && displayedText === content) return;

    if (displayedText.length < content.length) {
      const timeout = setTimeout(() => {
        const diff = content.length - displayedText.length;
        const increment = diff > 50 ? 5 : (diff > 10 ? 2 : 1);
        setDisplayedText(content.slice(0, displayedText.length + increment));
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [content, displayedText, isStreaming]);

  let finalContent = isStreaming ? displayedText : content;
  // Automatically inject newlines before bullet points, but avoid double newlines
  finalContent = finalContent.replace(/([^\n])\s*•/g, "$1\n•");

  return <>{renderMarkdownWithTables(finalContent)}</>;
}

export function ChatWidget({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, isAuthReady, isLoggedIn } = useAuth();

  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const token = user?.token ?? null;

  const historyPayload = useMemo(() => {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({
        role: normalizeRole(m.role),
        content: m.content,
      }));
  }, [messages]);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  async function sendMessage(messageText: string) {
    const msg = messageText.trim();
    if (!msg) return;
    if (!isAuthReady) return;

    if (!isLoggedIn || !token) {
      setError("Please log in to use the support chat.");
      return;
    }

    setError(null);
    setInput("");
    setStreaming(true);

    const userMsg: ChatMessage = { id: uid(), role: "user", content: msg };
    const assistantId = uid();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const payload: ChatRequestPayload = {
      message: msg,
      history: historyPayload.map((h) => ({ role: h.role, content: h.content })),
    };

    try {
      const res = await fetch("/api/backend/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Chat request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line: \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataIdx = part.indexOf("data:");
          if (dataIdx === -1) continue;

          // SSE spec says if the character after 'data:' is a space, remove it (only one).
          let data = part.slice(dataIdx + 5);
          if (data.startsWith(" ")) {
            data = data.slice(1);
          }

          if (data.trim() === "[DONE]") {
            done = true;
            break;
          }

          if (data) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data } : m)),
            );
          }
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Chat error.";
      setError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Sorry، حصل خطأ: ${message}` } : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  function quickSuggestions() {
    // Make it easy for users: provide good first prompts.
    return [
      "اعرض لي طلباتي النشطة",
      "عايز اعرف حالة طلبي",
      "ازاي ألغي طلب؟",
      "عايز جدول بأسعار الخدمات",
    ];
  }

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-6 transition-all">
        <div className="w-full h-[90dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#2A5C66]" />
              <p className="font-semibold text-slate-800">Support Chat</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-2 text-slate-600">
            <Loader2 size={18} className="animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-6 transition-all">
      <div className="w-full h-[90dvh] sm:h-[80vh] sm:max-h-[800px] sm:max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#2A5C66]" />
            <p className="font-semibold text-slate-800">Support Chat</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50/50">
          {(!isLoggedIn || !token) && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700">
              <p className="text-sm font-semibold">Login required</p>
              <p className="text-xs text-slate-500 mt-1">
                To chat with support, please log in.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => router.push("/login?from=/help")}
                  className="w-full bg-[#1D6076] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a7a94]"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {messages.length === 0 && isLoggedIn && token && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 text-slate-700">
              <p className="text-sm font-semibold">Hi! How can we help?</p>
              <p className="text-xs text-slate-500 mt-1">
                Ask about orders, cancellations, or support questions.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickSuggestions().map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={streaming}
                    onClick={() => sendMessage(s)}
                    className="text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end pl-12" : "flex justify-start pr-4 sm:pr-12"}>
              <div
                dir="auto"
                className={
                  m.role === "user"
                    ? "bg-[#0D47A1] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm inline-block"
                    : "w-full bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-800 shadow-sm whitespace-pre-wrap overflow-hidden"
                }
              >
                {m.role === "assistant" ? (
                  <TypewriterText
                    content={m.content}
                    isStreaming={streaming && m.id === messages[messages.length - 1]?.id}
                  />
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 size={16} className="animate-spin" />
              Typing...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-red-700 text-xs">
              {error}
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-3 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 resize-none h-[44px] max-h-[90px] bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-[#1D6076] focus:ring-1 focus:ring-[#1D6076]/20 disabled:opacity-60"
              disabled={!isLoggedIn || !token || streaming}
            />
            <button
              type="submit"
              disabled={!isLoggedIn || !token || streaming || input.trim().length === 0}
              className="w-11 h-11 rounded-2xl bg-[#0D47A1] hover:bg-[#0a367a] text-white flex items-center justify-center disabled:opacity-60 disabled:hover:bg-[#0D47A1] transition-colors shadow-sm"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-2">
            Bot responds in friendly style and may include tables.
          </p>
        </div>
      </div>
    </div>
  );
}

