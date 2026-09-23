import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Image,
  Clock,
  Play,
  Download,
  Settings,
  Copy,
  MessageCircle,
} from "lucide-react";
import API from "../utils/api.js";
import QRCodeDisplay from "../components/QRCodeDisplay.jsx";
import QuotaBar from "../components/QuotaBar.jsx";
import Gallery from "../components/Gallery.jsx";

export default function EventAdmin() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get(`/events/get.php?slug=${slug}`)
      .then(({ data }) => setEvent(data.event))
      .catch((err) =>
        setError(
          err.response?.data?.error || "Eroare la încărcarea evenimentului.",
        ),
      )
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDownloadZip = async (eventObj) => {
    eventObj.preventDefault();

    const downloadUrl = `${import.meta.env.VITE_API_URL}/images/download-zip.php?event_id=${event.id}`;
    const token = localStorage.getItem("wedpix_token");

    console.debug("[Download ZIP] url=", downloadUrl);
    console.debug(
      "[Download ZIP] tokenPresent=",
      !!token,
      "tokenLength=",
      token?.length,
    );

    if (!token) {
      console.warn(
        "[Download ZIP] Fără token de autentificare. Cererea va fi respinsă cu Autentificare necesară.",
      );
    }

    try {
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
      });

      console.debug("[Download ZIP] response status=", response.status);
      console.debug(
        "[Download ZIP] response content-type=",
        response.headers.get("content-type"),
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error("[Download ZIP] failed", response.status, data);
        window.alert(
          data?.error ||
            "Eroare la descărcarea ZIP. Vezi consola pentru detalii.",
        );
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `WedPix_${event.slug}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("[Download ZIP] fetch error", error);
      window.alert("Eroare la descărcarea ZIP. Vezi consola pentru detalii.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-rose-gold" size={32} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24 text-center">
        <p className="text-red-500 mb-4">
          {error || "Evenimentul nu a fost găsit."}
        </p>
        <Link to="/dashboard" className="text-taupe hover:underline">
          Înapoi la panou
        </Link>
      </div>
    );
  }

  const appBase = (
    import.meta.env.VITE_APP_URL || window.location.origin
  ).replace(/\/$/, "");
  const guestUrl = `${appBase}/event/${event.slug}`;
  const planInfo = event.plan_info;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-taupe hover:text-charcoal flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Înapoi la panou
        </Link>
        <div className="flex items-center gap-2">
          {planInfo.slideshow && (
            <Link
              to={`/event/${event.slug}/slideshow`}
              target="_blank"
              className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 border-rose-gold text-rose-gold hover:bg-rose-gold/10"
            >
              <Play size={14} /> Slideshow
            </Link>
          )}
          {/* Download Zip */}
          {planInfo.zip ? (
            <button
              type="button"
              onClick={handleDownloadZip}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Download size={14} /> Descarcă ZIP
            </button>
          ) : (
            <span className="text-xs text-taupe px-3 py-1.5 inline-flex items-center gap-1.5 border border-rose-gold/30 rounded-2xl">
              <Download size={14} /> ZIP disponibil doar pentru Gold/Platinum
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & QR */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-card border border-white/50">
            <h1 className="text-2xl font-serif text-charcoal mb-1">
              {event.name}
            </h1>
            <p className="text-sm text-taupe font-sans mb-4">/{event.slug}</p>

            <div className="flex flex-col gap-3 text-sm text-charcoal/80 mb-6">
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-rose-gold" />
                  <span>
                    {new Date(event.event_date).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Image size={16} className="text-rose-gold" />
                <span>{event.photo_count} fotografii</span>
              </div>
              {event.expires_at && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-rose-gold" />
                  <span>
                    Expiră la:{" "}
                    {new Date(event.expires_at).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-taupe mb-2">
                Pachet {planInfo.name}
              </p>
              <QuotaBar used={event.photo_count} limit={planInfo.photo_limit} />
            </div>

            <div className="border-t border-rose-gold/20 pt-6">
              <p className="text-sm font-semibold text-charcoal mb-4 text-center">
                Invită Oaspeții
              </p>
              <QRCodeDisplay url={guestUrl} eventName={event.name} />
            </div>
          </div>
        </div>

        {/* Right Column: Gallery */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl p-6 shadow-card border border-white/50 min-h-[500px]">
            <h2 className="text-xl font-serif text-charcoal mb-6 flex items-center justify-between">
              <span>Galerie</span>
              <span className="text-sm font-sans font-normal text-taupe">
                {event.photo_count} elemente
              </span>
            </h2>
            <Gallery eventId={event.id} isOrganizer={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
