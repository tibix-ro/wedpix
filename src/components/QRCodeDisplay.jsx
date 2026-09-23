import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function QRCodeDisplay({ url, eventName }) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    // Convert SVG to PNG via canvas
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url2 = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FDF8F0";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 56, 56, 400, 400);
      URL.revokeObjectURL(url2);
      const link = document.createElement("a");
      link.download = `QR_${eventName.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url2;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR */}
      <div
        ref={svgRef}
        className="p-4 bg-white rounded-2xl shadow-card border border-rose-gold/15"
      >
        <QRCodeSVG
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#3D3535"
          level="M"
          includeMargin={false}
        />
      </div>

      {/* URL */}
      <div className="w-full bg-cream rounded-xl border border-rose-gold/20 px-3 py-2 flex items-center gap-2">
        <span className="flex-1 text-xs font-mono text-charcoal/70 truncate">
          {url}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-taupe hover:text-rose-gold transition-colors"
          title="Copiază link"
        >
          {copied ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>

      {/* Actions */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 text-xs font-semibold font-sans
          bg-gradient-to-r from-rose-gold to-[#6F5827] text-white
          px-4 py-2 rounded-xl shadow-gold hover:shadow-gold-lg
          hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Download size={13} /> Descarcă QR Code (PNG)
      </button>
    </div>
  );
}
