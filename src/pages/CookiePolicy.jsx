import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function CookiePolicy() {
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
          Politica de Cookie-uri
        </h1>

        <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
          <p className="text-sm text-taupe">
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              1. Ce sunt cookie-urile
            </h2>
            <p>
              Cookie-urile sunt fișiere mici de text stocate pe dispozitivul
              dumneavoastră atunci când vizitați site-ul nostru. Ele ne ajută să
              asigurăm funcționarea corectă a platformei și să îmbunătățim
              experiența de utilizare.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              2. Tipuri de cookie-uri utilizate
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Esențiale:</strong> necesare pentru autentificare,
                securitate și funcționarea de bază a aplicației.
              </li>
              <li>
                <strong>Funcționale:</strong> rețin preferințe precum setări și
                opțiuni de interfață.
              </li>
              <li>
                <strong>Analitice:</strong> ne ajută să înțelegem cum este
                folosit site-ul (ex: pagini vizitate, interacțiuni).
              </li>
              <li>
                <strong>Marketing:</strong> pot fi folosite pentru
                personalizarea comunicărilor și măsurarea campaniilor.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              3. Cum colectăm consimțământul
            </h2>
            <p>
              La prima vizită, afișăm un banner de cookie-uri prin care puteți
              accepta toate cookie-urile, doar pe cele esențiale sau puteți
              personaliza preferințele. Opțiunea dumneavoastră este salvată și
              poate fi modificată ulterior.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              4. Gestionarea cookie-urilor
            </h2>
            <p>
              Puteți controla cookie-urile atât din setările noastre de
              consimțământ, cât și din browser-ul folosit. Dezactivarea
              cookie-urilor esențiale poate afecta funcționarea platformei.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              5. Durata de stocare
            </h2>
            <p>
              Cookie-urile pot fi de sesiune (șterse la închiderea browser-ului)
              sau persistente (păstrate pentru o perioadă limitată). Durata
              exactă depinde de scopul cookie-ului.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              6. Cookie-uri terțe
            </h2>
            <p>
              Unele funcționalități pot utiliza servicii terțe, cum ar fi
              instrumente analitice sau procesatori de plăți. Aceste servicii
              pot seta propriile cookie-uri conform politicilor lor.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              7. Contact
            </h2>
            <p>
              Pentru întrebări privind cookie-urile, ne puteți contacta la{" "}
              <a
                href="mailto:help@wedpix.ro"
                className="text-rose-gold hover:underline"
              >
                help@wedpix.ro
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
