import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Trash2, Play } from "lucide-react";
import API from "../utils/api.js";

// ── Relative time helper ──────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "acum câteva secunde";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 2) return "ieri";
  return `acum ${Math.floor(diff / 86400)} zile`;
}

export default function ImageCard({
  photo,
  onOpen,
  isOrganizer,
  onPhotoUpdate,
  liked = false,
  onLike,
}) {
  const [loaded, setLoaded] = useState(false);
  const [isHidden, setIsHidden] = useState(photo.is_hidden || false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute aspect-ratio padding for placeholder (prevents layout shift)
  const aspectPadding =
    photo.width && photo.height
      ? `${((photo.height / photo.width) * 100).toFixed(1)}%`
      : "75%";

  const handleHideToggle = async (e) => {
    e.stopPropagation();
    try {
      const action = isHidden ? "unhide" : "hide";
      await API.post(`/images/hide.php?image_id=${photo.id}&action=${action}`);
      setIsHidden(!isHidden);
      if (onPhotoUpdate) onPhotoUpdate(photo.id, { is_hidden: !isHidden });
    } catch (err) {
      alert("Eroare la modificarea vizibilității fotografiei.");
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Sigur dorești să ștergi definitiv această fotografie? Această acțiune este ireversibilă.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      await API.delete(`/images/delete.php?image_id=${photo.id}`);
      if (onPhotoUpdate) onPhotoUpdate(photo.id, null); // null means deleted
    } catch (err) {
      alert(err.response?.data?.error || "Eroare la ștergerea fotografiei.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="masonry-item group">
      <div
        className={`
          relative overflow-hidden rounded-xl cursor-pointer
          bg-cream border border-rose-gold/10
          shadow-card hover:shadow-card-lg
          transition-all duration-300
          ${isHidden ? "opacity-60 ring-2 ring-amber-300" : ""}
          ${isDeleting ? "opacity-50 pointer-events-none" : ""}
        `}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        aria-label={`Fotografie de ${photo.uploader}${isHidden ? " (ascunsă)" : ""}`}
      >
        {/* Hidden indicator */}
        {isHidden && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Ascunsă
          </div>
        )}

        {/* Aspect-ratio wrapper */}
        <div style={{ paddingBottom: aspectPadding, position: "relative" }}>
          {/* Skeleton while loading */}
          {!loaded && <div className="absolute inset-0 skeleton" />}

          {photo.is_video ? (
            <>
              <video
                src={`${photo.url}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                onLoadedData={() => setLoaded(true)}
                className={`
                  absolute inset-0 w-full h-full object-cover
                  transition-all duration-500
                  group-hover:scale-105
                  ${loaded ? "opacity-100" : "opacity-0"}
                `}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center">
                  <Play size={20} className="text-white ml-0.5" fill="white" />
                </span>
              </div>
            </>
          ) : (
            <img
              src={photo.url}
              alt={`Fotografie de ${photo.uploader}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-all duration-500
                group-hover:scale-105
                ${loaded ? "opacity-100" : "opacity-0"}
              `}
            />
          )}
        </div>

        {/* Hover overlay */}
        <div
          className="
          absolute inset-0
          bg-gradient-to-t from-charcoal/70 via-transparent to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          flex flex-col justify-end p-2.5
          pointer-events-none
        "
        >
          <p className="text-white text-[11px] font-medium font-sans leading-tight truncate">
            {photo.uploader}
          </p>
          <p className="text-white/60 text-[10px] font-sans">
            {timeAgo(photo.created_at)}
          </p>
        </div>

        {/* Like button — always visible on mobile, hover on desktop */}
        {!isOrganizer && (
          <motion.button
            whileTap={{ scale: 1.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike && onLike();
            }}
            aria-label={liked ? "Elimină aprecierea" : "Apreciază"}
            className="
              absolute bottom-2 right-2
              w-8 h-8 rounded-full
              bg-white/85 backdrop-blur-sm
              flex items-center justify-center
              shadow-sm transition-colors duration-200
              hover:bg-white
            "
          >
            <Heart
              size={14}
              fill={liked ? "#ef4444" : "none"}
              className={`transition-colors duration-200 ${liked ? "text-red-500" : "text-charcoal/40"}`}
            />
          </motion.button>
        )}

        {/* Moderation buttons (organizers only) */}
        {isOrganizer && (
          <div
            className="
            absolute top-2 right-2
            flex gap-1
            opacity-0 group-hover:opacity-100
            transition-all duration-200
          "
          >
            <button
              onClick={handleHideToggle}
              aria-label={
                isHidden ? "Afișează fotografie" : "Ascunde fotografie"
              }
              className="
                w-7 h-7 rounded-full
                bg-white/80 backdrop-blur-sm
                flex items-center justify-center
                hover:scale-110 active:scale-90
                shadow-sm transition-all duration-200
                hover:bg-white
              "
            >
              {isHidden ? (
                <Eye size={13} className="text-charcoal/70" />
              ) : (
                <EyeOff size={13} className="text-charcoal/70" />
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Șterge definitiv fotografia"
              className="
                w-7 h-7 rounded-full
                bg-red-500/80 backdrop-blur-sm
                flex items-center justify-center
                hover:scale-110 active:scale-90
                shadow-sm transition-all duration-200
                hover:bg-red-500 disabled:opacity-50
              "
            >
              <Trash2 size={13} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
