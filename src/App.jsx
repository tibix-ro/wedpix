import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import GoogleAnalytics from "./components/GoogleAnalytics.jsx";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const CreateEvent = lazy(() => import("./pages/CreateEvent.jsx"));
const EventAdmin = lazy(() => import("./pages/EventAdmin.jsx"));
const GuestUpload = lazy(() => import("./pages/GuestUpload.jsx"));
const Slideshow = lazy(() => import("./pages/Slideshow.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.jsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.jsx"));
const GDPR = lazy(() => import("./pages/GDPR.jsx"));
const DPA = lazy(() => import("./pages/DPA.jsx"));
const Accessibility = lazy(() => import("./pages/Accessibility.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.jsx"));

const AUTH_ROUTES = ["/", "/login", "/register"];
const GUEST_ROUTES = ["/event"];
const SEO_BY_ROUTE = {
  "/": {
    title: "WedPix — Amintirile Nunții",
    description:
      "WedPix — Galeria foto a nunții. Scanează codul QR, urcă amintirile și bucură-te de fiecare moment surprins.",
    indexable: true,
  },
  "/contact": {
    title: "Contact WedPix",
    description:
      "Contactează echipa WedPix pentru suport, întrebări comerciale sau asistență rapidă la eveniment.",
    indexable: true,
  },
  "/privacy-policy": {
    title: "Politica de Confidențialitate — WedPix",
    description:
      "Află cum colectăm, folosim și protejăm datele personale în platforma WedPix.",
    indexable: true,
  },
  "/terms-of-service": {
    title: "Termeni și Condiții — WedPix",
    description:
      "Consultă termenii și condițiile de utilizare ale platformei WedPix pentru organizatori și invitați.",
    indexable: true,
  },
  "/cookie-policy": {
    title: "Politica de Cookie-uri — WedPix",
    description:
      "Detalii despre cookie-urile utilizate de WedPix și opțiunile tale de consimțământ.",
    indexable: true,
  },
  "/gdpr": {
    title: "GDPR — WedPix",
    description:
      "Informații despre drepturile tale GDPR și modul în care WedPix procesează datele personale.",
    indexable: true,
  },
  "/dpa": {
    title: "Acord de Prelucrare a Datelor (DPA) — WedPix",
    description:
      "Documentația DPA WedPix pentru prelucrarea datelor cu caracter personal.",
    indexable: true,
  },
  "/accessibility": {
    title: "Accesibilitate — WedPix",
    description:
      "Declarația de accesibilitate WedPix și angajamentul nostru pentru o experiență incluzivă.",
    indexable: true,
  },
  "/login": {
    title: "Autentificare — WedPix",
    description:
      "Intră în contul tău WedPix pentru a administra evenimentele și galeriile private.",
    indexable: false,
  },
  "/register": {
    title: "Creează Cont — WedPix",
    description:
      "Creează un cont WedPix pentru a lansa evenimentul tău și a colecta fotografii de la invitați.",
    indexable: false,
  },
};

const DEFAULT_PRIVATE_SEO = {
  title: "WedPix",
  description:
    "Platformă pentru colectarea fotografiilor de la invitați prin link și cod QR.",
  indexable: false,
};

function RouteFallback() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center text-taupe font-sans">
      Se încarcă pagina...
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isGuest = location.pathname.startsWith("/event/");
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuth = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (location.hash) return; // hash navigation handled by the effect below
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const id = location.hash.replace("#", "");

    // LandingPage is lazy-loaded, so its sections (e.g. #pricing) may not
    // exist in the DOM yet right after navigation. Poll briefly until the
    // target mounts instead of giving up on the first (too-early) check.
    let attempts = 0;
    const maxAttempts = 40; // ~4s at 100ms intervals
    let timer = null;

    const tryScroll = () => {
      const target = document.getElementById(id);
      if (target) {
        // Keep section title visible below sticky navbar.
        const navbarOffset = 72;
        const top =
          target.getBoundingClientRect().top + window.scrollY - navbarOffset;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        timer = setTimeout(tryScroll, 100);
      }
    };

    tryScroll();
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const seo = SEO_BY_ROUTE[location.pathname] ?? DEFAULT_PRIVATE_SEO;
    const isIndexable = seo.indexable;

    document.title = seo.title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute("content", seo.description);

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.setAttribute(
      "content",
      isIndexable
        ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        : "noindex, nofollow, noarchive",
    );

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }

    const canonicalPath = isIndexable ? location.pathname : "/";
    canonicalLink.setAttribute("href", `https://www.wedpix.ro${canonicalPath}`);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", seo.title);

    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescription) ogDescription.setAttribute("content", seo.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl)
      ogUrl.setAttribute("content", `https://www.wedpix.ro${canonicalPath}`);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", seo.title);

    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]',
    );
    if (twitterDescription) {
      twitterDescription.setAttribute("content", seo.description);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-ivory flex flex-col">
      {!isGuest && !isAdmin && <Navbar />}

      <GoogleAnalytics />

      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/gdpr" element={<GDPR />} />
              <Route path="/dpa" element={<DPA />} />
              <Route path="/accessibility" element={<Accessibility />} />

              {/* Guest (no login) */}
              <Route path="/event/:slug" element={<GuestUpload />} />
              <Route path="/event/:slug/slideshow" element={<Slideshow />} />

              {/* Protected organizer */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/events/new"
                element={
                  <ProtectedRoute>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/events/:slug"
                element={
                  <ProtectedRoute>
                    <EventAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      {!isGuest && !isAdmin && <Footer />}

      <CookieConsent />
    </div>
  );
}
