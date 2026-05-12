import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Navigation,
  AlertCircle,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Zap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  ApiError,
  UiLaundry,
  getLaundriesRequest,
  mapLaundryDtoToUiLaundry,
  searchLaundriesRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState =
  | "permission_request"
  | "locating"
  | "location_error"
  | "fetching"
  | "no_laundries"
  | "success";

type SortOption = "distance" | "rating";
type FilterOption = "all" | "available";
const NEARBY_STATE_KEY = "ndeef_nearby_state";

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("Unable to get your location.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

function PermissionScreen({
  onGrant,
  onDeny,
}: {
  onGrant: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-8 md:px-8 md:py-12">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#0d3d50_0%,#1D6076_58%,#2a7a94_100%)] p-8 text-white shadow-[0_25px_80px_rgba(13,61,80,0.28)] md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur-sm">
            <Navigation size={14} strokeWidth={2.2} />
            Nearby Discovery
          </div>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Find the best laundries around you in a cleaner, faster way.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/78 md:text-base">
            Share your location once and we&apos;ll surface nearby laundries,
            delivery timing, ratings, and live availability from the backend.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Live Search", value: "GPS based" },
              { label: "Availability", value: "Updated now" },
              { label: "Fast Compare", value: "Distance + rating" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ndeef-page-card rounded-[32px] border border-slate-200/80 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#1D6076]/10">
            <Navigation size={34} className="text-[#1D6076]" strokeWidth={1.7} />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Enable your location
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            This helps us rank laundries by distance and show the options that
            make the most sense for your area.
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={onGrant}
              className="w-full rounded-2xl bg-[#1D6076] px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(29,96,118,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#174d5f] active:scale-[0.98]"
            >
              Allow Location Access
            </button>
            <button
              onClick={onDeny}
              className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              Not Now
            </button>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Privacy
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your location is only used to search nearby laundries and estimate
              distance more accurately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocatingScreen() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#1D6076]/10">
        <MapPin size={40} className="text-[#1D6076]" strokeWidth={1.5} />
        <span className="absolute inset-0 rounded-full border-2 border-[#1D6076]/30 animate-ping" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
        Getting your location...
      </h2>
      <p className="mt-2 text-sm text-gray-400">This only takes a moment</p>
      <div className="mt-8 w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="mb-3 flex items-center gap-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D6076]/10">
            <Navigation size={18} className="text-[#1D6076]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Matching your area</p>
            <p className="text-xs text-slate-400">
              Detecting coordinates for nearby coverage
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(90deg,#1D6076_0%,#EBA050_100%)]" />
        </div>
      </div>
    </div>
  );
}

function FetchingScreen() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#EBA050]/10">
        <Search size={38} className="text-[#EBA050]" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
        Checking the backend...
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Fetching laundries from the live API
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#1D6076] opacity-60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {["Searching area", "Ranking options", "Loading cards"].map((step) => (
          <div
            key={step}
            className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 text-sm font-medium text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({
  type,
  onRetry,
}: {
  type: "location_error" | "no_laundries" | "permission_denied";
  onRetry: () => void;
}) {
  const config = {
    location_error: {
      icon: WifiOff,
      title: "Unable to Detect Location",
      body: "We couldn't get your GPS coordinates. Please check your device settings and try again.",
      action: "Try Again",
    },
    no_laundries: {
      icon: AlertCircle,
      title: "No Laundries Available",
      body: "The deployed backend did not return any laundries for your area right now.",
      action: "Refresh",
    },
    permission_denied: {
      icon: MapPin,
      title: "Location Access Denied",
      body: "Without your location we can't search nearby laundries. You can still retry at any time.",
      action: "Try Again",
    },
  };

  const { icon: Icon, title, body, action } = config[type];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <Icon size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
        {title}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
        {body}
      </p>
      <div className="mt-8 w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          What you can do
        </p>
        <div className="mt-4 space-y-3 text-left text-sm text-slate-500">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Check browser or device location permissions
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Retry the lookup after refreshing your signal
          </div>
        </div>
        <button
          onClick={onRetry}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D6076] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#1D6076]/90 active:scale-[0.98]"
        >
          <RefreshCw size={16} strokeWidth={2} />
          {action}
        </button>
      </div>
    </div>
  );
}

function LaundryCard({ laundry, index }: { laundry: UiLaundry; index: number }) {
  const availabilityMeta = laundry.isAvailable
    ? {
        label: "Open Now",
        tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      }
    : {
        label: laundry.availability === "Busy" ? "Currently Busy" : "Currently Closed",
        tone: "text-slate-700 bg-slate-100/95 border-slate-200/80",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.07,
      }}
    >
      <Link
        href={`/laundry/${laundry.id}?from=${encodeURIComponent("/nearby")}`}
        className="ndeef-page-card group mx-auto block w-full max-w-[980px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] active:scale-[0.99] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
      >
        <motion.div
          className="relative h-60 overflow-hidden md:h-72"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.img
            src={laundry.image}
            alt={laundry.name}
            className="h-full w-full object-cover object-center brightness-[1.02] contrast-[1.05] saturate-[1.08]"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/62 via-slate-950/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${availabilityMeta.tone}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${laundry.isAvailable ? "bg-emerald-500" : "bg-slate-500"}`}
                    />
                    {availabilityMeta.label}
                  </span>
                  {laundry.rating >= 4.5 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#1D6076]/20 bg-[#1D6076]/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                      <Zap size={11} fill="currentColor" strokeWidth={0} />
                      Top Pick
                    </span>
                  )}
                </div>
                <h3 className="truncate text-lg font-semibold tracking-tight text-white md:text-[19px]">
                  {laundry.name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[13px] text-white/75">
                  {laundry.address}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5">
                <ChevronRight size={16} strokeWidth={2.2} />
              </div>
            </div>
          </div>
          {laundry.isAvailable && laundry.rating >= 4.5 && (
            <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
              Featured
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
            <MapPin size={10} className="text-[#1D6076]" strokeWidth={2.5} />
            {laundry.distanceLabel}
          </div>
        </motion.div>

        <div className="px-4 py-3.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="ndeef-page-soft rounded-xl bg-slate-50 px-2.5 py-2.5">
              <div className="mb-1 flex items-center gap-1 text-slate-400">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Rating</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{laundry.rating.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">{laundry.reviews} reviews</p>
            </div>

            <div className="ndeef-page-soft rounded-xl bg-slate-50 px-2.5 py-2.5">
              <div className="mb-1 flex items-center gap-1 text-slate-400">
                <Clock size={12} className="text-[#1D6076]" strokeWidth={2} />
                <span className="text-[10px] font-semibold uppercase tracking-wide">ETA</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{laundry.deliveryTime}</p>
              <p className="text-[10px] text-slate-400">Estimated service</p>
            </div>

            <div className="ndeef-page-soft rounded-xl bg-slate-50 px-2.5 py-2.5">
              <div className="mb-1 flex items-center gap-1 text-slate-400">
                <MapPin size={12} className="text-[#1D6076]" strokeWidth={2} />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Distance</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{laundry.distanceLabel}</p>
              <p className="text-[10px] text-slate-400">From your location</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function NearbyLaundries() {
  const router = useRouter();
  const { isLoggedIn, isAuthReady } = useAuth();
  const filterAnchorRef = useRef<HTMLDivElement | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("permission_request");
  const [errorType, setErrorType] = useState<
    "location_error" | "no_laundries" | "permission_denied"
  >("location_error");
  const [laundryList, setLaundryList] = useState<UiLaundry[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/nearby");
    }
  }, [isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem(NEARBY_STATE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as {
        laundryList?: UiLaundry[];
        search?: string;
        sortBy?: SortOption;
        filterBy?: FilterOption;
      };

      if (Array.isArray(saved.laundryList) && saved.laundryList.length > 0) {
        setLaundryList(saved.laundryList);
        setSearch(saved.search ?? "");
        setSortBy(saved.sortBy ?? "distance");
        setFilterBy(saved.filterBy ?? "all");
        setFlowState("success");
      }
    } catch {
      window.sessionStorage.removeItem(NEARBY_STATE_KEY);
    }
  }, [isAuthReady, isLoggedIn]);

  const handleGrantPermission = async () => {
    if (!isLoggedIn) {
      router.push("/login?from=/nearby");
      return;
    }

    try {
      setFlowState("locating");
      const coords = await getCurrentLocation();

      setFlowState("fetching");

      const searchResponse = await searchLaundriesRequest({
        lat: coords.lat,
        lng: coords.lng,
        radius: 10,
        pageIndex: 1,
        pageSize: 50,
      });

      let mapped = searchResponse.data.map((item) =>
        mapLaundryDtoToUiLaundry(item, coords),
      );

      if (mapped.length === 0) {
        const fallback = await getLaundriesRequest({ pageIndex: 1, pageSize: 50 });
        mapped = fallback.data.map((item) => mapLaundryDtoToUiLaundry(item, coords));
      }

      if (mapped.length === 0) {
        setErrorType("no_laundries");
        setFlowState("no_laundries");
        return;
      }

      setLaundryList(mapped);
      setFlowState("success");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorType("no_laundries");
        setFlowState("no_laundries");
        return;
      }

      setErrorType("location_error");
      setFlowState("location_error");
    }
  };

  const handleDenyPermission = () => {
    setErrorType("permission_denied");
    setFlowState("location_error");
  };

  const filteredLaundries = useMemo(() => {
    let next = laundryList.filter((laundry) => {
      const matchesSearch =
        !search ||
        laundry.name.toLowerCase().includes(search.toLowerCase()) ||
        laundry.address.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = filterBy === "all" || laundry.isAvailable;
      return matchesSearch && matchesFilter;
    });

    next = next.sort((a, b) =>
      sortBy === "rating" ? b.rating - a.rating : a.distance - b.distance,
    );

    return next;
  }, [filterBy, laundryList, search, sortBy]);

  const openNowCount = useMemo(
    () => laundryList.filter((laundry) => laundry.isAvailable).length,
    [laundryList],
  );

  const topRatedCount = useMemo(
    () => laundryList.filter((laundry) => laundry.rating >= 4.5).length,
    [laundryList],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "distance") count += 1;
    if (filterBy !== "all") count += 1;
    if (search.trim()) count += 1;
    return count;
  }, [filterBy, search, sortBy]);

  useEffect(() => {
    if (typeof window === "undefined" || flowState !== "success" || laundryList.length === 0) {
      return;
    }

    window.sessionStorage.setItem(
      NEARBY_STATE_KEY,
      JSON.stringify({
        laundryList,
        search,
        sortBy,
        filterBy,
      }),
    );
  }, [filterBy, flowState, laundryList, search, sortBy]);

  useEffect(() => {
    if (!showFilters) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedDesktopArea = filterAnchorRef.current?.contains(target);
      const clickedMobileSheet = mobileSheetRef.current?.contains(target);

      if (!clickedDesktopArea && !clickedMobileSheet) {
        setShowFilters(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showFilters]);

  const filterPanelContent = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Quick filters</p>
          <p className="text-xs text-slate-400">Sort and narrow results faster</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(false)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-gray-400">
            SORT BY
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["distance", "rating"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  sortBy === option
                    ? "bg-[#1D6076] text-white"
                    : "ndeef-page-soft bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option === "distance" ? "Distance" : "Rating"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-gray-400">
            AVAILABILITY
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["all", "available"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilterBy(option)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  filterBy === option
                    ? "bg-[#1D6076] text-white"
                    : "ndeef-page-soft bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option === "all" ? "All" : "Open Now"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Results", value: `${filteredLaundries.length}` },
            { label: "Open", value: `${openNowCount}` },
            { label: "Top", value: `${topRatedCount}` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-slate-50 px-3 py-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => {
            setSortBy("distance");
            setFilterBy("all");
            setSearch("");
          }}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(false)}
          className="flex-1 rounded-2xl bg-[#1D6076] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#174d5f]"
        >
          Apply
        </button>
      </div>
    </>
  );

  if (!isAuthReady || !isLoggedIn) {
    return null;
  }

  return (
    <div
      className="ndeef-page-shell min-h-screen bg-[radial-gradient(circle_at_top,#f6fbfd_0%,#f8fafc_32%,#f5f5f5_74%)] pb-16"
      dir="ltr"
    >
      <div className="ndeef-page-header sticky top-16 z-20 border-b border-gray-100 bg-white/92 px-4 py-4 shadow-sm backdrop-blur-md md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Nearby Laundries</h1>
              {flowState === "success" && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {filteredLaundries.length} laundries available
                </p>
              )}
            </div>
            {flowState === "success" && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {openNowCount} open now
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {flowState === "permission_request" && (
        <PermissionScreen
          onGrant={handleGrantPermission}
          onDeny={handleDenyPermission}
        />
      )}
      {flowState === "locating" && <LocatingScreen />}
      {flowState === "fetching" && <FetchingScreen />}
      {flowState === "location_error" && (
        <ErrorScreen type={errorType} onRetry={handleGrantPermission} />
      )}
      {flowState === "no_laundries" && (
        <ErrorScreen type="no_laundries" onRetry={handleGrantPermission} />
      )}

      {flowState === "success" && (
        <div className="mx-auto max-w-[1160px] px-4 py-5 md:px-8">
          <div className="mb-4 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0d3d50_0%,#1D6076_60%,#2a7a94_100%)] text-white shadow-[0_18px_56px_rgba(13,61,80,0.18)]">
            <div className="grid gap-4 px-5 py-5 md:grid-cols-[1.15fr_0.85fr] md:px-7 md:py-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm">
                  <Sparkles size={13} strokeWidth={2.3} />
                  Curated nearby options
                </div>
                <h2 className="mt-3 max-w-xl text-[31px] font-semibold tracking-tight leading-tight md:text-[38px]">
                  Compare trusted laundries around you with less scrolling.
                </h2>
                <p className="mt-2.5 max-w-xl text-sm leading-6 text-white/78 md:text-[15px]">
                  Search by name or area, sort by distance or rating, and focus
                  on places that are open right now.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
                    {laundryList.length} total laundries
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
                    {openNowCount} open now
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
                    {topRatedCount} top rated
                  </span>
                </div>
              </div>

              <div className="ndeef-page-card rounded-[24px] border border-white/10 bg-white/95 p-4 text-slate-900 shadow-[0_14px_36px_rgba(2,19,26,0.10)] backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D6076]/10">
                    <ShieldCheck
                      size={20}
                      className="text-[#1D6076]"
                      strokeWidth={1.9}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Smart recommendations
                    </p>
                    <p className="text-xs text-slate-400">
                      Ranked from your current location
                    </p>
                  </div>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3 md:grid-cols-1">
                  {[
                    {
                      label: "Best for speed",
                      value: filteredLaundries[0]?.deliveryTime ?? "Live lookup",
                    },
                    {
                      label: "Closest match",
                      value: filteredLaundries[0]?.distanceLabel ?? "Nearby first",
                    },
                    {
                      label: "Search mode",
                      value: filterBy === "available" ? "Open now only" : "All laundries",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-slate-50 px-3.5 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-3 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by laundry name or area"
                className="ndeef-page-card w-full rounded-[22px] border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all placeholder-gray-400 focus:border-[#1D6076] focus:outline-none focus:ring-1 focus:ring-[#1D6076]/20"
              />
            </div>

            <div ref={filterAnchorRef} className="relative">
              <button
                onClick={() => setShowFilters((value) => !value)}
                className={`flex items-center justify-center gap-2 rounded-[22px] border px-5 py-3.5 text-sm font-semibold transition-all ${
                  showFilters
                    ? "border-[#1D6076] bg-[#1D6076] text-white shadow-[0_14px_30px_rgba(29,96,118,0.18)]"
                    : "ndeef-page-card border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal size={16} strokeWidth={2} />
                Filters
                {activeFilterCount > 0 ? (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      showFilters ? "bg-white/18 text-white" : "bg-[#1D6076]/10 text-[#1D6076]"
                    }`}
                  >
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 hidden w-[min(92vw,420px)] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] md:block">
                  {filterPanelContent}
                </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="fixed inset-0 z-40 md:hidden">
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setShowFilters(false)}
                className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
              />
              <div
                ref={mobileSheetRef}
                className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_-20px_50px_rgba(15,23,42,0.18)]"
              >
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-200" />
                {filterPanelContent}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              Sorted by {sortBy === "distance" ? "distance" : "rating"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              {filterBy === "available" ? "Open now only" : "All availability"}
            </span>
            {search ? (
              <span className="rounded-full bg-[#1D6076]/8 px-4 py-2 text-xs font-semibold text-[#1D6076] shadow-sm ring-1 ring-[#1D6076]/10">
                Search: {search}
              </span>
            ) : null}
          </div>

          {filteredLaundries.length === 0 ? (
            <div className="ndeef-page-card rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="ndeef-page-soft mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search size={24} className="text-gray-400" strokeWidth={1.8} />
              </div>
              <h2 className="mb-2 text-lg text-gray-900">No matches found</h2>
              <p className="text-sm text-gray-500">
                Try a different search term or remove the availability filter.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredLaundries.map((laundry, index) => (
                <LaundryCard key={laundry.id} laundry={laundry} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
