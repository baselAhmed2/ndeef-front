"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Truck,
} from "lucide-react";
import { ChatWidget } from "@/app/components/chat/ChatWidget";

const supportEmail = "support@ndeef.com";
const supportPhone = "+20 100 555 2222";

const supportHighlights = [
  {
    icon: Truck,
    title: "Order tracking",
    description: "Follow pickup, laundry processing, and delivery updates from the same order screen.",
  },
  {
    icon: TimerReset,
    title: "Fast issue handling",
    description: "Need to reschedule, cancel, or report a problem? Support can help without leaving the app.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted follow-up",
    description: "Complaints and support conversations stay linked to your real order details.",
  },
];

const faqItems = [
  {
    question: "How does Nazeef work?",
    answer:
      "Choose a nearby laundry, select your services, confirm your pickup and delivery address, and place the order. You can then track every stage from confirmation to delivery inside your account.",
  },
  {
    question: "How do I track my delivery?",
    answer:
      "Open My Orders, select the order, and you will see the latest courier and delivery updates. When live location is available, the tracking section shows the route and destination directly on the map.",
  },
  {
    question: "Which payment methods are available?",
    answer:
      "Nazeef supports the payment options configured for your order, including cash on delivery, card payment, and mobile payment when the selected laundry provides them.",
  },
  {
    question: "Can I cancel or reschedule an order?",
    answer:
      "Yes. If the order has not already moved too far in processing, you can contact support through chat or call Nody to help with cancellation or rescheduling.",
  },
  {
    question: "What should I do if there is a problem with my order?",
    answer:
      "Use live chat or the AI assistant right away and mention your order number. The support flow in Nazeef can connect the issue to the laundry and help you follow the complaint until it is resolved.",
  },
];

export default function Help() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div
      className="ndeef-page-shell min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,96,118,0.12),_transparent_36%),linear-gradient(180deg,#f8fcfd_0%,#ffffff_30%,#f7fafb_100%)]"
      dir="ltr"
    >
      <div className="ndeef-page-header sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur md:px-8 lg:px-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-700 transition-opacity hover:opacity-70">
          <ArrowLeft size={22} strokeWidth={2} />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10 lg:px-12">
        <section className="mb-8 overflow-hidden rounded-[32px] border border-[#1D6076]/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[1.4fr_0.9fr] lg:px-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1D6076]/15 bg-[#1D6076]/8 px-3 py-1 text-sm font-medium text-[#1D6076]">
                <Sparkles size={16} strokeWidth={2} />
                Nazeef support center
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Help, answers, and real support for your Nazeef orders
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Reach the support team, talk to Nody, or check the most common order questions in one place.
                Everything here is tailored to how Nazeef actually works: nearby laundries, order tracking,
                delivery updates, and payment follow-up.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#174d5f]"
                >
                  <MessageCircle size={18} strokeWidth={2} />
                  Start live chat
                </button>
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">Quick access</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Email support</p>
                  <p className="mt-2 text-lg font-semibold">{supportEmail}</p>
                  <p className="mt-1 text-sm text-white/65">For order questions, payment help, and complaints.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Phone support</p>
                  <p className="mt-2 text-lg font-semibold">{supportPhone}</p>
                  <p className="mt-1 text-sm text-white/65">Best for urgent delivery or pickup follow-up.</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-50">
                  <p className="text-sm font-semibold">Live chat is available from this page</p>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Ask about orders, tracking, available services, or delivery timing directly from support chat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {supportHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D6076]/10 text-[#1D6076]">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-[0.22em] text-slate-500">CONTACT CHANNELS</h2>
            <p className="text-sm text-slate-500">Real support options inside Nazeef</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="group flex w-full items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#1D6076]/20 hover:shadow-[0_20px_45px_rgba(29,96,118,0.12)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D6076]/10 text-[#1D6076]">
                <MessageCircle size={24} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Live chat</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Chat with the Nazeef support flow and get help linked to your current order.
                </p>
              </div>
              <ChevronRight
                size={20}
                className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </button>

            <a
              href={`mailto:${supportEmail}`}
              className="group flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#1D6076]/20 hover:shadow-[0_20px_45px_rgba(29,96,118,0.12)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D6076]/10 text-[#1D6076]">
                <Mail size={24} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Email</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{supportEmail}</p>
              </div>
              <ChevronRight
                size={20}
                className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </a>

            <a
              href="tel:+201005552222"
              className="group flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#1D6076]/20 hover:shadow-[0_20px_45px_rgba(29,96,118,0.12)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D6076]/10 text-[#1D6076]">
                <Phone size={24} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Phone</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{supportPhone}</p>
              </div>
              <ChevronRight
                size={20}
                className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </a>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-[0.22em] text-slate-500">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="text-sm text-slate-500">Updated for Nazeef flows</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 transition-colors hover:bg-slate-50">
                  <h3 className="text-base font-semibold text-slate-900 md:text-lg">{item.question}</h3>
                  <ChevronRight
                    size={20}
                    className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
                    strokeWidth={2}
                  />
                </summary>
                <div className="px-5 pb-5 text-sm leading-7 text-slate-600 md:text-base">{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </div>

      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
    </div>
  );
}
