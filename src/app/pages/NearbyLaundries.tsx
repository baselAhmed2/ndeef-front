import { useEffect, useMemo, useState } from "react";
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
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
        <Navigation size={40} className="text-[#1D6076]" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl text-gray-900 mb-3">Find Laundries Near You</h2>
      <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-xs">
        Nadeef needs your location to search the deployed backend for nearby
        laundries and show live availability.
      </p>
      <button
        onClick={onGrant}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-base font-medium mb-3 hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
      >
        Allow Location Access
      </button>
      <button
        onClick={onDeny}
        className="w-full max-w-xs text-gray-500 py-3 rounded-2xl text-base hover:text-gray-700 transition-all"
      >
        Not Now
      </button>
    </div>
  );
}

function LocatingScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6 relative">
        <MapPin size={40} className="text-[#1D6076]" strokeWidth={1.5} />
        <span className="absolute inset-0 rounded-full border-2 border-[#1D6076]/30 animate-ping" />
      </div>
      <h2 className="text-xl text-gray-900 mb-2">Getting your location...</h2>
      <p className="text-gray-400 text-sm">This only takes a moment</p>
    </div>
  );
}

function FetchingScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#EBA050]/10 flex items-center justify-center mb-6">
        <Search size={38} className="text-[#EBA050]" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-2">Checking the backend...</h2>
      <p className="text-gray-400 text-sm">
        Fetching laundries from the live API
      </p>
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#1D6076] opacity-60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
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
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <Icon size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        {body}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
      >
        <RefreshCw size={16} strokeWidth={2} />
        {action}
      </button>
    </div>
  );
}

function LaundryCard({ laundry, index }: { laundry: UiLaundry; index: number }) {
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
        href={`/laundry/${laundry.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-all duration-200"
      >
        <motion.div
          className="relative h-44 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.img
            src={laundry.image}
            alt={laundry.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {!laundry.isAvailable && (
            <div className="absolute top-3 left-3 bg-gray-800/80 text-white text-xs px-3 py-1 rounded-full">
              {laundry.availability === "Busy" ? "Currently Busy" : "Currently Closed"}
            </div>
          )}
          {laundry.isAvailable && laundry.rating >= 4.5 && (
            <div className="absolute top-3 right-3 bg-[#1D6076] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} fill="white" strokeWidth={0} />
              Featured
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
            <MapPin size={10} className="text-[#1D6076]" strokeWidth={2.5} />
            {laundry.distanceLabel}
          </div>
        </motion.div>

        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-gray-900 text-base font-medium leading-snug">
              {laundry.name}
            </h3>
            <ChevronRight
              size={18}
              className="text-gray-300 mt-0.5 shrink-0"
              strokeWidth={2}
            />
          </div>
          <p className="text-gray-400 text-xs mb-3">{laundry.address}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-900">
                {laundry.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({laundry.reviews})</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} className="text-[#1D6076]" strokeWidth={2} />
              {laundry.deliveryTime}
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span
              className={`text-xs font-medium ${laundry.isAvailable ? "text-emerald-600" : "text-gray-400"}`}
            >
              {laundry.isAvailable ? "Open" : laundry.availability}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function NearbyLaundries() {
  const router = useRouter();
  const { isLoggedIn, isAuthReady } = useAuth();
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

  if (!isAuthReady || !isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-16" dir="ltr">
      <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 text-lg">Nearby Laundries</h1>
              {flowState === "success" && (
                <p className="text-gray-400 text-xs mt-0.5">
                  {filteredLaundries.length} laundries available
                </p>
              )}
            </div>
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
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by laundry or area"
                className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#1D6076] focus:ring-[#1D6076]/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters((value) => !value)}
              className={`p-3.5 rounded-2xl border transition-all ${
                showFilters
                  ? "bg-[#1D6076] text-white border-[#1D6076]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={2} />
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-2">
                    SORT BY
                  </p>
                  <div className="flex gap-2">
                    {(["distance", "rating"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          sortBy === option
                            ? "bg-[#1D6076] text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option === "distance" ? "Distance" : "Rating"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wider mb-2">
                    FILTER
                  </p>
                  <div className="flex gap-2">
                    {(["all", "available"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setFilterBy(option)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          filterBy === option
                            ? "bg-[#1D6076] text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option === "all" ? "All" : "Open Now"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredLaundries.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" strokeWidth={1.8} />
              </div>
              <h2 className="text-gray-900 text-lg mb-2">No matches found</h2>
              <p className="text-gray-500 text-sm">
                Try a different search term or remove the availability filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
