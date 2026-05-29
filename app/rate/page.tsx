"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TSVInput, CityKey, UnitType, Facing, ViewType, ViewAngle, VastuDirection, AmenityKey, FireSafetyFeature, ParkingType, PowerBackup, WaterSupply, CrossVentilation } from "@/lib/tsv/types";
import { CITY_LABELS, VIEW_LABELS, VIEW_ANGLE_LABELS, AMENITY_LABELS, FIRE_SAFETY_LABELS } from "@/lib/tsv/types";

const UNIT_TYPES: UnitType[] = ["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "Penthouse"];
const FACINGS: Facing[] = ["North", "NE", "East", "SE", "South", "SW", "West", "NW"];
const VASTU_DIRS: VastuDirection[] = ["North", "NE", "East", "SE", "South", "SW", "West", "NW", "unknown"];

// ── tiny helpers ──────────────────────────────────────────────────
function Chip<T extends string>({ value, selected, onClick, children }: { value: T; selected: boolean; onClick: (v: T) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selected ? "bg-forest text-sand border-forest" : "bg-white border-gray-200 text-gray-600 hover:border-gold/60"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", min, max }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; min?: number; max?: number;
}) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min} max={max}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition"
    />
  );
}

function SelectInput<T extends string>({ value, onChange, options }: { value: T | undefined; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition"
    >
      <option value="">— Select —</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function CheckGroup<T extends string>({ value, onChange, options }: { value: T[]; onChange: (v: T[]) => void; options: { value: T; label: string }[] }) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50">
          <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="accent-gold" />
          <span className="text-xs text-gray-700">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// Sections collapsed by default — user expands to add more data
function Section({ title, badge, defaultOpen = false, children }: { title: string; badge?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-forest">{title}</span>
          {badge && <span className="text-xs px-2 py-0.5 bg-gold/10 text-gold-dark rounded-full font-medium">{badge}</span>}
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 border-t border-gray-100 bg-white space-y-4">{children}</div>}
    </div>
  );
}

export default function RatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Partial<TSVInput>>({});
  const set = useCallback(<K extends keyof TSVInput>(k: K, v: TSVInput[K]) => setForm((p) => ({ ...p, [k]: v })), []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setImageFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setImageDataUrl(dataUrl);
      set("floorPlanImage", dataUrl);
      setAnalysing(true);
      setAnalysisNote("Analysing floor plan with AI…");

      try {
        const res = await fetch("/api/analyze-floor-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        });
        if (res.ok) {
          const a = await res.json();
          setForm((prev) => ({
            ...prev,
            bedrooms: prev.bedrooms ?? a.bedrooms,
            bathrooms: prev.bathrooms ?? a.bathrooms,
            carpetArea: prev.carpetArea ?? a.estimatedCarpetAreaSqFt,
            passageAreaPercent: prev.passageAreaPercent ?? a.passageAreaPercent,
            roomsRectangular: prev.roomsRectangular ?? a.roomsRectangular,
            dryBalconyPresent: prev.dryBalconyPresent ?? a.dryBalconyPresent,
            storagePresent: prev.storagePresent ?? a.storagePresent,
            externalWindowsCount: prev.externalWindowsCount ?? a.externalWindowsCount,
            crossVentilation: prev.crossVentilation ?? a.crossVentilation,
          }));
          setAnalysisNote(`✓ AI detected ${a.bedrooms}BHK, ~${a.estimatedCarpetAreaSqFt} sq ft carpet area`);
        } else {
          setAnalysisNote("AI analysis not available — you can still enter details manually below.");
        }
      } catch {
        setAnalysisNote("AI analysis failed — enter details manually below.");
      } finally {
        setAnalysing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const canSubmit = !!(imageDataUrl || form.carpetArea || form.bedrooms);

  const handleSubmit = async () => {
    if (!canSubmit) { setError("Please upload a floor plan or enter at least carpet area or bedroom count."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed.");
      router.push(`/report/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      {/* Nav */}
      <nav className="border-b border-black/8 bg-sand/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-serif font-bold text-forest">TSV</span>
            <span className="text-xs text-gray-400 hidden sm:block">True Space Value</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-forest">← Back</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-forest">Rate an Apartment</h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Upload a photo of the floor plan from a brochure or listing. AI will analyse it and generate your TSV score instantly.
            Add more details below to get a fuller rating.
          </p>
        </div>

        {/* Primary: Floor plan upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors mb-4 ${imageDataUrl ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:border-gold hover:bg-gold/5"}`}
        >
          {imageDataUrl ? (
            <div className="space-y-3">
              {/* Preview thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Floor plan preview" className="max-h-40 mx-auto rounded-lg shadow object-contain" />
              <p className="text-sm font-medium text-green-700">✓ {imageFileName}</p>
              {analysing && <p className="text-xs text-gold-dark animate-pulse">{analysisNote}</p>}
              {!analysing && analysisNote && <p className="text-xs text-green-700">{analysisNote}</p>}
              <button
                onClick={() => { setImageDataUrl(null); setImageFileName(""); setAnalysisNote(""); set("floorPlanImage", undefined); }}
                className="text-xs text-red-400 hover:underline"
              >
                Remove image
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Upload floor plan</p>
              <p className="text-xs text-gray-400 mb-4">Drag & drop or click to choose · Photo from brochure, PDF screenshot, or CAD export</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-block px-5 py-2.5 bg-forest text-sand text-sm font-semibold rounded-lg hover:bg-forest/90 transition-colors"
              >
                Choose Image →
              </button>
            </div>
          )}
        </div>

        {/* Quick manual fields — always visible */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic Details (optional — AI fills from plan if uploaded)</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Name">
              <Input value={form.projectName ?? ""} onChange={(v) => set("projectName", v)} placeholder="e.g. Prestige Lakeside" />
            </Field>
            <Field label="City">
              <SelectInput
                value={form.city}
                onChange={(v) => set("city", v as CityKey)}
                options={Object.entries(CITY_LABELS).map(([k, v]) => ({ value: k as CityKey, label: v }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Carpet Area (sq ft)">
              <Input type="number" value={form.carpetArea ?? ""} onChange={(v) => set("carpetArea", Number(v))} placeholder="e.g. 900" min={100} max={15000} />
            </Field>
            <Field label="Bedrooms">
              <Input type="number" value={form.bedrooms ?? ""} onChange={(v) => set("bedrooms", Number(v))} placeholder="2" min={0} max={10} />
            </Field>
            <Field label="Unit Type">
              <SelectInput value={form.unitType} onChange={(v) => set("unitType", v as UnitType)} options={UNIT_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
          </div>
        </div>

        {/* Expandable enhancement sections */}
        <div className="space-y-2 mb-6">
          <p className="text-xs text-gray-400 px-1 uppercase tracking-wider font-semibold">Add more details to unlock additional scores ↓</p>

          <Section title="Orientation & Floor" badge="Unlocks Sunlight Score">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Floor Number">
                <Input type="number" value={form.floorNumber ?? ""} onChange={(v) => set("floorNumber", Number(v))} min={0} max={100} />
              </Field>
              <Field label="Total Floors">
                <Input type="number" value={form.totalFloors ?? ""} onChange={(v) => set("totalFloors", Number(v))} min={1} max={150} />
              </Field>
            </div>
            <Field label="Facing Direction">
              <div className="flex flex-wrap gap-2">
                {FACINGS.map((f) => <Chip key={f} value={f} selected={form.facing === f} onClick={(v) => set("facing", v)}>{f}</Chip>)}
              </div>
            </Field>
          </Section>

          <Section title="View" badge="Unlocks View Score">
            <Field label="What do you see from the main living area?">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(VIEW_LABELS).map(([k, label]) => (
                  <Chip key={k} value={k as ViewType} selected={form.viewType === k} onClick={(v) => set("viewType", v)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </Field>
            {form.viewType && (
              <Field label="How wide is the view?">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(VIEW_ANGLE_LABELS).map(([k, label]) => (
                    <Chip key={k} value={k as ViewAngle} selected={form.viewAngle === k} onClick={(v) => set("viewAngle", v)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </Field>
            )}
          </Section>

          <Section title="Vastu Directions" badge="Unlocks Vastu Score">
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "entranceDirection", label: "Main Entrance" },
                { key: "kitchenDirection", label: "Kitchen" },
                { key: "masterBedroomDirection", label: "Master Bedroom" },
                { key: "toiletDirection", label: "Toilets" },
                { key: "poojaRoomDirection", label: "Pooja Room" },
              ] as const).map(({ key, label }) => (
                <Field key={key} label={label}>
                  <SelectInput
                    value={(form[key] as VastuDirection) ?? undefined}
                    onChange={(v) => set(key, v as VastuDirection)}
                    options={VASTU_DIRS.map((d) => ({ value: d, label: d === "unknown" ? "Not sure" : d }))}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Building & Amenities" badge="Unlocks Building Score">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parking Type">
                <SelectInput value={form.parkingType} onChange={(v) => set("parkingType", v as ParkingType)}
                  options={[
                    { value: "dedicated_covered", label: "Dedicated Covered" },
                    { value: "mechanical_stack", label: "Mechanical / Stack" },
                    { value: "dedicated_open", label: "Dedicated Open" },
                    { value: "visitor_only", label: "No Dedicated Parking" },
                  ]} />
              </Field>
              <Field label="Power Backup">
                <SelectInput value={form.powerBackup} onChange={(v) => set("powerBackup", v as PowerBackup)}
                  options={[
                    { value: "full", label: "Full DG Backup" },
                    { value: "partial", label: "Partial Backup" },
                    { value: "none", label: "No Backup" },
                  ]} />
              </Field>
              <Field label="Water Supply">
                <SelectInput value={form.waterSupply} onChange={(v) => set("waterSupply", v as WaterSupply)}
                  options={[
                    { value: "24x7_borewell", label: "24×7 + Borewell" },
                    { value: "municipal_tank", label: "Municipal + Tank" },
                    { value: "irregular", label: "Irregular" },
                  ]} />
              </Field>
              <Field label="Total Units in Project">
                <Input type="number" value={form.totalUnitsInProject ?? ""} onChange={(v) => set("totalUnitsInProject", Number(v))} min={1} />
              </Field>
              <Field label="Number of Lifts">
                <Input type="number" value={form.liftCount ?? ""} onChange={(v) => set("liftCount", Number(v))} min={0} />
              </Field>
            </div>

            <Field label="Amenities available">
              <CheckGroup
                value={form.amenities ?? []}
                onChange={(v) => set("amenities", v as AmenityKey[])}
                options={Object.entries(AMENITY_LABELS).map(([k, v]) => ({ value: k as AmenityKey, label: v }))}
              />
            </Field>

            <Field label="Fire & Safety features">
              <CheckGroup
                value={form.fireSafetyFeatures ?? []}
                onChange={(v) => set("fireSafetyFeatures", v as FireSafetyFeature[])}
                options={Object.entries(FIRE_SAFETY_LABELS).map(([k, v]) => ({ value: k as FireSafetyFeature, label: v }))}
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="checkbox" checked={!!form.evReady} onChange={(e) => set("evReady", e.target.checked)} className="accent-gold" />
              <span className="text-xs text-gray-700">EV Charging Points available</span>
            </label>
          </Section>

          <Section title="Asking Price" badge="Unlocks Value Score">
            <Field label="Asking Price (₹ per sq ft of carpet area)" hint={form.carpetArea && form.askingPricePerSqFt ? `Total ≈ ₹${((form.carpetArea * form.askingPricePerSqFt) / 100_000).toFixed(1)} lakhs` : undefined}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={form.askingPricePerSqFt ?? ""}
                  onChange={(e) => set("askingPricePerSqFt", Number(e.target.value))}
                  placeholder="e.g. 9500"
                  min={500}
                  className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition"
                />
              </div>
            </Field>
          </Section>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">{error}</div>
        )}

        {/* What we'll score */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What will be scored based on your data</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Functional Space", avail: !!(imageDataUrl || form.carpetArea) },
              { label: "Livability", avail: !!(imageDataUrl || form.bedrooms) },
              { label: "Ventilation", avail: !!(imageDataUrl || form.externalWindowsCount) },
              { label: "Sunlight", avail: !!form.facing },
              { label: "View", avail: !!form.viewType },
              { label: "Vastu", avail: !!form.entranceDirection },
              { label: "Building", avail: !!form.parkingType },
              { label: "Price Value", avail: !!form.askingPricePerSqFt },
            ].map((s) => (
              <span key={s.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.avail ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-400"}`}>
                {s.avail ? "✓" : "○"} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting || analysing}
          className="w-full py-4 bg-gold text-forest font-bold text-base rounded-xl hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="w-5 h-5 border-2 border-forest/30 border-t-forest rounded-full animate-spin" /> Generating TSV Report…</>
          ) : analysing ? (
            <><span className="w-5 h-5 border-2 border-forest/30 border-t-forest rounded-full animate-spin" /> Analysing floor plan…</>
          ) : (
            `Get TSV Score →`
          )}
        </button>

        {!canSubmit && (
          <p className="text-center text-xs text-gray-400 mt-2">Upload a floor plan or enter carpet area / bedrooms to continue</p>
        )}

        <p className="text-center text-xs text-gray-300 mt-4">
          No account needed · Shareable report link · Score improves as you add more details
        </p>
      </div>
    </div>
  );
}
