import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  CreditCard,
  AlertCircle,
  WifiOff,
  Package,
  RefreshCw,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import {
  ApiError,
  UiLaundry,
  UiServiceItem,
  categoryLabels,
  categoryOrder,
  getLaundryRequest,
  mapLaundryDtoToUiLaundry,
} from "@/app/lib/api";

type FlowState =
  | "loading"
  | "not_found"
  | "unavailable"
  | "no_services"
  | "success";

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 px-5 py-6">
      <div className="h-6 bg-gray-100 rounded-xl w-3/4" />
      <div className="h-4 bg-gray-100 rounded-xl w-1/2" />
      <div className="h-4 bg-gray-100 rounded-xl w-2/5" />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({
  type,
  onRetry,
}: {
  type: "not_found" | "unavailable" | "no_services";
  onRetry: () => void;
}) {
  const config = {
    not_found: {
      icon: WifiOff,
      title: "Laundry Not Found",
      body: "This laundry does not exist on the deployed backend, or the link may be outdated.",
      action: "Try Again",
    },
    unavailable: {
      icon: AlertCircle,
      title: "Currently Unavailable",
      body: "This laundry exists, but it is inactive or not open right now.",
      action: "Browse Nearby",
    },
    no_services: {
      icon: Package,
      title: "No Services Available",
      body: "This laundry has no active services in the current backend response.",
      action: "Refresh",
    },
  };

  const { icon: Icon, title, body, action } = config[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <Icon size={34} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-7 max-w-xs">{body}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
      >
        <RefreshCw size={15} strokeWidth={2} />
        {action}
      </button>
      <Link
        href="/nearby"
        className="mt-3 text-sm text-[#1D6076] underline underline-offset-2"
      >
        Back to Nearby Laundries
      </Link>
    </div>
  );
}

function ServiceRow({
  service,
  selected,
  onToggle,
}: {
  service: UiServiceItem;
  selected: boolean;
  onToggle: (serviceId: string) => void;
}) {
  const categoryColors: Record<string, string> = {
    wash: "#1D6076",
    iron: "#EBA050",
    dry_clean: "#2a7a94",
    specialty: "#8b5cf6",
  };
  const color = categoryColors[service.category] ?? "#1D6076";

  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      className={`w-full flex items-center justify-between p-4 border rounded-[24px] active:scale-[0.99] transition-all duration-300 bg-white group ${
        selected
          ? "border-[#1D6076] shadow-[0_10px_30px_rgba(29,96,118,0.12)] ring-2 ring-[#1D6076]/10"
          : "border-slate-200/80 hover:border-[#1D6076]/30 hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Sparkles size={20} style={{ color }} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-gray-900 text-[15px] font-semibold">{service.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{service.unit}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selected ? (
          <span className="w-7 h-7 rounded-full bg-[#1D6076] text-white flex items-center justify-center shrink-0">
            <Check size={14} strokeWidth={3} />
          </span>
        ) : null}
        <div className="text-right">
          <p className="text-base font-semibold" style={{ color }}>
            {service.price} <span className="text-xs font-medium">EGP</span>
          </p>
          <p className="text-xs text-gray-400">
            {selected ? "Selected" : "Tap to add"}
          </p>
        </div>
        <ChevronRight
          size={16}
          className={`transition-colors ${
            selected ? "text-[#1D6076]" : "text-gray-300 group-hover:text-[#1D6076]"
          }`}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

export default function LaundryDetails() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [laundry, setLaundry] = useState<UiLaundry | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    const runFlow = async () => {
      try {
        setFlowState("loading");
        setLaundry(null);

        const response = await getLaundryRequest(id ?? "");
        const mapped = mapLaundryDtoToUiLaundry(response);

        if (mapped.status !== "active") {
          setLaundry(mapped);
          setFlowState("unavailable");
          return;
        }

        if (mapped.services.filter((service) => service.available).length === 0) {
          setLaundry(mapped);
          setFlowState("no_services");
          return;
        }

        setLaundry(mapped);
        setSelectedServiceIds((current) =>
          current.filter((serviceId) =>
            mapped.services.some(
              (service) => service.available && service.id === serviceId,
            ),
          ),
        );
        setFlowState("success");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setFlowState("not_found");
          return;
        }

        setFlowState("not_found");
      }
    };

    runFlow();
  }, [id]);

  const grouped = useMemo(() => {
    if (!laundry) return [];

    return categoryOrder
      .map((category) => ({
        category,
        label: categoryLabels[category],
        items: laundry.services.filter(
          (service) => service.available && service.category === category,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [laundry]);

  const selectedServices = useMemo(() => {
    if (!laundry) return [];
    return laundry.services.filter((service) =>
      selectedServiceIds.includes(service.id),
    );
  }, [laundry, selectedServiceIds]);

  const selectedStartingPrice = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + Number(service.price ?? 0),
        0,
      ),
    [selectedServices],
  );

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  };

  const handleContinue = () => {
    if (!laundry || selectedServiceIds.length === 0) return;
    const params = new URLSearchParams();
    params.set("services", selectedServiceIds.join(","));
    router.push(`/order/${laundry.id}?${params.toString()}`);
  };

  const features = [
    { icon: Zap, text: "Live API Data", color: "#EBA050" },
    { icon: Shield, text: "Backend Auth", color: "#1D6076" },
    { icon: Package, text: "Tracked Orders", color: "#5a6c7d" },
    { icon: CreditCard, text: "Real Payments", color: "#2a7a94" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f6fbfd_0%,#f8fafc_28%,#f5f5f5_70%)]" dir="ltr">
      <div className="sticky top-16 z-20 border-b border-slate-200/80 bg-white/90 px-4 md:px-8 py-4 flex items-center gap-3 shadow-sm backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 text-lg truncate">
            {laundry ? laundry.name : "Laundry Details"}
          </h1>
          {flowState === "success" && (
            <p className="text-xs text-gray-400 mt-0.5">
              {laundry?.services.filter((service) => service.available).length} services
              available
            </p>
          )}
        </div>
      </div>

      {flowState === "loading" && (
        <div>
          <div className="h-56 bg-gray-200 animate-pulse" />
          <div className="bg-white rounded-t-3xl -mt-6 relative z-10 shadow-sm">
            <SkeletonLoader />
          </div>
        </div>
      )}

      {flowState === "not_found" && (
        <ErrorScreen type="not_found" onRetry={() => router.refresh()} />
      )}
      {flowState === "unavailable" && (
        <ErrorScreen type="unavailable" onRetry={() => router.push("/nearby")} />
      )}
      {flowState === "no_services" && (
        <ErrorScreen type="no_services" onRetry={() => router.refresh()} />
      )}

      {flowState === "success" && laundry && (
        <div className="pb-10">
          <div className="relative h-[340px] overflow-hidden bg-slate-200">
            <img
              src={laundry.image}
              alt={laundry.name}
              className="w-full h-full object-cover scale-[1.04] saturate-[1.08] contrast-[1.04] brightness-[0.92]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(235,160,80,0.18),transparent_24%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/22 to-slate-950/12" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 md:px-10 pb-8">
              <div className="mx-auto max-w-5xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Star size={11} className="fill-[#EBA050] text-[#EBA050]" />
                    {laundry.rating.toFixed(1)} rating
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Clock size={11} />
                    {laundry.deliveryTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <MapPin size={11} />
                    {laundry.distanceLabel}
                  </span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  {laundry.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/75">
                  {laundry.address}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 -mt-10 mx-auto max-w-5xl px-4 md:px-8">
            <div className="rounded-[32px] border border-slate-200/80 bg-white/96 px-6 pt-6 pb-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Laundry Overview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{laundry.name}</h2>
                </div>
              {!laundry.isAvailable && (
                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0 font-semibold">
                  <Info size={10} strokeWidth={2.5} />
                  {laundry.availability}
                </span>
              )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-amber-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-amber-500">
                    <Star size={14} className="fill-amber-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Rating</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{laundry.rating.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">{laundry.reviews} reviews</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#1D6076]">
                    <Clock size={14} strokeWidth={2.1} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">ETA</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{laundry.deliveryTime}</p>
                  <p className="text-xs text-slate-400">Estimated turnaround</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#1D6076]">
                    <MapPin size={14} strokeWidth={2.1} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{laundry.distanceLabel}</p>
                  <p className="text-xs text-slate-400">From your location</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">{laundry.address}</p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6 space-y-6">
            {grouped.map(({ category, label, items }) => (
              <div key={category}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 tracking-[0.22em] uppercase">
                    {label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {items.length} service{items.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {items
                    .sort((a, b) => a.price - b.price)
                    .map((service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        selected={selectedServiceIds.includes(service.id)}
                        onToggle={toggleService}
                      />
                    ))}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-[0_14px_35px_rgba(15,23,42,0.06)] p-5 mt-2">
              <p className="text-xs font-semibold text-gray-500 tracking-wider mb-4 uppercase">
                Why This Page Is Different Now
              </p>
              <div className="grid grid-cols-2 gap-3">
                {features.map(({ icon: Icon, text, color }) => (
                  <div
                    key={text}
                    className="rounded-2xl bg-gray-50 px-4 py-3.5 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={18} style={{ color }} strokeWidth={1.8} />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-4 z-20 px-4 md:px-8">
            <div className="mx-auto max-w-5xl bg-white/95 backdrop-blur rounded-[28px] border border-slate-200/80 shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {selectedServiceIds.length === 0
                      ? "Choose one or more services"
                      : `${selectedServiceIds.length} service${
                          selectedServiceIds.length > 1 ? "s" : ""
                        } selected`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Starting from {selectedStartingPrice} EGP before quantities
                  </p>
                </div>
                {selectedServiceIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedServiceIds([])}
                    className="text-xs text-[#1D6076] hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={selectedServiceIds.length === 0}
                className="w-full bg-[#1D6076] text-white py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a7a94] transition-all shadow-[0_10px_25px_rgba(29,96,118,0.20)]"
              >
                Continue to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
