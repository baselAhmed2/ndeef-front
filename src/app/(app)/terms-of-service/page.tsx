import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "Using the Platform",
    body:
      "Nazeef helps customers browse laundries, place orders, schedule pickup and delivery, and track service updates. By using the platform, you agree to provide accurate account and order details.",
  },
  {
    title: "Orders and Payments",
    body:
      "Service pricing, fees, and payment timing may vary by laundry, order type, and delivery option. Customers are responsible for reviewing order details before confirming payment.",
  },
  {
    title: "Laundry and Delivery Service",
    body:
      "Turnaround times and availability depend on the selected laundry and service area. Nazeef coordinates service fulfillment, but final processing depends on the participating laundry partner.",
  },
  {
    title: "Account Responsibility",
    body:
      "Users are responsible for securing their account access, keeping profile information current, and reporting any suspected misuse or billing issues through support as soon as possible.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="ltr">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex rounded-xl p-2 transition hover:bg-slate-100" aria-label="Back to home">
            <ArrowLeft size={20} className="text-slate-700" strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBA050]/15">
              <FileText size={20} className="text-[#EBA050]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Terms of Service</p>
              <p className="text-xs text-slate-500">Last updated: May 3, 2026</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Terms for using Nazeef</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            These terms summarize the main rules for placing orders, using account features, and interacting with the
            Nazeef platform and its laundry partners.
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-7 text-amber-900 sm:px-6">
            Questions about service rules, cancellations, or order issues can be handled through the{" "}
            <Link href="/help" className="font-semibold text-amber-900 underline-offset-4 transition hover:underline">
              Help Center
            </Link>
            .
          </div>
        </div>
      </main>
    </div>
  );
}
