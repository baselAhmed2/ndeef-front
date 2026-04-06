import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, AlertCircle,
  User, Mail, Lock, Phone, MapPin, Check
} from 'lucide-react';
import { useAuth, SignupData } from '../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

const SIDE_IMG = 'https://images.unsplash.com/photo-1711783059489-8a0da5564785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < current
                  ? 'bg-[#1D6076] text-white'
                  : i === current
                    ? 'bg-[#1D6076] text-white ring-4 ring-[#1D6076]/20'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-8 rounded-full transition-all ${i < current ? 'bg-[#1D6076]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-400 font-medium">Step {current + 1} of {total}</span>
    </div>
  );
}

function InputField({
  label, type = 'text', placeholder, value, onChange, error, icon: Icon, suffix
}: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; icon: React.ElementType; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 ${suffix ? 'pr-11' : ''} text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
            error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
          }`}
        />
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
        {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const { signup, socialLogin } = useAuth();

  const [step, setStep] = useState(0); // 0 = choose method, 1 = details, 2 = contact
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [address,   setAddress]   = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim())  e.lastName  = 'Last name is required';
    if (!email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep0Continue = () => setStep(1);

  const handleStep1Next = () => {
    if (validateStep1()) { setErrors({}); setStep(2); }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    const data: SignupData = { firstName, lastName, email, phone, password, address };
    const result = await signup(data);
    setLoading(false);
    if (!result.ok) {
      setErrors((prev) => ({
        ...prev,
        submit: result.message ?? "Unable to create your account.",
      }));
      return;
    }

    if (result.requiresVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(result.email ?? email)}`);
      return;
    }

    router.replace('/');
  };

  const handleSocial = async (provider: string, credential: string) => {
    setSocialLoad(provider);
    const result = await socialLogin(provider, credential);
    setSocialLoad('');
    if (result.ok) router.replace('/');
    else {
      setErrors((prev) => ({
        ...prev,
        submit: result.message ?? "Social sign-up is not available right now.",
      }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex" dir="ltr">

      {/* ── Left form ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 max-w-xl mx-auto w-full lg:max-w-none">
        <div className="max-w-md w-full mx-auto">

          {/* Back */}
          <button
            onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors group"
          >
            <ArrowLeft size={16} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 0 ? 'Back' : 'Previous step'}
          </button>

          {/* Step 0 — Choose method */}
          {step === 0 && (
            <>
              <h1 className="text-3xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Create account
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Join Nadeef for free.{' '}
                <Link href="/login" className="text-[#1D6076] font-medium hover:underline">Already have an account?</Link>
              </p>

              <div className="space-y-3 mb-6">
                {socialLoad === 'google' ? (
                  <div className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-800 opacity-60">
                    <Loader2 size={18} className="animate-spin text-gray-500" strokeWidth={2} />
                    Signing in with Google...
                  </div>
                ) : (
                  <GoogleSignInButton
                    disabled={loading}
                    text="signup_with"
                    onCredential={(credential) => handleSocial('google', credential)}
                  />
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-gray-400 text-xs font-medium">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                onClick={handleStep0Continue}
                className="w-full py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
              >
                Sign up with Email
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Step 1 — Name, email, password */}
          {step === 1 && (
            <>
              <StepIndicator current={0} total={2} />
              <h1 className="text-2xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Let&apos;s get started!
              </h1>
              <p className="text-gray-500 text-sm mb-6">Fill in your basic info to create your account.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="First name" placeholder="Basel" value={firstName} onChange={v => { setFirstName(v); setErrors(p => ({ ...p, firstName: '' })); }} error={errors.firstName} icon={User} />
                  <InputField label="Last name"  placeholder="Ahmed" value={lastName}  onChange={v => { setLastName(v);  setErrors(p => ({ ...p, lastName: '' }));  }} error={errors.lastName}  icon={User} />
                </div>
                <InputField label="Email" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} icon={Mail} />
                <InputField
                  label="Create password" type={showPwd ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                  error={errors.password} icon={Lock}
                  suffix={
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                    </button>
                  }
                />
              </div>

              <button
                onClick={handleStep1Next}
                className="w-full mt-6 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{ background: 'linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)' }}
              >
                Continue
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Step 2 — Phone & address */}
          {step === 2 && (
            <>
              <StepIndicator current={1} total={2} />
              <h1 className="text-2xl text-gray-900 mb-1.5" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Almost done!
              </h1>
              <p className="text-gray-500 text-sm mb-6">Add your contact details for smooth delivery.</p>

              <div className="space-y-4">
                <InputField label="Phone number" type="tel" placeholder="+20 1XX XXX XXXX" value={phone} onChange={v => { setPhone(v); setErrors(p => ({ ...p, phone: '' })); }} error={errors.phone} icon={Phone} />
                <InputField label="Home address (optional)" placeholder="Street, City" value={address} onChange={setAddress} icon={MapPin} />
              </div>

              {errors.submit && (
                <div className="mt-4 flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <AlertCircle size={16} className="text-red-500 shrink-0" strokeWidth={2} />
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4 leading-relaxed text-center">
                By creating an account you agree to our{' '}
                <span className="text-[#1D6076] cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#1D6076] cursor-pointer hover:underline">Privacy Policy</span>
              </p>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-5 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Creating account…</>
                  : <><Check size={16} strokeWidth={2.5} /> Create My Account</>
                }
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Right: image ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EBA050 0%, #d4832a 100%)' }}>
        <ImageWithFallback
          src={SIDE_IMG}
          alt="Happy customer"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#EBA050]/80 to-[#d4832a]/90" />
        <div className="relative z-10 flex flex-col justify-center px-14 py-16 max-w-lg">
          <div className="text-6xl mb-6">🧺</div>
          <h2 className="text-4xl text-white mb-5" style={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Don&apos;t let laundry<br />slow you down.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Join Nadeef and discover a smarter way to manage your laundry — schedule pickups, track orders, and get fresh clothes delivered.
          </p>
          <div className="space-y-3">
            {['Browse verified local laundries', 'Transparent pricing, no surprises', 'Real-time order tracking'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white/90 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
