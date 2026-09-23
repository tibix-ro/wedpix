import { useState, useCallback, useRef } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import {
  Upload,
  ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2000,
  useWebWorker: false, // blob: workers blocked by server CSP; main-thread is fine
  fileType: "image/jpeg",
  initialQuality: 0.85,
};

// ── Get CSRF token ────────────────────────────────────────────
async function getCSRFToken() {
  let token = sessionStorage.getItem("wedpix_csrf_token");
  if (token) return token;

  try {
    const res = await axios.get(`${API_URL}/csrf-token.php`);
    token = res.data?.csrf_token;
    if (token) {
      sessionStorage.setItem("wedpix_csrf_token", token);
      return token;
    }
  } catch (err) {
    console.error("[CSRF] Failed to fetch token:", err?.message ?? err);
  }
  return null;
}

// ── Status icon ───────────────────────────────────────────────
function StatusIcon({ status, progress }) {
  if (status === "compressing")
    return (
      <Loader2
        size={15}
        className="animate-spin-slow text-rose-gold shrink-0"
      />
    );
  if (status === "uploading")
    return (
      <span className="text-[11px] font-medium text-rose-gold shrink-0 w-7 text-right">
        {progress}%
      </span>
    );
  if (status === "success")
    return <CheckCircle size={15} className="text-emerald-500 shrink-0" />;
  if (status === "error")
    return <AlertCircle size={15} className="text-red-400 shrink-0" />;
  return (
    <Loader2 size={15} className="animate-spin-slow text-taupe/40 shrink-0" />
  );
}

// ── Single file row ───────────────────────────────────────────
function FileRow({ item }) {
  const { file, preview, status, progress, error } = item;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-rose-gold/10 last:border-0 animate-fade-in">
      {/* Thumbnail */}
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-cream border border-rose-gold/15 shrink-0">
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full skeleton" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-charcoal truncate font-sans">
          {file.name}
        </p>
        {status === "compressing" && (
          <p className="text-[11px] text-taupe mt-0.5 font-sans">
            Se optimizează imaginea...
          </p>
        )}
        {status === "uploading" && (
          <div className="mt-1.5">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {status === "success" && (
          <p className="text-[11px] text-emerald-600 mt-0.5 font-sans">
            Încărcată cu succes
          </p>
        )}
        {status === "error" && (
          <p className="text-[11px] text-red-500 mt-0.5 font-sans truncate">
            {error}
          </p>
        )}
        {status === "pending" && (
          <p className="text-[11px] text-taupe mt-0.5 font-sans">
            În așteptare...
          </p>
        )}
      </div>

      <StatusIcon status={status} progress={progress} />
    </div>
  );
}

// ── Main Uploader ─────────────────────────────────────────────
export default function Uploader({
  eventId,
  guestName,
  planInfo,
  photoCount,
  expiresAt,
  onSuccess,
  onError,
}) {
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  // ── Check if uploads should be disabled ──────────────────────
  const isLimitReached =
    planInfo?.photo_limit && photoCount >= planInfo.photo_limit;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const canUpload = !isLimitReached && !isExpired;

  // ── Update a single item by id ────────────────────────────
  const updateItem = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  }, []);

  // ── Process files ─────────────────────────────────────────
  const processFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length || busy) return;
      setBusy(true);

      const newItems = Array.from(fileList).map((file, idx) => ({
        id: Date.now() + idx,
        file,
        preview: null,
        status: "pending", // pending | compressing | uploading | success | error
        progress: 0,
        error: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Generate previews (images only — video has no data-URL thumbnail)
      for (const item of newItems) {
        if (item.file.type.startsWith("video/")) continue;
        const reader = new FileReader();
        reader.onload = (e) =>
          updateItem(item.id, { preview: e.target.result });
        reader.readAsDataURL(item.file);
      }

      // Process each file sequentially
      let anySuccess = false;
      for (const item of newItems) {
        try {
          const isVideoFile = item.file.type.startsWith("video/");

          // Client-side video size guard (mirrors server limit)
          if (isVideoFile) {
            const limitMb = planInfo?.max_video_mb || 200;
            if (item.file.size > limitMb * 1024 * 1024) {
              const msg = `Videoclipul este prea mare (max ${limitMb} MB).`;
              updateItem(item.id, { status: "error", error: msg });
              onError(msg);
              continue;
            }
          }

          // 1. Compress images only (never re-encode video)
          let compressed = item.file;
          if (!isVideoFile) {
            updateItem(item.id, { status: "compressing" });
            try {
              compressed = await imageCompression(
                item.file,
                COMPRESSION_OPTIONS,
              );
            } catch {
              // Compression failed – use original
              compressed = item.file;
            }
          }

          // 2. Upload
          updateItem(item.id, { status: "uploading", progress: 0 });
          const formData = new FormData();
          formData.append("photo", compressed, item.file.name);
          formData.append("uploader_name", guestName);
          formData.append("event_id", eventId);

          // Fetch CSRF token for upload
          const csrfToken = await getCSRFToken();
          const headers = { "Content-Type": "multipart/form-data" };
          if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
          }

          const res = await axios.post(
            `${API_URL}/images/upload.php`,
            formData,
            {
              headers,
              onUploadProgress: (evt) => {
                if (evt.total) {
                  const pct = Math.round((evt.loaded / evt.total) * 100);
                  updateItem(item.id, { progress: pct });
                }
              },
            },
          );

          updateItem(item.id, { status: "success", progress: 100 });
          anySuccess = true;
          if (res.data?.image) {
            onSuccess?.(res.data.image);
          } else {
            onSuccess?.();
          }
        } catch (err) {
          const msg =
            err?.response?.data?.error || "A apărut o eroare la upload.";
          updateItem(item.id, { status: "error", error: msg });
          onError(msg);
        }
      }

      setBusy(false);
    },
    [busy, guestName, planInfo, updateItem, onSuccess, onError],
  );

  // ── Drag & drop handlers ───────────────────────────────────
  const onDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const onDragOver = (e) => {
    e.preventDefault();
  };
  const onDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // ── Clear completed items ─────────────────────────────────
  const clearDone = () => {
    setItems((prev) =>
      prev.filter(
        (it) =>
          it.type === "uploading" ||
          it.status === "compressing" ||
          it.status === "pending",
      ),
    );
  };

  const hasItems = items.length > 0;
  const doneCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <section className="mt-6">
      <div className="text-center mb-5">
        <h2 className="font-serif text-3xl font-light text-charcoal mb-1">
          Adaugă fotografii
        </h2>
        <p className="text-sm text-taupe font-sans">
          Imaginile sunt optimizate automat înainte de upload
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 glass ${dragging ? "drag-over" : ""} ${!canUpload ? "opacity-75" : ""}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={canUpload ? onDrop : undefined}
        onClick={() => canUpload && !busy && inputRef.current?.click()}
        role="button"
        tabIndex={canUpload ? 0 : -1}
        onKeyDown={(e) =>
          canUpload && e.key === "Enter" && !busy && inputRef.current?.click()
        }
        aria-label={
          canUpload
            ? "Zona de drag and drop pentru fotografii"
            : "Upload dezactivat"
        }
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={planInfo?.video ? "image/*,video/*" : "image/*"}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
          disabled={busy}
        />

        <div
          className={`transition-transform duration-200 ${dragging ? "scale-110" : ""}`}
        >
          {isExpired ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 border-2 border-red-200">
                <AlertCircle size={26} className="text-red-500" />
              </div>
              <p className="font-sans font-medium text-red-600 text-sm mb-1">
                Eveniment expirat
              </p>
              <p className="text-xs text-red-500/80 font-sans">
                Acest eveniment nu mai acceptă fotografii noi
              </p>
            </>
          ) : isLimitReached ? (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 border-2 border-amber-200">
                <AlertCircle size={26} className="text-amber-500" />
              </div>
              <p className="font-sans font-medium text-amber-600 text-sm mb-1">
                Limită atinsă
              </p>
              <p className="text-xs text-amber-600/80 font-sans">
                {photoCount} / {planInfo.photo_limit} fotografii încărcate
              </p>
              <p className="text-[11px] text-taupe/60 mt-2 font-sans">
                Contactează organizatorul pentru upgrade
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blush to-rose-gold/20 flex items-center justify-center mx-auto mb-3 border-2 border-rose-gold/25">
                {dragging ? (
                  <Upload size={26} className="text-rose-gold animate-bounce" />
                ) : (
                  <Camera size={26} className="text-rose-gold" />
                )}
              </div>

              <p className="font-sans font-medium text-charcoal text-sm mb-1">
                {dragging
                  ? "Eliberează pentru a încărca"
                  : "Trage fotografiile aici"}
              </p>
              <p className="text-xs text-taupe font-sans">sau</p>

              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="
                  mt-3 inline-flex items-center gap-2
                  bg-gradient-to-r from-rose-gold to-gold-light
                  text-white text-sm font-medium font-sans
                  px-5 py-2.5 rounded-xl shadow-gold
                  transition-all duration-200
                  hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                "
              >
                <Sparkles size={14} />
                Selectează fotografii
              </button>

              <p className="text-[11px] text-taupe/60 mt-3 font-sans">
                JPEG, PNG, WebP, HEIC · max {planInfo?.max_mb || 5} MB/fișier
                {planInfo?.video && (
                  <> · Video MP4/MOV · max {planInfo?.max_video_mb || 200} MB</>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {/* File list */}
      {hasItems && (
        <div className="mt-4 glass rounded-2xl p-4 shadow-card animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-sans text-taupe">
              <ImageIcon size={13} />
              <span>
                {doneCount}/{items.length} încărcate
                {errorCount > 0 && (
                  <span className="text-red-400 ml-1">
                    · {errorCount} erori
                  </span>
                )}
              </span>
            </div>
            {!busy && (
              <button
                onClick={clearDone}
                className="text-[11px] text-taupe hover:text-rose-gold transition-colors font-sans flex items-center gap-1"
              >
                <X size={11} />
                Șterge lista
              </button>
            )}
          </div>

          {/* Rows */}
          <div className="divide-y divide-rose-gold/10">
            {items.map((item) => (
              <FileRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
