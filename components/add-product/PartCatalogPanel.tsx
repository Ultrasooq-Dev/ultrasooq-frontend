"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Car, ChevronRight, ChevronDown, Search, Box, Wrench,
  Check, Flag, Package,
} from "lucide-react";

// ─── Universal tree node — supports unlimited levels ───
interface TreeNode {
  id: string;
  name: string;
  flag?: string;
  count?: number;
  searchable?: boolean; // shows search box at this level
  children?: TreeNode[];
  // Leaf node = actual part
  part?: {
    partNumber: string;
    brand: string;
    price: number;
    rating: number;
    inStock: boolean;
    oem: boolean;
    condition: string;
  };
}

// ─── Full RockAuto-style tree: Make → Year → Model → Engine → Category → Sub → Part ───
const CATALOG: TreeNode[] = [
  { id: "toyota", name: "TOYOTA", flag: "🇯🇵", children: [
    { id: "toy-2024", name: "2024", children: [
      { id: "toy-24-camry", name: "Camry", children: [
        { id: "toy-24-cam-25", name: "2.5L 4Cyl", searchable: true, children: [
          { id: "brk", name: "Brake & Wheel Hub", count: 12, children: [
            { id: "brk-pads", name: "Brake Pad", count: 5, children: [
              { id: "brk-fp", name: "Front Pad Set", count: 3, children: [
                { id: "bp1", name: "Brembo P83148N", part: { partNumber: "P83148N", brand: "Brembo", price: 45, rating: 4.8, inStock: true, oem: false, condition: "NEW" } },
                { id: "bp2", name: "Toyota OEM 04465-06200", part: { partNumber: "04465-06200", brand: "Toyota", price: 65, rating: 4.9, inStock: true, oem: true, condition: "NEW" } },
                { id: "bp3", name: "TRW GDB3604", part: { partNumber: "GDB3604", brand: "TRW", price: 38, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
              ]},
              { id: "brk-rp", name: "Rear Pad Set", count: 2, children: [
                { id: "bp4", name: "TRW GDB3610", part: { partNumber: "GDB3610", brand: "TRW", price: 35, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
                { id: "bp5", name: "Toyota OEM 04466-06210", part: { partNumber: "04466-06210", brand: "Toyota", price: 55, rating: 4.8, inStock: true, oem: true, condition: "NEW" } },
              ]},
            ]},
            { id: "brk-rotor", name: "Brake Rotor", count: 4, children: [
              { id: "brk-fr", name: "Front Rotor", count: 2, children: [
                { id: "br1", name: "ATE 24.0128-0289.1", part: { partNumber: "24.0128-0289.1", brand: "ATE", price: 65, rating: 4.6, inStock: true, oem: true, condition: "NEW" } },
                { id: "br2", name: "Brembo 09.D491.11", part: { partNumber: "09.D491.11", brand: "Brembo", price: 72, rating: 4.7, inStock: true, oem: false, condition: "NEW" } },
              ]},
              { id: "brk-rr", name: "Rear Rotor", count: 2, children: [
                { id: "br3", name: "ATE 24.0128-0294.1", part: { partNumber: "24.0128-0294.1", brand: "ATE", price: 55, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
                { id: "br4", name: "Bosch BD2380", part: { partNumber: "BD2380", brand: "Bosch", price: 60, rating: 4.6, inStock: true, oem: true, condition: "NEW" } },
              ]},
            ]},
            { id: "brk-caliper", name: "Brake Caliper", count: 2, children: [
              { id: "bc1", name: "Bosch 0986135433 (Front L)", part: { partNumber: "0986135433", brand: "Bosch", price: 120, rating: 4.7, inStock: false, oem: true, condition: "NEW" } },
              { id: "bc2", name: "TRW BHS1432 (Front R)", part: { partNumber: "BHS1432", brand: "TRW", price: 115, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
            ]},
            { id: "brk-hose", name: "Brake Hose", count: 1, children: [
              { id: "bh1", name: "TRW PHD1234", part: { partNumber: "PHD1234", brand: "TRW", price: 15, rating: 4.4, inStock: true, oem: false, condition: "NEW" } },
            ]},
          ]},
          { id: "cool", name: "Cooling System", count: 4, children: [
            { id: "cool-rad", name: "Radiator", count: 2, children: [
              { id: "cr1", name: "Nissens 68752", part: { partNumber: "68752", brand: "Nissens", price: 140, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
              { id: "cr2", name: "Toyota OEM 16400-0P370", part: { partNumber: "16400-0P370", brand: "Toyota", price: 210, rating: 4.8, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "cool-wp", name: "Water Pump", count: 1, children: [
              { id: "cw1", name: "Aisin WPT-190", part: { partNumber: "WPT-190", brand: "Aisin", price: 65, rating: 4.7, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "cool-th", name: "Thermostat", count: 1, children: [
              { id: "ct1", name: "Wahler 4552.87D", part: { partNumber: "4552.87D", brand: "Wahler", price: 18, rating: 4.6, inStock: true, oem: false, condition: "NEW" } },
            ]},
          ]},
          { id: "eng", name: "Engine", count: 8, children: [
            { id: "eng-oil", name: "Oil Filter", count: 2, children: [
              { id: "ef1", name: "Mann W712/95", part: { partNumber: "W712/95", brand: "Mann", price: 8, rating: 4.9, inStock: true, oem: false, condition: "NEW" } },
              { id: "ef2", name: "Toyota OEM 90915-YZZD1", part: { partNumber: "90915-YZZD1", brand: "Toyota", price: 12, rating: 4.9, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "eng-air", name: "Air Filter", count: 1, children: [
              { id: "ea1", name: "K&N 33-5096", part: { partNumber: "33-5096", brand: "K&N", price: 22, rating: 4.7, inStock: true, oem: false, condition: "NEW" } },
            ]},
            { id: "eng-spark", name: "Spark Plug", count: 2, children: [
              { id: "es1", name: "NGK ILKAR7B11 (Set of 4)", part: { partNumber: "ILKAR7B11", brand: "NGK", price: 32, rating: 4.8, inStock: true, oem: true, condition: "NEW" } },
              { id: "es2", name: "Denso FK20HBR-S8 (Set of 4)", part: { partNumber: "FK20HBR-S8", brand: "Denso", price: 36, rating: 4.7, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "eng-timing", name: "Timing Belt/Chain", count: 1, children: [
              { id: "et1", name: "Gates TCK333 Kit", part: { partNumber: "TCK333", brand: "Gates", price: 85, rating: 4.6, inStock: true, oem: false, condition: "NEW" } },
            ]},
            { id: "eng-igncoil", name: "Ignition Coil", count: 2, children: [
              { id: "eic1", name: "Denso 673-1307", part: { partNumber: "673-1307", brand: "Denso", price: 45, rating: 4.6, inStock: true, oem: true, condition: "NEW" } },
              { id: "eic2", name: "Bosch 0221504029 (Set of 4)", part: { partNumber: "0221504029", brand: "Bosch", price: 140, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
            ]},
          ]},
          { id: "elec", name: "Electrical-Bulb & Socket", count: 5, children: [
            { id: "elec-alt", name: "Alternator", count: 1, children: [
              { id: "eal1", name: "Denso 210-0789", part: { partNumber: "210-0789", brand: "Denso", price: 180, rating: 4.5, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "elec-start", name: "Starter Motor", count: 1, children: [
              { id: "est1", name: "Denso 428000-7580", part: { partNumber: "428000-7580", brand: "Denso", price: 160, rating: 4.5, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "elec-head", name: "Headlight", count: 3, children: [
              { id: "eh1", name: "Depo 312-11C1L (Left)", part: { partNumber: "312-11C1L", brand: "Depo", price: 95, rating: 4.3, inStock: true, oem: false, condition: "NEW" } },
              { id: "eh2", name: "Depo 312-11C1R (Right)", part: { partNumber: "312-11C1R", brand: "Depo", price: 95, rating: 4.3, inStock: true, oem: false, condition: "NEW" } },
              { id: "eh3", name: "Toyota OEM 81150-06E80 (Left)", part: { partNumber: "81150-06E80", brand: "Toyota", price: 280, rating: 4.8, inStock: false, oem: true, condition: "NEW" } },
            ]},
          ]},
          { id: "steer", name: "Steering", count: 2, children: [
            { id: "steer-pump", name: "Power Steering Pump", count: 1, children: [
              { id: "sp1", name: "Toyota OEM 44310-06100", part: { partNumber: "44310-06100", brand: "Toyota", price: 200, rating: 4.6, inStock: true, oem: true, condition: "NEW" } },
            ]},
            { id: "steer-rack", name: "Steering Rack", count: 1, children: [
              { id: "sr1", name: "Bosch KS01000549", part: { partNumber: "KS01000549", brand: "Bosch", price: 350, rating: 4.4, inStock: false, oem: false, condition: "NEW" } },
            ]},
          ]},
          { id: "susp", name: "Suspension", count: 3, children: [
            { id: "susp-shock", name: "Shock Absorber", count: 2, children: [
              { id: "ss1", name: "KYB 339232 (Front)", part: { partNumber: "339232", brand: "KYB", price: 55, rating: 4.6, inStock: true, oem: false, condition: "NEW" } },
              { id: "ss2", name: "KYB 349212 (Rear)", part: { partNumber: "349212", brand: "KYB", price: 48, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
            ]},
            { id: "susp-arm", name: "Control Arm", count: 1, children: [
              { id: "sa1", name: "Moog RK621356", part: { partNumber: "RK621356", brand: "Moog", price: 75, rating: 4.4, inStock: true, oem: false, condition: "NEW" } },
            ]},
          ]},
          { id: "trans", name: "Transmission", count: 2, children: [
            { id: "trans-clutch", name: "Clutch Kit", count: 1, children: [
              { id: "tc1", name: "LuK 06-075", part: { partNumber: "06-075", brand: "LuK", price: 250, rating: 4.6, inStock: true, oem: false, condition: "NEW" } },
            ]},
            { id: "trans-cv", name: "CV Axle", count: 1, children: [
              { id: "tcv1", name: "GKN 303459 (Front Left)", part: { partNumber: "303459", brand: "GKN", price: 95, rating: 4.5, inStock: true, oem: false, condition: "NEW" } },
            ]},
          ]},
        ]},
        { id: "toy-24-cam-35", name: "3.5L V6", searchable: true, children: [] },
      ]},
      { id: "toy-24-corolla", name: "Corolla", children: [
        { id: "toy-24-cor-18", name: "1.8L 4Cyl", searchable: true, children: [] },
        { id: "toy-24-cor-20", name: "2.0L 4Cyl", searchable: true, children: [] },
      ]},
      { id: "toy-24-rav4", name: "RAV4", children: [
        { id: "toy-24-rav-25", name: "2.5L 4Cyl", searchable: true, children: [] },
      ]},
      { id: "toy-24-hilux", name: "Hilux", children: [
        { id: "toy-24-hil-28d", name: "2.8L Diesel", searchable: true, children: [] },
      ]},
      { id: "toy-24-lc", name: "Land Cruiser", children: [
        { id: "toy-24-lc-35tt", name: "3.5L V6 Twin Turbo", searchable: true, children: [] },
      ]},
    ]},
    { id: "toy-2023", name: "2023", children: [] },
    { id: "toy-2022", name: "2022", children: [] },
    { id: "toy-2021", name: "2021", children: [] },
    { id: "toy-2020", name: "2020", children: [] },
  ]},
  { id: "nissan", name: "NISSAN", flag: "🇯🇵", children: [
    { id: "nis-2024", name: "2024", children: [
      { id: "nis-24-patrol", name: "Patrol", children: [
        { id: "nis-24-pat-56", name: "5.6L V8", searchable: true, children: [] },
      ]},
      { id: "nis-24-xtrail", name: "X-Trail", children: [
        { id: "nis-24-xt-25", name: "2.5L 4Cyl", searchable: true, children: [] },
      ]},
    ]},
    { id: "nis-2023", name: "2023", children: [] },
  ]},
  { id: "hyundai", name: "HYUNDAI", flag: "🇰🇷", children: [
    { id: "hyu-2024", name: "2024", children: [
      { id: "hyu-24-tucson", name: "Tucson", children: [
        { id: "hyu-24-tuc-25", name: "2.5L 4Cyl", searchable: true, children: [] },
      ]},
    ]},
  ]},
  { id: "bmw", name: "BMW", flag: "🇩🇪", children: [
    { id: "bmw-2024", name: "2024", children: [
      { id: "bmw-24-3", name: "3 Series", children: [
        { id: "bmw-24-3-20i", name: "2.0L Turbo (320i)", searchable: true, children: [] },
      ]},
    ]},
  ]},
  { id: "honda", name: "HONDA", flag: "🇯🇵", children: [] },
  { id: "kia", name: "KIA", flag: "🇰🇷", children: [] },
  { id: "ford", name: "FORD", flag: "🇺🇸", children: [] },
  { id: "chevrolet", name: "CHEVROLET", flag: "🇺🇸", children: [] },
  { id: "mercedes", name: "MERCEDES-BENZ", flag: "🇩🇪", children: [] },
  { id: "audi", name: "AUDI", flag: "🇩🇪", children: [] },
  { id: "lexus", name: "LEXUS", flag: "🇯🇵", children: [] },
  { id: "mitsubishi", name: "MITSUBISHI", flag: "🇯🇵", children: [] },
];

// A-Z index
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Collect all leaf IDs under a node
function collectLeafIds(node: TreeNode): string[] {
  if (node.part) return [node.id];
  return (node.children ?? []).flatMap(collectLeafIds);
}

// Check state for a branch: "all" | "some" | "none"
function branchCheckState(node: TreeNode, checked: Set<string>): "all" | "some" | "none" {
  const leaves = collectLeafIds(node);
  if (leaves.length === 0) return "none";
  const checkedCount = leaves.filter((id) => checked.has(id)).length;
  if (checkedCount === 0) return "none";
  if (checkedCount === leaves.length) return "all";
  return "some";
}

// Selection mode per node: "none" | "self" | "some" | "all"
type SelectMode = "none" | "self" | "some" | "all";

// Colors per mode
const MODE_COLORS: Record<SelectMode, { bg: string; border: string; icon: string; label: string }> = {
  none: { bg: "", border: "border-border", icon: "", label: "" },
  self: { bg: "bg-orange-500", border: "border-orange-500", icon: "text-white", label: "Self" },
  some: { bg: "bg-blue-400", border: "border-blue-400", icon: "text-white", label: "Some" },
  all: { bg: "bg-primary", border: "border-primary", icon: "text-primary-foreground", label: "All" },
};

// ─── Recursive tree renderer — unlimited depth + 4-mode select ───
function Node({ node, level, expanded, toggle, selectedId, onSelect, checked, nodeMode, onCheck, onSetMode }: {
  node: TreeNode; level: number; expanded: Set<string>;
  toggle: (id: string) => void; selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  checked: Set<string>;
  nodeMode: Record<string, SelectMode>;
  onCheck: (ids: string[], value: boolean) => void;
  onSetMode: (id: string, mode: SelectMode) => void;
}) {
  const isLeaf = !!node.part;
  const isOpen = expanded.has(node.id);
  const isSel = node.id === selectedId;
  const hasKids = node.children && node.children.length > 0;
  const indent = level * 14;

  const isChecked = isLeaf ? checked.has(node.id) : false;
  const mode = nodeMode[node.id] ?? "none";
  const branchState = !isLeaf ? branchCheckState(node, checked) : undefined;

  // Show selector on categories (level >= 4) and all leaves
  const showSelect = isLeaf || (level >= 4 && hasKids);

  // Cycle: none → self → all → none (for branches)
  // Simple toggle for leaves
  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLeaf) {
      onCheck([node.id], !checked.has(node.id));
      return;
    }
    const leaves = collectLeafIds(node);
    if (mode === "none") {
      // → self (select category itself, not children)
      onSetMode(node.id, "self");
      onCheck([node.id], true);
    } else if (mode === "self") {
      // → all (select all children)
      onSetMode(node.id, "all");
      onCheck([node.id, ...leaves], true);
    } else {
      // → none (deselect everything)
      onSetMode(node.id, "none");
      onCheck([node.id, ...leaves], false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex w-full items-center gap-1 py-1 pe-2 text-start border-b border-border/10 transition-colors",
          isSel && "bg-primary/5",
          isLeaf ? "hover:bg-muted/20" : "hover:bg-muted/30",
          level === 0 && !isLeaf && "py-1.5"
        )}
        style={{ paddingInlineStart: `${indent + 6}px` }}>

        {/* Selection indicator */}
        {showSelect && (
          <button type="button" onClick={handleCycle} className="shrink-0 flex items-center justify-center" title={
            isLeaf ? (isChecked ? "Deselect" : "Select") :
            mode === "none" ? "Click: select as category" :
            mode === "self" ? "Click: select all children" :
            "Click: deselect"
          }>
            <div className={cn(
              "h-4 w-4 rounded border flex items-center justify-center transition-colors text-[7px] font-bold",
              isLeaf && isChecked ? "bg-primary border-primary text-primary-foreground" :
              !isLeaf && mode !== "none" ? `${MODE_COLORS[mode].bg} ${MODE_COLORS[mode].border} ${MODE_COLORS[mode].icon}` :
              !isLeaf && branchState === "some" ? "bg-blue-400/50 border-blue-400 text-white" :
              "border-border"
            )}>
              {isLeaf && isChecked && <Check className="h-3 w-3" />}
              {!isLeaf && mode === "self" && "S"}
              {!isLeaf && mode === "all" && <Check className="h-3 w-3" />}
              {!isLeaf && mode === "none" && branchState === "some" && <div className="h-1.5 w-1.5 bg-white rounded-sm" />}
            </div>
          </button>
        )}

        {/* Expand/collapse + name */}
        <button type="button" onClick={() => isLeaf ? onSelect(node) : toggle(node.id)} className="flex flex-1 items-center gap-1 min-w-0">
          {!isLeaf && hasKids ? (
            isOpen ? <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
          ) : isLeaf ? null : (
            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/20" />
          )}

          {node.flag && <span className="text-xs shrink-0">{node.flag}</span>}

          <span className={cn(
            "flex-1 truncate",
            level === 0 ? "text-xs font-bold" :
            isLeaf ? "text-[11px]" :
            "text-xs font-medium",
            isSel && "text-primary font-semibold"
          )}>
            {node.name}
          </span>
        </button>

        {/* Part info */}
        {isLeaf && node.part && (
          <span className="flex items-center gap-1 shrink-0">
            {node.part.oem && <span className="text-[7px] bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-0.5 rounded font-bold">OEM</span>}
            <span className="text-[10px] font-bold text-green-600">{node.part.price}</span>
            <span className={cn("text-[8px]", node.part.inStock ? "text-green-500" : "text-red-400")}>●</span>
          </span>
        )}

        {/* Mode badge for branches */}
        {!isLeaf && mode === "self" && (
          <span className="text-[7px] bg-orange-100 dark:bg-orange-900/20 text-orange-600 px-1 rounded font-bold shrink-0">SELF</span>
        )}
        {!isLeaf && mode === "all" && (
          <span className="text-[7px] bg-primary/10 text-primary px-1 rounded font-bold shrink-0">ALL</span>
        )}

        {!isLeaf && node.count && <span className="text-[9px] text-muted-foreground shrink-0">{node.count}</span>}
      </div>

      {/* Search box at engine level */}
      {isOpen && node.searchable && (
        <div className="border-b border-border/20" style={{ paddingInlineStart: `${indent + 20}px`, paddingInlineEnd: 8, paddingTop: 4, paddingBottom: 4 }}>
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input type="text" placeholder="part name or part type"
              className="w-full rounded border bg-background ps-7 pe-2 py-1 text-[11px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      )}

      {/* Recursion */}
      {isOpen && node.children?.map((child) => (
        <Node key={child.id} node={child} level={level + 1}
          expanded={expanded} toggle={toggle}
          selectedId={selectedId} onSelect={onSelect}
          checked={checked} nodeMode={nodeMode} onCheck={onCheck} onSetMode={onSetMode} />
      ))}
    </>
  );
}

// ─── Main panel ───
interface PartCatalogPanelProps {
  onSelectVehicle: (make: string, model: string, year: string) => void;
  onSelectPart?: (part: any) => void;
  selectedVehicle: { make: string; model: string; year: string } | null;
  locale: string;
}

export default function PartCatalogPanel({ onSelectVehicle, onSelectPart, selectedVehicle, locale }: PartCatalogPanelProps) {
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [nodeMode, setNodeMode] = useState<Record<string, SelectMode>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleCheck = (ids: string[], value: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const id of ids) { if (value) next.add(id); else next.delete(id); }
      return next;
    });
  };

  const handleSetMode = (id: string, mode: SelectMode) => {
    setNodeMode((prev) => ({ ...prev, [id]: mode }));
  };

  const handleSelect = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    if (node.part && onSelectPart) {
      onSelectPart({ id: node.id, name: node.name, ...node.part });
    }
  };

  // Collect all checked parts for bulk action
  const checkedParts: { id: string; name: string; price: number }[] = [];
  const findCheckedParts = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.part && checked.has(n.id)) checkedParts.push({ id: n.id, name: n.name, price: n.part.price });
      if (n.children) findCheckedParts(n.children);
    }
  };
  findCheckedParts(CATALOG);

  // Filter by search or letter
  const filtered = CATALOG.filter((make) => {
    if (selectedLetter && !make.name.startsWith(selectedLetter)) return false;
    if (search && !make.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full min-h-0">
      {/* Main tree */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 border-e border-border">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{isAr ? "كتالوج القطع" : "Part Catalog"}</span>
            <span className="flex-1" />
            <button type="button" onClick={() => setExpanded(new Set())} className="text-[9px] text-muted-foreground hover:underline">
              {isAr ? "طي الكل" : "Collapse"}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedLetter(null); }}
              placeholder={isAr ? "ابحث عن ماركة..." : "year make model part type or part number"}
              className="w-full rounded-md border bg-background ps-7 pe-2 py-1.5 text-xs placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Bulk action bar — shows when parts are checked */}
        {checkedParts.length > 0 && (
          <div className="px-3 py-2 border-b border-primary/20 bg-primary/5 shrink-0 flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary flex-1">
              {checkedParts.length} {isAr ? "قطعة مختارة" : "parts selected"}
              <span className="ms-1 text-green-600 font-bold">
                ({checkedParts.reduce((s, p) => s + p.price, 0)} OMR)
              </span>
            </span>
            <button type="button" onClick={() => {
              // Add all checked to product list
              checkedParts.forEach((p) => {
                const node = { id: p.id, name: p.name } as TreeNode;
                // Find full node to get part data
                const findNode = (nodes: TreeNode[]): TreeNode | null => {
                  for (const n of nodes) {
                    if (n.id === p.id) return n;
                    if (n.children) { const f = findNode(n.children); if (f) return f; }
                  }
                  return null;
                };
                const full = findNode(CATALOG);
                if (full) handleSelect(full);
              });
              setChecked(new Set());
              setNodeMode({});
            }}
              className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-medium">
              <Package className="h-3 w-3" /> {isAr ? "إضافة الكل" : "Add All"}
            </button>
            <button type="button" onClick={() => { setChecked(new Set()); setNodeMode({}); }}
              className="text-[10px] text-muted-foreground hover:text-destructive">
              {isAr ? "مسح" : "Clear"}
            </button>
          </div>
        )}

        {/* Tree */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.map((node) => (
            <Node key={node.id} node={node} level={0}
              expanded={expanded} toggle={toggle}
              selectedId={selectedNodeId} onSelect={handleSelect}
              checked={checked} nodeMode={nodeMode} onCheck={handleCheck} onSetMode={handleSetMode} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Car className="h-8 w-8 mb-2 opacity-15" />
              <p className="text-xs">{isAr ? "لا توجد نتائج" : "No makes found"}</p>
            </div>
          )}
        </div>
      </div>

      {/* A-Z sidebar */}
      <div className="w-5 shrink-0 flex flex-col items-center py-0.5 overflow-y-auto bg-muted/10">
        {ALPHABET.map((letter) => {
          const has = CATALOG.some((m) => m.name.startsWith(letter));
          return (
            <button key={letter} type="button" disabled={!has}
              onClick={() => { setSelectedLetter(selectedLetter === letter ? null : letter); setSearch(""); }}
              className={cn("text-[8px] font-bold w-4 h-3.5 flex items-center justify-center",
                selectedLetter === letter ? "text-primary bg-primary/10 rounded" :
                has ? "text-foreground hover:text-primary" : "text-muted-foreground/20")}>
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
