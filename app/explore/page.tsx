"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ApartmentCard from "@/components/ApartmentCard";
import type { TSVIndexEntry, CityKey, UnitType } from "@/lib/tsv/types";
import { CITY_LABELS } from "@/lib/tsv/types";

const UNIT_TYPES: UnitType[] = ["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "Penthouse"];
const VALUE_RATINGS = ["Undervalued", "Fair Value", "Overpriced"];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entries, setEntries] = useState<TSVIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Filters
  const [city, setCity] = useState<string>(searchParams.get("city") ?? "");
  const [unitType, setUnitType] = useState<string>(searchParams.get("unitType") ?? "");
  const [minScore, setMinScore] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("composite");

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (unitType) params.set("unitType", unitType);
    if (minScore) params.set("minScore", minScore);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (search) params.set("search", search);
    params.set("limit", "60");

    fetch(`/api/tsv/reports?${params}`)
      .then((r) => r.json())
      .then((d) => {
        let data: TSVIndexEntry[] = d.entries ?? [];
        if (sortBy === "composite") data = [...data].sort((a, b) => b.composite - a.composite);
        else if (sortBy === "price_asc") data = [...data].sort((a, b) => (a.askingPricePerSqFt ?? 0) - (b.askingPricePerSqFt ?? 0));
        else if (sortBy === "price_desc") data = [...data].sort((a, b) => (b.askingPricePerSqFt ?? 0) - (a.askingPricePerSqFt ?? 0));
        else if (sortBy === "recent") data = [...data].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
        setEntries(data);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [city, unitType, minScore, maxPrice, search, sortBy]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const goCompare = () => {
    if (compareIds.length >= 2) {
      router.push(`/compare?ids=${compareIds.join(",")}`);
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      {/* Nav */}
      <nav className="border-b border-black/8 bg-sand/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-serif font-bold text-forest">TSV</Link>
            <span className="text-sm text-gray-400">Explore</span>
          </div>
          <Link href="/rate" className="bg-forest text-sand text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors">
            Rate Apartment
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-20">
              <h2 className="text-sm font-bold text-forest mb-4 uppercase tracking-wider">Filters</h2>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
                  <input
                    type="text"
                    placeholder="Project, developer, locality…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    <option value="">All Cities</option>
                    {Object.entries(CITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Unit type */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Unit Type</label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setUnitType("")}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${!unitType ? "bg-forest text-sand border-forest" : "border-gray-200 text-gray-600"}`}
                    >
                      All
                    </button>
                    {UNIT_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setUnitType(unitType === t ? "" : t)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${unitType === t ? "bg-forest text-sand border-forest" : "border-gray-200 text-gray-600 hover:border-gold"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min score */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Min TSV Score</label>
                  <select
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    <option value="">Any</option>
                    <option value="80">80+ (Excellent)</option>
                    <option value="70">70+ (Great Buy)</option>
                    <option value="60">60+ (Good)</option>
                    <option value="50">50+ (Fair)</option>
                  </select>
                </div>

                {/* Max price */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Max Price/sqft (₹)</label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    <option value="">Any</option>
                    <option value="6000">Under ₹6,000</option>
                    <option value="10000">Under ₹10,000</option>
                    <option value="15000">Under ₹15,000</option>
                    <option value="25000">Under ₹25,000</option>
                    <option value="50000">Under ₹50,000</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    <option value="composite">TSV Score (High → Low)</option>
                    <option value="recent">Most Recent</option>
                    <option value="price_asc">Price (Low → High)</option>
                    <option value="price_desc">Price (High → Low)</option>
                  </select>
                </div>

                <button
                  onClick={() => { setCity(""); setUnitType(""); setMinScore(""); setMaxPrice(""); setSearch(""); }}
                  className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-serif font-bold text-forest">
                  {city ? CITY_LABELS[city as CityKey] : "All Apartments"}{unitType ? ` · ${unitType}` : ""}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {loading ? "Loading…" : `${entries.length} rated apartment${entries.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${compareMode ? "bg-forest text-sand border-forest" : "border-gray-200 text-gray-600 hover:border-forest"}`}
                >
                  {compareMode ? "✓ Compare Mode" : "Compare"}
                </button>
                {compareMode && compareIds.length >= 2 && (
                  <button
                    onClick={goCompare}
                    className="text-xs font-bold px-3 py-2 bg-gold text-forest rounded-lg hover:bg-gold-light transition-colors"
                  >
                    Compare {compareIds.length} →
                  </button>
                )}
              </div>
            </div>

            {compareMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                Select 2–3 apartments to compare side-by-side. {compareIds.length}/3 selected.
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
                <p className="font-serif text-lg text-gray-400 mb-2">No apartments match your filters</p>
                <p className="text-sm text-gray-400 mb-6">Try broadening your search or rate the first one.</p>
                <Link href="/rate" className="inline-block bg-forest text-sand text-sm font-semibold px-6 py-3 rounded-lg hover:bg-forest/90 transition-colors">
                  Rate an Apartment →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <ApartmentCard
                    key={entry.id}
                    entry={entry}
                    compareMode={compareMode}
                    selected={compareIds.includes(entry.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
