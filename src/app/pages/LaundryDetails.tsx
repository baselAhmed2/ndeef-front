"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  CreditCard,
  Heart,
  AlertCircle,
  WifiOff,
  Package,
  RefreshCw,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import {
  announceLaundryRatingUpdated,
  applyLaundryRatingSnapshot,
  ApiError,
  BackendFavoriteLaundryDto,
  BackendOrderReviewCheckDto,
  BackendRatingSummaryDto,
  BackendReviewDto,
  UiBundle,
  UiLaundry,
  UiServiceItem,
  addUserFavoriteRequest,
  categoryLabels,
  categoryOrder,
  checkOrderReviewRequest,
  getCachedLaundryRating,
  getLaundryBundlesRequest,
  getOrdersRequest,
  getLaundryRequest,
  getLaundryRatingSummaryRequest,
  getLaundryReviewsRequest,
  getUserFavoritesRequest,
  mapLaundryDtoToUiLaundry,
  mapOrderDtoToUiOrder,
  removeUserFavoriteRequest,
  subscribeLaundryRatingUpdates,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { getRoutePath } from "@/app/lib/platform";

type FlowState =
  | "loading"
  | "not_found"
  | "unavailable"
  | "no_services"
  | "success";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const staggerChildren = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

function normalizeLaundryName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractReviewCheck(input: BackendOrderReviewCheckDto) {
  return {
    hasRating: Boolean(input.hasRating ?? input.HasRating),
    rating: Number(input.rating ?? input.Rating ?? 0),
    comment: input.comment ?? input.Comment ?? "",
  };
}

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
    <motion.button
      type="button"
      onClick={() => onToggle(service.id)}
      variants={reveal}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.992 }}
      className={`ndeef-page-card w-full flex items-center justify-between p-4 border rounded-[24px] active:scale-[0.99] transition-all duration-300 bg-white group ${
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
    </motion.button>
  );
}

export default function LaundryDetails() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id || searchParams?.get("id") || "";
  const router = useRouter();
  const { user } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [laundry, setLaundry] = useState<UiLaundry | null>(null);
  const [bundles, setBundles] = useState<UiBundle[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<BackendReviewDto[]>([]);
  const [ratingSummary, setRatingSummary] = useState<BackendRatingSummaryDto | null>(null);
  const [favoriteLaundryIds, setFavoriteLaundryIds] = useState<number[]>([]);

  useEffect(() => {
    const runFlow = async () => {
      try {
        setFlowState("loading");
        setLaundry(null);
        setBundles([]);

        const [response, loadedBundles] = await Promise.all([
          getLaundryRequest(id ?? ""),
          getLaundryBundlesRequest(id ?? "").catch(() => []),
        ]);
        const mapped = applyLaundryRatingSnapshot(
          mapLaundryDtoToUiLaundry(response),
          getCachedLaundryRating(response.id, response.name),
        );

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
        setBundles(
          loadedBundles
            .filter((bundle) => bundle.status.toLowerCase().includes("active"))
            .sort((a, b) => a.displayOrder - b.displayOrder),
        );
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

  useEffect(() => {
    let active = true;

    async function loadReviewsAndFavorites() {
      if (!id) return;

      try {
        const [loadedReviews, loadedSummary, loadedFavorites] = await Promise.all([
          getLaundryReviewsRequest(id).catch(() => []),
          getLaundryRatingSummaryRequest(id).catch(() => null),
          user?.token ? getUserFavoritesRequest(user.token).catch(() => []) : Promise.resolve([] as BackendFavoriteLaundryDto[]),
        ]);

        if (!active) return;
        setReviews(loadedReviews);
        setRatingSummary(loadedSummary);
        setFavoriteLaundryIds(loadedFavorites.map((favorite) => favorite.laundryId));
      } catch {
        if (!active) return;
      }
    }

    void loadReviewsAndFavorites();

    return () => {
      active = false;
    };
  }, [id, user?.token]);

  useEffect(() => {
    const unsubscribe = subscribeLaundryRatingUpdates((snapshot) => {
      setLaundry((current) =>
        current ? applyLaundryRatingSnapshot(current, snapshot) : current,
      );

      const matchesCurrentLaundry =
        (typeof snapshot.laundryId === "number" && Number(id) === snapshot.laundryId) ||
        (typeof snapshot.laundryName === "string" &&
          snapshot.laundryName.trim().toLowerCase() ===
            (laundry?.name ?? "").trim().toLowerCase());

      if (matchesCurrentLaundry) {
        setRatingSummary((current) => ({
          averageRating: snapshot.averageRating,
          totalReviews: snapshot.totalReviews,
          starCounts: current?.starCounts ?? current?.StarCounts ?? null,
          AverageRating: snapshot.averageRating,
          TotalReviews: snapshot.totalReviews,
          StarCounts: current?.StarCounts ?? current?.starCounts ?? null,
        }));
      }
    });

    return unsubscribe;
  }, [id, laundry?.name]);

  useEffect(() => {
    if (!user?.token || !laundry) return;
    if (reviews.length > 0) return;

    const authToken = user.token;
    const currentLaundryId = Number(laundry.id);
    const currentLaundryName = laundry.name;
    const currentSummaryTotal = Number(
      ratingSummary?.totalReviews ?? ratingSummary?.TotalReviews ?? laundry.reviews ?? 0,
    );
    if (currentSummaryTotal > 0) return;

    let active = true;

    async function loadFallbackUserReview() {
      try {
        const ordersResponse = await getOrdersRequest(authToken, 1, 100);
        const candidateOrders = ordersResponse.data
          .map(mapOrderDtoToUiOrder)
          .filter((order) => {
            if (order.status !== "delivered") return false;

            const matchesId =
              typeof order.laundryId === "number" && order.laundryId === currentLaundryId;
            const matchesName =
              normalizeLaundryName(order.laundryName) ===
              normalizeLaundryName(currentLaundryName);

            return matchesId || matchesName;
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10);

        for (const order of candidateOrders) {
          const reviewCheck = extractReviewCheck(
            await checkOrderReviewRequest(authToken, order.id),
          );

          if (!active || !reviewCheck.hasRating) continue;

          setRatingSummary((current) => ({
            averageRating: reviewCheck.rating,
            totalReviews: 1,
            starCounts: current?.starCounts ?? current?.StarCounts ?? null,
            AverageRating: reviewCheck.rating,
            TotalReviews: 1,
            StarCounts: current?.StarCounts ?? current?.starCounts ?? null,
          }));
          announceLaundryRatingUpdated({
            laundryId: currentLaundryId,
            laundryName: currentLaundryName,
            averageRating: reviewCheck.rating,
            totalReviews: 1,
          });

          setReviews((current) =>
            current.length > 0
              ? current
              : [
                  {
                    id: -Number(order.id),
                    orderId: Number(order.id),
                    laundryId: currentLaundryId,
                    laundryName: currentLaundryName,
                    customerName: "You",
                    rating: reviewCheck.rating,
                    comment: reviewCheck.comment || "Your submitted review.",
                    tags: [],
                    createdAt: order.createdAt,
                    Id: -Number(order.id),
                    OrderId: Number(order.id),
                    LaundryId: currentLaundryId,
                    LaundryName: currentLaundryName,
                    CustomerName: "You",
                    Rating: reviewCheck.rating,
                    Comment: reviewCheck.comment || "Your submitted review.",
                    Tags: [],
                    CreatedAt: order.createdAt,
                  },
                ],
          );
          return;
        }
      } catch {
        if (!active) return;
      }
    }

    void loadFallbackUserReview();

    return () => {
      active = false;
    };
  }, [laundry, ratingSummary, reviews.length, user?.token]);

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

  const visibleReviews = Array.isArray(reviews) ? reviews : [];
  const derivedRatingFromReviews =
    visibleReviews.length > 0
      ? visibleReviews.reduce(
          (sum, review) => sum + Number(review.rating ?? review.Rating ?? 0),
          0,
        ) / visibleReviews.length
      : 0;
  const summaryAverage = Number(
    ratingSummary?.averageRating ?? ratingSummary?.AverageRating ?? 0,
  );
  const summaryTotal = Number(
    ratingSummary?.totalReviews ?? ratingSummary?.TotalReviews ?? 0,
  );
  const fallbackAverage =
    visibleReviews.length > 0 ? derivedRatingFromReviews : Number(laundry?.rating ?? 0);
  const fallbackReviews =
    visibleReviews.length > 0 ? visibleReviews.length : Number(laundry?.reviews ?? 0);
  const displayedRating =
    summaryTotal > 0 ? summaryAverage : fallbackAverage;
  const displayedReviews =
    summaryTotal > 0 ? summaryTotal : fallbackReviews;

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  };

  const handleContinue = () => {
    if (!laundry || selectedServiceIds.length === 0) return;
    router.push(getRoutePath("/order", String(laundry.id), "laundryId", { services: selectedServiceIds.join(",") }));
  };

  const handleBundleOrder = (bundleId: string) => {
    if (!laundry) return;
    router.push(getRoutePath("/order", String(laundry.id), "laundryId", { bundle: bundleId }));
  };

  const isFavorite = laundry ? favoriteLaundryIds.includes(Number(laundry.id)) : false;

  const handleFavoriteToggle = async () => {
    if (!user?.token || !laundry) {
      router.push(`/login?from=${encodeURIComponent(getRoutePath("/laundry", id))}`);
      return;
    }

    try {
      if (isFavorite) {
        await removeUserFavoriteRequest(user.token, Number(laundry.id));
        setFavoriteLaundryIds((current) => current.filter((entry) => entry !== Number(laundry.id)));
        toast.success("Removed from favorites.");
      } else {
        await addUserFavoriteRequest(user.token, Number(laundry.id));
        setFavoriteLaundryIds((current) => [...current, Number(laundry.id)]);
        toast.success("Added to favorites.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update favorites.");
    }
  };

  const features = [
    { icon: Zap, text: "Live API Data", color: "#EBA050" },
    { icon: Shield, text: "Backend Auth", color: "#1D6076" },
    { icon: Package, text: "Tracked Orders", color: "#5a6c7d" },
    { icon: CreditCard, text: "Real Payments", color: "#2a7a94" },
  ];

  const handleBack = () => {
    const from = searchParams?.get("from");
    if (from === "/nearby") {
      router.push("/nearby");
      return;
    }

    router.back();
  };

  return (
    <div className="ndeef-page-shell ndeef-laundry-page min-h-screen bg-[radial-gradient(circle_at_top,#f6fbfd_0%,#f8fafc_28%,#f5f5f5_70%)]" dir="ltr">
      <div className="ndeef-page-header sticky top-16 z-20 border-b border-slate-200/80 bg-white/90 px-4 md:px-8 py-4 flex items-center gap-3 shadow-sm backdrop-blur-md">
        <button
          onClick={handleBack}
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
          <div className="ndeef-page-card bg-white rounded-t-3xl -mt-6 relative z-10 shadow-sm">
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
        <motion.div initial="hidden" animate="show" className="pb-10">
          <motion.div
            variants={reveal}
            className="ndeef-laundry-hero relative h-[340px] overflow-hidden bg-slate-200"
          >
            <motion.img
              src={laundry.image}
              alt={laundry.name}
              className="w-full h-full object-cover scale-[1.04] saturate-[1.08] contrast-[1.04] brightness-[0.92]"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1.04 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="ndeef-laundry-hero-glow absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(235,160,80,0.18),transparent_24%)]" />
            <div className="ndeef-laundry-hero-topfade absolute inset-0 bg-gradient-to-b from-slate-950/15 via-transparent to-transparent" />
            <div className="ndeef-laundry-hero-bottomfade absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/22 to-slate-950/12" />
            <div className="ndeef-laundry-hero-bottomedge absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 md:px-10 pb-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={staggerChildren} initial="hidden" animate="show" className="flex flex-wrap items-center gap-2 mb-3">
                  <motion.span variants={reveal} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Star size={11} className="fill-[#EBA050] text-[#EBA050]" />
                    {displayedRating.toFixed(1)} rating
                  </motion.span>
                  <motion.span variants={reveal} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Clock size={11} />
                    {laundry.deliveryTime}
                  </motion.span>
                  <motion.span variants={reveal} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <MapPin size={11} />
                    {laundry.distanceLabel}
                  </motion.span>
                </motion.div>
                <motion.h2 variants={reveal} className="text-3xl font-semibold tracking-tight text-white">
                  {laundry.name}
                </motion.h2>
                <motion.p variants={reveal} className="mt-2 max-w-2xl text-sm text-white/75">
                  {laundry.address}
                </motion.p>
              </div>
            </div>
          </motion.div>

          <div className="relative z-10 -mt-10 mx-auto max-w-5xl px-4 md:px-8">
            <motion.div
              variants={reveal}
              className="ndeef-page-card rounded-[32px] border border-slate-200/80 bg-white/96 px-6 pt-6 pb-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Laundry Overview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{laundry.name}</h2>
                </div>
              <button
                type="button"
                onClick={() => void handleFavoriteToggle()}
                className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  isFavorite
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
                  {isFavorite ? "Saved" : "Save"}
                </span>
              </button>
              {!laundry.isAvailable && (
                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0 font-semibold dark:text-orange-300 dark:bg-orange-500/10 dark:border-orange-400/20">
                  <Info size={10} strokeWidth={2.5} />
                  {laundry.availability}
                </span>
              )}
              </div>

              <motion.div variants={staggerChildren} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
                <motion.div variants={reveal} className="ndeef-page-soft rounded-2xl bg-amber-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-amber-500">
                    <Star size={14} className="fill-amber-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Rating</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{displayedRating.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">{displayedReviews} reviews</p>
                </motion.div>
                <motion.div variants={reveal} className="ndeef-page-soft rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#1D6076]">
                    <Clock size={14} strokeWidth={2.1} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">ETA</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{laundry.deliveryTime}</p>
                  <p className="text-xs text-slate-400">Estimated turnaround</p>
                </motion.div>
                <motion.div variants={reveal} className="ndeef-page-soft rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[#1D6076]">
                    <MapPin size={14} strokeWidth={2.1} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{laundry.distanceLabel}</p>
                  <p className="text-xs text-slate-400">From your location</p>
                </motion.div>
              </motion.div>

              <p className="mt-4 text-sm text-slate-500">{laundry.address}</p>
            </motion.div>
          </div>

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="show"
            className="max-w-5xl mx-auto px-4 md:px-8 mt-6 space-y-6"
          >
            {bundles.length > 0 && (
              <motion.div variants={reveal} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 tracking-[0.22em] uppercase">
                      Bundles
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      Ready-made offers from this laundry
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    {bundles.length} active bundle{bundles.length > 1 ? "s" : ""}
                  </p>
                </div>

                <motion.div
                  variants={staggerChildren}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  className="grid gap-3"
                >
                  {bundles.map((bundle) => (
                    <motion.div
                      key={bundle.id}
                      variants={reveal}
                      className="overflow-hidden rounded-[28px] border border-[#1D6076]/15 bg-[linear-gradient(135deg,rgba(29,96,118,0.08),rgba(235,160,80,0.12))] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1D6076]">
                            <Sparkles size={12} />
                            Bundle Offer
                          </div>
                          <h4 className="mt-3 text-xl font-semibold text-slate-950">{bundle.name}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {bundle.description?.trim() || "A discounted package prepared from this laundry's active services."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {bundle.items.map((item) => (
                              <span
                                key={item.id}
                                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs text-slate-600"
                              >
                                {item.quantity}x {item.serviceName}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="w-full shrink-0 rounded-[24px] border border-white/70 bg-white/85 p-4 md:w-[230px]">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Bundle price
                          </p>
                          <div className="mt-2 flex items-end gap-2">
                            <p className="text-3xl font-bold text-[#1D6076]">{bundle.price}</p>
                            <p className="pb-1 text-sm font-medium text-slate-400">EGP</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-500 line-through">
                            {bundle.originalPrice} EGP
                          </p>
                          <p className="mt-2 text-sm font-semibold text-emerald-600">
                            Save {bundle.savingsAmount.toFixed(2)} EGP ({bundle.savingsPercentage.toFixed(0)}%)
                          </p>
                          <button
                            type="button"
                            onClick={() => handleBundleOrder(bundle.id)}
                            className="mt-4 w-full rounded-2xl bg-[#1D6076] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2a7a94]"
                          >
                            Order This Bundle
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {grouped.map(({ category, label, items }) => (
              <motion.div key={category} variants={reveal}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 tracking-[0.22em] uppercase">
                    {label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {items.length} service{items.length > 1 ? "s" : ""}
                  </p>
                </div>
                <motion.div variants={staggerChildren} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} className="space-y-2.5">
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
                </motion.div>
              </motion.div>
            ))}

            <motion.div variants={reveal} className="ndeef-page-card bg-white rounded-[28px] border border-slate-200/80 shadow-[0_14px_35px_rgba(15,23,42,0.06)] p-5 mt-2">
              <p className="text-xs font-semibold text-gray-500 tracking-wider mb-4 uppercase">
                Why This Page Is Different Now
              </p>
              <motion.div variants={staggerChildren} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
                {features.map(({ icon: Icon, text, color }) => (
                  <motion.div
                    key={text}
                    variants={reveal}
                    className="ndeef-page-soft rounded-2xl bg-gray-50 px-4 py-3.5 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={18} style={{ color }} strokeWidth={1.8} />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{text}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={reveal} className="ndeef-page-card bg-white rounded-[28px] border border-slate-200/80 shadow-[0_14px_35px_rgba(15,23,42,0.06)] p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 tracking-[0.22em] uppercase">
                    Reviews
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    Real customer feedback
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-950">
                    {displayedRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {displayedReviews} reviews
                  </p>
                </div>
              </div>

              {visibleReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No reviews were returned by the backend for this laundry yet.
                </div>
              ) : (
                <motion.div variants={staggerChildren} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
                  {visibleReviews.slice(0, 4).map((review) => (
                    <motion.div variants={reveal} key={review.id ?? review.Id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {review.customerName ?? review.CustomerName ?? "Customer"}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Star size={11} className="fill-current" />
                          {Number(review.rating ?? review.Rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {(review.comment ?? review.Comment ?? "").trim() || "No written comment was added."}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          <div className="sticky bottom-4 z-20 px-4 md:px-8">
            <motion.div
              variants={reveal}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.12 }}
              className="ndeef-page-bottom-bar mx-auto max-w-5xl bg-white/95 backdrop-blur rounded-[28px] border border-slate-200/80 shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-4"
            >
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
