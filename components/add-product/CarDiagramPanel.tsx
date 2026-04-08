"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Package, X, MapPin, ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Eye } from "lucide-react";

// ─── Car zones with detailed parts ───
export type CarZone = "front" | "front-left" | "front-right" | "rear-left" | "rear-right" | "rear" | "roof" | "underbody" | "engine" | "interior";

interface PartDef {
  id: string;
  name: string;
  x: number; // % position in section diagram
  y: number;
  w?: number;
  h?: number;
  price?: number;
  oem?: boolean;
}

interface ZoneDef {
  id: CarZone;
  label: string;
  labelAr: string;
  color: string;
  // SVG position on car overview
  svgX: number;
  svgY: number;
  svgW: number;
  svgH: number;
  parts: PartDef[];
}

const ZONES: ZoneDef[] = [
  { id: "front", label: "Front", labelAr: "أمامي", color: "#ef4444", svgX: 90, svgY: 15, svgW: 120, svgH: 50,
    parts: [
      { id: "f-bumper", name: "Front Bumper", x: 50, y: 90, price: 220 },
      { id: "f-hood", name: "Hood", x: 50, y: 30, price: 380 },
      { id: "f-hl-l", name: "Headlight (L)", x: 15, y: 70, price: 95 },
      { id: "f-hl-r", name: "Headlight (R)", x: 85, y: 70, price: 95 },
      { id: "f-grille", name: "Front Grille", x: 50, y: 65, price: 65 },
      { id: "f-fog-l", name: "Fog Light (L)", x: 20, y: 88, price: 35 },
      { id: "f-fog-r", name: "Fog Light (R)", x: 80, y: 88, price: 35 },
      { id: "f-rad-support", name: "Radiator Support", x: 50, y: 45, price: 120 },
      { id: "f-fender-liner-l", name: "Fender Liner (L)", x: 10, y: 55, price: 25 },
      { id: "f-fender-liner-r", name: "Fender Liner (R)", x: 90, y: 55, price: 25 },
      { id: "f-badge", name: "Emblem/Badge", x: 50, y: 75, price: 15 },
      { id: "f-lp-frame", name: "License Plate Frame", x: 50, y: 95, price: 10 },
    ]},
  { id: "engine", label: "Engine Bay", labelAr: "حجرة المحرك", color: "#f97316", svgX: 100, svgY: 65, svgW: 100, svgH: 40,
    parts: [
      { id: "e-engine", name: "Engine Assembly", x: 50, y: 40, price: 2500, oem: true },
      { id: "e-radiator", name: "Radiator", x: 50, y: 15, price: 140 },
      { id: "e-alternator", name: "Alternator", x: 25, y: 50, price: 180 },
      { id: "e-starter", name: "Starter Motor", x: 75, y: 60, price: 160 },
      { id: "e-ac-comp", name: "A/C Compressor", x: 30, y: 70, price: 220 },
      { id: "e-ps-pump", name: "Power Steering Pump", x: 70, y: 45, price: 200 },
      { id: "e-water-pump", name: "Water Pump", x: 55, y: 55, price: 65 },
      { id: "e-thermostat", name: "Thermostat", x: 60, y: 25, price: 18 },
      { id: "e-oil-filter", name: "Oil Filter", x: 40, y: 75, price: 8 },
      { id: "e-air-filter", name: "Air Filter Box", x: 80, y: 20, price: 22 },
      { id: "e-battery", name: "Battery", x: 15, y: 25, price: 110 },
      { id: "e-timing", name: "Timing Belt/Chain", x: 45, y: 50, price: 85 },
      { id: "e-spark", name: "Spark Plugs (Set)", x: 50, y: 45, price: 32 },
      { id: "e-ign-coil", name: "Ignition Coil (Set)", x: 55, y: 35, price: 140 },
      { id: "e-intake", name: "Intake Manifold", x: 65, y: 30, price: 180 },
      { id: "e-exhaust-m", name: "Exhaust Manifold", x: 35, y: 60, price: 150 },
      { id: "e-valve-cover", name: "Valve Cover Gasket", x: 50, y: 30, price: 25 },
      { id: "e-belt", name: "Serpentine Belt", x: 30, y: 55, price: 20 },
    ]},
  { id: "front-left", label: "Front Left", labelAr: "أمامي أيسر", color: "#eab308", svgX: 60, svgY: 80, svgW: 30, svgH: 100,
    parts: [
      { id: "fl-fender", name: "Left Fender", x: 50, y: 20, price: 180 },
      { id: "fl-mirror", name: "Left Mirror", x: 80, y: 40, price: 85 },
      { id: "fl-door", name: "Left Front Door", x: 50, y: 55, price: 450 },
      { id: "fl-window", name: "Left Front Window", x: 50, y: 45, price: 120 },
      { id: "fl-handle", name: "Left Door Handle", x: 80, y: 55, price: 30 },
      { id: "fl-regulator", name: "Window Regulator (L)", x: 50, y: 60, price: 75 },
      { id: "fl-seal", name: "Door Seal (L)", x: 30, y: 55, price: 35 },
    ]},
  { id: "front-right", label: "Front Right", labelAr: "أمامي أيمن", color: "#22c55e", svgX: 210, svgY: 80, svgW: 30, svgH: 100,
    parts: [
      { id: "fr-fender", name: "Right Fender", x: 50, y: 20, price: 180 },
      { id: "fr-mirror", name: "Right Mirror", x: 20, y: 40, price: 85 },
      { id: "fr-door", name: "Right Front Door", x: 50, y: 55, price: 450 },
      { id: "fr-window", name: "Right Front Window", x: 50, y: 45, price: 120 },
      { id: "fr-handle", name: "Right Door Handle", x: 20, y: 55, price: 30 },
    ]},
  { id: "rear-left", label: "Rear Left", labelAr: "خلفي أيسر", color: "#06b6d4", svgX: 60, svgY: 260, svgW: 30, svgH: 100,
    parts: [
      { id: "rl-door", name: "Left Rear Door", x: 50, y: 40, price: 420 },
      { id: "rl-window", name: "Left Rear Window", x: 50, y: 30, price: 110 },
      { id: "rl-qp", name: "Left Quarter Panel", x: 50, y: 70, price: 280 },
      { id: "rl-handle", name: "Left Rear Handle", x: 80, y: 40, price: 28 },
    ]},
  { id: "rear-right", label: "Rear Right", labelAr: "خلفي أيمن", color: "#8b5cf6", svgX: 210, svgY: 260, svgW: 30, svgH: 100,
    parts: [
      { id: "rr-door", name: "Right Rear Door", x: 50, y: 40, price: 420 },
      { id: "rr-window", name: "Right Rear Window", x: 50, y: 30, price: 110 },
      { id: "rr-qp", name: "Right Quarter Panel", x: 50, y: 70, price: 280 },
      { id: "rr-handle", name: "Right Rear Handle", x: 20, y: 40, price: 28 },
    ]},
  { id: "rear", label: "Rear", labelAr: "خلفي", color: "#ec4899", svgX: 90, svgY: 395, svgW: 120, svgH: 50,
    parts: [
      { id: "r-bumper", name: "Rear Bumper", x: 50, y: 85, price: 200 },
      { id: "r-trunk", name: "Trunk Lid", x: 50, y: 30, price: 350 },
      { id: "r-tl-l", name: "Tail Light (L)", x: 20, y: 60, price: 120 },
      { id: "r-tl-r", name: "Tail Light (R)", x: 80, y: 60, price: 120 },
      { id: "r-exhaust", name: "Exhaust Tip", x: 35, y: 95, price: 45 },
      { id: "r-diffuser", name: "Rear Diffuser", x: 50, y: 90, price: 85 },
      { id: "r-lp-light", name: "License Plate Light", x: 50, y: 75, price: 12 },
      { id: "r-spoiler", name: "Rear Spoiler", x: 50, y: 15, price: 120 },
    ]},
  { id: "underbody", label: "Underbody", labelAr: "أسفل السيارة", color: "#64748b", svgX: 100, svgY: 200, svgW: 100, svgH: 60,
    parts: [
      { id: "u-brk-fl", name: "Front Brake Pad (L)", x: 15, y: 20, price: 45 },
      { id: "u-brk-fr", name: "Front Brake Pad (R)", x: 85, y: 20, price: 45 },
      { id: "u-brk-rl", name: "Rear Brake Pad (L)", x: 15, y: 80, price: 38 },
      { id: "u-brk-rr", name: "Rear Brake Pad (R)", x: 85, y: 80, price: 38 },
      { id: "u-rotor-fl", name: "Front Rotor (L)", x: 10, y: 25, price: 65 },
      { id: "u-rotor-fr", name: "Front Rotor (R)", x: 90, y: 25, price: 65 },
      { id: "u-shock-fl", name: "Front Shock (L)", x: 20, y: 15, price: 55 },
      { id: "u-shock-fr", name: "Front Shock (R)", x: 80, y: 15, price: 55 },
      { id: "u-shock-rl", name: "Rear Shock (L)", x: 20, y: 85, price: 48 },
      { id: "u-shock-rr", name: "Rear Shock (R)", x: 80, y: 85, price: 48 },
      { id: "u-cv-l", name: "CV Axle (L)", x: 30, y: 50, price: 95 },
      { id: "u-cv-r", name: "CV Axle (R)", x: 70, y: 50, price: 95 },
      { id: "u-exhaust-sys", name: "Exhaust System", x: 50, y: 65, price: 350 },
      { id: "u-cat", name: "Catalytic Converter", x: 50, y: 55, price: 280 },
      { id: "u-muffler", name: "Muffler", x: 50, y: 80, price: 120 },
      { id: "u-trans", name: "Transmission", x: 50, y: 40, price: 1200 },
      { id: "u-fuel-tank", name: "Fuel Tank", x: 50, y: 70, price: 200 },
      { id: "u-ctrl-arm-l", name: "Control Arm (L)", x: 25, y: 30, price: 75 },
      { id: "u-ctrl-arm-r", name: "Control Arm (R)", x: 75, y: 30, price: 75 },
      { id: "u-stab-link-l", name: "Stabilizer Link (L)", x: 30, y: 40, price: 22 },
      { id: "u-stab-link-r", name: "Stabilizer Link (R)", x: 70, y: 40, price: 22 },
    ]},
  { id: "interior", label: "Interior", labelAr: "داخلي", color: "#a855f7", svgX: 100, svgY: 130, svgW: 100, svgH: 60,
    parts: [
      { id: "i-dashboard", name: "Dashboard", x: 50, y: 15, price: 450 },
      { id: "i-steering", name: "Steering Wheel", x: 35, y: 25, price: 180 },
      { id: "i-airbag-d", name: "Airbag (Driver)", x: 35, y: 30, price: 250 },
      { id: "i-airbag-p", name: "Airbag (Passenger)", x: 65, y: 30, price: 250 },
      { id: "i-seat-fl", name: "Front Seat (L)", x: 30, y: 50, price: 350 },
      { id: "i-seat-fr", name: "Front Seat (R)", x: 70, y: 50, price: 350 },
      { id: "i-seat-rl", name: "Rear Seat (L)", x: 30, y: 75, price: 280 },
      { id: "i-seat-rr", name: "Rear Seat (R)", x: 70, y: 75, price: 280 },
      { id: "i-ac", name: "A/C Control Unit", x: 55, y: 20, price: 120 },
      { id: "i-audio", name: "Head Unit / Radio", x: 50, y: 22, price: 150 },
      { id: "i-cluster", name: "Instrument Cluster", x: 40, y: 15, price: 200 },
      { id: "i-windshield", name: "Windshield", x: 50, y: 5, price: 250 },
      { id: "i-rear-glass", name: "Rear Window", x: 50, y: 90, price: 180 },
      { id: "i-shifter", name: "Gear Shifter", x: 50, y: 40, price: 85 },
      { id: "i-carpet", name: "Floor Carpet", x: 50, y: 60, price: 120 },
    ]},
  { id: "roof", label: "Roof & Glass", labelAr: "سقف وزجاج", color: "#0ea5e9", svgX: 100, svgY: 110, svgW: 100, svgH: 20,
    parts: [
      { id: "roof-panel", name: "Roof Panel", x: 50, y: 50, price: 400 },
      { id: "roof-rack", name: "Roof Rack", x: 50, y: 30, price: 120 },
      { id: "roof-antenna", name: "Antenna", x: 70, y: 20, price: 25 },
      { id: "roof-sunroof", name: "Sunroof Glass", x: 50, y: 50, price: 300 },
    ]},
];

// ─── All parts flat list for quick lookup ───
const ALL_PARTS = ZONES.flatMap((z) => z.parts.map((p) => ({ ...p, zone: z.id, zoneLabel: z.label, zoneColor: z.color })));

interface CarDiagramPanelProps {
  checkedParts: Set<string>;
  onTogglePart: (partId: string) => void;
  onSelectAllZone: (zone: CarZone) => void;
  onDeselectAllZone: (zone: CarZone) => void;
  onBulkAdd: (parts: Array<{ id: string; name: string; price?: number; zone: string }>) => void;
  highlightPartId?: string | null;
  locale: string;
}

export default function CarDiagramPanel({ checkedParts, onTogglePart, onSelectAllZone, onDeselectAllZone, onBulkAdd, highlightPartId, locale }: CarDiagramPanelProps) {
  const isAr = locale === "ar";
  const [activeZone, setActiveZone] = useState<CarZone | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const activeZoneData = ZONES.find((z) => z.id === activeZone);
  const totalChecked = checkedParts.size;
  const totalPrice = ALL_PARTS.filter((p) => checkedParts.has(p.id)).reduce((s, p) => s + (p.price ?? 0), 0);

  // Zone check counts
  const zoneCounts = useMemo(() => {
    const counts: Record<string, { total: number; checked: number }> = {};
    for (const z of ZONES) {
      const checked = z.parts.filter((p) => checkedParts.has(p.id)).length;
      counts[z.id] = { total: z.parts.length, checked };
    }
    return counts;
  }, [checkedParts]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background border-s border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border shrink-0 flex items-center gap-2">
        {activeZone ? (
          <>
            <button type="button" onClick={() => setActiveZone(null)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: activeZoneData?.color }} />
            <span className="text-sm font-bold flex-1">{isAr ? activeZoneData?.labelAr : activeZoneData?.label}</span>
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold flex-1">{isAr ? "مخطط القطع" : "Parts Diagram"}</span>
          </>
        )}
        {totalChecked > 0 && (
          <span className="text-[10px] bg-green-100 dark:bg-green-900/20 text-green-600 px-2 py-0.5 rounded-full font-bold">
            {totalChecked} · {totalPrice} OMR
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ═══ OVERVIEW: Car outline + zone list ═══ */}
        {!activeZone && (
          <>
            {/* Car SVG */}
            <div className="px-4 py-3 border-b border-border">
              <svg viewBox="0 0 300 460" className="w-full max-w-[240px] mx-auto" style={{ height: "auto", maxHeight: "240px" }}>
                {/* Car body */}
                <path d="M100,35 Q100,15 150,10 Q200,15 200,35 L210,75 Q215,95 215,125 L215,340 Q215,370 210,390 L200,430 Q200,450 150,455 Q100,450 100,430 L90,390 Q85,370 85,340 L85,125 Q85,95 90,75 Z"
                  fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
                {/* Windows */}
                <path d="M105,95 Q150,80 195,95 L190,130 Q150,120 110,130 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
                <path d="M110,335 Q150,345 190,335 L195,370 Q150,385 105,370 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />

                {/* Clickable zones with fill based on selection */}
                {ZONES.map((z) => {
                  const count = zoneCounts[z.id];
                  const hasChecked = count && count.checked > 0;
                  const allChecked = count && count.checked === count.total;
                  return (
                    <g key={z.id} className="cursor-pointer" onClick={() => setActiveZone(z.id)}>
                      <rect x={z.svgX} y={z.svgY} width={z.svgW} height={z.svgH} rx="4"
                        fill={allChecked ? z.color + "40" : hasChecked ? z.color + "20" : "transparent"}
                        stroke={z.color} strokeWidth={hasChecked ? "2" : "0.5"} strokeOpacity={hasChecked ? 1 : 0.3}
                        className="hover:opacity-80" />
                      {hasChecked && (
                        <circle cx={z.svgX + z.svgW - 6} cy={z.svgY + 6} r="7" fill={z.color} />
                      )}
                      {hasChecked && (
                        <text x={z.svgX + z.svgW - 6} y={z.svgY + 9} textAnchor="middle" className="text-[7px] fill-white font-bold pointer-events-none">{count?.checked}</text>
                      )}
                    </g>
                  );
                })}

                {/* Highlighted part indicator */}
                {highlightPartId && (() => {
                  const part = ALL_PARTS.find((p) => p.id === highlightPartId);
                  if (!part) return null;
                  const zone = ZONES.find((z) => z.id === part.zone);
                  if (!zone) return null;
                  const px = zone.svgX + (part.x / 100) * zone.svgW;
                  const py = zone.svgY + (part.y / 100) * zone.svgH;
                  return <circle cx={px} cy={py} r="5" fill="#ef4444" className="animate-pulse" />;
                })()}
              </svg>
            </div>

            {/* Zone list */}
            <div className="p-2 space-y-1">
              {ZONES.map((z) => {
                const count = zoneCounts[z.id];
                return (
                  <button key={z.id} type="button" onClick={() => setActiveZone(z.id)}
                    className="flex w-full items-center gap-2.5 p-2 rounded-md hover:bg-muted/30 text-start transition-colors">
                    <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="text-xs font-medium flex-1">{isAr ? z.labelAr : z.label}</span>
                    {count && count.checked > 0 && (
                      <span className="text-[9px] font-bold px-1.5 rounded" style={{ backgroundColor: z.color + "20", color: z.color }}>
                        {count.checked}/{count.total}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{z.parts.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Bulk: Select All / Clear All */}
            {totalChecked > 0 && (
              <div className="px-3 py-2 border-t border-border flex gap-2">
                <button type="button" onClick={() => onBulkAdd(ALL_PARTS.filter((p) => checkedParts.has(p.id)).map((p) => ({ id: p.id, name: p.name, price: p.price, zone: p.zoneLabel })))}
                  className="flex-1 flex items-center justify-center gap-1 rounded-md bg-green-600 text-white py-1.5 text-xs font-medium hover:bg-green-700">
                  <Package className="h-3 w-3" /> {isAr ? "إضافة المختار" : "Add Selected"} ({totalChecked})
                </button>
                <button type="button" onClick={() => ZONES.forEach((z) => onDeselectAllZone(z.id))}
                  className="flex items-center justify-center gap-1 rounded-md border border-border py-1.5 px-3 text-xs text-muted-foreground hover:text-destructive">
                  <RotateCcw className="h-3 w-3" /> {isAr ? "مسح" : "Clear"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ ZONE DETAIL: Exploded parts view ═══ */}
        {activeZone && activeZoneData && (
          <>
            {/* Zone actions */}
            <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 bg-muted/20">
              <span className="text-[10px] text-muted-foreground flex-1">
                {zoneCounts[activeZone]?.checked ?? 0}/{activeZoneData.parts.length} {isAr ? "مختار" : "selected"}
              </span>
              <button type="button" onClick={() => onSelectAllZone(activeZone)} className="text-[10px] text-primary font-medium hover:underline">
                {isAr ? "اختر الكل" : "Select All"}
              </button>
              <button type="button" onClick={() => onDeselectAllZone(activeZone)} className="text-[10px] text-muted-foreground hover:text-destructive">
                {isAr ? "إلغاء" : "Clear"}
              </button>
            </div>

            {/* Interactive parts diagram */}
            <div className="relative border-b border-border" style={{ paddingBottom: "70%" }}>
              <div className="absolute inset-0 bg-muted/10">
                {/* Zone background shape */}
                <div className="absolute inset-4 rounded-xl border-2 border-dashed" style={{ borderColor: activeZoneData.color + "30" }} />

                {/* Part dots */}
                {activeZoneData.parts.map((part) => {
                  const isChecked = checkedParts.has(part.id);
                  const isHighlight = highlightPartId === part.id;
                  const isHover = hoveredPart === part.id;
                  return (
                    <button key={part.id} type="button"
                      onClick={() => onTogglePart(part.id)}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      className="absolute transition-all"
                      style={{ left: `${part.x}%`, top: `${part.y}%`, transform: "translate(-50%,-50%)" }}>
                      {/* Dot */}
                      <div className={cn(
                        "rounded-full transition-all border-2",
                        isChecked ? "h-4 w-4" : "h-3 w-3",
                        isChecked ? "border-green-500 bg-green-500" :
                        isHighlight ? "border-red-500 bg-red-500 animate-pulse" :
                        "border-muted-foreground/40 bg-background hover:border-primary",
                      )}>
                        {isChecked && <Check className="h-2.5 w-2.5 text-white m-auto" style={{ marginTop: "1px" }} />}
                      </div>
                      {/* Tooltip */}
                      {(isHover || isHighlight) && (
                        <div className="absolute bottom-full mb-1 start-1/2 -translate-x-1/2 bg-foreground text-background rounded px-2 py-1 text-[9px] whitespace-nowrap font-medium z-10 shadow-lg">
                          {part.name}
                          {part.price && <span className="ms-1 text-green-300">{part.price} OMR</span>}
                          {part.oem && <span className="ms-1 text-blue-300">OEM</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parts list below diagram */}
            <div className="p-2 space-y-0.5">
              {activeZoneData.parts.map((part) => {
                const isChecked = checkedParts.has(part.id);
                return (
                  <button key={part.id} type="button" onClick={() => onTogglePart(part.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2 py-1.5 rounded text-start text-xs transition-colors",
                      isChecked ? "bg-green-50 dark:bg-green-950/10" : "hover:bg-muted/30"
                    )}>
                    <div className={cn(
                      "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isChecked ? "bg-green-500 border-green-500 text-white" : "border-border"
                    )}>
                      {isChecked && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span className={cn("flex-1 truncate", isChecked && "font-medium")}>{part.name}</span>
                    {part.oem && <span className="text-[7px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1 rounded font-bold">OEM</span>}
                    {part.price && <span className="text-[10px] font-bold text-green-600 shrink-0">{part.price}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Export zones and parts for use in other panels
export { ZONES, ALL_PARTS };
