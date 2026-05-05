"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  MessageSquare,
  Star,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  addReviewRequest,
  ApiError,
  checkOrderReviewRequest,
  getLaundriesRequest,
  getOrderByIdRequest,
  mapOrderDtoToUiOrder,
  type UiOrder,
} from "@/app/lib/api";

type FlowState =
  | "loading"
  | "not_found"
  | "invalid"
  | "incomplete_order"
  | "already_rated"
  | "missing_laundry"
  | "form"
  | "submitting"
  | "success";

type SubmissionStep = 0 | 1 | 2;

const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const quickTags = [
  "Fast delivery",
  "Clean clothes",
  "Handled with care",
  "Great packaging",
  "On time",
  "Worth the price",
];

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractReviewCheck(input: Awaited<ReturnType<typeof checkOrderReviewRequest>>) {
  return {
    hasRating: Boolean(input.hasRating ?? input.HasRating),
    rating: Number(input.rating ?? input.Rating ?? 0),
    comment: input.comment ?? input.Comment ?? "",
  };
}

async function resolveLaundryIdByName(laundryName: string) {
  const response = await getLaundriesRequest({
    pageIndex: 1,
    pageSize: 100,
    search: laundryName,
  });

  const normalizedTarget = normalizeName(laundryName);
  const exact = response.data.find(
    (laundry) => normalizeName(laundry.name) === normalizedTarget,
  );
  if (exact) return exact.id;

  const partial = response.data.find((laundry) =>
    normalizeName(laundry.name).includes(normalizedTarget),
  );
  return partial?.id ?? null;
}

function SubmittingScreen({ step }: { step: SubmissionStep }) {
  const steps = [
    { label: "Saving your rating...", done: step > 0, active: step === 0 },
    { label: "Updating laundry review...", done: step > 1, active: step === 1 },
    { label: "Finishing up...", done: false, active: step === 2 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
        <Loader2 size={36} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-6">Submitting Rating...</h2>
      <div className="w-full max-w-xs space-y-3">
        {steps.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              item.done
                ? "bg-emerald-50 border-emerald-200"
                : item.active
                  ? "bg-[#1D6076]/10 border-[#1D6076]/20"
                  : "bg-gray-50 border-gray-100 opacity-50"
            }`}
          >
            <span className="text-lg">
              {item.done ? "OK" : item.active ? "..." : "•"}
            </span>
            <span
              className={`text-sm ${
                item.done
                  ? "text-emerald-700 font-medium"
                  : item.active
                    ? "text-[#1D6076] font-medium"
                    : "text-gray-400"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RateLaundry() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const { user, isAuthReady, isLoggedIn } = useAuth();

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [laundryId, setLaundryId] = useState<number | null>(null);
  const [existingRating, setExistingRating] = useState(0);
  const [existingComment, setExistingComment] = useState("");
  const [submitStep, setSubmitStep] = useState<SubmissionStep>(0);

  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace(`/login?from=${encodeURIComponent(`/rate-order/${id}`)}`);
    }
  }, [id, isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || !user?.token || !id) return;

    let cancelled = false;

    async function load() {
      try {
        setFlowState("loading");
        setInputError("");

        const orderResponse = await getOrderByIdRequest(user.token!, id);
        if (cancelled) return;

        const nextOrder = mapOrderDtoToUiOrder(orderResponse);
        setOrder(nextOrder);

        if (nextOrder.status !== "delivered") {
          setFlowState("incomplete_order");
          return;
        }

        const reviewCheck = extractReviewCheck(
          await checkOrderReviewRequest(user.token!, id),
        );
        if (cancelled) return;

        if (reviewCheck.hasRating) {
          setExistingRating(reviewCheck.rating);
          setExistingComment(reviewCheck.comment);
          setFlowState("already_rated");
          return;
        }

        const resolvedLaundryId = await resolveLaundryIdByName(nextOrder.laundryName);
        if (cancelled) return;

        if (!resolvedLaundryId) {
          setFlowState("missing_laundry");
          return;
        }

        setLaundryId(resolvedLaundryId);
        setFlowState("form");
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 404) {
          setFlowState("not_found");
          return;
        }

        setFlowState("invalid");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthReady, isLoggedIn, user?.token]);

  const selectedLabel = useMemo(
    () => starLabels[hoveredStar || selectedStar] ?? "",
    [hoveredStar, selectedStar],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const handleSubmit = async () => {
    if (!user?.token || !order || !laundryId) return;

    setInputError("");
    if (selectedStar === 0) {
      setInputError("Please select a star rating to continue.");
      return;
    }

    try {
      setFlowState("submitting");
      setSubmitStep(0);

      await addReviewRequest(user.token, {
        orderId: Number(order.id),
        laundryId,
        rating: selectedStar,
        tags: selectedTags,
        comment: review.trim() || null,
      });

      setSubmitStep(1);
      setSubmitStep(2);
      setExistingRating(selectedStar);
      setExistingComment(review.trim());
      setFlowState("success");
    } catch (error) {
      setFlowState("form");
      setInputError(
        error instanceof ApiError
          ? error.message
          : "Failed to submit rating. Please try again.",
      );
    }
  };

  if (!isAuthReady || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {flowState !== "success" && flowState !== "submitting" && (
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <h1 className="text-gray-900 text-lg">Rate Laundry</h1>
          </div>
        </div>
      )}

      {flowState === "loading" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Loading your order...</p>
        </div>
      )}

      {flowState === "not_found" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-6">Order not found.</p>
          <Link href="/orders" className="text-[#1D6076] text-sm underline">
            My Orders
          </Link>
        </div>
      )}

      {flowState === "invalid" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-2">We couldn&apos;t load the review form.</p>
          <p className="text-gray-500 text-sm mb-6">Please try again from your order details page.</p>
          <Link href="/orders" className="text-[#1D6076] text-sm underline">
            My Orders
          </Link>
        </div>
      )}

      {flowState === "missing_laundry" && order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <AlertCircle size={36} className="text-orange-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-2">We found your order, but couldn&apos;t prepare the laundry review yet.</p>
          <p className="text-gray-500 text-sm mb-6">
            The current backend order response does not include a direct laundry id, so the app couldn&apos;t safely match the laundry for this review.
          </p>
          <Link href={`/track-order/${order.id}`} className="text-[#1D6076] text-sm underline">
            Back to Order
          </Link>
        </div>
      )}

      {flowState === "incomplete_order" && order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-5">
            <XCircle size={34} className="text-orange-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Order Not Completed Yet</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs leading-relaxed">
            You can rate the laundry only after the order is delivered.
          </p>
          <Link
            href={`/track-order/${order.id}`}
            className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all"
          >
            Track Order
          </Link>
        </div>
      )}

      {flowState === "already_rated" && order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
            <Star size={36} className="text-amber-400 fill-amber-400" strokeWidth={0} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">You Already Rated This Laundry</h2>
          <p className="text-gray-500 text-sm mb-3 max-w-xs">
            Your review for {order.laundryName} has already been submitted.
          </p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                className={star <= existingRating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                strokeWidth={1}
              />
            ))}
          </div>
          {existingComment && (
            <div className="max-w-sm rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 mb-6">
              {existingComment}
            </div>
          )}
          <Link href={`/track-order/${order.id}`} className="text-[#1D6076] text-sm underline">
            View Order
          </Link>
        </div>
      )}

      {flowState === "submitting" && <SubmittingScreen step={submitStep} />}

      {flowState === "success" && order && (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <Check size={40} className="text-amber-500" strokeWidth={2} />
          </div>
          <h2 className="text-2xl text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm mb-3 max-w-xs leading-relaxed">
            Your laundry review has been submitted successfully.
          </p>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={26}
                className={star <= existingRating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                strokeWidth={1}
              />
            ))}
          </div>
          <p className="text-amber-600 font-medium text-base mb-8">
            {starLabels[existingRating]} - {order.laundryName}
          </p>
          <button
            onClick={() => router.push(`/track-order/${order.id}`)}
            className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3"
          >
            View Order
          </button>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Back to Home
          </Link>
        </div>
      )}

      {flowState === "form" && order && (
        <>
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-5 pb-32">
            <div className="text-center pt-2">
              <p className="text-gray-400 text-xs mb-1">Reviewing</p>
              <h2 className="text-gray-900 text-xl">{order.laundryName}</h2>
              <p className="text-gray-400 text-xs mt-1">
                Order #{order.id} - {order.serviceName}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-5">YOUR RATING</p>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setSelectedStar(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={
                        star <= (hoveredStar || selectedStar)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }
                      strokeWidth={1}
                    />
                  </button>
                ))}
              </div>
              {selectedLabel && (
                <p className="text-amber-500 text-sm font-medium transition-all">{selectedLabel}</p>
              )}
              {inputError && (
                <p className="text-red-500 text-xs mt-2 flex items-center justify-center gap-1">
                  <AlertCircle size={12} strokeWidth={2} />
                  {inputError}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp size={14} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wider">QUICK FEEDBACK</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-[0.97] ${
                      selectedTags.includes(tag)
                        ? "bg-[#1D6076] text-white border-[#1D6076] shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {selectedTags.includes(tag) ? "OK " : ""}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-[#EBA050]" strokeWidth={2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wider">
                  WRITTEN REVIEW <span className="text-gray-300 font-normal">(optional)</span>
                </p>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Share more about your experience..."
                value={review}
                onChange={(event) => setReview(event.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1D6076] focus:ring-1 focus:ring-[#1D6076]/20 transition-all resize-none"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{review.length}/1000</p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSubmit}
                className="w-full bg-[#EBA050] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#d4832a] active:scale-[0.99] transition-all shadow-sm"
              >
                <Star size={16} className="fill-white" strokeWidth={0} />
                Submit Laundry Rating
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
