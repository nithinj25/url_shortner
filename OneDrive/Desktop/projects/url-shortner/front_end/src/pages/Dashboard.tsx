import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { urlsApi } from "../api/urls";
import { useAuth } from "../context/AuthContext";
import { type UrlItem } from "../types";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [items, setItems] = useState<UrlItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUrls = async () => {
    setError("");
    try {
      const list = await urlsApi.getAll();
      setItems(list);
    } catch {
      setError("Unable to load URLs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUrls();
  }, []);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const parsedDays = expiresInDays.trim() === "" ? undefined : Number(expiresInDays);
    if (parsedDays !== undefined && Number.isNaN(parsedDays)) {
      setError("Expiry must be a valid number.");
      setIsSubmitting(false);
      return;
    }

    try {
      await urlsApi.shorten(originalUrl, customAlias || undefined, parsedDays);
      setOriginalUrl("");
      setCustomAlias("");
      setExpiresInDays("");
      await loadUrls();
    } catch {
      setError("Unable to create short URL.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome {user?.name}</p>
        </div>
        <button type="button" onClick={() => void logout()} className="border rounded px-3 py-2">
          Logout
        </button>
      </header>

      <form onSubmit={onCreate} className="grid gap-3 border rounded-lg p-4">
        <input
          type="url"
          placeholder="https://example.com"
          className="border rounded px-3 py-2"
          value={originalUrl}
          onChange={(event) => setOriginalUrl(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Custom alias (optional)"
          className="border rounded px-3 py-2"
          value={customAlias}
          onChange={(event) => setCustomAlias(event.target.value)}
        />
        <input
          type="number"
          placeholder="Expiry in days (optional)"
          className="border rounded px-3 py-2"
          value={expiresInDays}
          onChange={(event) => setExpiresInDays(event.target.value)}
          min={1}
        />
        <button
          type="submit"
          className="rounded bg-black text-white py-2 disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create short URL"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {isLoading ? <p>Loading URLs...</p> : null}

      <section className="space-y-2">
        {items.map((item) => (
          <article key={item._id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">/{item.shortCode}</p>
              <p className="text-sm text-gray-600 truncate">{item.originalUrl}</p>
            </div>
            <Link to={`/analytics/${item._id}`} className="underline text-sm">
              Analytics
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
