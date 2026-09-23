import { Link } from "react-router-dom";
import logoImage from "../assets/images/LOGO-WEDPIX-TRANS.png";
import logoWebp from "../assets/images/LOGO-WEDPIX-TRANS.webp";

export default function Footer() {
  return (
    <footer
      className="border-t border-rose-gold/20 bg-[#3A2218]"
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-2 text-center md:text-left">
            <div className="mb-4">
              <picture>
                <source srcSet={logoWebp} type="image/webp" />
                <img
                  src={logoImage}
                  alt="WedPix"
                  className="w-full max-w-[297px] h-auto mx-auto md:mx-0"
                  width="297"
                  height="100"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <p className="text-ivory/60 font-sans text-sm leading-relaxed mb-4">
              Platforma SaaS pentru nunți și evenimente. Transformăm amintirile
              în magie prin tehnologie inovatoare și design elegant.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="https://facebook.com/wedpix"
                aria-label="Facebook"
                className="text-ivory/50 hover:text-rose-gold transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/wedpix"
                aria-label="Instagram"
                className="text-ivory/50 hover:text-rose-gold transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C8.396 0 7.609.035 6.298.129c-1.31.092-2.206.25-2.99.535C2.535.95 1.769 1.272.99 1.796c-.779.524-1.095 1.29-1.41 2.06C-.135 5.625-.17 6.412-.17 10.033s.035 4.408.129 5.719c.092 1.31.25 2.206.535 2.99.524.779 1.29 1.095 2.06 1.41.78.315 1.567.45 5.188.45s4.408-.135 5.719-.129c1.31-.092 2.206-.25 2.99-.535.779-.524 1.095-1.29 1.41-2.06.315-.78.45-1.567.45-5.188s-.135-4.408-.129-5.719c-.092-1.31-.25-2.206-.535-2.99-.524-.779-1.29-1.095-2.06-1.41C16.482.25 15.586.092 14.276 0c-1.31-.092-2.097-.129-5.719-.129zM9.982 2.261c2.532 0 4.508.02 6.098.11.95.054 1.47.202 1.815.336.448.17.773.373 1.11.71.337.337.54.662.71 1.11.134.345.282.865.336 1.815.09 1.59.11 3.566.11 6.098s-.02 4.508-.11 6.098c-.054.95-.202 1.47-.336 1.815-.17.448-.373.773-.71 1.11-.337.337-.662.54-1.11.71-.345.134-.865.282-1.815.336-1.59.09-3.566.11-6.098.11s-4.508-.02-6.098-.11c-.95-.054-1.47-.202-1.815-.336-.448-.17-.773-.373-1.11-.71-.337-.337-.54-.662-.71-1.11-.134-.345-.282-.865-.336-1.815C2.272 12.49 2.252 10.514 2.252 7.982s.02-4.508.11-6.098c.054-.95.202-1.47.336-1.815.17-.448.373-.773.71-1.11.337-.337.662-.54 1.11-.71.345-.134.865-.282 1.815-.336 1.59-.09 3.566-.11 6.098-.11zM12.017 6.072c-2.662 0-4.825 2.163-4.825 4.825s2.163 4.825 4.825 4.825 4.825-2.163 4.825-4.825S14.679 6.072 12.017 6.072zm0 7.966c-1.725 0-3.125-1.4-3.125-3.125s1.4-3.125 3.125-3.125 3.125 1.4 3.125 3.125-1.4 3.125-3.125 3.125zM18.406 5.926c-.62 0-1.124.504-1.124 1.124s.504 1.124 1.124 1.124 1.124-.504 1.124-1.124-.504-1.124-1.124-1.124z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/wedpix"
                aria-label="Twitter"
                className="text-ivory/50 hover:text-rose-gold transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
            <div className="mt-5 flex flex-row gap-3 flex-wrap items-center justify-center md:justify-start">
              <a
                href="https://anpc.ro/ce-este-sal/"
                target="_blank"
                rel="nofollow"
              >
                <img
                  style={{ width: "220px", maxWidth: "100%" }}
                  src="https://wpfitness.eu/wp-content/uploads/2022/10/anpc-sal.png"
                  alt="Solutionarea Alternativa a Litigiilor"
                />
              </a>
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="nofollow"
              >
                <img
                  style={{ width: "220px", maxWidth: "100%" }}
                  src="https://wpfitness.eu/wp-content/uploads/2022/10/anpc-sol.png"
                  alt="Solutionarea Online a Litigiilor"
                />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-ivory mb-4">
              Link-uri rapide
            </h3>
            <nav aria-label="Link-uri rapide">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Acasă
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Începe gratuit
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Autentificare
                  </Link>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Prețuri
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-ivory mb-4">
              Legal & Suport
            </h3>
            <nav aria-label="Legal și suport">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Politica de Confidențialitate
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-service"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Termeni și Condiții
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Politica de Cookie-uri
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gdpr"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    GDPR
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dpa"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    DPA
                  </Link>
                </li>
                <li>
                  <Link
                    to="/accessibility"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Accesibilitate
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@wedpix.ro"
                    className="text-ivory/60 hover:text-rose-gold transition-colors"
                  >
                    Suport
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="border-t border-rose-gold/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="font-serif text-lg font-semibold text-ivory mb-2">
              Rămâi la curent
            </h3>
            <p className="text-ivory/60 text-sm mb-4">
              Primește noutăți despre funcționalități noi și sfaturi pentru
              evenimente.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Newsletter signup coming soon!");
              }}
            >
              <input
                type="email"
                placeholder="Adresa de email"
                className="flex-1 px-3 py-2 bg-white/10 border border-rose-gold/30 rounded-lg text-sm text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-rose-gold"
                aria-label="Adresa de email pentru newsletter"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-gold text-white rounded-lg text-sm font-medium hover:bg-[#6F5827] transition-colors"
                aria-label="Abonează-te la newsletter"
              >
                Abonează-te
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-rose-gold/20 pt-8 text-center">
          <p className="text-xs text-ivory/60 font-sans">
            © {new Date().getFullYear()} Nixart Romania SRL. Toate drepturile
            rezervate.
            <span className="block mt-1">
              <a
                href="mailto:hello@wedpix.ro"
                className="hover:text-rose-gold transition-colors"
              >
                hello@wedpix.ro
              </a>{" "}
              |
              <a
                href="mailto:help@wedpix.ro"
                className="hover:text-rose-gold transition-colors ml-2"
              >
                help@wedpix.ro
              </a>{" "}
              |
              <a
                href="tel:+40750222962"
                className="hover:text-rose-gold transition-colors ml-2"
              >
                0750 222 962
              </a>
            </span>
          </p>
          <p className="text-xs text-ivory/40 font-sans mt-2">
            Licurici 2, Bacău · CUI: J2022002045045 · J4/2045/2022
          </p>
          <p className="text-xs text-ivory/40 font-sans mt-3">
            Developed with ❤️ by{" "}
            <a
              href="https://tibix.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-gold hover:text-gold-light transition-colors"
            >
              Tibix
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
