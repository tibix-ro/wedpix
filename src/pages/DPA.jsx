import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Shield,
  Users,
  AlertTriangle,
} from "lucide-react";

export default function DPA() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-rose-gold hover:text-rose-gold/80 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Înapoi la pagina principală
        </Link>
        <h1 className="text-4xl font-serif text-charcoal mb-2">
          Acord de Prelucrare a Datelor (DPA)
        </h1>
        <p className="text-xl text-taupe">Pentru clienți business (B2B)</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="glass rounded-2xl p-8 shadow-card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield size={32} className="text-blue-600" />
            <h2 className="text-2xl font-serif text-charcoal m-0">
              Acord de Prelucrare a Datelor
            </h2>
          </div>

          <p className="text-taupe leading-relaxed mb-6">
            Acest Acord de Prelucrare a Datelor ("DPA") stabilește termenii și
            condițiile conform cărora
            <strong> Nixart Romania SRL</strong> ("Operatorul") prelucrează
            datele cu caracter personal în numele clienților săi business
            ("Controlorul de Date").
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Users size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Pentru cine este acest DPA?
                </h3>
                <p className="text-blue-700 text-sm">
                  Acest acord se aplică doar clienților business care folosesc
                  WedPix pentru prelucrarea datelor cu caracter personal ale
                  clienților lor (ex: organizatori de evenimente).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              1. Definiții
            </h2>
            <div className="space-y-3 text-taupe">
              <p>
                <strong>"Date cu Caracter Personal"</strong> înseamnă orice
                informație privind o persoană fizică identificată sau
                identificabilă.
              </p>
              <p>
                <strong>"Operator"</strong> înseamnă Nixart Romania SRL, care
                prelucrează datele în numele Controlorului.
              </p>
              <p>
                <strong>"Controlor"</strong> înseamnă clientul business care
                determină scopurile și mijloacele prelucrării datelor.
              </p>
              <p>
                <strong>"Prelucrare"</strong> înseamnă orice operațiune
                efectuată asupra datelor cu caracter personal.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              2. Obiectul DPA
            </h2>
            <p className="text-taupe leading-relaxed">
              Operatorul se angajează să prelucreze Datele cu Caracter Personal
              numai în conformitate cu instrucțiunile Controlorului și să
              implementeze măsuri tehnice și organizatorice adecvate pentru
              protejarea acestor date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              3. Obligațiile Operatorului
            </h2>
            <div className="space-y-3 text-taupe">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-gold/10 flex items-center justify-center text-sm font-semibold text-rose-gold mt-0.5">
                  1
                </span>
                <p>
                  Prelucrarea datelor numai conform instrucțiunilor
                  Controlorului
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-gold/10 flex items-center justify-center text-sm font-semibold text-rose-gold mt-0.5">
                  2
                </span>
                <p>
                  Asigurarea confidențialității angajaților și
                  subcontractanților
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-gold/10 flex items-center justify-center text-sm font-semibold text-rose-gold mt-0.5">
                  3
                </span>
                <p>Implementarea măsurilor de securitate adecvate</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-gold/10 flex items-center justify-center text-sm font-semibold text-rose-gold mt-0.5">
                  4
                </span>
                <p>Asistarea Controlorului în îndeplinirea obligațiilor GDPR</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              4. Măsuri de Securitate
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">Tehnice</h3>
                <ul className="text-sm text-taupe space-y-1">
                  <li>• Criptare SSL/TLS</li>
                  <li>• Stocare securizată a fișierelor</li>
                  <li>• Control acces bazat pe roluri</li>
                  <li>• Monitorizare continuă</li>
                </ul>
              </div>
              <div className="glass rounded-lg p-4">
                <h3 className="font-semibold text-charcoal mb-2">
                  Organizatorice
                </h3>
                <ul className="text-sm text-taupe space-y-1">
                  <li>• Politici de confidențialitate</li>
                  <li>• Training angajați</li>
                  <li>• Audit regulat</li>
                  <li>• Plan de răspuns la incidente</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              5. Subcontractanți
            </h2>
            <p className="text-taupe leading-relaxed mb-4">
              Operatorul poate utiliza subcontractanți pentru prelucrarea
              datelor, dar numai cu acordul prealabil al Controlorului și cu
              condiția ca subcontractanții să ofere garanții adecvate.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">
                    Subcontractanți Actuali
                  </h3>
                  <ul className="text-amber-700 text-sm">
                    <li>• Hetzner (Hosting și stocare)</li>
                    <li>• Stripe (Procesare plăți)</li>
                    <li>
                      • Google Analytics (Analytics - doar cu consimțământ)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              6. Drepturile Subiecților Datelor
            </h2>
            <p className="text-taupe leading-relaxed mb-4">
              Operatorul asistă Controlorul în îndeplinirea cererilor
              subiecților datelor privind:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-ivory rounded-lg">
                <span className="text-rose-gold">📋</span>
                <span className="text-sm">Acces la date</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-ivory rounded-lg">
                <span className="text-rose-gold">✏️</span>
                <span className="text-sm">Rectificare</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-ivory rounded-lg">
                <span className="text-rose-gold">🗑️</span>
                <span className="text-sm">Ștergere</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-ivory rounded-lg">
                <span className="text-rose-gold">📦</span>
                <span className="text-sm">Portabilitate</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              7. Încetarea Prelucrării
            </h2>
            <p className="text-taupe leading-relaxed">
              La încetarea contractului, Operatorul va șterge sau returna toate
              Datele cu Caracter Personal la Controlor, cu excepția cazurilor în
              care păstrarea este necesară din motive legale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-charcoal mb-4">
              8. Contact
            </h2>
            <div className="glass rounded-lg p-6">
              <p className="text-taupe mb-2">
                Pentru întrebări privind acest DPA, contactați:
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> help@wedpix.ro
                </p>
                <p>
                  <strong>Adresă:</strong> Licurici 2, Bacău
                </p>
                <p>
                  <strong>Telefon:</strong> 0750 222 962
                </p>
              </div>
            </div>
          </section>

          <div className="bg-rose-gold/5 border border-rose-gold/20 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-serif text-charcoal mb-2">
              Semnarea DPA
            </h3>
            <p className="text-taupe text-sm mb-4">
              Pentru a activa acest DPA, vă rugăm să ne contactați la
              help@wedpix.ro. Vom semna acordul și vă vom furniza o copie
              semnată electronic.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-rose-gold text-white px-4 py-2 rounded-lg hover:bg-rose-gold/90 transition-colors"
            >
              <FileText size={16} />
              Contactează-ne pentru DPA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
