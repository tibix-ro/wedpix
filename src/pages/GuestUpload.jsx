import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  Heart,
  AlertCircle,
  Clock,
  Image,
  ShieldCheck,
} from "lucide-react";
import API from "../utils/api.js";
import NameEntry from "../components/NameEntry.jsx";
import Uploader from "../components/Uploader.jsx";
import Gallery from "../components/Gallery.jsx";

export default function GuestUpload() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem(`wedpix_guest_${slug}`) || "";
  });
  const [refreshGallery, setRefreshGallery] = useState(0);
  const [newPhoto, setNewPhoto] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return sessionStorage.getItem(`wedpix_terms_${slug}`) === "1";
  });

  useEffect(() => {
    API.get(`/events/get.php?slug=${slug}`)
      .then(({ data }) => setEvent(data.event))
      .catch((err) => {
        // Handle different error types
        if (err.response?.status === 410) {
          setError(
            "Acest eveniment a expirat şi nu mai acceptă fotografii noi. Contactează organizatorul pentru mai multe detalii.",
          );
        } else if (err.response?.status === 429) {
          setError(
            "Limita de fotografii pentru acest eveniment a fost atinsă. Contactează organizatorul pentru upgrade.",
          );
        } else {
          setError(err.response?.data?.error || "Evenimentul nu a fost găsit.");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleNameSubmit = (name) => {
    setGuestName(name);
    localStorage.setItem(`wedpix_guest_${slug}`, name);
  };

  const handleUploadSuccess = (image) => {
    if (image?.id) setNewPhoto(image);
    setRefreshGallery((prev) => prev + 1);
    setEvent((prev) =>
      prev ? { ...prev, photo_count: (prev.photo_count ?? 0) + 1 } : prev,
    );
  };

  const handleAcceptTerms = () => {
    sessionStorage.setItem(`wedpix_terms_${slug}`, "1");
    setTermsAccepted(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-dvh bg-ivory bg-floral">
        <Loader2 className="animate-spin text-rose-gold" size={32} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex justify-center items-center min-h-dvh bg-ivory bg-floral px-4 text-center">
        <div className="glass rounded-3xl p-8 shadow-card border border-rose-gold/20 max-w-md w-full">
          <AlertCircle size={40} className="text-rose-gold mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-charcoal mb-2">Oops!</h1>
          <p className="text-taupe mb-6">
            {error || "Acest link nu este valid sau evenimentul a expirat."}
          </p>
          <Link to="/" className="btn-primary inline-flex">
            Creează și tu un eveniment
          </Link>
        </div>
      </div>
    );
  }

  if (!guestName) {
    return <NameEntry onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="min-h-dvh bg-ivory bg-floral pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-ivory/90 backdrop-blur-md border-b border-rose-gold/15 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-medium text-charcoal truncate">
              {event.name}
            </h1>
            <p className="text-xs text-taupe flex items-center gap-1">
              Salut, {guestName}{" "}
              <Heart size={10} className="text-rose-gold" fill="#C9A96E" />
            </p>
          </div>
          {event.cover_image && (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-gold/30 shrink-0">
              <img
                src={event.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-8">
        {event.description && (
          <div className="glass rounded-2xl p-5 shadow-sm text-center border border-white/50">
            <p className="text-sm text-charcoal/80 italic font-serif">
              "{event.description}"
            </p>
          </div>
        )}

        {/* Expiration Warning */}
        {event.expires_at &&
          (() => {
            const diff = Math.floor(
              (new Date(event.expires_at) - Date.now()) / 1000,
            );
            const isExpiringSoon = diff > 0 && diff < 86400 * 2; // Less than 2 days
            const isExpired = diff <= 0;

            if (isExpired) return null; // Already handled by error state

            if (isExpiringSoon) {
              return (
                <div className="glass rounded-2xl p-4 shadow-sm border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Evenimentul expiră în{" "}
                        {diff < 3600
                          ? "mai puțin de o oră"
                          : `${Math.floor(diff / 3600)} ore`}
                      </p>
                      <p className="text-xs text-amber-700">
                        Încarcă-ți fotografiile cât mai curând posibil!
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

        {/* Limit Warning */}
        {event.plan_info?.photo_limit &&
          event.photo_count >= event.plan_info.photo_limit * 0.8 && (
            <div className="glass rounded-2xl p-4 shadow-sm border border-blue-200 bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Image size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Limită aproape atinsă: {event.photo_count} /{" "}
                    {event.plan_info.photo_limit} fotografii
                  </p>
                  <p className="text-xs text-blue-700">
                    {event.plan_info.photo_limit - event.photo_count} locuri
                    rămase
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Upload Section */}
        {!termsAccepted ? (
          <div className="glass rounded-2xl p-6 shadow-sm border border-rose-gold/20 text-center space-y-4">
            <ShieldCheck size={32} className="text-rose-gold mx-auto" />
            <h3 className="font-serif text-lg text-charcoal">
              Înainte de a adăuga fotografii
            </h3>
            <p className="text-sm text-taupe">
              Pentru a putea încărca fotografii la acest eveniment, trebuie să
              confirmi că ai citit și accepți condițiile de utilizare.
            </p>
            <label className="flex items-start gap-3 text-left cursor-pointer bg-white/50 rounded-xl p-4 border border-rose-gold/15">
              <input
                type="checkbox"
                className="mt-0.5 accent-rose-gold w-4 h-4 shrink-0"
                onChange={(e) => e.target.checked && handleAcceptTerms()}
              />
              <span className="text-sm text-charcoal/80 leading-relaxed">
                Am citit și accept{" "}
                <Link
                  to="/terms-of-service"
                  target="_blank"
                  className="text-rose-gold hover:underline font-medium"
                >
                  Termenii și Condițiile
                </Link>{" "}
                și{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  className="text-rose-gold hover:underline font-medium"
                >
                  Politica de Confidențialitate
                </Link>
                .
              </span>
            </label>
          </div>
        ) : (
          <Uploader
            eventId={event.id}
            guestName={guestName}
            planInfo={event.plan_info}
            photoCount={event.photo_count}
            expiresAt={event.expires_at}
            onSuccess={handleUploadSuccess}
            onError={(err) => console.error("Upload error:", err)}
          />
        )}

        {/* Gallery Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-charcoal">Galeria</h2>
            {event.plan_info?.slideshow && (
              <Link
                to={`/event/${event.slug}/slideshow`}
                target="_blank"
                className="text-xs text-rose-gold hover:underline font-semibold"
              >
                Vezi Slideshow
              </Link>
            )}
          </div>
          <Gallery
            eventId={event.id}
            isOrganizer={false}
            refreshKey={refreshGallery}
            newPhoto={newPhoto}
          />
        </div>
      </main>
    </div>
  );
}
