"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Wrench, Search, ChevronDown, ChevronRight, Package, Star,
  Check, Filter, Car, Box,
} from "lucide-react";

// ─── Multi-level part tree ───
interface PartNode {
  id: string;
  name: string;
  count?: number;
  children?: PartNode[];
  // Leaf node (actual part)
  part?: {
    partNumber: string;
    brand: string;
    price: number;
    rating: number;
    inStock: boolean;
    oem: boolean;
    condition: string;
    fitment: string;
  };
}

// ─── Sample multi-level tree (like RockAuto) ───
const PART_TREE: PartNode[] = [
  { id: "brakes", name: "Brakes & Brake Parts", count: 12, children: [
    { id: "brk-front", name: "Front Brakes", count: 6, children: [
      { id: "brk-f-pads", name: "Brake Pads", count: 3, children: [
        { id: "p1", name: "Front Brake Pad Set — Brembo", part: { partNumber: "BRK-F001", brand: "Brembo", price: 45, rating: 4.8, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
        { id: "p2", name: "Front Brake Pad Set — TRW", part: { partNumber: "BRK-F002", brand: "TRW", price: 38, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
        { id: "p3", name: "Front Brake Pad Set — Toyota OEM", part: { partNumber: "BRK-F003", brand: "Toyota OEM", price: 65, rating: 4.9, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      ]},
      { id: "brk-f-rotors", name: "Brake Rotors", count: 2, children: [
        { id: "p4", name: "Front Brake Disc — ATE", part: { partNumber: "BRK-D001", brand: "ATE", price: 65, rating: 4.6, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
        { id: "p5", name: "Front Brake Disc — Brembo", part: { partNumber: "BRK-D002", brand: "Brembo", price: 72, rating: 4.7, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      ]},
      { id: "brk-f-caliper", name: "Brake Calipers", count: 1, children: [
        { id: "p6", name: "Front Caliper Left — Bosch", part: { partNumber: "BRK-C001", brand: "Bosch", price: 120, rating: 4.7, inStock: false, oem: true, condition: "NEW", fitment: "2020-2024" } },
      ]},
    ]},
    { id: "brk-rear", name: "Rear Brakes", count: 4, children: [
      { id: "brk-r-pads", name: "Brake Pads", count: 2, children: [
        { id: "p7", name: "Rear Brake Pad Set — TRW", part: { partNumber: "BRK-R001", brand: "TRW", price: 38, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
        { id: "p8", name: "Rear Brake Pad Set — Toyota OEM", part: { partNumber: "BRK-R002", brand: "Toyota OEM", price: 55, rating: 4.8, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      ]},
      { id: "brk-r-rotors", name: "Brake Rotors", count: 2, children: [
        { id: "p9", name: "Rear Brake Disc — ATE", part: { partNumber: "BRK-RD01", brand: "ATE", price: 55, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
        { id: "p10", name: "Rear Brake Disc — Bosch", part: { partNumber: "BRK-RD02", brand: "Bosch", price: 60, rating: 4.6, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      ]},
    ]},
    { id: "brk-lines", name: "Brake Lines & Hoses", count: 2, children: [
      { id: "p11", name: "Front Brake Hose — TRW", part: { partNumber: "BRK-H001", brand: "TRW", price: 15, rating: 4.4, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p12", name: "Brake Line Set — OEM", part: { partNumber: "BRK-L001", brand: "Toyota OEM", price: 35, rating: 4.7, inStock: true, oem: true, condition: "NEW", fitment: "2018-2024" } },
    ]},
  ]},
  { id: "engine", name: "Engine", count: 10, children: [
    { id: "eng-filters", name: "Filters", count: 3, children: [
      { id: "p13", name: "Oil Filter — Mann", part: { partNumber: "ENG-OF01", brand: "Mann", price: 8, rating: 4.9, inStock: true, oem: false, condition: "NEW", fitment: "2018-2024" } },
      { id: "p14", name: "Air Filter — K&N", part: { partNumber: "ENG-AF01", brand: "K&N", price: 22, rating: 4.7, inStock: true, oem: false, condition: "NEW", fitment: "2018-2024" } },
      { id: "p15", name: "Fuel Filter — Bosch", part: { partNumber: "ENG-FF01", brand: "Bosch", price: 18, rating: 4.6, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "eng-ignition", name: "Ignition", count: 3, children: [
      { id: "p16", name: "Spark Plug Set (4) — NGK", part: { partNumber: "ENG-SP01", brand: "NGK", price: 32, rating: 4.8, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      { id: "p17", name: "Ignition Coil — Denso", part: { partNumber: "ENG-IC01", brand: "Denso", price: 45, rating: 4.6, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      { id: "p18", name: "Ignition Coil Set (4) — Bosch", part: { partNumber: "ENG-IC02", brand: "Bosch", price: 140, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "eng-timing", name: "Timing", count: 2, children: [
      { id: "p19", name: "Timing Belt Kit — Gates", part: { partNumber: "ENG-TB01", brand: "Gates", price: 85, rating: 4.6, inStock: true, oem: false, condition: "NEW", fitment: "2018-2024" } },
      { id: "p20", name: "Timing Chain Kit — OEM", part: { partNumber: "ENG-TC01", brand: "Toyota OEM", price: 150, rating: 4.8, inStock: false, oem: true, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "eng-gaskets", name: "Gaskets & Seals", count: 2, children: [
      { id: "p21", name: "Head Gasket — Elring", part: { partNumber: "ENG-HG01", brand: "Bosch", price: 35, rating: 4.4, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p22", name: "Valve Cover Gasket — OEM", part: { partNumber: "ENG-VG01", brand: "Toyota OEM", price: 25, rating: 4.7, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
    ]},
  ]},
  { id: "electrical", name: "Electrical & Lighting", count: 6, children: [
    { id: "elc-charging", name: "Charging System", count: 2, children: [
      { id: "p23", name: "Alternator — Denso", part: { partNumber: "ELC-AL01", brand: "Denso", price: 180, rating: 4.5, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      { id: "p24", name: "Battery — Varta", part: { partNumber: "ELC-BT01", brand: "Bosch", price: 110, rating: 4.7, inStock: true, oem: false, condition: "NEW", fitment: "All" } },
    ]},
    { id: "elc-starting", name: "Starting System", count: 1, children: [
      { id: "p25", name: "Starter Motor — Denso", part: { partNumber: "ELC-SM01", brand: "Denso", price: 160, rating: 4.5, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "elc-lights", name: "Headlights & Lighting", count: 3, children: [
      { id: "p26", name: "Headlight Assembly Left — Depo", part: { partNumber: "ELC-HL01", brand: "Bosch", price: 95, rating: 4.3, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p27", name: "Headlight Assembly Right — Depo", part: { partNumber: "ELC-HR01", brand: "Bosch", price: 95, rating: 4.3, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p28", name: "Tail Light Assembly Left — OEM", part: { partNumber: "ELC-TL01", brand: "Toyota OEM", price: 120, rating: 4.6, inStock: false, oem: true, condition: "NEW", fitment: "2022-2024" } },
    ]},
  ]},
  { id: "suspension", name: "Suspension & Steering", count: 5, children: [
    { id: "sus-shocks", name: "Shocks & Struts", count: 2, children: [
      { id: "p29", name: "Front Shock Absorber — KYB", part: { partNumber: "SUS-SH01", brand: "KYB", price: 55, rating: 4.6, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p30", name: "Rear Shock Absorber — KYB", part: { partNumber: "SUS-SH02", brand: "KYB", price: 48, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "sus-arms", name: "Control Arms & Links", count: 2, children: [
      { id: "p31", name: "Front Lower Control Arm — Moog", part: { partNumber: "SUS-CA01", brand: "Moog", price: 75, rating: 4.4, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p32", name: "Stabilizer Link — TRW", part: { partNumber: "SUS-SL01", brand: "TRW", price: 22, rating: 4.3, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "sus-steering", name: "Steering", count: 1, children: [
      { id: "p33", name: "Power Steering Pump — OEM", part: { partNumber: "SUS-PS01", brand: "Toyota OEM", price: 200, rating: 4.6, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
    ]},
  ]},
  { id: "cooling", name: "Cooling System", count: 4, children: [
    { id: "cool-rad", name: "Radiator & Fans", count: 2, children: [
      { id: "p34", name: "Radiator — Nissens", part: { partNumber: "COL-RD01", brand: "Bosch", price: 140, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p35", name: "Cooling Fan — OEM", part: { partNumber: "COL-FN01", brand: "Toyota OEM", price: 85, rating: 4.6, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "cool-pump", name: "Water Pump & Thermostat", count: 2, children: [
      { id: "p36", name: "Water Pump — Aisin", part: { partNumber: "COL-WP01", brand: "Toyota OEM", price: 65, rating: 4.7, inStock: true, oem: true, condition: "NEW", fitment: "2020-2024" } },
      { id: "p37", name: "Thermostat — Wahler", part: { partNumber: "COL-TH01", brand: "Bosch", price: 18, rating: 4.6, inStock: true, oem: false, condition: "NEW", fitment: "2018-2024" } },
    ]},
  ]},
  { id: "body", name: "Body & Exterior", count: 3, children: [
    { id: "body-mirrors", name: "Mirrors", count: 1, children: [
      { id: "p38", name: "Side Mirror Left — TYC", part: { partNumber: "BDY-SM01", brand: "Bosch", price: 45, rating: 4.2, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "body-bumpers", name: "Bumpers", count: 1, children: [
      { id: "p39", name: "Front Bumper Cover — OEM", part: { partNumber: "BDY-FB01", brand: "Toyota OEM", price: 220, rating: 4.0, inStock: false, oem: true, condition: "NEW", fitment: "2022-2024" } },
    ]},
    { id: "body-fenders", name: "Fenders & Panels", count: 1, children: [
      { id: "p40", name: "Front Fender Left — Aftermarket", part: { partNumber: "BDY-FL01", brand: "TRW", price: 80, rating: 3.9, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
  ]},
  { id: "transmission", name: "Transmission & Drivetrain", count: 3, children: [
    { id: "trn-clutch", name: "Clutch", count: 1, children: [
      { id: "p41", name: "Clutch Kit — LuK", part: { partNumber: "TRN-CK01", brand: "LuK", price: 250, rating: 4.6, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
    { id: "trn-axle", name: "Axle & CV Joints", count: 2, children: [
      { id: "p42", name: "CV Axle Front Left — GKN", part: { partNumber: "TRN-CV01", brand: "GKN", price: 95, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
      { id: "p43", name: "CV Axle Front Right — GKN", part: { partNumber: "TRN-CV02", brand: "GKN", price: 95, rating: 4.5, inStock: true, oem: false, condition: "NEW", fitment: "2020-2024" } },
    ]},
  ]},
];

// ─── Recursive tree renderer ───
function TreeNode({ node, level, expanded, toggleExpand, selectedId, onSelect }: {
  node: PartNode; level: number; expanded: Set<string>;
  toggleExpand: (id: string) => void; selectedId: string | null;
  onSelect: (node: PartNode) => void;
}) {
  const isLeaf = !!node.part;
  const isExpanded = expanded.has(node.id);
  const isSelected = node.id === selectedId;
  const indent = level * 16;

  return (
    <>
      <button type="button"
        onClick={() => isLeaf ? onSelect(node) : toggleExpand(node.id)}
        className={cn(
          "flex w-full items-center gap-1.5 py-1.5 pe-3 text-start transition-colors border-b border-border/10",
          isSelected ? "bg-primary/5 border-s-2 border-s-primary" :
          isLeaf ? "hover:bg-muted/20" : "hover:bg-muted/30",
          level === 0 && "bg-muted/20 border-b-border/30"
        )}
        style={{ paddingInlineStart: `${indent + 8}px` }}>
        {/* Expand/collapse or leaf indicator */}
        {!isLeaf ? (
          isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <Box className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        )}

        {/* Name */}
        <span className={cn(
          "flex-1 truncate",
          isLeaf ? "text-xs" : level === 0 ? "text-xs font-bold uppercase tracking-wide" : "text-xs font-semibold",
          isSelected && "text-primary font-semibold"
        )}>
          {node.name}
        </span>

        {/* Leaf: part details inline */}
        {isLeaf && node.part && (
          <div className="flex items-center gap-1.5 shrink-0">
            {node.part.oem && <span className="text-[7px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-1 rounded font-bold">OEM</span>}
            <span className="text-[10px] font-bold text-green-600">{node.part.price}</span>
            <span className={cn("text-[9px]", node.part.inStock ? "text-green-600" : "text-destructive")}>
              {node.part.inStock ? "●" : "○"}
            </span>
          </div>
        )}

        {/* Branch: count */}
        {!isLeaf && node.count && (
          <span className="text-[10px] text-muted-foreground shrink-0">{node.count}</span>
        )}

        {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
      </button>

      {/* Children */}
      {isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} level={level + 1}
          expanded={expanded} toggleExpand={toggleExpand}
          selectedId={selectedId} onSelect={onSelect} />
      ))}
    </>
  );
}

// ─── Main panel ───
interface PartFinderPanelProps {
  vehicle: { make: string; model: string; year: string } | null;
  onSelectPart: (part: any) => void;
  selectedPartId: number | null;
  locale: string;
}

export default function PartFinderPanel({ vehicle, onSelectPart, selectedPartId, locale }: PartFinderPanelProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["brakes", "brk-front"]));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showOemOnly, setShowOemOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleSelect = (node: PartNode) => {
    setSelectedNodeId(node.id);
    if (node.part) {
      onSelectPart({
        id: node.id,
        name: node.name,
        partNumber: node.part.partNumber,
        brand: node.part.brand,
        price: node.part.price,
        rating: node.part.rating,
        inStock: node.part.inStock,
        oem: node.part.oem,
        condition: node.part.condition,
        fitment: node.part.fitment,
      });
    }
  };

  if (!vehicle) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <Wrench className="h-12 w-12 mb-3 opacity-10" />
          <h3 className="text-sm font-semibold mb-1">{isAr ? "محدد القطع" : "Part Finder"}</h3>
          <p className="text-xs text-center opacity-60 max-w-[200px]">
            {isAr ? "اختر ماركة ← موديل ← سنة" : "Select Make → Model → Year"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Vehicle header */}
      <div className="px-3 py-2 border-b border-border shrink-0 bg-primary/5">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">{vehicle.year} {vehicle.make} {vehicle.model}</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="px-3 py-2 border-b border-border shrink-0 space-y-1.5">
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث عن قطعة..." : "Search part name or number..."}
            className="w-full rounded-md border bg-background ps-8 pe-3 py-1.5 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-[10px] cursor-pointer text-muted-foreground">
            <input type="checkbox" checked={showOemOnly} onChange={(e) => setShowOemOnly(e.target.checked)} className="rounded border-border h-3 w-3" />
            OEM
          </label>
          <label className="flex items-center gap-1 text-[10px] cursor-pointer text-muted-foreground">
            <input type="checkbox" checked={showInStockOnly} onChange={(e) => setShowInStockOnly(e.target.checked)} className="rounded border-border h-3 w-3" />
            {isAr ? "متوفر" : "In Stock"}
          </label>
          <span className="flex-1" />
          <button type="button" onClick={() => setExpanded(new Set(PART_TREE.map(n => n.id)))} className="text-[10px] text-primary hover:underline">
            {isAr ? "توسيع الكل" : "Expand All"}
          </button>
          <button type="button" onClick={() => setExpanded(new Set())} className="text-[10px] text-muted-foreground hover:underline">
            {isAr ? "طي الكل" : "Collapse"}
          </button>
        </div>
      </div>

      {/* Multi-level tree */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {PART_TREE.map((node) => (
          <TreeNode key={node.id} node={node} level={0}
            expanded={expanded} toggleExpand={toggleExpand}
            selectedId={selectedNodeId} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
