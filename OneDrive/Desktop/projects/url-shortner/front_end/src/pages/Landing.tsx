import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion, useInView, useAnimation,
  useScroll, useTransform,
} from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Link2, Moon, Sun, ArrowRight,
  MousePointerClick, Globe, BarChart2,
  QrCode, Shield, Zap,
} from "lucide-react";

// ── Animation variants ─────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

// ── Scroll-reveal wrapper ──────────────────────────────────

function Reveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref      = useRef(null);
  const controls = useAnimation();
  const inView   = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden:  { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Feature cards (the fanned deck) ───────────────────────

const cards = [
  {
    bg: "bg-zinc-900 border-zinc-700",
    rotate: -14,
    x: -160,
    y: 20,
    content: (
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-400 font-mono">snip.ly/launch</span>
        </div>
        <div>
          <p className="text-3xl font-semibold text-white tabular-nums">2,847</p>
          <p className="text-xs text-zinc-500 mt-1">total clicks</p>
          <div className="flex items-end gap-0.5 mt-3 h-8">
            {[3,5,4,7,6,9,8,10,7,12].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-500 rounded-sm opacity-70" style={{ height: `${h * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    bg: "bg-brand-600 border-brand-500",
    rotate: -5,
    x: -60,
    y: -10,
    content: (
      <div className="p-5 h-full flex flex-col justify-between">
        <QrCode className="w-5 h-5 text-white/60" />
        <div>
          <div className="grid grid-cols-6 gap-0.5 mb-3">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-[1px] ${i % 3 === 0 ? "bg-white" : "bg-white/20"}`} />
            ))}
          </div>
          <p className="text-xs text-white/60 font-mono">Scan to open</p>
        </div>
      </div>
    ),
  },
  {
    bg: "bg-stone-100 border-stone-200",
    rotate: 5,
    x: 60,
    y: -20,
    content: (
      <div className="p-5 h-full flex flex-col justify-between">
        <Globe className="w-5 h-5 text-stone-400" />
        <div className="space-y-2">
          {[
            { country: "India",   pct: 68 },
            { country: "USA",     pct: 18 },
            { country: "Germany", pct: 14 },
          ].map(({ country, pct }) => (
            <div key={country}>
              <div className="flex justify-between text-[10px] text-stone-500 mb-0.5">
                <span>{country}</span><span>{pct}%</span>
              </div>
              <div className="h-1 bg-stone-200 rounded-full">
                <div className="h-full bg-stone-800 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    bg: "bg-emerald-950 border-emerald-800",
    rotate: 14,
    x: 160,
    y: 10,
    content: (
      <div className="p-5 h-full flex flex-col justify-between">
        <MousePointerClick className="w-5 h-5 text-emerald-400" />
        <div>
          <p className="text-xs text-emerald-600 font-mono mb-1">Top device</p>
          <p className="text-lg font-semibold text-white">Mobile</p>
          <p className="text-xs text-emerald-600 font-mono mt-3 mb-1">Top browser</p>
          <p className="text-lg font-semibold text-white">Chrome</p>
        </div>
      </div>
    ),
  },
];

function CardDeck() {
  return (
    <div className="relative h-52 w-full flex items-center justify-center">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute w-36 h-48 rounded-2xl border ${card.bg} shadow-2xl cursor-pointer`}
          initial={{ rotate: 0, x: 0, y: 40, opacity: 0, scale: 0.9 }}
          animate={{ rotate: card.rotate, x: card.x, y: card.y, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{
            y: card.y - 12,
            scale: 1.05,
            zIndex: 10,
            transition: { duration: 0.2 },
          }}
        >
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}

// ── Parallax section divider ───────────────────────────────

function ParallaxLine() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={ref} className="overflow-hidden py-6 border-y border-gray-100 dark:border-white/5">
      <motion.div style={{ x }} className="flex gap-8 whitespace-nowrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="text-xs font-mono text-gray-300 dark:text-white/10 tracking-widest uppercase">
            Analytics · Short Links · QR Codes · Custom Aliases · Click Tracking · Geo Data ·&nbsp;
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────

export default function Landing() {
  const { user }           = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate           = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-brand-500/30">

      {/* ── Navbar ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-30 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-black/70 backdrop-blur-xl"
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Snip</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/login"
              className="text-sm px-3.5 py-1.5 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm px-3.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-white/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-14 px-6 overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 dark:bg-brand-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-700/3 dark:bg-brand-700/5 rounded-full blur-3xl" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <motion.div
          className="relative text-center max-w-3xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 text-xs font-medium tracking-wide">
              <Zap className="w-3 h-3 text-brand-500" />
              Link analytics made simple
            </span>
          </motion.div>

          {/* Headline — serif */}
          <motion.h1
            variants={stagger}
            className="font-serif text-6xl sm:text-7xl lg:text-8xl font-medium leading-[1.05] tracking-tight mb-6"
          >
            {["Short links.", "Real insights."].map((line, i) => (
              <motion.span
                key={i}
                variants={fadeUp}
                className={`block ${i === 1 ? "text-gray-300 dark:text-white/40" : "text-gray-900 dark:text-white"}`}
              >
                {line}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeUp}
            className="text-gray-400 dark:text-white/40 text-lg max-w-md mx-auto leading-relaxed mb-10"
          >
            Create short links in seconds. Know exactly who clicks,
            from where, and on what device — in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-white/90 transition-colors"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20 text-sm font-medium rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="text-xs text-gray-300 dark:text-white/20">
            No credit card required · Free forever
          </motion.p>
        </motion.div>

        {/* Card deck */}
        <motion.div
          className="relative w-full max-w-lg mx-auto mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <CardDeck />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-white/20 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Scrolling ticker ── */}
      <ParallaxLine />

      {/* ── Stats ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {[
            { value: "< 100ms", label: "Redirect speed" },
            { value: "99.9%",   label: "Uptime" },
            { value: "Real-time", label: "Analytics" },
          ].map(({ value, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="bg-white dark:bg-zinc-950 px-8 py-10 text-center"
            >
              <p className="font-serif text-4xl font-medium text-gray-900 dark:text-white mb-2">{value}</p>
              <p className="text-sm text-gray-400 dark:text-white/30">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <Reveal className="text-center mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium text-gray-900 dark:text-white mb-4">
            Built for people who care
          </h2>
          <p className="text-gray-400 dark:text-white/30 text-base max-w-sm mx-auto">
            Every feature is intentional. Nothing is noise.
          </p>
        </Reveal>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          variants={staggerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {[
            { icon: MousePointerClick, title: "Click analytics",    body: "Every click captured — device, browser, OS, referrer. All of it, automatically.", color: "text-brand-500" },
            { icon: Globe,             title: "Geographic data",    body: "See exactly which countries and cities your links reach.", color: "text-emerald-500" },
            { icon: QrCode,            title: "QR code generation", body: "Every link gets a QR code instantly. Works offline. No setup.", color: "text-violet-500" },
            { icon: Link2,             title: "Custom aliases",     body: "Replace random characters with meaningful slugs that represent your brand.", color: "text-orange-500" },
            { icon: BarChart2,         title: "Timeline charts",    body: "Visualise click volume over time. Spot your peaks and understand patterns.", color: "text-sky-500" },
            { icon: Shield,            title: "Link expiry",        body: "Set links to self-destruct after N days. Full control, zero maintenance.", color: "text-rose-500" },
          ].map(({ icon: Icon, title, body, color }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 rounded-xl p-6 transition-colors cursor-default"
            >
              <Icon className={`w-5 h-5 ${color} mb-5`} />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 dark:text-white/30 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal className="text-center mb-20">
            <h2 className="font-serif text-4xl sm:text-5xl font-medium text-gray-900 dark:text-white">
              Three steps. That's it.
            </h2>
          </Reveal>

          <motion.div
            className="grid sm:grid-cols-3 gap-12"
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { step: "01", title: "Paste your URL",      body: "Drop in any long URL — a product page, article, or portfolio link." },
              { step: "02", title: "Get your short link", body: "Receive a clean short link instantly. Add a custom alias if you want." },
              { step: "03", title: "Track the clicks",    body: "Every click is logged. Open your dashboard to see who, where, and what device." },
            ].map(({ step, title, body }) => (
              <motion.div key={step} variants={fadeUp} className="flex flex-col gap-4">
                <span className="text-xs font-mono font-semibold text-brand-500 tracking-[0.2em]">
                  {step}
                </span>
                <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                <p className="text-sm text-gray-400 dark:text-white/30 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-5xl mx-auto px-6 py-32 text-center">
        <Reveal>
          <h2 className="font-serif text-5xl sm:text-6xl font-medium text-gray-900 dark:text-white mb-6 leading-tight">
            Start shortening
            <br />
            <span className="text-gray-300 dark:text-white/30">links today.</span>
          </h2>
          <p className="text-gray-400 dark:text-white/30 text-sm mb-10 max-w-xs mx-auto">
            Free to use. No setup required. Your first link is one click away.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-white/90 transition-all hover:gap-3"
          >
            Create your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-brand-500 rounded flex items-center justify-center">
              <Link2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Snip</span>
          </div>
          <p className="text-xs text-gray-300 dark:text-white/20 font-mono">
            Express · MongoDB · Redis · React
          </p>
        </div>
      </footer>

    </div>
  );
}
