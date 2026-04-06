import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, Check, AlertCircle, Loader2,
  MessageSquare, ThumbsUp, XCircle
} from 'lucide-react';
import { Order, getOrder, saveOrder } from '../data/sampleOrders';

// ── Flow states ───────────────────────────────────────────────────────────────
type FlowState =
  | 'loading'
  | 'not_found'
  | 'incomplete_order'   // order not delivered yet
  | 'already_rated'      // already has a rating
  | 'form'               // rating input form
  | 'submitting'
  | 'success';

// ── Star labels ───────────────────────────────────────────────────────────────
const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const quickTags  = ['Fast delivery', 'Clean clothes', 'Friendly valet', 'Great packaging', 'On time', 'Careful with items'];

function simulateSave(): Promise<void> {
  return new Promise(r => setTimeout(r, 1400));
}

function simulateUpdateRating(): Promise<void> {
  return new Promise(r => setTimeout(r, 800));
}

function simulateNotifyAdmin(): Promise<void> {
  return new Promise(r => setTimeout(r, 700));
}

// ── Submitting Step Indicator ────────────────────────────────────────────────
function SubmittingScreen({ step }: { step: number }) {
  const steps = [
    { label: 'Saving your rating & review…',         icon: '💾' },
    { label: 'Updating laundry average rating…',     icon: '⭐' },
    { label: 'Notifying laundry admin…',             icon: '📨' },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
        <Loader2 size={36} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-6">Submitting Rating…</h2>
      <div className="w-full max-w-xs space-y-3">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 ${
              i < step ? 'bg-emerald-50 border border-emerald-200' :
              i === step ? 'bg-[#1D6076]/10 border border-[#1D6076]/20' :
              'bg-gray-50 border border-gray-100 opacity-40'
            }`}
          >
            <span className="text-lg">{i < step ? '✅' : s.icon}</span>
            <span className={`text-sm ${i < step ? 'text-emerald-700 font-medium' : i === step ? 'text-[#1D6076] font-medium' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RateLaundry() {
  const { id }   = useParams<{ id: string }>();
  const router = useRouter();

  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [order, setOrder]         = useState<Order | null>(null);
  const [submitStep, setSubmitStep] = useState(0);

  // Form state
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [review,       setReview]       = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputError,   setInputError]   = useState('');

  useEffect(() => {
    const run = async () => {
      await new Promise(r => setTimeout(r, 700));
      const found = getOrder(id ?? '');
      if (!found)                        { setFlowState('not_found');      return; }
      if (found.status !== 'delivered')  { setFlowState('incomplete_order'); setOrder(found); return; }
      if (found.rating !== null)         { setFlowState('already_rated');   setOrder(found); return; }
      setOrder(found);
      setFlowState('form');
    };
    run();
  }, [id]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    setInputError('');
    if (selectedStar === 0) { setInputError('Please select a star rating to continue'); return; }
    if (!order) return;

    setFlowState('submitting');
    setSubmitStep(0);

    // Step 1: save rating
    await simulateSave();
    const reviewText = [
      ...selectedTags,
      ...(review.trim() ? [review.trim()] : []),
    ].join('. ');
    const updated: Order = {
      ...order,
      rating:    selectedStar,
      review:    reviewText || null,
      updatedAt: new Date().toISOString(),
    };
    saveOrder(updated);
    setOrder(updated);

    // Step 2: update average rating
    setSubmitStep(1);
    await simulateUpdateRating();

    // Step 3: notify admin
    setSubmitStep(2);
    await simulateNotifyAdmin();

    setFlowState('success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {/* Header */}
      {flowState !== 'success' && (
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <h1 className="text-gray-900 text-lg">Rate Your Order</h1>
          </div>
        </div>
      )}

      {/* Loading */}
      {flowState === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      )}

      {/* Not found */}
      {flowState === 'not_found' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-6">Order not found.</p>
          <Link href="/orders" className="text-[#1D6076] text-sm underline">My Orders</Link>
        </div>
      )}

      {/* Incomplete order */}
      {flowState === 'incomplete_order' && order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-5">
            <XCircle size={34} className="text-orange-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Order Not Completed Yet</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs leading-relaxed">
            You can only rate an order after it has been delivered. Your order is currently <strong>{order.status.replace(/_/g, ' ')}</strong>.
          </p>
          <Link href={`/track-order/${order.id}`}
            className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all"
          >
            Track Order
          </Link>
        </div>
      )}

      {/* Already rated */}
      {flowState === 'already_rated' && order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
            <Star size={36} className="text-amber-400 fill-amber-400" strokeWidth={0} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Already Rated</h2>
          <p className="text-gray-500 text-sm mb-3 max-w-xs">You&apos;ve already submitted a rating for this order.</p>
          <div className="flex gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={22}
                className={i <= (order.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                strokeWidth={1}
              />
            ))}
          </div>
          <Link href={`/track-order/${order.id}`} className="text-[#1D6076] text-sm underline">View Order</Link>
        </div>
      )}

      {/* Submitting */}
      {flowState === 'submitting' && <SubmittingScreen step={submitStep} />}

      {/* Success */}
      {flowState === 'success' && order && (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center">
              <Check size={40} className="text-amber-500" strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-2xl text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm mb-3 max-w-xs leading-relaxed">
            Your rating has been submitted and the laundry admin has been notified.
          </p>
          <div className="flex gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={26}
                className={i <= (order.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                strokeWidth={1}
              />
            ))}
          </div>
          <p className="text-amber-600 font-medium text-base mb-8">
            {starLabels[order.rating ?? 0]} — {order.laundryName}
          </p>
          <button
            onClick={() => router.push(`/track-order/${order.id}`)}
            className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3"
          >
            View Order
          </button>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      )}

      {/* Rating form */}
      {flowState === 'form' && order && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-5 pb-32">

          {/* Laundry name */}
          <div className="text-center pt-2">
            <p className="text-gray-400 text-xs mb-1">Reviewing</p>
            <h2 className="text-gray-900 text-xl">{order.laundryName}</h2>
            <p className="text-gray-400 text-xs mt-1">Order #{order.id} · {order.serviceName}</p>
          </div>

          {/* Stars */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-5">YOUR RATING</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(i)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={
                      i <= (hoveredStar || selectedStar)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }
                    strokeWidth={1}
                  />
                </button>
              ))}
            </div>
            {(hoveredStar || selectedStar) > 0 && (
              <p className="text-amber-500 text-sm font-medium transition-all">
                {starLabels[hoveredStar || selectedStar]}
              </p>
            )}
            {inputError && (
              <p className="text-red-500 text-xs mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={12} strokeWidth={2} />{inputError}
              </p>
            )}
          </div>

          {/* Quick tags */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp size={14} className="text-[#1D6076]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">QUICK FEEDBACK</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-[0.97] ${
                    selectedTags.includes(tag)
                      ? 'bg-[#1D6076] text-white border-[#1D6076] shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Written review */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-[#EBA050]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">WRITTEN REVIEW <span className="text-gray-300 font-normal">(optional)</span></p>
            </div>
            <textarea
              rows={4}
              placeholder="Share more about your experience…"
              value={review}
              onChange={e => setReview(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1D6076] focus:ring-1 focus:ring-[#1D6076]/20 transition-all resize-none"
            />
            <p className="text-xs text-gray-300 text-right mt-1">{review.length}/500</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      {flowState === 'form' && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              className="w-full bg-[#EBA050] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#d4832a] active:scale-[0.99] transition-all shadow-sm"
            >
              <Star size={16} className="fill-white" strokeWidth={0} />
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
}