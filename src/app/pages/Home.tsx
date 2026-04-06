import { useEffect, useRef, useState } from 'react';
import Link from "next/link"
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useInView } from 'motion/react';
import { ArrowRight, MapPin, Star, ShieldCheck, Zap, Clock, ChevronRight, Sparkles, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getLaundriesRequest, mapLaundryDtoToUiLaundry, UiLaundry } from '@/app/lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const HERO_IMG       = 'https://images.unsplash.com/photo-1596433904747-e8b061219a71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400';
const DELIVERY_IMG   = 'https://images.unsplash.com/photo-1576192350050-d9e08ee1f122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';
const WASHING_IMG    = 'https://images.unsplash.com/photo-1631323272727-6418cf55f287?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

const steps = [
  { n: '01', title: 'Find a Laundry',    desc: 'Browse verified laundries near your location, compare prices and ratings.',              icon: MapPin,      color: '#1D6076', bg: '#EFF8FB' },
  { n: '02', title: 'Place Your Order',  desc: 'Choose services, set a pickup time, and confirm your order in seconds.',               icon: Sparkles,   color: '#EBA050', bg: '#FFF7ED' },
  { n: '03', title: 'Track & Receive',   desc: 'Follow your order in real time and receive your clean clothes at your door.',           icon: CheckCircle, color: '#059669', bg: '#ECFDF5' },
];

const features = [
  { icon: ShieldCheck, title: 'Verified Laundries',  desc: 'Every partner laundry is vetted for quality and reliability.',       color: '#1D6076' },
  { icon: Clock,       title: 'Smart Scheduling',    desc: 'Pick a time slot that suits you — no waiting, no surprises.',        color: '#EBA050' },
  { icon: Zap,         title: 'Real-Time Tracking',  desc: 'Know exactly where your order is at every step of the process.',     color: '#059669' },
  { icon: Star,        title: 'Transparent Pricing', desc: 'See exact costs before you order — no hidden fees, ever.',           color: '#7c3aed' },
];

const testimonials = [
  { name: 'Nour Khalil',  role: 'New Cairo', rating: 5, text: 'Nadeef saved me so much time. My clothes come back perfectly clean every single time!' },
  { name: 'Ahmed Tarek',  role: 'Maadi',     rating: 5, text: 'The tracking feature is a game-changer. I always know when to expect my delivery.' },
  { name: 'Sara Mansour', role: 'Zamalek',   rating: 5, text: 'Best laundry service in Cairo by far. Affordable, fast, and professional.' },
];

// ── Reusable scroll-reveal section ───────────────────────────────────────────
function Section({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

// ── Staggered list container ──────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
} as const;
const itemVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

// ── Count-up stat ────────────────────────────────────────────────────────────
function StatItem({ v, l }: { v: string; l: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <p className="text-white font-bold text-xl">{v}</p>
      <p className="text-white/50 text-xs">{l}</p>
    </motion.div>
  );
}

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nearbyPreview, setNearbyPreview] = useState<UiLaundry[]>([]);

  useEffect(() => {
    if (searchParams.get('orderPlaced') !== '1') return;

    toast.success('Order placed successfully.');
    router.replace('/');
  }, [searchParams, router]);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await getLaundriesRequest({ pageIndex: 1, pageSize: 3 });
        setNearbyPreview(response.data.map((entry) => mapLaundryDtoToUiLaundry(entry)));
      } catch {
        setNearbyPreview([]);
      }
    };

    loadPreview();
  }, []);

  return (
    <div className="min-h-screen" dir="ltr">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0d3d50] min-h-[85vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={HERO_IMG}
            alt="Clean laundry"
            className="w-full h-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d3d50] via-[#1D6076]/90 to-[#0d3d50]/80" />
          {/* Animated blobs */}
          <motion.div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#EBA050]/15 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#1D6076]/30 blur-3xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            {isLoggedIn && user && (
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6"
              >
                <span className="text-amber-300 text-sm">👋</span>
                <span className="text-white/90 text-sm">Welcome back, {user.firstName}!</span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight"
              style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Your Neighbourhood<br />
              Laundry,{' '}
              <motion.span
                style={{ color: '#EBA050' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Delivered.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="text-white/75 text-lg md:text-xl mb-8 leading-relaxed max-w-lg"
            >
              Ndeef connects you with the best local laundries. Browse, order, track — clean clothes at your door.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link
                 href="/nearby"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-[#EBA050]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}
              >
                <MapPin size={16} strokeWidth={2.5} />
                Find Laundries Near Me
              </Link>
              {!isLoggedIn && (
                <Link
                   href="/signup"
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-semibold text-white border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 active:scale-[0.98] transition-all"
                >
                  Get Started Free
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              )}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="flex flex-wrap gap-5"
            >
              {[
                { v: '500+', l: 'Orders Delivered' },
                { v: '50+',  l: 'Partner Laundries' },
                { v: '4.9★', l: 'Average Rating' },
              ].map(({ v, l }) => <StatItem key={l} v={v} l={l} />)}
            </motion.div>
          </div>

          {/* Right — feature card */}
          <div className="hidden md:flex justify-center items-center">
            <motion.div
              className="relative w-80"
              initial={{ opacity: 0, x: 60, rotateY: 8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              style={{ perspective: 800 }}
            >
              {/* Main card */}
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1D6076]/10 flex items-center justify-center">
                    <Sparkles size={22} className="text-[#1D6076]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">Smart Laundry Service</p>
                    <p className="text-gray-400 text-xs">Ndeef Platform</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Wash & Fold', 'Dry Cleaning', 'Ironing Service'].map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
                    >
                      <span className="text-sm text-gray-700">{s}</span>
                      <span className="text-xs font-semibold text-[#1D6076]">{['18', '45', '8'][i]} EGP</span>
                    </motion.div>
                  ))}
                </div>
                <Link
                   href="/nearby"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
                >
                  Order Now <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Floating rating badge */}
              <motion.div
                className="absolute -top-4 -right-4 bg-gradient-to-br from-[#EBA050] to-[#d4832a] text-white rounded-2xl px-4 py-2 shadow-lg text-xs font-semibold"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                ⭐ 4.9 / 5.0
              </motion.div>

              {/* Floating delivered badge */}
              <motion.div
                className="absolute -bottom-3 -left-3 bg-white rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-medium text-gray-700 border border-gray-100"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Order delivered!
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <Section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-block bg-[#1D6076]/10 text-[#1D6076] text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase"
            >
              How It Works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl md:text-4xl text-gray-900"
              style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Fresh clothes in 3 easy steps
            </motion.h2>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {steps.map(({ n, title, desc, icon: Icon, color, bg }) => (
              <motion.div key={n} className="group relative" variants={itemVariants}>
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-px" style={{ background: `linear-gradient(to right, ${color}30, transparent)` }} />
                <motion.div
                  className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative"
                  whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.10)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: bg }}
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon size={26} style={{ color }} strokeWidth={1.8} />
                    </motion.div>
                    <span className="text-5xl font-black mt-1" style={{ color: `${color}15`, lineHeight: 1 }}>{n}</span>
                  </div>
                  <h3 className="text-gray-900 text-xl mb-2" style={{ fontWeight: 700 }}>{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── NEARBY LAUNDRIES PREVIEW ──────────────────────────────────────── */}
      <Section className="py-20 md:py-28" style={{ background: 'linear-gradient(135deg, #1D6076 0%, #0d3d50 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <motion.span
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="inline-block bg-white/15 text-white text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase"
              >
                Near You
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl text-white"
                style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
              >
                Top Laundries
              </motion.h2>
            </div>
            <Link  href="/nearby" className="flex items-center gap-1.5 text-[#EBA050] text-sm font-semibold hover:gap-2.5 transition-all">
              See All <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-5"
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {nearbyPreview.length > 0 ? nearbyPreview.map(l => (
              <motion.div key={l.id} variants={itemVariants}>
                <Link  href={`/laundry/${l.id}`} className="group block">
                  <motion.div
                    className="bg-white rounded-3xl overflow-hidden shadow-lg"
                    whileHover={{ y: -8, boxShadow: '0 30px 60px rgba(0,0,0,0.20)' }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }} className="h-full">
                        <ImageWithFallback
                          src={l.image || WASHING_IMG}
                          alt={l.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                        <MapPin size={11} className="text-[#1D6076]" strokeWidth={2.5} />
                        <span className="text-xs font-semibold text-gray-800">{l.distanceLabel}</span>
                      </div>
                      {l.isAvailable && (
                        <div className="absolute top-3 left-3 bg-emerald-500 rounded-full px-3 py-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-white text-xs font-semibold">Open</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-gray-900 font-semibold text-base">{l.name}</h3>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Star size={13} className="text-amber-400 fill-amber-400" strokeWidth={0} />
                          <span className="text-sm font-semibold text-gray-800">{l.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mb-3">{l.address}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">From <strong className="text-[#1D6076]">{l.services.length ? Math.min(...l.services.map(s => s.price)) : 0} EGP</strong></span>
                        <span className="text-xs font-semibold text-[#1D6076] flex items-center gap-0.5">
                          View Services <ChevronRight size={12} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )) : (
              <motion.div
                variants={itemVariants}
                className="md:col-span-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center"
              >
                <p className="text-white text-lg font-semibold mb-2">No live laundries yet</p>
                <p className="text-white/65 text-sm max-w-md mx-auto">
                  The deployed backend is connected, but it is currently returning an empty laundries list.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </Section>

      {/* ── WHY NDEEF ─────────────────────────────────────────────────────── */}
      <Section className="bg-[#f8fafb] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block bg-[#EBA050]/15 text-[#EBA050] text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase">
                Why Ndeef
              </span>
              <h2 className="text-3xl md:text-4xl text-gray-900 mb-5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Built for the modern<br />Egyptian lifestyle
              </h2>
              <p className="text-gray-500 text-base leading-relaxed max-w-md">
                We solve the chaos of informal laundry communication by bringing transparency, speed, and accountability to your doorstep.
              </p>
            </motion.div>
            <motion.div
              className="relative rounded-3xl overflow-hidden h-72"
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <ImageWithFallback src={DELIVERY_IMG} alt="Delivery service" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1D6076]/30 to-transparent" />
            </motion.div>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
          >
            {features.map(({ icon: Icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-default"
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: `${color}40` }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}15` }}
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                >
                  <Icon size={22} style={{ color }} strokeWidth={1.8} />
                </motion.div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <Section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-block bg-amber-50 text-amber-600 text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-4 uppercase"
            >
              Reviews
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl md:text-4xl text-gray-900"
              style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Loved by our customers
            </motion.h2>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={listVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
          >
            {testimonials.map(({ name, role, rating, text }) => (
              <motion.div
                key={name}
                variants={itemVariants}
                className="bg-gray-50 rounded-3xl p-7 border border-gray-100 cursor-default"
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.07)', backgroundColor: '#fff' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400 }}
                    >
                      <Star size={16} className="text-amber-400 fill-amber-400" strokeWidth={0} />
                    </motion.span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{name[0]}</span>
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold">{name}</p>
                    <p className="text-gray-400 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <Section className="py-20" style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            className="text-5xl mb-5 select-none"
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.12, 1.12, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          >
            👕
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontWeight: 800 }}
          >
            Ready for clean clothes?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/80 text-lg mb-8"
          >
            Join thousands of Egyptians who trust Ndeef for their laundry.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link
               href="/nearby"
              className="flex items-center gap-2 bg-white font-semibold px-8 py-4 rounded-2xl hover:bg-gray-50 hover:-translate-y-0.5 shadow-xl transition-all text-sm"
              style={{ color: '#1D6076' }}
            >
              <MapPin size={16} strokeWidth={2.5} />
              Find Laundries Now
            </Link>
            {!isLoggedIn && (
              <Link
                 href="/signup"
                className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl hover:-translate-y-0.5 shadow-xl transition-all text-sm text-white"
                style={{ background: '#0d3d50' }}
              >
                Create Free Account
              </Link>
            )}
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0d3d50] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
                <span className="text-white font-bold text-lg">Ndeef</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Smart laundry platform connecting residents with local laundries in Egypt.</p>
            </div>
            {[
              { heading: 'Platform', links: ['Find Laundries', 'My Orders', 'How It Works', 'Pricing'] },
              { heading: 'Account',  links: ['Sign In', 'Register', 'Profile', 'Preferences'] },
              { heading: 'Support',  links: ['Help Center', 'Contact Us', 'Terms of Service', 'Privacy Policy'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-white font-semibold text-sm mb-4">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(l => (
                    <li key={l}>
                      <span className="text-white/45 text-sm hover:text-white/80 cursor-pointer transition-colors">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2026 Ndeef. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Cookies'].map(t => (
                <span key={t} className="text-white/30 text-sm hover:text-white/60 cursor-pointer transition-colors">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
