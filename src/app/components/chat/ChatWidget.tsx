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

function replaceAllCompat(text: string, from: string, to: string) {
  return text.split(from).join(to);
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

function normalizeArabicSpacing(text: string) {
  const phraseReplacements: Array<[string, string]> = [
    ["تمإلغاءالطلبرقم", "تم إلغاء الطلب رقم "],
    ["تمالغاءالطلبرقم", "تم الغاء الطلب رقم "],
    ["بنجاح.لو", "بنجاح. لو "],
    ["بنجاح،لو", "بنجاح، لو "],
    ["لوفيه", "لو فيه "],
    ["أياستفسارات", "أي استفسارات "],
    ["اياستفسارات", "اي استفسارات "],
    ["تانيةاو", "تانية او "],
    ["تانيةأو", "تانية أو "],
    ["احتاجمساعدة", "احتاج مساعدة "],
    ["احتاجمساعدة", "احتاج مساعدة "],
    ["فيحاجة", "في حاجة "],
    ["متترددش", "متترددش "],
    ["شفينا", "فينا"],
    ["الطلبرقم", "الطلب رقم "],
    ["Ø±Ù‚Ù…Ø§Ù„Ø·Ù„Ø¨", "Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ "],
    ["Ø§Ù„Ù…ØºØ³Ù„Ø©Ø§Ù„Ø³Ø¹Ø±", "Ø§Ù„Ù…ØºØ³Ù„Ø© Ø§Ù„Ø³Ø¹Ø± "],
    ["Ø§Ù„Ø³Ø¹Ø±(Ø¬Ù…)Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø³Ø¹Ø± (Ø¬Ù…) Ø§Ù„Ø­Ø§Ù„Ø© "],
    ["Ù…ØºØ³Ù„Ø©Ø§Ù„Ù†Ø¸Ø§ÙØ©", "Ù…ØºØ³Ù„Ø© Ø§Ù„Ù†Ø¸Ø§ÙØ© "],
  ];

  let normalized = text;

  for (const [from, to] of phraseReplacements) {
    normalized = replaceAllCompat(normalized, from, to);
  }

  normalized = replaceAllCompat(normalized, "\u0627\u062e\u0631\u0637\u0644\u0628\u0631\u0642\u0645", "\u0627\u062e\u0631 \u0637\u0644\u0628 \u0631\u0642\u0645 ");
  normalized = replaceAllCompat(normalized, "\u0648\u0645\u0648\u062c\u0648\u062f\u0641\u064a\u062d\u0627\u0644\u0629", "\u0648\u0645\u0648\u062c\u0648\u062f \u0641\u064a \u062d\u0627\u0644\u0629 ");
  normalized = replaceAllCompat(normalized, "\u0641\u064a\u0645\u063a\u0633\u0644\u0629", "\u0641\u064a \u0645\u063a\u0633\u0644\u0629 ");
  normalized = replaceAllCompat(normalized, "\u0628\u0633\u0639\u0631", "\u0628\u0633\u0639\u0631 ");

  normalized = normalized
    .replace(/([.!؟،,:])(?=\S)/g, "$1 ")
    .replace(/(\d)(?=[\u0600-\u06FF])/g, "$1 ")
    .replace(/([()])(?=\S)/g, "$1 ")
    .replace(/(?<=\S)([()])/g, " $1")
    .replace(/([\u0600-\u06FF])(?=\d)/g, "$1 ")
    .replace(/([A-Za-z])(?=[\u0600-\u06FF])/g, "$1 ")
    .replace(/([\u0600-\u06FF])(?=[A-Za-z])/g, "$1 ")
    .replace(/(\d)(?=[A-Za-z])/g, "$1 ")
    .replace(/([A-Za-z])(?=\d)/g, "$1 ")
    .replace(/-{4,}/g, " ------------ ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return normalized;
}

const ARABIC_SUPPORT_WORDS = new Set([
  "اخر",
  "آخر",
  "اول",
  "أول",
  "الأخير",
  "هو",
  "مش",
  "معملش",
  "معمول",
  "لو",
  "او",
  "أو",
  "اوأسعار",
  "أوأسعار",
  "أوأقرب",
  "في",
  "من",
  "عن",
  "على",
  "الى",
  "إلى",
  "عندك",
  "ممكن",
  "ممكنتسألني",
  "تسألني",
  "طلب",
  "طلبات",
  "نشطة",
  "حالياً",
  "حاليا",
  "رقم",
  "الطلب",
  "الطلبات",
  "السابقة",
  "حالة",
  "الحالة",
  "جاري",
  "إنتظار",
  "انتظار",
  "تأكيد",
  "لسه",
  "قاعدين",
  "التأكيد",
  "على",
  "متوقع",
  "ننفذ",
  "طلبك",
  "قريباً",
  "قريبا",
  "جداً",
  "جدا",
  "موجود",
  "مغسلة",
  "المغسلة",
  "النظافة",
  "أقرب",
  "اقرب",
  "بسعر",
  "سعر",
  "أسعار",
  "اسعار",
  "الخدمات",
  "جم",
  "جنيه",
  "بتقدر",
  "تقدر",
  "تسأل",
  "اسأل",
  "اسال",
  "أساعدك",
  "اساعدك",
  "أكتر",
  "اكتر",
  "حابب",
  "حاجة",
  "تانية",
  "قائمة",
  "بالطلبات",
  "تشوفها",
  "لتشوفها",
  "بنفسك",
  "أرفق",
  "ارفق",
  "ليك",
  "قوللي",
  "عليه",
  "واجيبلك",
  "وأجيبلك",
  "المعلومات",
  "اللي",
  "عندي",
  "معين",
  "عايز",
  "تعرف",
  "ده",
  "دي",
  "مساعدة",
  "تم",
  "إلغاء",
  "الغاء",
  "بنجاح",
]);

function splitArabicRun(run: string) {
  if (run.length < 6) return run;

  const best: Array<string[] | null> = new Array(run.length + 1).fill(null);
  best[0] = [];

  for (let i = 0; i < run.length; i += 1) {
    const current = best[i];
    if (!current) continue;

    for (let j = Math.min(run.length, i + 12); j > i; j -= 1) {
      const part = run.slice(i, j);
      const normalizedPart = part.startsWith("و") && part.length > 2 ? part.slice(1) : part;
      if (!ARABIC_SUPPORT_WORDS.has(part) && !ARABIC_SUPPORT_WORDS.has(normalizedPart)) continue;

      const candidate = [...current, part];
      const existing = best[j];
      if (!existing || candidate.length < existing.length) {
        best[j] = candidate;
      }
    }
  }

  const segmented = best[run.length];
  if (!segmented || segmented.length <= 1) return run;

  return segmented.join(" ");
}

function formatAssistantText(text: string) {
  const base = normalizeArabicSpacing(text);
  return base
    .replace(/[\u0600-\u06FF]{6,}/g, (run) => splitArabicRun(run))
    .replace(/\s{2,}/g, " ")
    .trim();
}

function TableCell({ content }: { content: string }) {
  const s = content.trim();

  // Premium Status Badges
  if (s === "في انتظار الموافقة" || s === "في انتظار التأكيد" || s === "PendingConfirmation" || s === "قيد التنفيذ" || s === "Pending") {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#FED7AA] bg-[#FFF7ED] px-2.5 py-1 text-xs font-bold leading-tight text-[#EA580C] shadow-sm whitespace-normal break-all">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316] animate-pulse"></span>
        <span className="min-w-0">{s}</span>
      </span>
    );
  }
  if (s === "مكتمل" || s === "تم التوصيل" || s === "Done" || s === "Completed" || s === "Delivered") {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-xs font-bold leading-tight text-[#059669] shadow-sm whitespace-normal break-words">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]"></span>
        <span className="min-w-0">{s}</span>
      </span>
    );
  }
  if (s === "ملغي" || s === "Canceled" || s === "Cancelled") {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#FECDD3] bg-[#FEF2F2] px-2.5 py-1 text-xs font-bold leading-tight text-[#E11D48] shadow-sm whitespace-normal break-words">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F43F5E]"></span>
        <span className="min-w-0">{s}</span>
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
  const desktopGridTemplate =
    headerCells.length === 4
      ? "minmax(0,1.05fr) minmax(0,1.15fr) minmax(0,0.9fr) minmax(0,1.4fr)"
      : `repeat(${headerCells.length}, minmax(0, 1fr))`;

  const showPagination = bodyRows.length > pageSize;

  return (
    <div className="w-full my-4 drop-shadow-sm font-sans">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Order Summary
          </p>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {pageRows.map((cells, rowIdx) => (
            <div
              key={`${rowIdx}-${cells.join("|")}`}
              className="space-y-3 px-4 py-4 bg-white"
            >
              {cells.map((c, cellIdx) => (
                <div
                  key={cellIdx}
                  className="rounded-xl bg-slate-50/80 px-3 py-2.5"
                >
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {headerCells[cellIdx] ?? `Column ${cellIdx + 1}`}
                  </span>
                  <div className="min-w-0 text-right break-words">
                    <TableCell content={c} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="hidden md:block p-3">
          <div
            className="grid items-center gap-5 rounded-xl bg-slate-50 px-4 py-3 text-right"
            style={{ gridTemplateColumns: desktopGridTemplate }}
            dir="auto"
          >
            {headerCells.map((h, idx) => (
              <div
                key={idx}
                className="min-w-0 whitespace-normal break-words font-bold text-slate-800"
              >
                {h}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            {pageRows.map((cells, rowIdx) => (
              <div
                key={`${rowIdx}-${cells.join("|")}`}
                className="grid items-center gap-5 rounded-xl border border-slate-100 bg-white px-4 py-3 text-right shadow-[0_10px_24px_-24px_rgba(15,23,42,0.55)] transition-colors duration-150 hover:bg-slate-50/70"
                style={{ gridTemplateColumns: desktopGridTemplate }}
                dir="auto"
              >
                {cells.map((c, cellIdx) => (
                  <div
                    key={cellIdx}
                    className="min-w-0 overflow-hidden break-words"
                  >
                    <TableCell content={c} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
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
    return <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">{formatAssistantText(text)}</div>;
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
        {formatAssistantText(lines[i])}
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
        <div className="w-full h-[90dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-[min(92vw,56rem)] bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform">
          <div className="px-5 py-4 border-b border-slate-100 bg-white/95 flex items-center justify-between">
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
      <div className="w-full h-[90dvh] sm:h-[82vh] sm:max-h-[820px] sm:max-w-[min(92vw,56rem)] bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-transform">
        <div className="px-5 py-4 border-b border-slate-100 bg-white/95 flex items-center justify-between">
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

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40">
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
            <div key={m.id} className={m.role === "user" ? "flex justify-end pl-8 sm:pl-20" : "flex justify-start pr-2 sm:pr-10"}>
              <div
                dir="auto"
                className={
                  m.role === "user"
                    ? "max-w-full bg-[#0D47A1] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm inline-block"
                    : "w-full max-w-full bg-white/95 border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)] whitespace-pre-wrap overflow-hidden"
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


