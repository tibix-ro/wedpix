import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Image,
  Trash2,
  Shield,
  ShieldOff,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Loader2,
  BarChart3,
  HardDrive,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  ExternalLink,
  PlusCircle,
  Save,
  X,
  Settings,
  Video,
  Archive,
  Projector,
} from "lucide-react";
import API from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("ro-RO").format(n);
const fmtBytes = (b) => {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ro-RO") : "—");
const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const PLAN_COLORS = {
  demo: "bg-gray-100 text-gray-600",
  silver: "bg-blue-50 text-blue-700",
  gold: "bg-amber-50 text-amber-700",
  platinum: "bg-purple-50 text-purple-700",
};
const STATUS_COLORS = {
  active: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  expired: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

function Badge({ label, colorClass }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

// Extra add-ons that can be granted per subscription on top of the plan
const EXTRAS = [
  { key: "extra_video", label: "Video", icon: Video },
  { key: "extra_zip", label: "Download ZIP", icon: Archive },
  { key: "extra_slideshow", label: "Slideshow", icon: Projector },
];

function ExtraToggle({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm w-full transition-colors ${
        checked
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
    >
      <Icon size={15} />
      <span className="flex-1 text-left">{label}</span>
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-amber-500" : "bg-gray-200"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-4" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

function ExtraPills({ sub }) {
  const active = EXTRAS.filter((e) => sub[e.key]);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {active.map((e) => (
        <span
          key={e.key}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-medium"
        >
          <e.icon size={10} /> {e.label}
        </span>
      ))}
      {sub.extra_validity_days > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-medium">
          <Calendar size={10} /> +{sub.extra_validity_days} zile
        </span>
      )}
      {sub.extra_photo_limit > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-medium">
          <HardDrive size={10} /> +{sub.extra_photo_limit} poze
        </span>
      )}
    </div>
  );
}

function QuantityStepper({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
  step = 1,
  max = 999,
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm w-full">
      <Icon size={15} className="text-gray-400 shrink-0" />
      <div className="flex-1">
        <p className="text-gray-700">{label}</p>
        {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - step))}
          className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-gray-700 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Pagination({ page, lastPage, onChange }) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-500">
        Pagina {page} din {lastPage}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === lastPage}
        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Stats Tab ────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/admin/stats.php")
      .then(({ data }) => setStats(data.stats))
      .catch(() => setError("Eroare la încărcarea statisticilor."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-amber-600" size={32} />
      </div>
    );
  if (error) return <div className="text-red-500 p-6">{error}</div>;
  if (!stats) return null;

  const cards = [
    {
      label: "Utilizatori",
      value: fmt(stats.total_users),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Abonamente active",
      value: fmt(stats.active_subscriptions),
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Evenimente",
      value: fmt(stats.total_events),
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Fotografii",
      value: fmt(stats.total_images),
      icon: Image,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Venituri totale",
      value: `${fmt(stats.total_revenue_ron)} RON`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Stocare utilizată",
      value: fmtBytes(stats.storage_bytes),
      icon: HardDrive,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}
              >
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 size={18} /> Abonamente active pe plan
        </h3>
        <div className="flex gap-4 flex-wrap">
          {["silver", "gold", "platinum", "demo"].map((p) => (
            <div key={p} className="flex items-center gap-2">
              <Badge label={p} colorClass={PLAN_COLORS[p]} />
              <span className="font-semibold text-gray-700">
                {fmt(stats.active_by_plan?.[p] || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={18} /> Utilizatori recenți
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b">
                <th className="pb-2 text-left font-medium">Nume</th>
                <th className="pb-2 text-left font-medium">Email</th>
                <th className="pb-2 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-2 font-medium text-gray-800">{u.name}</td>
                  <td className="py-2 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-2 text-gray-400 text-xs">
                    {fmtDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent subscriptions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={18} /> Abonamente recente
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b">
                <th className="pb-2 text-left font-medium">User</th>
                <th className="pb-2 text-left font-medium">Plan</th>
                <th className="pb-2 text-right font-medium">RON</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_subscriptions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-2 text-gray-700 text-xs">{s.user_name}</td>
                  <td className="py-2">
                    <Badge label={s.plan} colorClass={PLAN_COLORS[s.plan]} />
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-800">
                    {s.price_ron}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activateModal, setActivateModal] = useState(null); // {userId, userName}
  const [activatePlan, setActivatePlan] = useState("gold");
  const [activateExtras, setActivateExtras] = useState({
    extra_video: false,
    extra_zip: false,
    extra_slideshow: false,
    extra_validity_days: 0,
    extra_photo_limit: 0,
  });
  const [activating, setActivating] = useState(false);

  const load = useCallback(
    async (p = 1, q = query) => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/users.php", {
          params: { page: p, search: q },
        });
        setUsers(data.users);
        setTotal(data.total);
        setPage(data.page);
        setLastPage(data.last_page);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
    load(1, search);
  };

  const deleteUser = async (id, name) => {
    if (
      !window.confirm(
        `Ștergi utilizatorul "${name}"? Acțiunea este ireversibilă.`,
      )
    )
      return;
    await API.delete(`/admin/users.php?id=${id}`);
    load(page);
  };

  const toggleAdmin = async (id, current) => {
    await API.patch("/admin/users.php", { id, is_admin: !current });
    load(page);
  };

  const activateSubscription = async () => {
    if (!activateModal) return;
    setActivating(true);
    try {
      await API.post("/admin/subscriptions.php", {
        user_id: activateModal.userId,
        plan: activatePlan,
        ...activateExtras,
      });
      setActivateModal(null);
      setActivateExtras({
        extra_video: false,
        extra_zip: false,
        extra_slideshow: false,
        extra_validity_days: 0,
        extra_photo_limit: 0,
      });
      load(page);
    } catch (err) {
      alert(err.response?.data?.error || "Eroare la activarea abonamentului.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume sau email…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            type="submit"
            className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
          >
            <Search size={16} />
          </button>
        </form>
        <span className="text-sm text-gray-400 ml-auto">
          {fmt(total)} utilizatori
        </span>
      </div>

      {/* Activate Subscription Modal */}
      {activateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Activează / actualizează abonament
              </h3>
              <button
                onClick={() => setActivateModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Utilizator:{" "}
              <span className="font-medium text-gray-700">
                {activateModal.userName}
              </span>
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Dacă utilizatorul are deja un abonament activ, acesta va fi
              actualizat (nu se creează unul nou).
            </p>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Plan
            </label>
            <select
              value={activatePlan}
              onChange={(e) => setActivatePlan(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="demo">Demo (2 ore)</option>
              <option value="silver">Silver — 49 RON (3 zile)</option>
              <option value="gold">Gold — 149 RON (30 zile)</option>
              <option value="platinum">Platinum — 299 RON (365 zile)</option>
            </select>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Extra-opțiuni
            </label>
            <div className="space-y-2 mb-5">
              {EXTRAS.map((ex) => (
                <ExtraToggle
                  key={ex.key}
                  icon={ex.icon}
                  label={ex.label}
                  checked={activateExtras[ex.key]}
                  onChange={(v) =>
                    setActivateExtras((f) => ({ ...f, [ex.key]: v }))
                  }
                />
              ))}
              <QuantityStepper
                icon={Calendar}
                label="Extra valabilitate"
                hint="+7 zile per unitate"
                value={activateExtras.extra_validity_days}
                step={7}
                onChange={(v) =>
                  setActivateExtras((f) => ({ ...f, extra_validity_days: v }))
                }
              />
              <QuantityStepper
                icon={HardDrive}
                label="Extra stocare"
                hint="+100 poze per unitate"
                value={activateExtras.extra_photo_limit}
                step={100}
                onChange={(v) =>
                  setActivateExtras((f) => ({ ...f, extra_photo_limit: v }))
                }
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActivateModal(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                onClick={activateSubscription}
                disabled={activating}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {activating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Activează
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-600" size={28} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Nume",
                  "Email",
                  "Plan activ",
                  "Evenimente",
                  "Fotografii",
                  "Înregistrat",
                  "Admin",
                  "Acțiuni",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.active_plan ? (
                      <Badge
                        label={u.active_plan}
                        colorClass={PLAN_COLORS[u.active_plan]}
                      />
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.event_count}</td>
                  <td className="px-4 py-3 text-gray-600">{u.image_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <Badge
                        label="Admin"
                        colorClass="bg-amber-50 text-amber-700"
                      />
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setActivateModal({ userId: u.id, userName: u.name })
                        }
                        title="Activează abonament manual"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-600"
                      >
                        <PlusCircle size={15} />
                      </button>
                      <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        title={u.is_admin ? "Revocă admin" : "Promovează admin"}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700"
                      >
                        {u.is_admin ? (
                          <ShieldOff size={15} />
                        ) : (
                          <Shield size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        lastPage={lastPage}
        onChange={(p) => {
          setPage(p);
          load(p);
        }}
      />
    </div>
  );
}

// ── Subscriptions Tab ────────────────────────────────────────
function SubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [editSub, setEditSub] = useState(null);
  const [editForm, setEditForm] = useState({
    plan: "gold",
    extra_video: false,
    extra_zip: false,
    extra_slideshow: false,
    extra_validity_days: 0,
    extra_photo_limit: 0,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(
    async (p = 1, status = filterStatus, plan = filterPlan) => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/subscriptions.php", {
          params: { page: p, status, plan },
        });
        setSubs(data.subscriptions);
        setTotal(data.total);
        setPage(data.page);
        setLastPage(data.last_page);
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, filterPlan],
  );

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await API.patch("/admin/subscriptions.php", { id, status });
    load(page);
  };

  const deleteSub = async (sub) => {
    if (
      !window.confirm(
        `Ștergi acest abonament (${sub.plan}) al utilizatorului ${sub.user_name}? Acțiunea este ireversibilă.`,
      )
    )
      return;
    try {
      await API.delete(`/admin/subscriptions.php?id=${sub.id}`);
      load(page);
    } catch (err) {
      alert(err.response?.data?.error || "Eroare la ștergerea abonamentului.");
    }
  };

  const openEdit = (sub) => {
    setEditForm({
      plan: sub.plan,
      extra_video: !!sub.extra_video,
      extra_zip: !!sub.extra_zip,
      extra_slideshow: !!sub.extra_slideshow,
      extra_validity_days: sub.extra_validity_days || 0,
      extra_photo_limit: sub.extra_photo_limit || 0,
    });
    setEditSub(sub);
  };

  const saveEdit = async () => {
    if (!editSub) return;
    setSavingEdit(true);
    try {
      await API.patch("/admin/subscriptions.php", {
        id: editSub.id,
        plan: editForm.plan,
        extra_video: editForm.extra_video,
        extra_zip: editForm.extra_zip,
        extra_slideshow: editForm.extra_slideshow,
        extra_validity_days: editForm.extra_validity_days,
        extra_photo_limit: editForm.extra_photo_limit,
      });
      setEditSub(null);
      load(page);
    } catch (err) {
      alert(err.response?.data?.error || "Eroare la salvarea abonamentului.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      {/* Edit subscription modal (upgrade/downgrade + extras) */}
      {editSub && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Modifică abonamentul
              </h3>
              <button
                onClick={() => setEditSub(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Utilizator:{" "}
              <span className="font-medium text-gray-700">
                {editSub.user_name}
              </span>
            </p>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Plan (upgrade / downgrade)
            </label>
            <select
              value={editForm.plan}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, plan: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="demo">Demo (2 ore)</option>
              <option value="silver">Silver — 49 RON (3 zile)</option>
              <option value="gold">Gold — 149 RON (30 zile)</option>
              <option value="platinum">Platinum — 299 RON (365 zile)</option>
            </select>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Extra-opțiuni
            </label>
            <div className="space-y-2 mb-5">
              {EXTRAS.map((ex) => (
                <ExtraToggle
                  key={ex.key}
                  icon={ex.icon}
                  label={ex.label}
                  checked={editForm[ex.key]}
                  onChange={(v) => setEditForm((f) => ({ ...f, [ex.key]: v }))}
                />
              ))}
              <QuantityStepper
                icon={Calendar}
                label="Extra valabilitate"
                hint="+7 zile per unitate"
                value={editForm.extra_validity_days}
                step={7}
                onChange={(v) =>
                  setEditForm((f) => ({ ...f, extra_validity_days: v }))
                }
              />
              <QuantityStepper
                icon={HardDrive}
                label="Extra stocare"
                hint="+100 poze per unitate"
                value={editForm.extra_photo_limit}
                step={100}
                onChange={(v) =>
                  setEditForm((f) => ({ ...f, extra_photo_limit: v }))
                }
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditSub(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingEdit ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Salvează
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            load(1, e.target.value, filterPlan);
          }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Toate statusurile</option>
          {["active", "pending", "expired", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterPlan}
          onChange={(e) => {
            setFilterPlan(e.target.value);
            load(1, filterStatus, e.target.value);
          }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">Toate planurile</option>
          {["demo", "silver", "gold", "platinum"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          onClick={() => load(page)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
        >
          <RefreshCcw size={15} />
        </button>
        <span className="text-sm text-gray-400 ml-auto">
          {fmt(total)} abonamente
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-600" size={28} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Utilizator",
                  "Plan",
                  "Status",
                  "Preț RON",
                  "Început",
                  "Expiră",
                  "Acțiuni",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">
                      {s.user_name}
                    </div>
                    <div className="text-xs text-gray-400">{s.user_email}</div>
                    {s.event_name && (
                      <div className="text-xs text-amber-600 mt-0.5">
                        📅 {s.event_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={s.plan} colorClass={PLAN_COLORS[s.plan]} />
                    <ExtraPills sub={s} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={s.status}
                      colorClass={STATUS_COLORS[s.status]}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {s.price_ron}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtDate(s.started_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtDate(s.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        title="Modifică plan și extra-opțiuni"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-300 hover:text-amber-600"
                      >
                        <Settings size={15} />
                      </button>
                      {s.status !== "active" && (
                        <button
                          onClick={() => updateStatus(s.id, "active")}
                          title="Activează"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-600"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {s.status === "active" && (
                        <button
                          onClick={() => updateStatus(s.id, "cancelled")}
                          title="Anulează"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                      {s.event_count === 0 && (
                        <button
                          onClick={() => deleteSub(s)}
                          title="Șterge abonamentul (fără eveniment atașat)"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        lastPage={lastPage}
        onChange={(p) => {
          setPage(p);
          load(p);
        }}
      />
    </div>
  );
}

// ── Events Tab ───────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expiryDrafts, setExpiryDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(
    async (p = 1, q = query) => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/events.php", {
          params: { page: p, search: q },
        });
        setEvents(data.events);
        setExpiryDrafts((current) => ({
          ...current,
          ...Object.fromEntries(
            data.events.map((event) => [
              event.id,
              toDateTimeLocal(event.expires_at),
            ]),
          ),
        }));
        setTotal(data.total);
        setPage(data.page);
        setLastPage(data.last_page);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
    load(1, search);
  };

  const deleteEvent = async (id, name) => {
    if (
      !window.confirm(`Ștergi evenimentul "${name}" și toate fotografiile lui?`)
    )
      return;
    await API.delete(`/admin/events.php?id=${id}`);
    load(page);
  };

  const updateExpiry = async (event) => {
    const expiresAt = expiryDrafts[event.id];
    if (!expiresAt) return;

    setSavingId(event.id);
    try {
      await API.patch("/admin/events.php", {
        id: event.id,
        expires_at: expiresAt,
      });
      await load(page);
    } catch (error) {
      window.alert(
        error.response?.data?.error ||
          "Data expirării nu a putut fi actualizată.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută eveniment sau user…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            type="submit"
            className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
          >
            <Search size={16} />
          </button>
        </form>
        <span className="text-sm text-gray-400 ml-auto">
          {fmt(total)} evenimente
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-600" size={28} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Eveniment",
                  "Utilizator",
                  "Plan",
                  "Fotografii",
                  "Stocare",
                  "Status",
                  "Expiră",
                  "Acțiuni",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{ev.name}</div>
                    <div className="text-xs text-gray-400">
                      /event/{ev.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{ev.user_name}</div>
                    <div className="text-xs text-gray-400">{ev.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={ev.plan} colorClass={PLAN_COLORS[ev.plan]} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ev.image_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtBytes(ev.storage_bytes)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={ev.status}
                      colorClass={
                        STATUS_COLORS[ev.status] || "bg-gray-100 text-gray-500"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="datetime-local"
                        value={expiryDrafts[ev.id] || ""}
                        onChange={(e) =>
                          setExpiryDrafts((current) => ({
                            ...current,
                            [ev.id]: e.target.value,
                          }))
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        aria-label={`Data expirării pentru ${ev.name}`}
                      />
                      <button
                        onClick={() => updateExpiry(ev)}
                        disabled={savingId === ev.id || !expiryDrafts[ev.id]}
                        title="Salvează data expirării"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-600 disabled:opacity-30"
                      >
                        {savingId === ev.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={`/event/${ev.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => deleteEvent(ev.id, ev.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        lastPage={lastPage}
        onChange={(p) => {
          setPage(p);
          load(p);
        }}
      />
    </div>
  );
}

// ── Images Tab ───────────────────────────────────────────────
function ImagesTab() {
  const [images, setImages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/images.php", {
        params: { page: p },
      });
      setImages(data.images);
      setTotal(data.total);
      setPage(data.page);
      setLastPage(data.last_page);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxUrl]);

  const deleteImage = async (id, name) => {
    if (!window.confirm(`Ștergi fotografia "${name}"?`)) return;
    await API.delete(`/admin/images.php?id=${id}`);
    load(page);
  };

  const toggleHide = async (id) => {
    try {
      const { data } = await API.patch(`/admin/images.php?id=${id}`);
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, is_hidden: data.is_hidden } : img,
        ),
      );
    } catch {
      alert("Eroare la modificarea vizibilității.");
    }
  };

  return (
    <div>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors text-xl"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-400">{fmt(total)} fotografii</span>
        <button
          onClick={() => load(page)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
        >
          <RefreshCcw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-600" size={28} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Preview",
                  "Fișier",
                  "Eveniment",
                  "Încărcat de",
                  "Dimensiune",
                  "❤ Like-uri",
                  "Status",
                  "Data",
                  "Acțiuni",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {images.map((img) => (
                <tr key={img.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2">
                    {!img.is_video ? (
                      <img
                        src={img.url}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg cursor-zoom-in hover:opacity-80 transition-opacity"
                        loading="lazy"
                        onClick={() => setLightboxUrl(img.url)}
                        title="Click pentru a mări"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        VIDEO
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700 max-w-[140px] truncate">
                      {img.original_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {img.width && img.height
                        ? `${img.width}×${img.height}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/event/${img.event_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 hover:underline text-xs"
                    >
                      {img.event_name}
                    </a>
                    <div className="text-xs text-gray-400">{img.user_name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {img.uploader_name}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtBytes(img.size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${img.likes_count > 0 ? "text-red-500" : "text-gray-300"}`}
                    >
                      ❤ {img.likes_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {img.is_hidden ? (
                      <Badge
                        label="Ascunsă"
                        colorClass="bg-gray-100 text-gray-500"
                      />
                    ) : (
                      <Badge
                        label="Vizibilă"
                        colorClass="bg-green-50 text-green-600"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {fmtDate(img.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHide(img.id)}
                        title={img.is_hidden ? "Afișează" : "Ascunde"}
                        className={`p-1.5 rounded-lg transition-colors ${img.is_hidden ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "hover:bg-gray-100 text-gray-300 hover:text-amber-500"}`}
                      >
                        {img.is_hidden ? (
                          <Eye size={15} />
                        ) : (
                          <EyeOff size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteImage(img.id, img.original_name)}
                        title="Șterge definitiv"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        lastPage={lastPage}
        onChange={(p) => {
          setPage(p);
          load(p);
        }}
      />
    </div>
  );
}

// ── Main AdminPanel ──────────────────────────────────────────
const TABS = [
  { id: "stats", label: "Statistici", icon: LayoutDashboard },
  { id: "users", label: "Utilizatori", icon: Users },
  { id: "subscriptions", label: "Abonamente", icon: CreditCard },
  { id: "events", label: "Evenimente", icon: Calendar },
  { id: "images", label: "Fotografii", icon: Image },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("stats");
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-shrink-0 flex-col">
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Admin Panel
          </p>
          <p className="text-sm text-gray-600 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <ChevronLeft size={17} /> Înapoi la Dashboard
          </button>
        </div>
      </aside>

      {/* Top bar + scrollable tabs (mobile) */}
      <div className="lg:hidden sticky top-16 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Admin Panel
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft size={15} /> Dashboard
          </button>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
          {TABS.find((t) => t.id === activeTab)?.label}
        </h1>
        <p className="text-sm text-gray-400 mb-6 sm:mb-8">
          WedPix Admin — gestionare platformă
        </p>

        {activeTab === "stats" && <StatsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "events" && <EventsTab />}
        {activeTab === "images" && <ImagesTab />}
      </main>
    </div>
  );
}
