import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ImageIcon,
  Loader2,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ImageCard from "./ImageCard.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 20;

// Responsive column count matching the CSS breakpoints in index.css
function getColumnCount() {
  if (typeof window === "undefined") return 2;
  const w = window.innerWidth;
  if (w >= 1024) return 5;
  if (w >= 768) return 4;
  if (w >= 480) return 3;
  return 2;
}

function useColumnCount() {
  const [count, setCount] = useState(getColumnCount);
  useEffect(() => {
    const onResize = () => setCount(getColumnCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
}

// ── Likes (localStorage) ──────────────────────────────────────
function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem("wedpix_likes") || "{}");
  } catch {
    return {};
  }
}
function saveLikes(map) {
  localStorage.setItem("wedpix_likes", JSON.stringify(map));
}

// ── Time helper ────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "acum câteva secunde";
  if (diff < 3600) return `acum ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `acum ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 2) return "ieri";
  return `acum ${Math.floor(diff / 86400)} zile`;
}

// ── Skeleton grid ─────────────────────────────────────────────
function SkeletonGrid() {
  const heights = [160, 200, 140, 220, 180, 160, 200, 140];
  return (
    <div className="masonry">
      {heights.map((h, i) => (
        <div key={i} className="masonry-item">
          <div className="skeleton rounded-xl w-full" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-blush/40 flex items-center justify-center mx-auto mb-4">
        <ImageIcon size={28} className="text-rose-gold/60" />
      </div>
      <p className="font-serif text-xl text-charcoal/60 font-light italic mb-2">
        Galeria este goală deocamdată
      </p>
      <p className="text-sm text-taupe font-sans">
        Fii primul care încarcă o amintire! 📸
      </p>
    </div>
  );
}

// Clamp pan offset so a zoomed image can't be dragged fully off-screen
function clampPan({ x, y }, scale) {
  const maxX = ((scale - 1) * window.innerWidth) / 2;
  const maxY = ((scale - 1) * window.innerHeight) / 2;
  return {
    x: Math.min(Math.max(x, -maxX), maxX),
    y: Math.min(Math.max(y, -maxY), maxY),
  };
}

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({ photos, index, likes, onClose, onNavigate, onLike }) {
  const photo = photos[index];
  const isLiked = !!likes[photo?.id];

  const [showHeart, setShowHeart] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0); // live horizontal carousel offset (follows finger)
  const [dragY, setDragY] = useState(0); // live vertical dismiss offset (follows finger)
  const [transitioning, setTransitioning] = useState(false); // settle/spring-back animation active
  const [axisLock, setAxisLock] = useState(null); // 'x' | 'y' locked for the current gesture

  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, lastTap: 0 });
  const pinchRef = useRef({
    startDist: 0,
    startScale: 1,
    startMid: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
  });
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const pendingRef = useRef({ nav: 0, close: false });
  const settledRef = useRef(true); // guards against duplicate bubbled transitionend events

  // Reset zoom/pan when navigating to a different photo
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate]);

  // Lock background scroll while the lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fireHeart = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current.startX = t.clientX;
      touchRef.current.startY = t.clientY;
      touchRef.current.startTime = Date.now();
      setAxisLock(null);
      if (scale > 1.05) {
        panStartRef.current = {
          x: t.clientX,
          y: t.clientY,
          startPanX: pan.x,
          startPanY: pan.y,
        };
      }
    } else if (e.touches.length === 2) {
      const [a, b] = e.touches;
      pinchRef.current = {
        startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startScale: scale,
        startMid: {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
        },
        startPan: { ...pan },
      };
      setAxisLock(null);
    }
  };

  const handleTouchMove = (e) => {
    // Two fingers → pinch-zoom + pan (follows the midpoint of both touches)
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const nextScale = Math.min(
        Math.max(
          pinchRef.current.startScale * (dist / pinchRef.current.startDist),
          1,
        ),
        4,
      );
      const mid = {
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      };
      const dmx = mid.x - pinchRef.current.startMid.x;
      const dmy = mid.y - pinchRef.current.startMid.y;
      setScale(nextScale);
      setPan(
        clampPan(
          {
            x: pinchRef.current.startPan.x + dmx,
            y: pinchRef.current.startPan.y + dmy,
          },
          nextScale,
        ),
      );
      return;
    }

    const t = e.touches[0];

    // One finger while zoomed in → pan around the image
    if (scale > 1.05) {
      e.preventDefault();
      const nx =
        panStartRef.current.startPanX + (t.clientX - panStartRef.current.x);
      const ny =
        panStartRef.current.startPanY + (t.clientY - panStartRef.current.y);
      setPan(clampPan({ x: nx, y: ny }, scale));
      return;
    }

    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    // Lock the gesture to whichever axis moved first (horizontal swipe vs. vertical dismiss)
    let axis = axisLock;
    if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      setAxisLock(axis);
    }

    if (axis === "x") {
      e.preventDefault();
      setDragX(dx);
    } else if (axis === "y" && dy > 0) {
      e.preventDefault();
      setDragY(dy);
    }
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;
    const dt = Math.max(Date.now() - touchRef.current.startTime, 1);

    // Double-tap → like, or reset zoom if currently zoomed in
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 250 && !axisLock) {
      const now = Date.now();
      if (now - touchRef.current.lastTap < 350) {
        touchRef.current.lastTap = 0;
        if (scale > 1.05) {
          settledRef.current = false;
          setTransitioning(true);
          setScale(1);
          setPan({ x: 0, y: 0 });
        } else {
          onLike(photo.id);
          fireHeart();
        }
        return;
      }
      touchRef.current.lastTap = now;
    }

    if (scale > 1.05) return; // panning is already live; nothing to settle

    const axis = axisLock;
    setAxisLock(null);

    if (axis === "x") {
      const width = window.innerWidth;
      const velocity = Math.abs(dx) / dt; // px/ms
      const committed = Math.abs(dx) > width * 0.22 || velocity > 0.5;
      settledRef.current = false;
      setTransitioning(true);
      if (committed && dx < 0 && index < photos.length - 1) {
        pendingRef.current.nav = 1;
        setDragX(-width);
      } else if (committed && dx > 0 && index > 0) {
        pendingRef.current.nav = -1;
        setDragX(width);
      } else {
        pendingRef.current.nav = 0;
        setDragX(0);
      }
    } else if (axis === "y") {
      const committed = dy > 120 || (dy > 40 && dt < 250);
      settledRef.current = false;
      setTransitioning(true);
      if (committed) {
        pendingRef.current.close = true;
        setDragY(window.innerHeight);
      } else {
        setDragY(0);
      }
    }
  };

  // Fires when the settle/spring-back CSS transition finishes
  const handleSettleEnd = () => {
    if (settledRef.current || !transitioning) return;
    settledRef.current = true;
    setTransitioning(false);
    if (pendingRef.current.nav) {
      const dir = pendingRef.current.nav;
      pendingRef.current.nav = 0;
      setDragX(0);
      onNavigate(dir);
    }
    if (pendingRef.current.close) {
      pendingRef.current.close = false;
      onClose();
    }
    setDragY(0);
  };

  if (!photo) return null;

  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  const slideTransition = transitioning
    ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "none";

  const renderLayer = (p, offset) => {
    if (!p) return null;
    const isCurrent = offset === 0;
    return (
      <div
        key={p.id}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translateX(${offset * width + dragX}px)`,
          transition: slideTransition,
        }}
      >
        {p.is_video ? (
          <video
            src={p.url}
            controls={isCurrent}
            autoPlay={isCurrent}
            playsInline
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={p.url}
            alt={`Fotografie de ${p.uploader}`}
            className="max-w-full max-h-full object-contain"
            style={
              isCurrent
                ? {
                    transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                    transition:
                      transitioning || scale === 1
                        ? "transform 0.2s ease-out"
                        : "none",
                  }
                : undefined
            }
            draggable={false}
          />
        )}
      </div>
    );
  };

  const dismissProgress = Math.min(dragY / 400, 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[100] bg-black select-none"
      style={{ touchAction: "none" }}
      role="dialog"
      aria-modal="true"
      aria-label="Vizualizare fotografie"
    >
      {/* Dismiss-drag wrapper — only the photo/UI moves, the black backdrop stays solid */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${dragY}px) scale(${1 - dismissProgress * 0.08})`,
          opacity: 1 - dismissProgress * 0.5,
          transition: slideTransition,
        }}
        onTransitionEnd={handleSettleEnd}
      >
        {/* Image + gesture area */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => scale <= 1.05 && !axisLock && onClose()}
        >
          {renderLayer(photos[index - 1], -1)}
          {renderLayer(photo, 0)}
          {renderLayer(photos[index + 1], 1)}

          {/* Double-tap heart burst */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart
                  size={100}
                  fill="#ef4444"
                  className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.85)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <p className="text-white text-sm font-semibold leading-tight">
              {photo.uploader}
            </p>
            <p className="text-white/50 text-xs">{timeAgo(photo.created_at)}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="Închide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-5 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-white/40 text-xs tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <p className="hidden md:block text-white/30 text-xs">
            ← → navigare &nbsp;•&nbsp; dublu-tap ❤️ &nbsp;•&nbsp; pinch zoom
          </p>
          <motion.button
            whileTap={{ scale: 1.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onLike(photo.id);
              if (!isLiked) fireHeart();
            }}
            aria-label={isLiked ? "Elimină aprecierea" : "Apreciază"}
          >
            <Heart
              size={26}
              fill={isLiked ? "#ef4444" : "none"}
              className={`transition-colors duration-200 ${isLiked ? "text-red-500" : "text-white/60"}`}
            />
          </motion.button>
        </div>

        {/* Desktop arrows */}
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="Fotografia anterioară"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="Fotografia următoare"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Gallery ────────────────────────────────────────────────────
export default function Gallery({
  eventId,
  isOrganizer = false,
  refreshKey = 0,
  newPhoto = null,
  onPhotoUpdate,
}) {
  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInit] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { index: number } | null
  const [likes, setLikes] = useState(loadLikes);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const columnCount = useColumnCount();

  // Distribute photos into columns by estimated height so new images append to
  // the bottom of the shortest column (never reshuffling existing ones).
  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    const heights = new Array(columnCount).fill(0);
    photos.forEach((photo, index) => {
      const ratio =
        photo.width && photo.height ? photo.height / photo.width : 0.75;
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      cols[shortest].push({ photo, index });
      heights[shortest] += ratio;
    });
    return cols;
  }, [photos, columnCount]);

  const handlePhotoUpdate = (photoId, updates) => {
    setPhotos((prev) => {
      if (updates === null) return prev.filter((p) => p.id !== photoId);
      return prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p));
    });
  };

  const toggleLike = useCallback((photoId) => {
    setLikes((prev) => {
      const isLiking = !prev[photoId];
      const next = { ...prev };
      if (next[photoId]) delete next[photoId];
      else next[photoId] = true;
      saveLikes(next);
      // Sync to server (fire-and-forget)
      axios
        .post(`${API_URL}/images/like.php`, {
          image_id: photoId,
          action: isLiking ? "like" : "unlike",
        })
        .catch(() => {});
      return next;
    });
  }, []);

  const navigateLightbox = useCallback(
    (dir) => {
      setLightbox((prev) => {
        if (!prev) return null;
        const next = prev.index + dir;
        if (next < 0 || next >= photos.length) return prev;
        return { index: next };
      });
    },
    [photos.length],
  );

  const fetchPage = useCallback(
    async (p) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        // Organizers send their token so the API returns hidden items too
        const token = isOrganizer ? localStorage.getItem("wedpix_token") : null;
        const { data } = await axios.get(
          `${API_URL}/images/list.php?event_id=${eventId}&page=${p}&limit=${LIMIT}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
        );
        const fetched = Array.isArray(data.photos) ? data.photos : [];
        setPhotos((prev) => (p === 1 ? fetched : [...prev, ...fetched]));
        setHasMore(Boolean(data.has_more));
        pageRef.current = p;
      } catch {
        setError("Nu s-au putut încărca fotografiile. Încearcă din nou.");
      } finally {
        setLoading(false);
        setInit(false);
        loadingRef.current = false;
      }
    },
    [eventId, isOrganizer],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);
  useEffect(() => {
    if (!refreshKey) return;
    fetchPage(1);
  }, [refreshKey, fetchPage]);
  useEffect(() => {
    if (!newPhoto?.id) return;
    setPhotos((prev) =>
      prev.some((p) => p.id === newPhoto.id) ? prev : [newPhoto, ...prev],
    );
  }, [newPhoto]);

  // Prefetch the next page while browsing the lightbox near the end
  useEffect(() => {
    if (!lightbox || !hasMore) return;
    if (lightbox.index >= photos.length - 3 && !loadingRef.current) {
      fetchPage(pageRef.current + 1);
    }
  }, [lightbox, hasMore, photos.length, fetchPage]);

  // Callback ref: attaches the IntersectionObserver as soon as the sentinel
  // element mounts, regardless of render timing.
  const sentinelRef = useCallback(
    (el) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !loadingRef.current) {
            fetchPage(pageRef.current + 1);
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(el);
      observerRef.current = observer;
    },
    [fetchPage],
  );

  if (initialLoad) return <SkeletonGrid />;
  if (error)
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm font-sans mb-3">{error}</p>
        <button
          onClick={() => fetchPage(1)}
          className="text-sm text-rose-gold underline font-sans hover:no-underline"
        >
          Încearcă din nou
        </button>
      </div>
    );
  if (!photos.length) return <EmptyState />;

  return (
    <>
      <div className="masonry-flex animate-fade-in">
        {columns.map((col, ci) => (
          <div className="masonry-col" key={ci}>
            {col.map(({ photo, index }) => (
              <ImageCard
                key={photo.id}
                photo={photo}
                onOpen={() => setLightbox({ index })}
                isOrganizer={isOrganizer}
                onPhotoUpdate={handlePhotoUpdate}
                liked={!!likes[photo.id]}
                onLike={() => toggleLike(photo.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {loading && !initialLoad && (
        <div className="flex justify-center py-6">
          <Loader2 size={22} className="animate-spin-slow text-rose-gold" />
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <p className="text-center text-xs text-taupe/50 font-sans py-6 tracking-wider uppercase">
          Toate fotografiile au fost afișate ✨
        </p>
      )}

      {createPortal(
        <AnimatePresence>
          {lightbox && (
            <Lightbox
              photos={photos}
              index={lightbox.index}
              likes={likes}
              onClose={() => setLightbox(null)}
              onNavigate={navigateLightbox}
              onLike={toggleLike}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
