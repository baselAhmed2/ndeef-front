import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";

interface FeaturePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "teal" | "orange";
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  accent = "teal",
}: FeaturePlaceholderProps) {
  const accentClasses =
    accent === "orange"
      ? {
          badge: "bg-[#EBA050]/10 text-[#EBA050]",
          button: "bg-[#EBA050] hover:bg-[#d99040] text-white",
          dot: "bg-[#EBA050]",
          card: "from-[#fff7ef] to-white",
        }
      : {
          badge: "bg-[#1D6076]/10 text-[#1D6076]",
          button: "bg-[#1D6076] hover:bg-[#154656] text-white",
          dot: "bg-[#1D6076]",
          card: "from-[#f2f8fa] to-white",
        };

  return (
    <div className={`rounded-[28px] border border-slate-200/70 bg-gradient-to-br ${accentClasses.card} p-8 shadow-sm`}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accentClasses.badge}`}>
            <Sparkles size={14} />
            {eyebrow}
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <button className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition-colors ${accentClasses.button}`}>
          Prepare This Module
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5">
          <div className={`mb-4 h-2 w-12 rounded-full ${accentClasses.dot}`} />
          <p className="text-sm font-semibold text-slate-800">Design is already aligned</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">This route now exists in Next.js, so your navigation feels complete while we keep the visual language consistent.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <Clock3 size={15} />
            <span className="text-sm font-semibold">Ready for implementation</span>
          </div>
          <p className="text-xs leading-5 text-slate-500">Use this screen as the starting point for real workflows, filters, tables, and API integration later on.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5">
          <p className="text-sm font-semibold text-slate-800">Dev-safe placeholder</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">No broken links, no router mismatch, and no empty white page when you click around the dashboard.</p>
        </div>
      </div>
    </div>
  );
}
