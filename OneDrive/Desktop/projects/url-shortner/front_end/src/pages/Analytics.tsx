import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics";
import { urlsApi } from "../api/urls";
import { useTheme } from "../context/ThemeContext";
import {
  ArrowLeft, Moon, Sun, MousePointerClick,
  Globe, Monitor, Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, BarChart, Bar,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export default function Analytics() {
  const { id }             = useParams<{ id: string }>();
  const { isDark, toggle } = useTheme();
  const navigate           = useNavigate();

  // ── Fetch URL stats ──
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", id],
    queryFn:  () => urlsApi.getStats(id!),
    enabled:  !!id,
  });

  // ── Fetch timeline ──
  const { data: timeline = [] } = useQuery({
    queryKey: ["timeline", id],
    queryFn:  () => analyticsApi.getTimeline(id!),
    enabled:  !!id,
  });

  // ── Fetch breakdown ──
  const { data: breakdown } = useQuery({
    queryKey: ["breakdown", id],
    queryFn:  () => analyticsApi.getBreakdown(id!),
    enabled:  !!id,
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">URL not found</p>
          <Link to="/dashboard" className="text-brand-500 hover:text-brand-600 text-sm font-medium">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { url, stats } = statsData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Analytics
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                localhost:5000/{url.shortCode}
              </p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total clicks",  value: stats.totalClicks,  icon: MousePointerClick },
            { label: "Top country",   value: stats.topCountry,   icon: Globe },
            { label: "Top device",    value: stats.topDevice,    icon: Monitor },
            {
              label: "Last clicked",
              value: stats.lastClicked
                ? new Date(stats.lastClicked).toLocaleDateString()
                : "Never",
              icon: Clock,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-brand-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Click Timeline ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">
            Clicks over time
          </h2>
          {timeline.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No click data yet — share your link to get started
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#1f2937" : "#f3f4f6"}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: isDark ? "#6b7280" : "#9ca3af" }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? "#6b7280" : "#9ca3af" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#111827" : "#fff",
                    border:     `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "long", day: "numeric" })}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6366f1" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Breakdown Charts ── */}
        {breakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Devices */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-500" />
                Devices
              </h3>
              {breakdown.devices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={breakdown.devices}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                    >
                      {breakdown.devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#111827" : "#fff",
                        border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Browsers */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                Browsers
              </h3>
              {breakdown.browsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={breakdown.browsers} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#1f2937" : "#f3f4f6"}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: isDark ? "#6b7280" : "#9ca3af" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="_id"
                      tick={{ fontSize: 11, fill: isDark ? "#6b7280" : "#9ca3af" }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#111827" : "#fff",
                        border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Countries */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                Top countries
              </h3>
              {breakdown.countries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {breakdown.countries.map((c, i) => {
                    const total = breakdown.countries.reduce((a, b) => a + b.count, 0);
                    const pct   = Math.round((c.count / total) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {c._id || "Unknown"}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            {c.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OS */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-500" />
                Operating systems
              </h3>
              {breakdown.os.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {breakdown.os.map((o, i) => {
                    const total = breakdown.os.reduce((a, b) => a + b.count, 0);
                    const pct   = Math.round((o.count / total) * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {o._id || "Unknown"}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            {o.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Original URL ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Original URL</p>
          <a
            href={url.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-500 hover:text-brand-600 break-all transition-colors"
          >
            {url.originalUrl}
          </a>
        </div>
      </div>
    </div>
  );
}