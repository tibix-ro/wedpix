import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import {
  Heart,
  Camera,
  Star,
  Shield,
  Zap,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import PricingCard from "../components/PricingCard.jsx";
import AddonsModal from "../components/AddonsModal.jsx";
import { PLAN_LIST } from "../utils/plans.js";
import { useAuth } from "../context/AuthContext.jsx";
import API from "../utils/api.js";
import featureUploadImage from "../assets/images/wedpix-qr-scan.webp";
import featureSecurityImage from "../assets/images/feature-portrait-02.webp";
import featureCompressionImage from "../assets/images/feature-portrait-03.webp";
import featureSlideshowImage from "../assets/images/wedpix-screen.webp";
import pricingBackdropImage from "../assets/images/lifestyle-wide-02.webp";

const HeroParticles3D = lazy(() => import("../components/HeroParticles3D.jsx"));

// y-displacement removed — layout shifts caused CLS 0.745
const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const features = [
  {
    icon: Camera,
    title: "Upload instant",
    desc: "Invitații scanează codul QR și adaugă fotografii imediat, fără cont și fără aplicații de instalat.",
    image: featureUploadImage,
  },
  {
    icon: Shield,
    title: "Galerie privată",
    desc: "Fotografiile tale sunt accesibile doar celor cu linkul tău. Nimeni altcineva nu le poate vedea.",
    image: featureSecurityImage,
  },
  {
    icon: Zap,
    title: "Fotografii optimizate",
    desc: "Pozele se reduc automat înainte de trimitere — fără pierderi vizibile, fără întârzieri.",
    image: featureCompressionImage,
  },
  {
    icon: Star,
    title: "Slideshow în timp real",
    desc: "Cu planul Platinum, toate fotografiile apar live pe ecranul de la eveniment pe măsură ce sunt încărcate.",
    image: featureSlideshowImage,
  },
];

const faqs = [
  {
    q: "Cum funcționează WedPix la evenimentul meu?",
    a: "Creezi un eveniment în câteva secunde, primești un link și un cod QR, și le distribui invitaților. Atât. Ei adaugă fotografii direct din browser, fără să instaleze nimic.",
  },
  {
    q: "Invitații trebuie să aibă cont?",
    a: "Nu. Invitații dau click pe link sau scanează codul QR, introduc numele lor și pot încărca fotografii imediat. Zero fricțiune.",
  },
  {
    q: "Cât timp rămân disponibile fotografiile?",
    a: "Depinde de pachetul ales — între 30 și 180 de zile. Le poți descărca oricând ca arhivă ZIP înainte de expirare.",
  },
  {
    q: "Pot descărca toate fotografiile dintr-odată?",
    a: 'Da. Din panoul tău de administrare există butonul "Descarcă tot", care pregătește o arhivă ZIP cu toate imaginile.',
  },
  {
    q: "Datele și fotografiile sunt în siguranță?",
    a: "Da. Stocăm fotografiile pe servere securizate, accesibile exclusiv prin linkul unic al evenimentului. Nu vindem și nu folosim datele tale în alte scopuri.",
  },
  {
    q: "Ce se întâmplă dacă am nevoie de ajutor?",
    a: "Ne poți scrie oricând la help@wedpix.ro sau prin formularul de contact. Răspundem în cel mai scurt timp, de obicei în aceeași zi.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl border border-white/50 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left text-charcoal font-semibold text-sm hover:text-rose-gold transition-colors"
      >
        {q}
        <ChevronDown
          size={16}
          className={`shrink-0 text-rose-gold transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-taupe leading-relaxed border-t border-rose-gold/10 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [enable3D, setEnable3D] = useState(false);
  const [addonsPlan, setAddonsPlan] = useState(null); // plan object while the add-ons modal is open

  useEffect(() => {
    let rafId = 0;

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        rafId = 0;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1024px)");
    const reducedMotionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const update3DState = () => {
      const connection = navigator.connection || navigator.mozConnection;
      const saveData = connection?.saveData === true;
      setEnable3D(
        desktopMedia.matches && !reducedMotionMedia.matches && !saveData,
      );
    };

    update3DState();

    const addMediaListener = (media, listener) => {
      if (media.addEventListener) {
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
      }

      media.addListener(listener);
      return () => media.removeListener(listener);
    };

    const disposeDesktop = addMediaListener(desktopMedia, update3DState);
    const disposeReduced = addMediaListener(reducedMotionMedia, update3DState);

    return () => {
      disposeDesktop();
      disposeReduced();
    };
  }, []);

  const handleSelectPlan = async (planId) => {
    if (!user) {
      navigate("/register", { state: { plan: planId } });
      return;
    }
    if (planId === "demo") {
      setLoading(true);
      try {
        await API.post("/billing/activate-demo.php");
        navigate("/dashboard");
      } catch (err) {
        alert(err?.response?.data?.error || "Eroare la procesarea cererii.");
      } finally {
        setLoading(false);
      }
      return;
    }
    // Paid plans: let the customer pick add-ons before checkout
    const plan = PLAN_LIST.find((p) => p.id === planId);
    if (plan) setAddonsPlan(plan);
  };

  const handleConfirmAddons = async (addons) => {
    if (!addonsPlan) return;
    setLoading(true);
    try {
      const { data } = await API.post("/billing/create-checkout.php", {
        plan: addonsPlan.id,
        addons,
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      alert(err?.response?.data?.error || "Eroare la procesarea cererii.");
      setLoading(false);
    }
  };

  return (
    <motion.div {...page} className="bg-ivory bg-floral">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-[90svh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        {/* Visual hero backdrop image */}
        <picture className="absolute inset-0 z-0 pointer-events-none">
          <source
            media="(max-width: 768px)"
            srcSet="/hero-mobile-01.webp"
            type="image/webp"
          />
          <img
            src="/hero-desktop-01.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-45"
            width="1920"
            height="1080"
            sizes="100vw"
            loading="eager"
            fetchpriority="high"
            decoding="sync"
          />
        </picture>
        {/* Gradient: scene visible in center, text-safe at top/bottom */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-ivory/80 via-ivory/25 to-ivory/80" />

        {/* 3D Background */}
        {enable3D && (
          <div
            className="absolute inset-0 z-10"
            style={{
              transform: `translate3d(0, ${Math.min(scrollY * 0.12, 120)}px, 0)`,
            }}
          >
            <Suspense fallback={null}>
              <HeroParticles3D scrollY={scrollY} />
            </Suspense>
          </div>
        )}

        {/* Background blobs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-blush/30 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none z-10"
          style={{
            transform: `translate3d(33.333%, calc(-33.333% + ${Math.min(scrollY * 0.08, 90)}px), 0)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 bg-gold-light/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl pointer-events-none z-10"
          style={{
            transform: `translate3d(-33.333%, calc(33.333% + ${Math.min(scrollY * -0.06, 0)}px), 0)`,
          }}
        />

        <div className="relative z-20">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-gold to-gold-light
              flex items-center justify-center shadow-gold-lg mb-6 relative"
          >
            <Camera size={30} className="text-white" strokeWidth={1.5} />
            <span className="absolute bottom-1.5 right-1.5 w-[22px] h-[22px] rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <Heart size={10} fill="white" className="text-white" />
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="font-serif text-5xl md:text-7xl font-light text-charcoal leading-tight mb-4"
          >
            Transformă amintirile <br />
            <span className="text-gradient-gold italic">în magie</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="max-w-xl text-taupe font-sans text-lg leading-relaxed mb-5"
          >
            Creezi un eveniment, distribui un link sau cod QR, și gata.
            Invitații adaugă fotografii instant, tu le ai pe toate într-un
            singur loc.
          </motion.p>

          {/* ── Social proof ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5 mb-8 flex-wrap justify-center"
          >
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={12}
                  fill="#C9A96E"
                  className="text-rose-gold"
                />
              ))}
              <span className="ml-1.5 text-xs font-semibold text-charcoal font-sans">
                4.9
              </span>
            </div>
            <div className="w-px h-3 bg-rose-gold/30" />
            <span className="text-xs font-sans text-taupe">
              <span className="font-semibold text-charcoal">800+</span> nunți
            </span>
            <div className="w-px h-3 bg-rose-gold/30" />
            <span className="text-xs font-sans text-taupe">
              <span className="font-semibold text-charcoal">30.000+</span>{" "}
              amintiri
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold to-[#6F5827]
                  text-white font-sans font-semibold px-8 py-4 rounded-2xl shadow-gold-lg
                  hover:shadow-gold hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Dashboard <ChevronRight size={18} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold to-[#6F5827]
                    text-white font-sans font-semibold px-8 py-4 rounded-2xl shadow-gold-lg
                    hover:shadow-gold hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Începe gratuit <ChevronRight size={18} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 glass border border-rose-gold/30
                    text-charcoal font-sans font-medium px-8 py-4 rounded-2xl
                    hover:border-rose-gold/50 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Autentificare
                  </Link>
                </>
              )}
            </div>
            {!user && (
              <p className="text-xs text-taupe/60 font-sans">
                Pentru miri și organizatori de evenimente
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section
        id="features"
        className="max-w-5xl mx-auto px-4 py-20"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1px 900px" }}
      >
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-light text-charcoal mb-3">
            Tot ce ai nevoie,{" "}
            <span className="italic text-gradient-gold">
              într-un singur loc
            </span>
          </h2>
          <div className="gold-divider max-w-xs mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, image }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="glass rounded-2xl p-5 shadow-card text-center overflow-hidden"
            >
              <div className="mb-4 rounded-xl overflow-hidden border border-rose-gold/15">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-36 object-cover"
                  width="640"
                  height="360"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blush to-rose-gold/20
                border border-rose-gold/20 flex items-center justify-center mx-auto mb-3"
              >
                <Icon size={20} className="text-rose-gold" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-charcoal mb-1">
                {title}
              </h3>
              <p className="text-sm font-sans text-taupe leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="max-w-3xl mx-auto px-4 py-20"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1px 900px" }}
      >
        <div className="text-center mb-10">
          <h2 className="font-serif text-4xl font-light text-charcoal mb-3">
            Întrebări{" "}
            <span className="italic text-gradient-gold">frecvente</span>
          </h2>
          <div className="gold-divider max-w-xs mx-auto" />
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <FaqItem key={i} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative max-w-6xl mx-auto px-4 py-20 overflow-hidden"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "1px 1200px",
        }}
      >
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          <img
            src={pricingBackdropImage}
            alt="Decor elegant pentru secțiunea de pricing"
            className="w-full h-full object-cover opacity-15"
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ivory/95 via-ivory/92 to-ivory/96" />
        </div>

        <div className="relative z-10 text-center mb-12">
          <h2 className="font-serif text-4xl font-light text-charcoal mb-3">
            Alege pachetul{" "}
            <span className="italic text-gradient-gold">potrivit</span>
          </h2>
          <p className="text-taupe font-sans">
            Plată unică per eveniment. Niciun abonament lunar.
          </p>
          <div className="gold-divider max-w-xs mx-auto mt-4" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLAN_LIST.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelect={handleSelectPlan}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {addonsPlan && (
        <AddonsModal
          plan={addonsPlan}
          loading={loading}
          onClose={() => setAddonsPlan(null)}
          onConfirm={handleConfirmAddons}
        />
      )}
    </motion.div>
  );
}
