import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaLeft, setCaptchaLeft] = useState(
    () => Math.floor(Math.random() * 8) + 2,
  );
  const [captchaRight, setCaptchaRight] = useState(
    () => Math.floor(Math.random() * 8) + 2,
  );
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const regenerateCaptcha = () => {
    setCaptchaLeft(Math.floor(Math.random() * 8) + 2);
    setCaptchaRight(Math.floor(Math.random() * 8) + 2);
    setCaptchaAnswer("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (Number(captchaAnswer) !== captchaLeft + captchaRight) {
      setCaptchaError("Validare CAPTCHA invalidă. Încearcă din nou.");
      regenerateCaptcha();
      return;
    }
    if (!termsAccepted) {
      setCaptchaError(
        "Trebuie să accepți Termenii și Condițiile pentru a trimite mesajul.",
      );
      return;
    }
    setCaptchaError("");

    const composedSubject = encodeURIComponent(
      subject || "Mesaj de pe site WedPix",
    );
    const composedBody = encodeURIComponent(
      `Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`,
    );

    window.location.href = `mailto:help@wedpix.ro?subject=${composedSubject}&body=${composedBody}`;
  };

  return (
    <motion.div {...page} className="bg-ivory min-h-dvh">
      <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-taupe hover:text-charcoal mb-8 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Înapoi la acasa
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="glass rounded-2xl p-6 shadow-card border border-white/40">
            <h1 className="font-serif text-4xl font-light text-charcoal mb-4">
              Contact
            </h1>
            <p className="text-taupe mb-6">
              Ai întrebări despre pachete, facturare sau funcționalități?
              Scrie-ne și îți răspundem cât mai rapid.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 text-charcoal/85">
                <Mail size={18} className="text-rose-gold mt-0.5" />
                <div>
                  <p className="font-semibold">Email</p>
                  <a
                    href="mailto:help@wedpix.ro"
                    className="text-taupe hover:text-rose-gold transition-colors"
                  >
                    help@wedpix.ro
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-charcoal/85">
                <Phone size={18} className="text-rose-gold mt-0.5" />
                <div>
                  <p className="font-semibold">Telefon</p>
                  <a
                    href="tel:+40750222962"
                    className="text-taupe hover:text-rose-gold transition-colors"
                  >
                    0750 222 962
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-charcoal/85">
                <MapPin size={18} className="text-rose-gold mt-0.5" />
                <div>
                  <p className="font-semibold">Adresă</p>
                  <p className="text-taupe">Licurici 2, Bacău</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-6 shadow-card border border-white/40">
            <h2 className="font-serif text-2xl text-charcoal mb-4">
              Formular de contact
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-charcoal/80 mb-1"
                  htmlFor="contact-name"
                >
                  Nume
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-rose-gold/25 px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-charcoal/80 mb-1"
                  htmlFor="contact-email"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-rose-gold/25 px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-charcoal/80 mb-1"
                  htmlFor="contact-subject"
                >
                  Subiect
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-rose-gold/25 px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-charcoal/80 mb-1"
                  htmlFor="contact-message"
                >
                  Mesaj
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full rounded-xl border border-rose-gold/25 px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-charcoal/80 mb-1"
                  htmlFor="contact-captcha"
                >
                  CAPTCHA: cât face {captchaLeft} + {captchaRight}?
                </label>
                <div className="flex gap-2">
                  <input
                    id="contact-captcha"
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(event) => setCaptchaAnswer(event.target.value)}
                    className="w-full rounded-xl border border-rose-gold/25 px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  />
                  <button
                    type="button"
                    onClick={regenerateCaptcha}
                    className="rounded-xl border border-rose-gold/25 px-3 py-2 text-sm text-charcoal/80 hover:border-rose-gold/50"
                  >
                    Alt cod
                  </button>
                </div>
                {captchaError && (
                  <p className="mt-1 text-sm text-red-500">{captchaError}</p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-gold to-[#6F5827] text-white px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
              >
                Trimite mesaj
              </button>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-rose-gold w-4 h-4 shrink-0"
                />
                <span className="text-xs text-taupe/80 leading-relaxed">
                  Am citit și accept{" "}
                  <Link
                    to="/terms-of-service"
                    className="text-rose-gold hover:underline"
                  >
                    Termenii și Condițiile
                  </Link>{" "}
                  și{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-rose-gold hover:underline"
                  >
                    Politica de Confidențialitate
                  </Link>
                  .
                </span>
              </label>
            </form>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
