import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function Accessibility() {
  return (
    <motion.div {...page} className="bg-ivory min-h-dvh">
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-taupe hover:text-charcoal mb-8 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Înapoi la acasa
        </Link>

        <h1 className="font-serif text-4xl font-light text-charcoal mb-8">
          Declarație de Accesibilitate
        </h1>

        <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
          <p className="text-sm text-taupe">
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              1. Angajamentul nostru pentru accesibilitate
            </h2>
            <p>
              WedPix se angajează să ofere o experiență accesibilă tuturor
              utilizatorilor, inclusiv persoanelor cu dizabilități. Platforma
              noastră respectă standardele WCAG 2.1 Nivel AA.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              2. Funcționalități de accesibilitate
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Navigare cu tastatura
                </h3>
                <p className="text-sm">
                  Toate funcționalitățile sunt accesibile prin tastatură (Tab,
                  Enter, Space).
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Cititoare de ecran
                </h3>
                <p className="text-sm">
                  Compatibil cu NVDA, JAWS, VoiceOver și alte cititoare de ecran
                  populare.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Contrast ridicat
                </h3>
                <p className="text-sm">
                  Culori cu contrast ridicat pentru vizibilitate optimă.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Text redimensionabil
                </h3>
                <p className="text-sm">
                  Textul se redimensionează fără pierderea funcționalității.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Structură semantică
                </h3>
                <p className="text-sm">
                  HTML semantic cu heading-uri, landmarks și ARIA labels.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Formulare accesibile
                </h3>
                <p className="text-sm">
                  Etichete clare, mesaje de eroare și instrucțiuni pentru
                  formulare.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              3. Conformitatea WCAG 2.1
            </h2>
            <p>Platforma respectă următoarele principii WCAG:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Perceptibil:</strong> Informația și componentele UI
                trebuie să fie prezentate utilizatorilor în modalități pe care
                le pot percepe.
              </li>
              <li>
                <strong>Operabil:</strong> Componentele interfeței trebuie să
                fie ușor de operat.
              </li>
              <li>
                <strong>Înțelegibil:</strong> Informația și operațiunea
                interfeței trebuie să fie înțelegibile.
              </li>
              <li>
                <strong>Robust:</strong> Conținutul trebuie să fie suficient de
                robust pentru a fi interpretat de o gamă largă de agenți
                utilizator, inclusiv tehnologii de asistare.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              4. Suport pentru dispozitive de asistare
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cititoare de ecran (screen readers)</li>
              <li>Software de mărire a ecranului</li>
              <li>Dispozitive braille</li>
              <li>Comenzi vocale</li>
              <li>Dispozitive de indicare alternativă</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              5. Feedback și îmbunătățiri
            </h2>
            <p>
              Lucrăm continuu la îmbunătățirea accesibilității platformei. Dacă
              întâmpinați dificultăți în utilizarea WedPix, vă rugăm să ne
              contactați pentru asistență.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              6. Contact pentru accesibilitate
            </h2>
            <p>
              Pentru întrebări sau feedback privind accesibilitatea, contactați
              echipa noastră:{" "}
              <a
                href="mailto:help@wedpix.ro"
                className="text-rose-gold hover:underline"
              >
                help@wedpix.ro
              </a>
            </p>
            <p className="text-sm mt-2">
              Vom răspunde solicitărilor dumneavoastră în termen de 5 zile
              lucrătoare.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              7. Resurse suplimentare
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <a
                  href="https://www.w3.org/WAI/WCAG21/quickref/"
                  className="text-rose-gold hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  Ghidul WCAG 2.1
                </a>
              </li>
              <li>
                <a
                  href="https://www.a11yproject.com/"
                  className="text-rose-gold hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  The A11Y Project
                </a>
              </li>
              <li>
                <a
                  href="https://webaim.org/"
                  className="text-rose-gold hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  WebAIM
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
