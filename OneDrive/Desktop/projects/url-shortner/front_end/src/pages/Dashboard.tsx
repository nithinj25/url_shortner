import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  Link2, Moon, Sun, Copy, Trash2, BarChart2,
  Power, QrCode, X, Plus, ChevronLeft, ChevronRight,
  MousePointerClick, Globe, TrendingUp, Hash,
} from "lucide-react";
import { urlsApi } from "../api/urls";
import { analyticsApi } from "../api/analytics";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { type UrlItem } from "../types";

const BASE_URL = "http://localhost:5000";

// ── Helpers ────────────────────────────────────────────────

function isExpired(item: UrlItem) {
  return !!item.expiresAt && new Date(item.expiresAt) < new Date();
}

function StatusBadge({ item }: { item: UrlItem }) {
  if (isExpired(item))
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 uppercase">
        Expired
      </span>
    );
  if (!item.isActive)
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 uppercase">
        Paused
      </span>
    );
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase">
      <span className="w-1 h-1 rounded-full bg-emerald-500" />
      Live
    </span>
  );
}

// ── QR Modal ───────────────────────────────────────────────

function QRModal({ url, onClose }: { url: UrlItem; onClose: () => void }) {
  const shortUrl = `${BASE_URL}/${url.shortCode}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-2xl flex flex-col items-center gap-5 w-72 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">QR Code</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">/{url.shortCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-white rounded-xl border border-gray-100 dark:border-gray-700">
          <QRCodeSVG value={shortUrl} size={160} />
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center break-all font-mono leading-relaxed">
          {shortUrl}
        </p>

        <button
          onClick={() => {
            navigator.clipboard.writeText(shortUrl);
            toast.success("Copied!");
          }}
          className="w-full py-2 text-sm font-medium text-brand-500 hover:text-brand-600 border border-brand-200 dark:border-brand-900 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}

// ── URL Card ───────────────────────────────────────────────

function UrlCard({
  item,
  onCopy,
  onQr,
  onToggle,
  onDelete,
}: {
  item: UrlItem;
  onCopy: () => void;
  onQr: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const expired = isExpired(item);

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-150">
      <div className="flex items-start gap-4">

        {/* Left — link info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-sm text-brand-500 dark:text-brand-400">
              /{item.shortCode}
            </span>
            <StatusBadge item={item} />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
            {item.originalUrl.replace(/^https?:\/\//, "")}
          </p>

          <div className="flex items-center gap-1 pt-0.5">
            <MousePointerClick className="w-3 h-3 text-gray-300 dark:text-gray-600" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {item.clicks.toLocaleString()} {item.clicks === 1 ? "click" : "clicks"}
            </span>
            {item.expiresAt && !expired && (
              <>
                <span className="text-gray-200 dark:text-gray-700 mx-1">·</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Expires {new Date(item.expiresAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={onCopy}
            title="Copy short URL"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onQr}
            title="Show QR code"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          <Link
            to={`/analytics/${item._id}`}
            title="View analytics"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={onToggle}
            title={item.isActive ? "Pause link" : "Resume link"}
            className={`p-2 rounded-lg transition-colors ${
              item.isActive
                ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            title="Delete link"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 animate-pulse">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-3.5 w-10 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-3 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout }    = useAuth();
  const { isDark, toggle }  = useTheme();
  const queryClient         = useQueryClient();

  const [page, setPage]         = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [qrItem, setQrItem]     = useState<UrlItem | null>(null);
  const [originalUrl, setOriginalUrl]     = useState("");
  const [customAlias, setCustomAlias]     = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  // ── Data fetching ──
  const { data: urlData, isLoading } = useQuery({
    queryKey: ["urls", page],
    queryFn:  () => urlsApi.getAll(page, 10),
  });

  const { data: overview } = useQuery({
    queryKey: ["overview"],
    queryFn:  analyticsApi.getOverview,
  });

  const urls       = urlData?.data ?? [];
  const pagination = urlData?.pagination;

  // ── Mutations ──
  const shortenMutation = useMutation({
    mutationFn: () => urlsApi.shorten(
      originalUrl,
      customAlias || undefined,
      expiresInDays ? Number(expiresInDays) : undefined
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setOriginalUrl("");
      setCustomAlias("");
      setExpiresInDays("");
      setShowForm(false);
      toast.success("Link created");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || "Failed to create link");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: urlsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("Link deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const toggleMutation = useMutation({
    mutationFn: urlsApi.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["urls"] }),
    onError: () => toast.error("Failed to update"),
  });

  // ── Handlers ──
  const handleCopy = (shortCode: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/${shortCode}`);
    toast.success("Copied!");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this link and all its analytics?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (expiresInDays && Number(expiresInDays) > 365) {
      toast.error("Expiry cannot exceed 365 days");
      return;
    }
    shortenMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white tracking-tight">
              Snip
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => void logout()}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Page heading ── */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Links
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Manage and track your shortened URLs
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total links",   value: overview?.totalUrls         ?? "—", icon: Hash },
            { label: "Total clicks",  value: overview?.totalClicks       ?? "—", icon: MousePointerClick },
            { label: "Last 7 days",   value: overview?.clicksLast7Days   ?? "—", icon: TrendingUp },
            { label: "Countries",     value: overview?.uniqueCountries   ?? "—", icon: Globe },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3"
            >
              <Icon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              <div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {value}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {pagination ? `${pagination.total} link${pagination.total !== 1 ? "s" : ""}` : ""}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New link
          </button>
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-fade-in">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Create a new link
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Destination URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/your-long-url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Custom alias <span className="text-gray-300 dark:text-gray-600 font-normal">— optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Expires in days <span className="text-gray-300 dark:text-gray-600 font-normal">— optional</span>
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    min={1}
                    max={365}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={shortenMutation.isPending}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {shortenMutation.isPending ? "Creating..." : "Create link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setOriginalUrl("");
                    setCustomAlias("");
                    setExpiresInDays("");
                  }}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Link list ── */}
        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          ) : urls.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">No links yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Create your first short link to get started
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="mt-1 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Create a link →
              </button>
            </div>
          ) : (
            urls.map((item) => (
              <UrlCard
                key={item._id}
                item={item}
                onCopy={() => handleCopy(item.shortCode)}
                onQr={() => setQrItem(item)}
                onToggle={() => toggleMutation.mutate(item._id)}
                onDelete={() => handleDelete(item._id)}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── QR Modal ── */}
      {qrItem && <QRModal url={qrItem} onClose={() => setQrItem(null)} />}
    </div>
  );
}
