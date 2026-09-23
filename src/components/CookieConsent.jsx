import { useState, useEffect } from "react";
import { X, Settings, Check } from "lucide-react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("wedpix_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const acceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allPreferences);
    localStorage.setItem(
      "wedpix_cookie_consent",
      JSON.stringify(allPreferences),
    );
    setShowBanner(false);
    setShowSettings(false);
    applyCookies(allPreferences);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem(
      "wedpix_cookie_consent",
      JSON.stringify(necessaryOnly),
    );
    setShowBanner(false);
    setShowSettings(false);
    applyCookies(necessaryOnly);
  };

  const saveSettings = () => {
    localStorage.setItem("wedpix_cookie_consent", JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    applyCookies(preferences);
  };

  const applyCookies = (prefs) => {
    // Enable/disable Google Analytics
    if (window.gtag && prefs.analytics) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    } else if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }

    // Enable/disable marketing cookies
    if (window.gtag && prefs.marketing) {
      window.gtag("consent", "update", {
        ad_storage: "granted",
      });
    } else if (window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: "denied",
      });
    }

    // Functional cookies are handled by the app itself
    // Necessary cookies are always enabled
  };

  const updatePreference = (type, value) => {
    if (type === "necessary") return; // Cannot disable necessary cookies
    setPreferences((prev) => ({ ...prev, [type]: value }));
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Main Banner */}
      {showBanner && !showSettings && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-t border-rose-gold/20 p-4 shadow-2xl"
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-description"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h2
                  id="cookie-title"
                  className="text-white font-serif text-lg font-semibold mb-2"
                >
                  🍪 Politica privind cookie-urile
                </h2>
                <p
                  id="cookie-description"
                  className="text-taupe text-sm leading-relaxed"
                >
                  Folosim cookie-uri pentru a îmbunătăți experiența
                  dumneavoastră pe site-ul nostru. Acceptați toate cookie-urile
                  sau personalizați-vă preferințele.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-sm font-medium text-charcoal bg-taupe hover:bg-taupe/80 transition-colors rounded-lg"
                  aria-label="Acceptă doar cookie-urile esențiale"
                >
                  Doar esențiale
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-sm font-medium text-charcoal bg-white hover:bg-white/90 transition-colors rounded-lg flex items-center gap-1"
                  aria-label="Personalizează preferințele cookie"
                >
                  <Settings size={14} />
                  Setări
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-gold hover:bg-[#6F5827] transition-colors rounded-lg"
                  aria-label="Acceptă toate cookie-urile"
                >
                  Acceptă toate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="settings-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="settings-title"
                  className="font-serif text-xl font-semibold text-charcoal"
                >
                  Setări cookie-uri
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-taupe hover:text-charcoal transition-colors"
                  aria-label="Închide setările cookie"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="border border-rose-gold/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-charcoal">
                      Cookie-uri esențiale
                    </h3>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        Întotdeauna activ
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-taupe">
                    Necesare pentru funcționarea site-ului. Nu pot fi
                    dezactivate.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-rose-gold/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-charcoal">
                      Cookie-uri analitice
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          updatePreference("analytics", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-taupe peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-gold/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-gold"></div>
                    </label>
                  </div>
                  <p className="text-sm text-taupe">
                    Ne ajută să înțelegem cum utilizați site-ul pentru a-l
                    îmbunătăți.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-rose-gold/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-charcoal">
                      Cookie-uri de marketing
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          updatePreference("marketing", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-taupe peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-gold/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-gold"></div>
                    </label>
                  </div>
                  <p className="text-sm text-taupe">
                    Folosite pentru a vă arăta reclame relevante pe alte
                    site-uri.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-rose-gold/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-charcoal">
                      Cookie-uri funcționale
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) =>
                          updatePreference("functional", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-taupe peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-gold/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-gold"></div>
                    </label>
                  </div>
                  <p className="text-sm text-taupe">
                    Îmbunătățesc funcționalitatea site-ului (ex: salvare
                    preferințe).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={acceptNecessary}
                  className="flex-1 px-4 py-2 text-sm font-medium text-charcoal bg-taupe hover:bg-taupe/80 transition-colors rounded-lg"
                >
                  Doar esențiale
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-gold hover:bg-[#6F5827] transition-colors rounded-lg"
                >
                  Salvează setările
                </button>
              </div>

              <p className="text-xs text-taupe text-center mt-4">
                Pentru mai multe informații, consultați{" "}
                <a
                  href="/cookie-policy"
                  className="text-rose-gold hover:underline"
                  onClick={() => setShowSettings(false)}
                >
                  Politica de Cookie-uri
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
