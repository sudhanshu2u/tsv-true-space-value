"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ApartmentCard from "@/components/ApartmentCard";
import type { TSVIndexEntry } from "@/lib/tsv/types";
import { CITY_LABELS } from "@/lib/tsv/types";

const CITIES = Object.entries(CITY_LABELS) as [string, string][];

const HERO_STATS = [
  { label: "Scoring dimensions", value: "13" },
  { label: "Indian cities covered", value: "8" },
  { label: "Three-layer rating", value: "Core · Building · Value" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Enter apartment details",
    desc: "Fill in space specs, orientation, amenities, and price. Upload a floor plan for AI auto-fill.",
  },
  {
    step: "2",
    title: "Get your TSV score",
    desc: "Our engine computes 13 dimensions across Core Quality, Building Infrastructure, and Price Value.",
  },
  {
    step: "3",
    title: "Read the verdict",
    desc: "See plain-English insights for buyers and deep-dive analytics for professionals — one unified report.",
  },
];

export default function TSVLanding() {
  const [search, setSearch] = useState("");
  const [recentEntries, setRecentEntries] = useState<TSVIndexEntry[]>([]);
  const [searchResults, setSearchResults] = useState<TSVIndexEntry[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch("/api/reports?limit=6")
      .then((r) => r.json())
      .then((d) => setRecentEntries(d.entries ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/tsv/reports?search=${encodeURIComponent(search)}&limit=8`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.entries ?? []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const displayEntries = search.trim() ? searchResults : recentEntries;

  return (
    <div className="min-h-screen bg-sand">
      {/* Nav */}
      <nav className="border-b border-black/8 bg-sand/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-forest">TSV</span>
              <span className="text-xs uppercase tracking-widest text-gray-400 hidden sm:block">True Space Value</span>
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
              <Link href="/explore" className="hover:text-forest transition-colors">Explore</Link>
              <Link href="/compare" className="hover:text-forest transition-colors">Compare</Link>
            </div>
          </div>
          <Link
            href="/rate"
            className="bg-forest text-sand text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors"
          >
            Rate an Apartment
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider">India's First Independent Apartment Rating</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-forest leading-tight mb-4">
          Know the True Value<br />of Any Apartment
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Beyond carpet area and price — TSV scores apartments on 13 dimensions including space efficiency,
          natural light, ventilation, vastu, and city-normalized value. Built for buyers, brokers, and analysts.
        </p>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto">
          <div className="flex rounded-xl border-2 border-forest/20 bg-white shadow-lg overflow-hidden focus-within:border-forest transition-colors">
            <input
              type="text"
              placeholder="Search by project, developer, or locality…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3.5 text-sm bg-transparent outline-none text-forest placeholder-gray-400"
            />
            <div className="flex items-center pr-2 gap-1">
              {searching && <span className="text-xs text-gray-400 animate-pulse">Searching…</span>}
              <Link
                href="/rate"
                className="bg-forest text-sand text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors whitespace-nowrap"
              >
                Rate New →
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-serif font-bold text-gold">{s.value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* City quick links */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 font-semibold">Browse by city</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map(([key, label]) => (
            <Link
              key={key}
              href={`/tsv/explore?city=${key}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-gold hover:text-gold-dark hover:bg-gold/5 transition-all font-medium"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/explore"
            className="px-4 py-2 bg-forest/5 border border-forest/20 rounded-full text-sm text-forest hover:bg-forest/10 transition-all font-medium"
          >
            All cities →
          </Link>
        </div>
      </section>

      {/* Recent / search results */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-bold text-forest">
            {search.trim() ? `Results for "${search}"` : "Recently Rated Apartments"}
          </h2>
          {!search.trim() && (
            <Link href="/explore" className="text-sm text-gold-dark hover:underline font-medium">
              View all →
            </Link>
          )}
        </div>

        {displayEntries.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            {search.trim() ? (
              <>
                <p className="text-gray-500 mb-4">No apartments found for &ldquo;{search}&rdquo;</p>
                <Link href="/rate" className="text-sm text-gold-dark hover:underline font-medium">
                  Be the first to rate one →
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-2 font-serif text-lg">No ratings yet</p>
                <p className="text-sm text-gray-400 mb-6">Rate the first apartment and start building India's property intelligence database.</p>
                <Link
                  href="/rate"
                  className="inline-block bg-forest text-sand text-sm font-semibold px-6 py-3 rounded-lg hover:bg-forest/90 transition-colors"
                >
                  Rate an Apartment →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEntries.map((entry) => (
              <ApartmentCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-forest text-sand py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">How TSV Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-serif font-bold text-gold">{step.step}</span>
                </div>
                <h3 className="font-serif font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sand/70 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/rate"
              className="inline-block bg-gold text-forest font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light transition-colors"
            >
              Rate Your Apartment Free →
            </Link>
            <p className="text-sand/50 text-xs mt-3">No account needed · Shareable report link · Takes ~5 minutes</p>
          </div>
        </div>
      </section>

      {/* Three-layer explainer */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-serif font-bold text-forest text-center mb-3">The Three-Layer Rating</h2>
        <p className="text-sm text-gray-400 text-center mb-10 max-w-xl mx-auto">
          TSV separates apartment quality from building amenities and price — so a luxury building can&apos;t inflate a poorly-planned apartment&apos;s score.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "TSV-Core",
              subtitle: "Pure apartment quality",
              desc: "Space efficiency, natural light, ventilation, views, livability, vastu compliance. This is the apartment itself — unaffected by the lobby or infinity pool.",
              color: "border-green-200 bg-green-50",
              badge: "bg-green-100 text-green-800",
            },
            {
              title: "TSV-Building",
              subtitle: "Infrastructure quality",
              desc: "Parking, elevators, fire safety, water & power backup, security systems, amenity utility. What the developer built around your home.",
              color: "border-blue-200 bg-blue-50",
              badge: "bg-blue-100 text-blue-800",
            },
            {
              title: "TSV-Value",
              subtitle: "Price-adjusted rating",
              desc: "TSV-Core weighted 70% + price competitiveness 30%. An Undervalued apartment has excellent quality at or below city benchmark pricing.",
              color: "border-amber-200 bg-amber-50",
              badge: "bg-amber-100 text-amber-800",
            },
          ].map((layer) => (
            <div key={layer.title} className={`rounded-xl border p-6 ${layer.color}`}>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${layer.badge} uppercase tracking-wider`}>
                {layer.title}
              </span>
              <h3 className="font-serif font-bold text-forest mt-3 mb-2">{layer.subtitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{layer.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/8 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-forest">TSV Home</Link>
          <Link href="/explore" className="hover:text-forest">Explore</Link>
          <Link href="/compare" className="hover:text-forest">Compare</Link>
          <Link href="/rate" className="hover:text-forest">Rate Apartment</Link>
          <Link href="/" className="hover:text-forest">SEO Word Lab</Link>
        </div>
        <p className="text-xs text-gray-300 mt-4">
          TSV is an advisory quality index, not a statutory valuation. Methodology v1.0 · 2026
        </p>
      </footer>
    </div>
  );
}
