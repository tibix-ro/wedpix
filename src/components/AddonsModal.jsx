import { useMemo, useState } from "react";
import { X, Loader2, Check, Sparkles } from "lucide-react";
import { ADDONS } from "../utils/plans.js";

const TOGGLE_KEYS = ["zip", "slideshow", "video"];

export default function AddonsModal({ plan, onClose, onConfirm, loading }) {
  const [selected, setSelected] = useState({
    zip: false,
    slideshow: false,
    video: false,
  });
  const [validityUnits, setValidityUnits] = useState(0);
  const [storageUnits, setStorageUnits] = useState(0);

  const total = useMemo(() => {
    let sum = plan.price;
    TOGGLE_KEYS.forEach((key) => {
      if (!plan[key] && selected[key]) sum += ADDONS[key].price;
    });
    sum += validityUnits * ADDONS.extra_validity.price;
    sum += storageUnits * ADDONS.extra_storage.price;
    return sum;
  }, [plan, selected, validityUnits, storageUnits]);

  const handleConfirm = () => {
    onConfirm({
      zip: selected.zip,
      slideshow: selected.slideshow,
      video: selected.video,
      extra_validity_units: validityUnits,
      extra_storage_units: storageUnits,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl shadow-card border border-white/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-rose-gold/15">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-rose-gold font-medium mb-1">
              {plan.emoji} {plan.name}
            </p>
            <h2 className="text-xl font-serif text-charcoal">Extra-opțiuni</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-rose-gold/10 flex items-center justify-center text-taupe hover:text-charcoal transition-colors"
            aria-label="Închide"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {TOGGLE_KEYS.map((key) => {
            const addon = ADDONS[key];
            if (plan[key]) {
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm"
                >
                  <Check size={15} className="shrink-0" />
                  <span className="flex-1">{addon.name}</span>
                  <span className="text-xs font-medium">Inclus</span>
                </div>
              );
            }
            const checked = selected[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [key]: !s[key] }))}
                aria-pressed={checked}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  checked
                    ? "border-rose-gold/50 bg-rose-gold/10 text-charcoal"
                    : "border-rose-gold/15 text-charcoal/70 hover:bg-rose-gold/5"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-md border shrink-0 flex items-center justify-center ${
                    checked
                      ? "bg-rose-gold border-rose-gold"
                      : "border-taupe/40"
                  }`}
                >
                  {checked && <Check size={11} className="text-white" />}
                </span>
                <span className="flex-1 text-left">{addon.name}</span>
                <span className="text-xs font-semibold">
                  +{addon.price} RON
                </span>
              </button>
            );
          })}

          <QuantityRow
            label={ADDONS.extra_validity.name}
            hint={`+${ADDONS.extra_validity.unitDays} zile per unitate`}
            price={ADDONS.extra_validity.price}
            value={validityUnits}
            max={ADDONS.extra_validity.maxUnits}
            onChange={setValidityUnits}
          />

          {plan.photoLimit !== null && (
            <QuantityRow
              label={ADDONS.extra_storage.name}
              hint={`+${ADDONS.extra_storage.unitPhotos} poze per unitate`}
              price={ADDONS.extra_storage.price}
              value={storageUnits}
              max={ADDONS.extra_storage.maxUnits}
              onChange={setStorageUnits}
            />
          )}
        </div>

        <div className="px-6 py-5 border-t border-rose-gold/15 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-taupe">Total de plată</span>
            <span className="font-serif text-2xl text-charcoal">
              {total} RON
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-rose-gold/20 text-sm text-taupe hover:bg-rose-gold/5 transition-colors"
            >
              Înapoi
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-gold to-amber-500 text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              Continuă spre plată
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuantityRow({ label, hint, price, value, max, onChange }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-rose-gold/15">
      <div className="flex-1">
        <p className="text-sm text-charcoal/80">{label}</p>
        <p className="text-[11px] text-taupe">
          {hint} · +{price} RON/unitate
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-lg bg-blush/50 text-charcoal hover:bg-blush flex items-center justify-center"
          aria-label={`Scade ${label}`}
        >
          −
        </button>
        <span className="w-6 text-center font-semibold text-charcoal tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-lg bg-blush/50 text-charcoal hover:bg-blush flex items-center justify-center"
          aria-label={`Crește ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
