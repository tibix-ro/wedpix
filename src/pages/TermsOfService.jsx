import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function TermsOfService() {
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
          Termeni și Condiții
        </h1>

        <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
          <p className="text-sm text-taupe">
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              1. Acceptarea termenilor
            </h2>
            <p>
              Prin utilizarea platformei WedPix, acceptați acești termeni și
              condiții. Dacă nu sunteți de acord, vă rugăm să nu utilizați
              serviciile noastre.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              2. Descrierea serviciilor
            </h2>
            <p>
              WedPix este o platformă SaaS care permite organizatorilor de
              evenimente să creeze galerii foto interactive pentru invitați, cu
              funcționalități de upload securizat și slideshow.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              3. Conturi și înregistrare
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trebuie să furnizați informații exacte și complete</li>
              <li>
                Sunteți responsabil pentru menținerea confidențialității parolei
              </li>
              <li>Un utilizator poate avea un singur cont activ</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              4. Conținutul utilizatorilor
            </h2>
            <p>
              Utilizatorii sunt responsabili pentru conținutul încărcat. WedPix
              își rezervă dreptul de a elimina conținut care încalcă drepturile
              de autor sau conține materiale ilegale.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              5. Plăți și abonamente
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Plățile sunt procesate prin Stripe</li>
              <li>
                Abonamentele sunt per eveniment, fără taxe lunare recurente
              </li>
              <li>Rambursările se fac conform politicii Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              6. Limitarea răspunderii
            </h2>
            <p>
              WedPix nu este responsabil pentru pierderea datelor din cauze
              independente de voința noastră. Serviciul este oferit "ca atare"
              fără garanții explicite.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              7. Încetarea serviciilor
            </h2>
            <p>
              WedPix își rezervă dreptul de a suspenda sau termina conturile
              care încalcă termenii. Utilizatorii pot șterge contul în orice
              moment.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              8. Legea aplicabilă
            </h2>
            <p>
              Acești termeni sunt guvernați de legislația română. Orice litigii
              vor fi soluționate în instanțele competente din România.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              9. Contact
            </h2>
            <p>
              Pentru întrebări privind termenii, contactați-ne la:{" "}
              <a
                href="mailto:help@wedpix.ro"
                className="text-rose-gold hover:underline"
              >
                help@wedpix.ro
              </a>
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
