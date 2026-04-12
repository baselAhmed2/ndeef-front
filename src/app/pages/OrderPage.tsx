import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Crosshair,
  Minus,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Check,
  AlertCircle,
  Loader2,
  Package,
  ChevronDown,
  Banknote,
  CreditCard,
  RefreshCw,
  Trash2,
  Navigation,
  X,
} from "lucide-react";
import {
  ApiError,
  UiLaundry,
  UiServiceItem,
  calculatePriceRequest,
  getLaundryRequest,
  mapLaundryDtoToUiLaundry,
  placeOrderRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

const dates = ["Today", "Tomorrow", "Day After"];
const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
];

function toPickupDateTime(dateLabel: string, timeSlot: string) {
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  if (dateLabel === "Tomorrow") date.setDate(date.getDate() + 1);
  if (dateLabel === "Day After") date.setDate(date.getDate() + 2);

  const [start] = timeSlot.split("-");
  const [hours, minutes] = start.trim().split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

function formatMapAddress(latitude: number, longitude: number) {
  return `Location selected from map (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
}

export default function OrderPage() {
  const { laundryId } = useParams<{ laundryId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isAuthReady, user } = useAuth();

  const selectedServiceIds = useMemo(
    () =>
      Array.from(
        new Set(
          (searchParams.get("services") ?? searchParams.get("service") ?? "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      ),
    [searchParams],
  );

  const [laundry, setLaundry] = useState<UiLaundry | null>(null);
  const [selectedServices, setSelectedServices] = useState<UiServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTime, setSelectedTime] = useState("10:00 - 12:00");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sameAddress, setSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "cash">("credit");
  const [validating, setValidating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [mapTarget, setMapTarget] = useState<"pickup" | "delivery" | null>(null);
  const [mapLatitude, setMapLatitude] = useState(30.044420);
  const [mapLongitude, setMapLongitude] = useState(31.235712);
  const [mapError, setMapError] = useState("");
  const [mapLoadingLocation, setMapLoadingLocation] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn) {
      const params = new URLSearchParams();
      if (selectedServiceIds.length > 0) {
        params.set("services", selectedServiceIds.join(","));
      }
      const from = encodeURIComponent(
        `/order/${laundryId}${params.toString() ? `?${params.toString()}` : ""}`,
      );
      router.replace(`/login?from=${from}`);
    }
  }, [isAuthReady, isLoggedIn, laundryId, router, selectedServiceIds]);

  useEffect(() => {
    const loadLaundry = async () => {
      if (!laundryId) return;

      try {
        setLoading(true);
        const response = await getLaundryRequest(laundryId);
        const mappedLaundry = mapLaundryDtoToUiLaundry(response);
        const nextSelectedServices = mappedLaundry.services.filter(
          (service) =>
            service.available && selectedServiceIds.includes(service.id),
        );

        setLaundry(mappedLaundry);
        setSelectedServices(nextSelectedServices);
        setItemCounts((current) => {
          const nextCounts: Record<string, number> = {};
          nextSelectedServices.forEach((service) => {
            nextCounts[service.id] = Math.max(1, current[service.id] ?? 1);
          });
          return nextCounts;
        });
      } catch {
        setLaundry(null);
        setSelectedServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadLaundry();
  }, [laundryId, selectedServiceIds]);

  useEffect(() => {
    const refreshPrice = async () => {
      if (!user?.token || !laundryId || selectedServices.length === 0) return;

      try {
        setPricingError("");
        const response = await calculatePriceRequest(user.token, {
          laundryId: Number(laundryId),
          items: selectedServices.map((service) => ({
            serviceId: Number(service.id),
            quantity: itemCounts[service.id] ?? 1,
          })),
        });

        setCalculatedTotal(Number(response.totalPrice));
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to calculate price right now.";
        setPricingError(message);
        setCalculatedTotal(
          selectedServices.reduce(
            (sum, service) =>
              sum + Number(service.price) * (itemCounts[service.id] ?? 1),
            0,
          ),
        );
      }
    };

    refreshPrice();
  }, [itemCounts, laundryId, selectedServices, user?.token]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!pickupAddress.trim()) nextErrors.pickup = "Pickup address is required";
    if (!sameAddress && !deliveryAddress.trim()) {
      nextErrors.delivery = "Delivery address is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const total = useMemo(() => {
    if (calculatedTotal !== null) return calculatedTotal;
    return selectedServices.reduce(
      (sum, service) =>
        sum + Number(service.price) * (itemCounts[service.id] ?? 1),
      0,
    );
  }, [calculatedTotal, itemCounts, selectedServices]);

  const totalItems = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + (itemCounts[service.id] ?? 1),
        0,
      ),
    [itemCounts, selectedServices],
  );

  const deliveryFee = 0;
  const finalDelivery = sameAddress ? pickupAddress : deliveryAddress;
  const mapPreviewSrc = useMemo(
    () =>
      `https://www.openstreetmap.org/export/embed.html?bbox=${mapLongitude - 0.01}%2C${mapLatitude - 0.01}%2C${mapLongitude + 0.01}%2C${mapLatitude + 0.01}&layer=mapnik&marker=${mapLatitude}%2C${mapLongitude}`,
    [mapLatitude, mapLongitude],
  );

  const updateItemCount = (serviceId: string, nextValue: number) => {
    setItemCounts((current) => ({
      ...current,
      [serviceId]: Math.max(1, nextValue),
    }));
  };

  const updateSelectedServicesInUrl = (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      router.push(`/laundry/${laundryId}`);
      return;
    }

    const params = new URLSearchParams();
    params.set("services", serviceIds.join(","));
    router.replace(`/order/${laundryId}?${params.toString()}`);
  };

  const removeService = (serviceId: string) => {
    updateSelectedServicesInUrl(
      selectedServices
        .filter((service) => service.id !== serviceId)
        .map((service) => service.id),
    );
  };

  const openMapPicker = (target: "pickup" | "delivery") => {
    setMapTarget(target);
    setMapError("");
  };

  const closeMapPicker = () => {
    setMapTarget(null);
    setMapError("");
    setMapLoadingLocation(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported on this device.");
      return;
    }

    setMapLoadingLocation(true);
    setMapError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapLatitude(position.coords.latitude);
        setMapLongitude(position.coords.longitude);
        setMapLoadingLocation(false);
      },
      () => {
        setMapError("We couldn't access your location. Please allow location permission and try again.");
        setMapLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const applyMapLocation = () => {
    const nextAddress = formatMapAddress(mapLatitude, mapLongitude);

    if (mapTarget === "pickup") {
      setPickupAddress(nextAddress);
      setErrors((current) => ({ ...current, pickup: "" }));
      if (sameAddress) {
        setDeliveryAddress(nextAddress);
      }
    }

    if (mapTarget === "delivery") {
      setDeliveryAddress(nextAddress);
      setErrors((current) => ({ ...current, delivery: "" }));
    }

    closeMapPicker();
  };

  const handlePlaceOrder = async () => {
    if (selectedServices.length === 0 || !user?.token) return;

    setSubmitError("");
    const normalizedRole = (user.role ?? "").toLowerCase();
    if (!normalizedRole.includes("customer")) {
      setSubmitError("Only customer accounts can place orders.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setValidating(true);
      const order = await placeOrderRequest(user.token, {
        laundryId: Number(laundryId),
        items: selectedServices.map((service) => ({
          serviceId: Number(service.id),
          quantity: itemCounts[service.id] ?? 1,
        })),
        pickupTime: toPickupDateTime(selectedDate, selectedTime),
        deliveryTime: null,
        pickupLocation: pickupAddress.trim(),
        deliveryLocation: finalDelivery.trim(),
        notes: null,
      });

      if (paymentMethod === "cash") {
        router.push(`/track-order/${order.id}?notice=placed`);
        return;
      }

      router.push(`/payment?orderId=${order.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to place the order right now.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!laundry || selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-8 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-gray-700 mb-2">No services selected</p>
          <button
            onClick={() => router.push(`/laundry/${laundryId}`)}
            className="text-[#1D6076] text-sm underline"
          >
            Choose services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-48" dir="ltr">
      <div className="sticky top-16 z-20 bg-[#1D6076] text-white px-4 md:px-8 py-4 shadow-sm">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} className="text-white" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-base">New Order</h1>
            <p className="text-white/70 text-xs truncate">
              {laundry.name} - {selectedServices.length} selected service
              {selectedServices.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-red-500 shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">Unable to place order</p>
                <p className="text-red-600 text-xs mt-0.5">{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {pricingError && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-amber-500 shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div className="flex-1">
                <p className="text-amber-700 text-sm font-medium">
                  Live price check unavailable
                </p>
                <p className="text-amber-600 text-xs mt-0.5">{pricingError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
            <AlertCircle
              size={15}
              className="text-amber-500 shrink-0"
              strokeWidth={2}
            />
            <p className="text-amber-700 text-sm">
              All required fields must be filled before placing your order.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs font-semibold text-gray-400 tracking-wider">
              SELECTED SERVICES
            </p>
            <button
              type="button"
              onClick={() => router.push(`/laundry/${laundryId}`)}
              className="text-xs text-[#1D6076] hover:underline"
            >
              Add more
            </button>
          </div>

          <div className="space-y-3">
            {selectedServices.map((service) => (
              <div
                key={service.id}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50/70"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0">
                      <Package size={20} className="text-[#1D6076]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-gray-400">{service.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-[#1D6076]">
                      {service.price} EGP
                    </p>
                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
                  <button
                    onClick={() =>
                      updateItemCount(service.id, (itemCounts[service.id] ?? 1) - 1)
                    }
                    className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                  >
                    <Minus size={18} strokeWidth={2.5} className="text-gray-600" />
                  </button>
                  <div className="text-center">
                    <p className="text-3xl text-[#1D6076]" style={{ fontWeight: 300 }}>
                      {itemCounts[service.id] ?? 1}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">quantity</p>
                  </div>
                  <button
                    onClick={() =>
                      updateItemCount(service.id, (itemCounts[service.id] ?? 1) + 1)
                    }
                    className="w-11 h-11 rounded-xl bg-[#1D6076] flex items-center justify-center hover:bg-[#2a7a94] active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={18} strokeWidth={2.5} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#EBA050]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">
              PICKUP DATE
            </p>
          </div>
          <div className="flex gap-2.5">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                  selectedDate === date
                    ? "bg-[#1D6076] text-white shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#1D6076]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">
              PICKUP TIME
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] relative ${
                  selectedTime === slot
                    ? "bg-[#1D6076] text-white shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {slot}
                {selectedTime === slot && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[#EBA050]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">
              PICKUP ADDRESS
            </p>
          </div>
          <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#1D6076]/10 bg-[#1D6076]/[0.04] p-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Choose your location from the map</p>
              <p className="text-xs text-gray-500">Use current location or fine-tune the pin coordinates.</p>
            </div>
            <button
              type="button"
              onClick={() => openMapPicker("pickup")}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1D6076] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#174e60]"
            >
              <MapPin size={15} />
              Open Map
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter your pickup address..."
            value={pickupAddress}
            onChange={(event) => {
              setPickupAddress(event.target.value);
              setErrors((current) => ({ ...current, pickup: "" }));
            }}
            className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
              errors.pickup
                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                : "border-gray-200 focus:ring-[#1D6076]/20 focus:border-[#1D6076]"
            }`}
          />
          {errors.pickup && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.pickup}
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm text-gray-700">Deliver to same address</p>
              <p className="text-xs text-gray-400">
                Use pickup address as delivery address
              </p>
            </div>
            <button
              onClick={() => setSameAddress((value) => !value)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                sameAddress ? "bg-[#1D6076]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  sameAddress ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {!sameAddress && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-[#1D6076]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">
                DELIVERY ADDRESS
              </p>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#1D6076]/10 bg-[#1D6076]/[0.04] p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Pick a different delivery point</p>
                <p className="text-xs text-gray-500">Open the map if delivery should go to another place.</p>
              </div>
              <button
                type="button"
                onClick={() => openMapPicker("delivery")}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#1D6076]/15 bg-white px-3.5 py-2 text-sm font-medium text-[#1D6076] transition hover:bg-[#1D6076]/5"
              >
                <MapPin size={15} />
                Open Map
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter delivery address..."
              value={deliveryAddress}
              onChange={(event) => {
                setDeliveryAddress(event.target.value);
                setErrors((current) => ({ ...current, delivery: "" }));
              }}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                errors.delivery
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                  : "border-gray-200 focus:ring-[#1D6076]/20 focus:border-[#1D6076]"
              }`}
            />
            {errors.delivery && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.delivery}
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">
            PAYMENT METHOD
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`text-left rounded-xl border px-4 py-3.5 transition-all ${
                paymentMethod === "cash"
                  ? "border-[#1D6076] bg-[#1D6076]/5"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <Banknote size={16} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-sm text-gray-900 font-medium">Cash on Delivery</p>
              </div>
              <p className="text-xs text-gray-500">
                Place the order immediately and pay later.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("credit")}
              className={`text-left rounded-xl border px-4 py-3.5 transition-all ${
                paymentMethod === "credit"
                  ? "border-[#1D6076] bg-[#1D6076]/5"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <CreditCard size={16} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-sm text-gray-900 font-medium">Credit Card</p>
              </div>
              <p className="text-xs text-gray-500">
                Place the order, then confirm payment through the backend.
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500">
              {totalItems} item{totalItems !== 1 ? "s" : ""} across {selectedServices.length} service
              {selectedServices.length !== 1 ? "s" : ""}
            </span>
            <span className="text-gray-700 font-medium">{total} EGP</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-gray-700 font-medium">{deliveryFee} EGP</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-100">
            <span className="text-gray-900 font-medium">Total</span>
            <span className="text-xl font-semibold text-[#1D6076]">
              {total + deliveryFee} EGP
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={validating}
            className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm"
          >
            {validating ? (
              <>
                <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                Placing order...
              </>
            ) : (
              <>
                {paymentMethod === "cash"
                  ? "Place Order (Cash on Delivery)"
                  : "Proceed to Payment"}
                <ChevronDown size={16} className="-rotate-90" strokeWidth={2} />
              </>
            )}
          </button>
          <button
            onClick={() => router.push(`/laundry/${laundryId}`)}
            className="w-full mt-2 text-xs text-[#1D6076] hover:underline"
          >
            <RefreshCw size={12} className="inline mr-1" strokeWidth={2} />
            Add or change services
          </button>
        </div>
      </div>

      <Dialog open={Boolean(mapTarget)} onOpenChange={(open) => !open && closeMapPicker()}>
        <DialogContent className="max-w-3xl rounded-[28px] border border-slate-200 bg-white p-0 shadow-2xl">
          <div className="overflow-hidden rounded-[28px]">
            <div className="bg-gradient-to-r from-[#1D6076] via-[#2b7d93] to-[#EBA050] px-6 py-5 text-white">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold">
                  Choose {mapTarget === "delivery" ? "delivery" : "pickup"} location from map
                </DialogTitle>
                <DialogDescription className="text-sm text-white/80">
                  Use your current location, adjust the coordinates if needed, then save it to the order form.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <iframe
                  title="Location map preview"
                  src={mapPreviewSrc}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                />
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Navigation size={15} className="text-[#1D6076]" />
                    {mapLatitude.toFixed(6)}, {mapLongitude.toFixed(6)}
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${mapLatitude}&mlon=${mapLongitude}#map=17/${mapLatitude}/${mapLongitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[#1D6076] hover:underline"
                  >
                    Open larger map
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">QUICK ACTIONS</p>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={mapLoadingLocation}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D6076] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#174e60] disabled:opacity-70"
                  >
                    {mapLoadingLocation ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                    {mapLoadingLocation ? "Detecting location..." : "Use my current location"}
                  </button>
                  {mapError ? (
                    <p className="mt-3 text-xs text-red-500">{mapError}</p>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Allow browser location access for the fastest address selection.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">PIN COORDINATES</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-slate-500">Latitude</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={mapLatitude}
                        onChange={(event) => setMapLatitude(Number(event.target.value))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D6076] focus:ring-2 focus:ring-[#1D6076]/15"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-slate-500">Longitude</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={mapLongitude}
                        onChange={(event) => setMapLongitude(Number(event.target.value))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1D6076] focus:ring-2 focus:ring-[#1D6076]/15"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    The saved address will include the selected map coordinates so the laundry can find you accurately.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-between">
              <button
                type="button"
                onClick={closeMapPicker}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={15} />
                Cancel
              </button>
              <button
                type="button"
                onClick={applyMapLocation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#174e60]"
              >
                <Check size={16} />
                Use This Location
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
