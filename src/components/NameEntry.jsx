import { useState } from "react";
import { Heart, Sparkles, Camera } from "lucide-react";
import logoImage from "../assets/images/LOGO-WEDPIX-TRANS.png";
import logoWebp from "../assets/images/LOGO-WEDPIX-TRANS.webp";

export default function NameEntry({ onSubmit }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Te rugăm să introduci numele sau porecla ta.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Numele trebuie să aibă cel puțin 2 caractere.");
      return;
    }
    setLeaving(true);
    setTimeout(() => onSubmit(trimmed), 400);
  };

  return (
    <div
      className={`
        fixed inset-0 bg-ivory bg-floral flex flex-col items-center justify-center
        px-6 transition-opacity duration-400
        ${leaving ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blush/30 -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-light/20 translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo mark */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-gold to-gold-light shadow-gold-lg flex items-center justify-center">
              <Camera size={32} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ivory border-2 border-rose-gold/30 flex items-center justify-center">
              <Heart size={12} fill="#C9A96E" className="text-rose-gold" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="flex justify-center mb-1">
            <picture>
              <source srcSet={logoWebp} type="image/webp" />
              <img
                src={logoImage}
                alt="WedPix"
                className="h-9 w-auto"
                width="106"
                height="36"
                loading="eager"
                decoding="async"
              />
            </picture>
          </h1>
          <p className="text-taupe text-sm tracking-widest uppercase font-sans">
            Galeria Nunții
          </p>

          <div className="gold-divider mt-4 mb-5" />

          <p className="text-charcoal/70 font-sans text-sm leading-relaxed">
            Bine ai venit! Înainte de a încărca amintirile tale frumoase,
            spune-ne{" "}
            <span className="text-rose-gold font-medium">cum te numești</span>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="glass rounded-2xl p-5 shadow-card mb-4">
            <label
              htmlFor="guest-name"
              className="block text-xs font-medium text-taupe uppercase tracking-widest mb-2 font-sans"
            >
              Numele sau porecla ta
            </label>
            <input
              id="guest-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="ex: Mama Mare, Andrei, Mireasa 💐"
              maxLength={100}
              autoFocus
              className="
                w-full bg-ivory/80 rounded-xl border border-rose-gold/25
                px-4 py-3 text-charcoal font-sans text-sm
                placeholder:text-taupe/50
                transition-colors duration-200
                focus:border-rose-gold focus:bg-white
                focus:outline-none
              "
            />
            {error && (
              <p className="mt-2 text-red-500 text-xs font-sans animate-fade-in">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="
              w-full flex items-center justify-center gap-2.5
              bg-gradient-to-r from-rose-gold to-gold-light
              text-white font-sans font-medium text-sm
              py-4 rounded-2xl shadow-gold
              transition-all duration-200
              hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.98]
            "
          >
            <Sparkles size={16} />
            <span>Intră în galerie</span>
          </button>
        </form>

        <p className="text-center text-xs text-taupe/60 mt-5 font-sans">
          Numele tău va apărea lângă fotografiile tale 📸
        </p>
      </div>
    </div>
  );
}
