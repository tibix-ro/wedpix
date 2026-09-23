import { Link } from "react-router-dom";
import { Calendar, Image, Clock, ExternalLink, Trash2 } from "lucide-react";
import QuotaBar from "./QuotaBar.jsx";

function formatDate(str) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
  if (diff <= 0) return { label: "Expirat", warning: true };
  if (diff < 86400)
    return {
      label: `${Math.floor(diff / 3600)}h rămase`,
      warning: diff < 3600 * 6,
    };
  return {
    label: `${Math.floor(diff / 86400)} zile rămase`,
    warning: diff < 86400 * 2,
  };
}

const PLAN_BADGE = {
  silver: "bg-slate-100 text-slate-600 border-slate-200",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  platinum: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function EventCard({ event, onDelete }) {
  const expiry = timeLeft(event.expires_at);
  const planInfo = event.plan_info || {};

  return (
    <div className="glass rounded-2xl p-5 shadow-card hover:shadow-card-lg transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-serif text-xl font-semibold text-charcoal truncate">
              {event.name}
            </h3>
            <span
              className={`text-[10px] font-semibold font-sans uppercase tracking-wider
              px-2 py-0.5 rounded-full border ${PLAN_BADGE[event.plan] || PLAN_BADGE.silver}`}
            >
              {event.plan}
            </span>
          </div>
          <p className="text-xs text-taupe font-sans">/{event.slug}</p>
        </div>
        <button
          onClick={() => onDelete?.(event)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-taupe
            hover:text-red-400 hover:bg-red-50 transition-all duration-200 shrink-0"
          title="Șterge eveniment"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-taupe font-sans mb-4 flex-wrap">
        {event.event_date && (
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {formatDate(event.event_date)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Image size={12} /> {event.photo_count} foto
        </span>
        {expiry && (
          <span
            className={`flex items-center gap-1 ${expiry.warning ? "text-red-400" : ""}`}
          >
            <Clock size={12} /> {expiry.label}
          </span>
        )}
      </div>

      {/* Quota bar */}
      <QuotaBar
        used={event.photo_count}
        limit={planInfo.photo_limit}
        className="mb-4"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/dashboard/events/${event.slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold font-sans
            bg-gradient-to-r from-rose-gold to-[#6F5827] text-white
            py-2.5 rounded-xl shadow-gold hover:shadow-gold-lg hover:scale-[1.02]
            active:scale-[0.98] transition-all duration-200"
        >
          Gestionează
        </Link>
        <a
          href={event.guest_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-sans font-medium
            border border-rose-gold/30 text-rose-gold hover:bg-rose-gold/5
            px-3 rounded-xl transition-colors duration-200"
          title="Link invitați"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
