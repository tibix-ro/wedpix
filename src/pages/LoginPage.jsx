import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoImage from "../assets/images/LOGO-WEDPIX-TRANS.png";
import logoWebp from "../assets/images/LOGO-WEDPIX-TRANS.webp";

const page = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  extra,
}) {
  return (
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
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-cream/60 border border-rose-gold/20 rounded-xl px-4 py-3
            text-charcoal font-sans text-sm placeholder:text-taupe/40
            focus:border-rose-gold focus:bg-white focus:outline-none transition-colors"
        />
        {extra}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("[Login Debug] Attempting to login with email:", email);
    if (!email || !password) {
      console.log("[Login Debug] Validation failed: Missing fields");
      setError("Completează toate câmpurile.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      console.log("[Login Debug] Login successful! Result:", result);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("[Login Debug] Login failed. Error object:", err);
      if (err?.response) {
        console.error(
          "[Login Debug] Server responded with status:",
          err.response.status,
        );
        console.error("[Login Debug] Server response data:", err.response.data);
      } else {
        console.error(
          "[Login Debug] Network or unexpected error:",
          err.message,
        );
      }
      setError(err?.response?.data?.error || "Eroare la autentificare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      {...page}
      className="min-h-[calc(100dvh-56px)] bg-ivory bg-floral flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
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
            Bun venit înapoi
          </h1>
          <p className="text-taupe text-sm font-sans mt-1">
            Autentifică-te în contul tău WedPix
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 shadow-card space-y-4"
        >
          <FormField
            label="Email"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adresa@exemplu.ro"
          />
          <FormField
            label="Parolă"
            id="login-password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parola ta"
            extra={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-rose-gold transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {error && (
            <p className="text-red-500 text-xs font-sans bg-red-50 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-sans font-semibold text-sm
              bg-gradient-to-r from-rose-gold to-[#6F5827] text-white shadow-gold
              hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se autentifică..." : "Autentificare"}
          </button>
        </form>

        <p className="text-center text-sm text-taupe font-sans mt-5">
          Nu ai cont?{" "}
          <Link
            to="/register"
            className="text-rose-gold hover:underline font-medium"
          >
            Înregistrează-te gratuit
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
