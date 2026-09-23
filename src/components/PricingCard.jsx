import { Check, X } from "lucide-react";

export default function PricingCard({ plan, onSelect, loading }) {
  const isPopular = plan.id === "gold";

  return (
    <div
      className={`
      relative glass rounded-2xl overflow-hidden
      transition-all duration-300 hover:scale-[1.02] hover:shadow-gold-lg
      ${isPopular ? "ring-2 ring-rose-gold shadow-gold-lg" : "shadow-card"}
    `}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <span
            className="bg-gradient-to-r from-rose-gold to-[#6F5827] text-white
            text-[10px] font-semibold font-sans tracking-widest uppercase
            px-4 py-1 rounded-b-lg"
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className={`p-6 ${plan.badge ? "pt-9" : ""}`}>
        {/* Header */}
        <div className="text-center mb-5">
          <div
            className={`
            w-14 h-14 rounded-full bg-gradient-to-br ${plan.color}
            flex items-center justify-center mx-auto mb-3 shadow-md text-2xl
          `}
          >
            {plan.emoji}
          </div>
          <h3 className="font-serif text-2xl font-semibold text-charcoal">
            {plan.name}
          </h3>
          <div className="mt-2">
            {plan.originalPrice && (
              <span className="text-taupe/60 line-through text-lg mr-2 font-sans font-medium">
                {plan.originalPrice} RON
              </span>
            )}
            <span className="font-serif text-4xl font-light text-charcoal">
              {plan.price === 0 ? "Gratuit" : plan.price}
            </span>
            {plan.price > 0 && (
              <span className="text-taupe text-sm font-sans"> RON</span>
            )}
          </div>
          <p className="text-taupe text-xs font-sans mt-1">per eveniment</p>
        </div>

        {/* Divider */}
        <div className="gold-divider my-4" />

        {/* Features included */}
        <ul className="space-y-2.5 mb-4">
          {plan.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm font-sans text-charcoal/80"
            >
              <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
          {plan.missing.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm font-sans text-taupe/50 line-through"
            >
              <X size={15} className="text-taupe/30 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onSelect(plan.id)}
          disabled={loading}
          className={`
            w-full py-3 rounded-xl font-sans font-semibold text-sm
            bg-gradient-to-r ${plan.color} text-white
            shadow-md hover:opacity-90 active:scale-95
            transition-all duration-200 disabled:opacity-50
          `}
        >
          {loading ? "Se procesează..." : `Alege ${plan.name}`}
        </button>
      </div>
    </div>
  );
}
