import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  MessageSquare,
  Sparkles,
  Camera,
  QrCode,
  Zap,
} from "lucide-react";
import API from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const PLAN_LABELS = {
  demo: "Demo",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export default function CreateEvent() {
  const { subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activatingDemo, setActivatingDemo] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleActivateDemo = async () => {
    setActivatingDemo(true);
    setError("");
    try {
      await API.post("/billing/activate-demo.php");
      await refreshSubscription();
    } catch (err) {
      setError(
        err.response?.data?.error || "Eroare la activarea pachetului demo.",
      );
    } finally {
      setActivatingDemo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Numele evenimentului este obligatoriu.");
      return;
    }
    if (!subscription) {
      setError("Nu ai un abonament activ. Te rugăm să achiziționezi unul.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await API.post("events/create.php", {
        ...formData,
        subscription_id: subscription.id,
      });
      navigate(`/dashboard/events/${data.event.slug}`);
    } catch (err) {
      setError(err.response?.data?.error || "Eroare la crearea evenimentului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-ivory bg-floral">
      <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-taupe hover:text-charcoal transition-colors mb-8"
        >
          <ArrowLeft size={15} /> Înapoi la panou
        </Link>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* ── Form card ── */}
          <div className="glass rounded-3xl shadow-card border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-gold/20 to-amber-100/40 px-8 py-7 border-b border-white/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-gold font-medium mb-1">
                    Eveniment nou
                  </p>
                  <h1 className="text-2xl font-serif text-charcoal">
                    Creează galeria ta
                  </h1>
                </div>
                {subscription && (
                  <span className="bg-white/70 text-rose-gold border border-rose-gold/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                    {PLAN_LABELS[subscription.plan] ?? subscription.plan}
                  </span>
                )}
              </div>
            </div>

            {/* Fields */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-charcoal mb-2"
                >
                  Nume eveniment <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ex. Nunta Ana și Andrei"
                  autoFocus
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-taupe mt-1.5">
                  Acesta devine și URL-ul galeriei publice.
                </p>
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="event_date"
                  className="block text-sm font-semibold text-charcoal mb-2 flex items-center gap-1.5"
                >
                  <Calendar size={14} className="text-rose-gold" /> Data
                  evenimentului{" "}
                  <span className="text-taupe font-normal">(opțional)</span>
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  className="input-field w-full"
                />
                <p className="text-xs text-taupe mt-1.5">
                  Afișată invitaților în pagina evenimentului.
                </p>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-charcoal mb-2 flex items-center gap-1.5"
                >
                  <MessageSquare size={14} className="text-rose-gold" /> Mesaj
                  pentru invitați{" "}
                  <span className="text-taupe font-normal">(opțional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="ex. Vă invităm să împărtășiți fotografiile din ziua specială…"
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !subscription}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-base transition-all
                  bg-gradient-to-r from-rose-gold to-amber-500 text-white shadow-lg shadow-amber-200/50
                  hover:shadow-xl hover:shadow-amber-200/60 hover:scale-[1.01]
                  active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Se creează
                    galeria…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Creează Evenimentul
                  </>
                )}
              </button>

              {!subscription && (
                <div className="text-center space-y-3">
                  <button
                    type="button"
                    onClick={handleActivateDemo}
                    disabled={activatingDemo}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm border border-rose-gold/40 text-rose-gold hover:bg-rose-gold/10 transition-colors disabled:opacity-50"
                  >
                    {activatingDemo ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Se
                        activează…
                      </>
                    ) : (
                      <>
                        <Zap size={16} /> Activează pachetul Demo (gratuit)
                      </>
                    )}
                  </button>
                  <p className="text-sm text-taupe">
                    Sau{" "}
                    <Link to="/#pricing" className="underline font-semibold">
                      alege un abonament
                    </Link>{" "}
                    Silver, Gold sau Platinum.
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* ── Info sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            {[
              {
                icon: QrCode,
                title: "Link și QR instant",
                desc: "Linkul și codul QR sunt generate imediat după creare, gata de distribuit.",
              },
              {
                icon: Camera,
                title: "Upload în timp real",
                desc: "Fotografiile invitaților apar în galerie instant, fără reîncărcare.",
              },
              {
                icon: Zap,
                title: "Modificări oricând",
                desc: "Poți edita numele, data și mesajul evenimentului după creare.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass rounded-2xl p-5 border border-white/50 shadow-sm flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex-shrink-0 flex items-center justify-center">
                  <Icon size={18} className="text-rose-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal mb-0.5">
                    {title}
                  </p>
                  <p className="text-xs text-taupe leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
