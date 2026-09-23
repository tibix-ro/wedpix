import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff } from "lucide-react";
import logoImage from "../assets/images/LOGO-WEDPIX-TRANS.png";
import logoWebp from "../assets/images/LOGO-WEDPIX-TRANS.webp";

const page = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!termsAccepted) {
      setError("Trebuie să acсepți Termenii și Condițiile pentru a continua.");
      return;
    }
    console.log("[Register Debug] Attempting to register:", { name, email });
    if (!name || !email || !password) {
      console.log("[Register Debug] Validation failed: Missing fields");
      setError("Completează toate câmpurile.");
      return;
    }
    if (password.length < 8) {
      console.log("[Register Debug] Validation failed: Password too short");
      setError("Parola trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(name, email, password);
      console.log("[Register Debug] Registration successful! Result:", result);
      // If they came from plan selection, redirect there
      const plan = location.state?.plan;
      navigate(plan ? `/?plan=${plan}#pricing` : "/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("[Register Debug] Registration failed. Error object:", err);
      if (err?.response) {
        console.error(
          "[Register Debug] Server responded with status:",
          err.response.status,
        );
        console.error(
          "[Register Debug] Server response data:",
          err.response.data,
        );
      } else {
        console.error(
          "[Register Debug] Network or unexpected error:",
          err.message,
        );
      }
      setError(err?.response?.data?.error || "Eroare la înregistrare.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label, id, type, val, set, placeholder, extra) => (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-taupe uppercase tracking-widest mb-1.5 font-sans"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={val}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-cream/60 border border-rose-gold/20 rounded-xl px-4 py-3
            text-charcoal font-sans text-sm placeholder:text-taupe/40
            focus:border-rose-gold focus:bg-white focus:outline-none transition-colors"
        />
        {extra}
      </div>
    </div>
  );

  return (
    <motion.div
      {...page}
      className="min-h-[calc(100dvh-56px)] bg-ivory bg-floral flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <picture>
            <source srcSet={logoWebp} type="image/webp" />
            <img
              src={logoImage}
              alt="WedPix"
              className="h-10 w-auto mx-auto mb-4"
              width="118"
              height="40"
              loading="eager"
              decoding="async"
            />
          </picture>
          <h1 className="font-serif text-3xl font-light text-charcoal">
            Creează cont
          </h1>
          <p className="text-taupe text-sm font-sans mt-1">
            Gestionează evenimente foto cu WedPix
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 shadow-card space-y-4"
        >
          {field(
            "Numele tău",
            "reg-name",
            "text",
            name,
            setName,
            "Ion Popescu",
          )}
          {field(
            "Email",
            "reg-email",
            "email",
            email,
            setEmail,
            "adresa@exemplu.ro",
          )}
          {field(
            "Parolă",
            "reg-pw",
            showPw ? "text" : "password",
            password,
            setPassword,
            "Min. 8 caractere",
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-rose-gold transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>,
          )}

          {error && (
            <p className="text-red-500 text-xs font-sans bg-red-50 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-sans font-semibold text-sm
              bg-gradient-to-r from-rose-gold to-[#6F5827] text-white shadow-gold
              hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se creează contul..." : "Creează cont"}
          </button>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-rose-gold w-4 h-4 shrink-0"
            />
            <span className="text-xs text-taupe/80 font-sans leading-relaxed">
              Am citit și accept{" "}
              <Link
                to="/terms-of-service"
                className="text-rose-gold hover:underline"
              >
                Termenii și Condițiile
              </Link>{" "}
              și{" "}
              <Link
                to="/privacy-policy"
                className="text-rose-gold hover:underline"
              >
                Politica de Confidențialitate
              </Link>
              .
            </span>
          </label>
        </form>

        <p className="text-center text-sm text-taupe font-sans mt-5">
          Ai deja cont?{" "}
          <Link
            to="/login"
            className="text-rose-gold hover:underline font-medium"
          >
            Autentifică-te
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
