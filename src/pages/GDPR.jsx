import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const page = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

export default function GDPR() {
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
          Conformitatea GDPR
        </h1>

        <div className="prose prose-lg max-w-none text-charcoal/80 space-y-6">
          <p className="text-sm text-taupe">
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
          </p>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              1. Responsabilul cu prelucrarea datelor
            </h2>
            <p>
              Nixart Romania SRL
              <br />
              CUI: J2022002045045
              <br />
              Adresă: Licurici 2, Bacău
              <br />
              Email:{" "}
              <a
                href="mailto:help@wedpix.ro"
                className="text-rose-gold hover:underline"
              >
                help@wedpix.ro
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              2. Baza legală pentru prelucrare
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Consimțământ:</strong> Pentru newsletter și comunicări
                de marketing
              </li>
              <li>
                <strong>Executarea contractului:</strong> Pentru furnizarea
                serviciilor
              </li>
              <li>
                <strong>Interes legitim:</strong> Pentru îmbunătățirea
                serviciilor și securitate
              </li>
              <li>
                <strong>Obligație legală:</strong> Pentru conformitatea cu
                legislația
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              3. Categorii de date personale
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Date de identificare (nume, email)</li>
              <li>Date financiare (informații de plată)</li>
              <li>Date de utilizare (IP, cookies, log-uri)</li>
              <li>Conținut încărcat (fotografii, metadate)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              4. Drepturile persoanelor vizate
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul de acces
                </h3>
                <p className="text-sm">
                  Puteți solicita o copie a datelor personale pe care le deținem
                  despre dumneavoastră.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul la rectificare
                </h3>
                <p className="text-sm">
                  Puteți solicita corectarea datelor inexacte sau incomplete.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul la ștergere
                </h3>
                <p className="text-sm">
                  Puteți solicita ștergerea datelor când nu mai sunt necesare.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul la portabilitate
                </h3>
                <p className="text-sm">
                  Puteți solicita transferul datelor într-un format structurat.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul la opoziție
                </h3>
                <p className="text-sm">
                  Puteți obiecta față de prelucrarea datelor în anumite cazuri.
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Dreptul la restricționare
                </h3>
                <p className="text-sm">
                  Puteți solicita limitarea prelucrării datelor în anumite
                  situații.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              5. Perioade de păstrare
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datele de cont: păstrate cât timp contul este activ</li>
              <li>Date financiare: 7 ani conform legislației fiscale</li>
              <li>Cookies: conform setărilor browser-ului</li>
              <li>Conținut evenimente: până la ștergerea evenimentului</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              6. Securitatea datelor
            </h2>
            <p>
              Implementăm măsuri tehnice și organizatorice pentru protejarea
              datelor:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptare SSL/TLS pentru transmisii</li>
              <li>Criptare la nivel de fișier pentru stocare</li>
              <li>Control acces bazat pe roluri</li>
              <li>Auditare regulată a securității</li>
              <li>Backup-uri securizate</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              7. Transferuri internaționale
            </h2>
            <p>
              Datele sunt stocate în Uniunea Europeană. Pentru servicii cloud
              (Stripe, AWS), asigurăm conformitatea cu GDPR prin clauze
              contractuale standard.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              8. Exercitarea drepturilor
            </h2>
            <p>
              Pentru exercitarea drepturilor GDPR, contactați responsabilul cu
              protecția datelor la:{" "}
              <a
                href="mailto:help@wedpix.ro"
                className="text-rose-gold hover:underline"
              >
                help@wedpix.ro
              </a>
            </p>
            <p className="text-sm mt-2">
              Răspundem la solicitări în termen de 30 de zile conform GDPR.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-charcoal mb-4">
              9. Reclamații
            </h2>
            <p>
              Dacă considerați că drepturile dumneavoastră au fost încălcate,
              puteți depune o plângere la:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Autoritatea Națională de Supraveghere a Prelucrării Datelor cu
                Caracter Personal (ANSPDCP)
              </li>
              <li>Adresă: București, România</li>
              <li>
                Website:{" "}
                <a
                  href="https://www.dataprotection.ro"
                  className="text-rose-gold hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  dataprotection.ro
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
