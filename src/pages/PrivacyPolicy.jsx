import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function PrivacyPolicy() {
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
          Politica de Confidențialitate
        </h1>

        <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
          <p className="text-sm text-taupe">
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              1. Introducere
            </h2>
            <p>
              La WedPix, respectăm confidențialitatea datelor dumneavoastră
              personale. Această politică de confidențialitate explică cum
              colectăm, utilizăm și protejăm informațiile dumneavoastră atunci
              când utilizați platforma noastră.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              2. Datele pe care le colectăm
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informații de înregistrare (nume, email, parolă criptată)</li>
              <li>Date despre evenimente și fotografii încărcate</li>
              <li>Informații de plată pentru abonamente</li>
              <li>Date de utilizare și analitice (cookies, IP)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              3. Cum utilizăm datele
            </h2>
            <p>Datele sunt utilizate pentru:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Furnizarea serviciilor platformei</li>
              <li>Procesarea plăților</li>
              <li>Îmbunătățirea experienței utilizatorului</li>
              <li>Comunicări privind serviciile</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              4. Partajarea datelor
            </h2>
            <p>
              Nu vindem sau închiriem datele dumneavoastră personale către
              terți. Datele pot fi partajate doar cu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Procesatori de plăți (Stripe)</li>
              <li>Furnizori de servicii tehnice</li>
              <li>Autorități legale când este necesar</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              5. Securitatea datelor
            </h2>
            <p>
              Implementăm măsuri de securitate avansate pentru protejarea
              datelor dumneavoastră, inclusiv criptare SSL, stocare securizată
              și controale de acces stricte.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              6. Drepturile dumneavoastră
            </h2>
            <p>Conform GDPR, aveți dreptul la:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accesarea datelor personale</li>
              <li>Rectificarea datelor inexacte</li>
              <li>Ștergerea datelor („dreptul de a fi uitat")</li>
              <li>Portabilitatea datelor</li>
              <li>Opunerea față de prelucrare</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              7. Contact
            </h2>
            <p>
              Pentru întrebări privind confidențialitatea datelor, contactați-ne
              la:{" "}
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
