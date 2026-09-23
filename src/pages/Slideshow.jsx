import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Home,
  Maximize,
  Minimize,
  Cast,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../utils/api.js";

const SLIDE_DURATION_MS = 5000;
const POLL_INTERVAL_MS = 10000;

export default function Slideshow() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [castAvailable, setCastAvailable] = useState(false);
  const [casting, setCasting] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  const lastIdRef = useRef(0);
  const pollTimerRef = useRef(null);
  const slideTimerRef = useRef(null);
  const presentationRef = useRef(null);
  const connectionRef = useRef(null);
  const audioRef = useRef(null);

  // 1. Fetch Event Info
  useEffect(() => {
    API.get(`/events/get.php?slug=${slug}`)
      .then(({ data }) => {
        const eventData = data?.event;
        const slideshowEnabled = eventData?.plan_info?.slideshow;

        if (!eventData) {
          setError("Evenimentul nu a fost găsit.");
          setLoading(false);
        } else if (!slideshowEnabled) {
          setError(
            "Abonamentul curent nu include funcționalitatea Live Slideshow.",
          );
          setLoading(false);
        } else {
          setEvent(eventData);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Evenimentul nu a fost găsit.");
        setLoading(false);
      });
  }, [slug]);

  // 2. Poll for images
  const pollImages = async (eventId) => {
    try {
      const { data } = await API.get(
        `/slideshow/get.php?event_id=${eventId}&after_id=${lastIdRef.current}&limit=20`,
      );
      const images = Array.isArray(data.images) ? data.images : [];
      if (images.length > 0) {
        setImages((prev) => [...prev, ...images]);
        lastIdRef.current = data.last_id;
      }
    } catch (err) {
      console.error("Eroare la poll slideshow", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  // 3. Setup Poll Interval
  useEffect(() => {
    if (!event) return;
    // Initial fetch
    pollImages(event.id);
    pollTimerRef.current = setInterval(() => {
      pollImages(event.id);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollTimerRef.current);
  }, [event]);

  // 4. Setup Slide Interval
  useEffect(() => {
    if (images.length === 0) return;

    slideTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(slideTimerRef.current);
  }, [images.length]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Cast / TV projection via the Presentation API (Chromecast, smart displays)
  useEffect(() => {
    if (typeof window === "undefined" || !("PresentationRequest" in window))
      return;
    try {
      const request = new window.PresentationRequest([window.location.href]);
      presentationRef.current = request;
      request
        .getAvailability()
        .then((availability) => {
          setCastAvailable(availability.value);
          availability.addEventListener("change", () =>
            setCastAvailable(availability.value),
          );
        })
        // Continuous availability isn't supported everywhere; show button anyway
        .catch(() => setCastAvailable(true));
    } catch {
      setCastAvailable(false);
    }
  }, []);

  const startCast = async () => {
    const request = presentationRef.current;
    if (!request) return;
    try {
      const connection = await request.start();
      connectionRef.current = connection;
      setCasting(true);
      const reset = () => {
        setCasting(false);
        connectionRef.current = null;
      };
      connection.addEventListener("close", reset);
      connection.addEventListener("terminate", reset);
    } catch {
      // user dismissed the cast picker or no device selected
    }
  };

  const stopCast = () => {
    const connection = connectionRef.current;
    if (connection) {
      try {
        connection.terminate();
      } catch {
        /* ignore */
      }
    }
    setCasting(false);
    connectionRef.current = null;
  };

  // Background music (browsers block autoplay with sound until a user gesture)
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) {
      audio.pause();
      setMusicOn(false);
    } else {
      audio.volume = 0.35;
      audio
        .play()
        .then(() => setMusicOn(true))
        .catch(() => setMusicOn(false));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <Loader2 className="animate-spin text-rose-gold" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white px-4 text-center">
        <div className="max-w-md w-full">
          <AlertCircle size={48} className="text-rose-gold mx-auto mb-4" />
          <h1 className="text-2xl font-serif mb-2">Oops!</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-flex">
            Înapoi la pagina principală
          </Link>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      {/* Background music — drop a royalty-free track at public/slideshow-music.mp3 */}
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}slideshow-music.mp3`}
        loop
        preload="auto"
        onCanPlayThrough={() => setMusicReady(true)}
        onError={() => setMusicReady(false)}
      />

      <AnimatePresence mode="wait">
        {currentImage ? (
          <motion.div
            key={currentImage.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Blurred background */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30"
              style={{ backgroundImage: `url(${currentImage.url})` }}
            />

            {/* Main Image */}
            <img
              src={currentImage.url}
              alt="Slideshow"
              className="relative z-10 max-w-full max-h-full object-contain drop-shadow-2xl"
            />

            {/* Overlay Info */}
            <div className="absolute bottom-12 left-12 z-20 flex flex-col items-start gap-2 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
              <span className="text-white/60 text-xs font-mono uppercase tracking-widest">
                Fotografiat de
              </span>
              <span className="text-white text-xl font-serif font-medium">
                {currentImage.uploader}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-4xl font-serif text-white mb-4">
              Galeria Nunții
            </h2>
            <p className="text-xl text-gray-400 font-light">
              Așteptăm primele fotografii... 📸
            </p>
            <Loader2 className="animate-spin text-rose-gold mt-8" size={32} />
          </div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4 opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        <Link
          to={`/event/${slug}`}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
          title="Înapoi"
        >
          <Home size={18} />
        </Link>
        {castAvailable && (
          <button
            onClick={casting ? stopCast : startCast}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border ${
              casting
                ? "bg-rose-gold text-white border-rose-gold"
                : "bg-white/10 text-white hover:bg-white/20 border-white/10"
            }`}
            title={
              casting ? "Oprește proiecția" : "Proiectează pe TV / Chromecast"
            }
          >
            <Cast size={18} />
          </button>
        )}
        {musicReady && (
          <button
            onClick={toggleMusic}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border ${
              musicOn
                ? "bg-rose-gold text-white border-rose-gold"
                : "bg-white/10 text-white hover:bg-white/20 border-white/10"
            }`}
            title={musicOn ? "Oprește muzica" : "Pornește muzica de fundal"}
          >
            {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Event Title Logo */}
      <div className="absolute top-8 left-8 z-50 opacity-50">
        <h1 className="text-white font-serif tracking-widest text-lg drop-shadow-md">
          {event?.name}
        </h1>
      </div>
    </div>
  );
}
