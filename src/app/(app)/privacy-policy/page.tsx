import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    body:
      "Ndeef stores the account details, order information, delivery addresses, and support activity needed to provide laundry pickup, cleaning, delivery, and customer support.",
  },
  {
    title: "How We Use Your Data",
    body:
      "We use your information to manage orders, coordinate with laundries and drivers, process payments, improve the platform experience, and keep you updated on important service events.",
  },
  {
    title: "Sharing and Security",
    body:
      "Order and delivery details are shared only with the teams required to complete your service. We apply reasonable technical and operational safeguards to protect customer information.",
  },
  {
    title: "Your Choices",
    body:
      "You can review account details, update profile information, and contact support if you need help with data corrections, order questions, or account concerns.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="ltr">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex rounded-xl p-2 transition hover:bg-slate-100" aria-label="Back to home">
            <ArrowLeft size={20} className="text-slate-700" strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1D6076]/10">
              <ShieldCheck size={20} className="text-[#1D6076]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Privacy Policy</p>
              <p className="text-xs text-slate-500">Last updated: May 3, 2026</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Your privacy on Ndeef</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            This policy explains the main categories of information used to operate the Ndeef platform for customers,
            laundries, deliveries, payments, and support interactions.
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-[#0d3d50] px-5 py-5 text-sm leading-7 text-white/80 sm:px-6">
            Need help with privacy-related questions? Visit the{" "}
            <Link href="/help" className="font-semibold text-white transition hover:text-white/80">
              Help Center
            </Link>{" "}
            to contact support.
          </div>
        </div>
      </main>
    </div>
  );
}
