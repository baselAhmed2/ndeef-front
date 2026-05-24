import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, User, LogOut, MapPin, HelpCircle, ChevronDown, Home, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Monogram } from './brand/Monogram';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from './ui/utils';

// ── Nazeef Logo ────────────────────────────────────────────────────────────────
function NazeefLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
      <Monogram variant="orange" size={44} className="group-hover:scale-105 transition-transform duration-200" />
      {!compact && (
        <div className="flex flex-col items-start leading-none">
          <span
            className="ndeef-topnav-brand text-[18px] font-black tracking-wide transition-colors"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontWeight: 900,
            }}
          >
            NAZEEF
          </span>
        </div>
      )}
    </Link>
  );
}

// ── TopNav ────────────────────────────────────────────────────────────────
export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const currentPath = pathname ?? "/";
  const prefersReducedMotion = useReducedMotion();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/nearby', label: 'Laundries', icon: MapPin },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const visibleNavLinks = isLoggedIn
    ? navLinks
    : navLinks.filter(link => link.href !== '/orders');
  const authHref = (path: '/login' | '/signup') => `${path}?from=${encodeURIComponent(currentPath)}`;

  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(`${href}/`);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim() || "N";
  const displayName = user?.firstName || user?.name || "Account";

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    router.push('/');
  };

  return (
    <>
      <motion.header
        initial={prefersReducedMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="ndeef-topnav-shell fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 h-[64px] flex items-center justify-between gap-3 lg:gap-5">
          {/* Logo */}
          <NazeefLogo />

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
            {visibleNavLinks.map(({ href, label }) => (
              <motion.div key={href} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={href}
                  className={cn(
                    "relative px-3.5 lg:px-4 py-2 rounded-xl text-[15px] font-medium transition-all",
                    isActive(href)
                      ? "ndeef-topnav-link-active bg-[#1D6076]/10 dark:bg-[#1D6076]/25"
                      : "ndeef-topnav-link hover:bg-gray-50 dark:hover:bg-white/8"
                  )}
                >
                  {isActive(href) && (
                    <motion.span
                      layoutId="ndeef-topnav-active-pill"
                      className="absolute inset-0 rounded-xl bg-[#1D6076]/10 dark:bg-[#1D6076]/25"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-[1]">{label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(v => !v)}
                  className="ndeef-topnav-user flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 transition-all dark:bg-white/6 dark:hover:bg-white/10 dark:border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {initials}
                    </span>
                  </div>
                  <span className="ndeef-topnav-account-name text-sm font-medium hidden sm:block">{displayName}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform dark:text-slate-400 ${userMenu ? 'rotate-180' : ''}`} strokeWidth={2} />
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={prefersReducedMotion ? false : { opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="ndeef-topnav-menu absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="ndeef-topnav-menu-name text-sm font-medium">{user.name}</p>
                        <p className="ndeef-topnav-menu-email text-xs truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/profile', label: 'My Profile', Icon: User },
                        { href: '/wallet', label: 'Wallet', Icon: Wallet },
                      ].map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenu(false)}
                          className="ndeef-topnav-menu-link flex items-center gap-3 px-4 py-2.5 transition-colors"
                        >
                          <Icon size={15} className="ndeef-topnav-menu-icon" strokeWidth={2} />
                          <span className="ndeef-topnav-menu-text text-sm">{label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut size={15} className="text-red-400" strokeWidth={2} />
                          <span className="text-sm text-red-500">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={authHref('/login')}
                  className="ndeef-topnav-link hidden sm:block text-[15px] font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all dark:hover:bg-white/8"
                >
                  Sign In
                </Link>
                <Link
                  href={authHref('/signup')}
                  className="bg-[#1D6076] text-white text-[15px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2a7a94] transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-all dark:hover:bg-white/8"
            >
              <Menu size={22} className="text-gray-700 dark:text-slate-200" strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={prefersReducedMotion ? false : { x: 64, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col dark:bg-[#091522]"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-white/10">
                <NazeefLogo />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/8">
                  <X size={20} className="text-gray-600 dark:text-slate-300" strokeWidth={2} />
                </button>
              </div>

              {isLoggedIn && user && (
                <div className="px-5 py-4 bg-[#1D6076]/5 border-b border-gray-100 dark:bg-[#1D6076]/12 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D6076] to-[#2a7a94] flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {visibleNavLinks.map(({ href, label, icon: Icon }) => (
                  <motion.div
                    key={href}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * visibleNavLinks.findIndex((link) => link.href === href) }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive(href)
                        ? 'bg-[#1D6076] text-white dark:bg-[#1D6076]/85'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-white/8'
                        }`}
                    >
                      <Icon size={18} strokeWidth={2} />
                      {label}
                    </Link>
                  </motion.div>
                ))}
                {isLoggedIn && (
                  <>
                    {[
                      { href: '/profile', label: 'Profile' },
                      { href: '/wallet', label: 'Wallet' },
                      { href: '/preferences', label: 'Preferences' },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all dark:text-slate-200 dark:hover:bg-white/8"
                      >
                        {label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              <div className="px-4 py-5 border-t border-gray-100 space-y-2 dark:border-white/10">
                {isLoggedIn ? (
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-all"
                  >
                    <LogOut size={16} strokeWidth={2} />
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link href={authHref('/login')} onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3.5 rounded-xl border border-[#1D6076] text-[#1D6076] text-sm font-medium hover:bg-[#1D6076]/5 transition-all dark:border-[#3b87a2] dark:text-[#d5edf6] dark:hover:bg-[#1D6076]/18"
                    >
                      Sign In
                    </Link>
                    <Link href={authHref('/signup')} onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3.5 rounded-xl bg-[#1D6076] text-white text-sm font-medium hover:bg-[#2a7a94] transition-all"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer so content starts below fixed nav */}
      <div className="h-[64px]" />
    </>
  );
}
