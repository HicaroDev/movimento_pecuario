"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChartData } from "@/lib/queries/reports";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";
import type { DashboardFilters, ConsumptionRecord } from "@/types";
import {
  FileSpreadsheet,
  CalendarDays,
  Filter,
  X,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SupplementRow = {
  pastureName: string;
  quantity: number;
  supplementName: string;
  periodDays: number;
  sacks25: number;
  kgConsumed: number;
  consumptionKgCabDay: number;
};

type SupplementSection = {
  supplementName: string;
  chartColor: string;
  rows: SupplementRow[];
  weightedAverage: number;
  quantityTotal: number;
};

type MonthOption = {
  key: string;
  label: string;
  month: number;
  year: number;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTH_SHORT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

const MONTH_FULL = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(value: number, decimals = 3): string {
  return value.toFixed(decimals).replace(".", ",");
}

function monthToDateRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

/** Colour mapping matching the client's Excel spreadsheet */
function colorBySupplement(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("energético") || n.includes("energetico")) return "#0b6b45";
  if (n.includes("proteico") || n.includes("proteinado")) return "#1b7a3d";
  if (n.includes("mineral")) return "#0b2748";
  if (n.includes("creep")) return "#6b2fa0";
  if (n.includes("ração") || n.includes("racao") || n.includes("engorda"))
    return "#8b3a00";
  return "#0b6b45";
}

/**
 * Builds one section per supplement type — identical to GRAFICOS tab.
 *
 * Columns: PASTO | QUANTIDADE | TIPO DE SUPLEMENTO | PERÍODO (dias) |
 *          SACOS (25 kg) | KG CONSUMIDOS NO PERÍODO | CONSUMO (kg/cab dia)
 *
 * Weighted average = SUMPRODUCT(consumption × período) / SUM(período)
 * Rows maintain original data order (not sorted by value).
 */
function buildSections(records: ConsumptionRecord[]): SupplementSection[] {
  const bySupplement = new Map<string, ConsumptionRecord[]>();
  for (const r of records) {
    const s = r.supplement?.name?.trim();
    if (!s) continue;
    if (!bySupplement.has(s)) bySupplement.set(s, []);
    bySupplement.get(s)!.push(r);
  }

  const sections: SupplementSection[] = [];

  for (const [supplementName, recs] of bySupplement.entries()) {
    const byPasture = new Map<string, ConsumptionRecord[]>();
    for (const r of recs) {
      const p = r.pasture?.name?.trim();
      if (!p) continue;
      if (!byPasture.has(p)) byPasture.set(p, []);
      byPasture.get(p)!.push(r);
    }

    const rows: SupplementRow[] = [];

    for (const [pastureName, pRecs] of byPasture.entries()) {
      const quantity = pRecs.reduce((s, r) => s + (r.lot_size || 0), 0);
      const kgConsumed = pRecs.reduce(
        (s, r) => s + (r.consumption_kg || 0),
        0
      );
      const periodDays = pRecs.reduce(
        (s, r) => s + (r.days_count || 0),
        0
      );
      const sacks25 = kgConsumed > 0 ? Math.round(kgConsumed / 25) : 0;
      const consVals = pRecs
        .map((r) => r.consumption_per_animal_day || 0)
        .filter((v) => v > 0);
      const consumptionKgCabDay =
        consVals.length > 0
          ? consVals.reduce((s, v) => s + v, 0) / consVals.length
          : 0;

      rows.push({
        pastureName,
        quantity,
        supplementName,
        periodDays,
        sacks25,
        kgConsumed,
        consumptionKgCabDay,
      });
    }

    // Keep original data order — NOT sorted by value (matches Excel table order)

    const totalPeriod = rows.reduce((s, r) => s + r.periodDays, 0);
    const weightedAverage =
      totalPeriod > 0
        ? rows.reduce(
            (s, r) => s + r.consumptionKgCabDay * r.periodDays,
            0
          ) / totalPeriod
        : 0;

    const quantityTotal = rows.reduce((s, r) => s + r.quantity, 0);

    sections.push({
      supplementName,
      chartColor: colorBySupplement(supplementName),
      rows,
      weightedAverage,
      quantityTotal,
    });
  }

  return sections.sort((a, b) =>
    a.supplementName.localeCompare(b.supplementName)
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RelatoriosPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [chartRecords, setChartRecords] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedSupplement, setSelectedSupplement] = useState<string | null>(
    null
  );

  // Filter options
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableSupplements, setAvailableSupplements] = useState<
    { id: string; name: string }[]
  >([]);

  /* ---- Profile ---- */
  useEffect(() => {
    getProfile().then((p) => {
      if (p) setOrgId(p.organization_id);
    });
  }, []);

  /* ---- Load filter options ---- */
  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();

    (async () => {
      // Available months from existing records
      const { data: dateData } = await supabase
        .from("consumption_records")
        .select("closing_date")
        .eq("organization_id", orgId);

      const monthsMap = new Map<string, { month: number; year: number }>();
      for (const r of dateData || []) {
        const d = new Date(r.closing_date + "T00:00:00");
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const key = `${y}-${String(m).padStart(2, "0")}`;
        if (!monthsMap.has(key)) monthsMap.set(key, { month: m, year: y });
      }

      const months = Array.from(monthsMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, val]) => ({
          key,
          label: `${MONTH_SHORT[val.month - 1]}/${String(val.year).slice(2)}`,
          ...val,
        }));
      setAvailableMonths(months);

      // Auto-select most recent month
      if (months.length > 0) {
        setSelectedMonth(months[0].key);
      }

      // Divisions
      const { data: farms } = await supabase
        .from("farms")
        .select("id")
        .eq("organization_id", orgId);

      if (farms && farms.length > 0) {
        const { data: divs } = await supabase
          .from("divisions")
          .select("id, name")
          .in(
            "farm_id",
            farms.map((f: { id: string }) => f.id)
          )
          .order("name");
        setAvailableDivisions(divs || []);
      }

      // Supplements
      const { data: supps } = await supabase
        .from("supplements")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name");
      setAvailableSupplements(supps || []);
    })();
  }, [orgId]);

  /* ---- Load report data ---- */
  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const filters: DashboardFilters = {
      dateStart: null,
      dateEnd: null,
      farmId: null,
      divisionId: selectedDivision,
      pastureId: null,
      supplementId: selectedSupplement,
      forageTypeId: null,
      month: null,
    };

    if (selectedMonth) {
      const range = monthToDateRange(selectedMonth);
      filters.dateStart = range.start;
      filters.dateEnd = range.end;
    }

    const records = await getChartData(orgId, filters);
    setChartRecords(records);
    setLoading(false);
  }, [orgId, selectedMonth, selectedDivision, selectedSupplement]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- Derived data ---- */
  const uniqueFarms = Array.from(
    new Set(
      chartRecords.map((r) => r.farm?.name).filter((v): v is string => !!v)
    )
  );
  const farmLabel = uniqueFarms.length >= 1 ? uniqueFarms.join(", ") : "";

  const periodFull = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split("-").map(Number);
        return `${MONTH_FULL[m - 1]} ${y}`;
      })()
    : "";

  const periodShort = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split("-").map(Number);
        return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
      })()
    : "";

  const periodYear = selectedMonth ? selectedMonth.split("-")[0] : "";

  const sections = buildSections(chartRecords);

  // Summary data for page 1
  const summaryData = sections.map((s) => ({
    name: s.supplementName,
    value: s.weightedAverage,
    color: s.chartColor,
  }));

  /* ---- Actions ---- */
  const handleExportPdf = () => window.print();

  const handleExportExcel = () => {
    const excelRows = chartRecords.map((r) => ({
      "DATA FECHAMENTO": r.closing_date,
      FAZENDA: r.farm?.name || "",
      RETIRO: r.division?.name || "",
      PASTO: r.pasture?.name || "",
      FORRAGEM: r.forage_type?.name || "",
      "TIPO DE SUPLEMENTO": r.supplement?.name || "",
      QUANTIDADE: r.lot_size || "",
      "PERIODO (dias)": r.days_count || "",
      "KG CONSUMIDOS NO PERIODO": r.consumption_kg || "",
      "CONSUMO (kg/cab dia)": r.consumption_per_animal_day || "",
      OBSERVACOES: r.notes || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    const tag =
      uniqueFarms.length === 1
        ? uniqueFarms[0].replace(/\s+/g, "_")
        : "relatorio";
    XLSX.writeFile(
      wb,
      `relatorio_consumo_${tag}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const clearFilters = () => {
    setSelectedMonth(null);
    setSelectedDivision(null);
    setSelectedSupplement(null);
  };

  const hasFilters = selectedMonth || selectedDivision || selectedSupplement;

  /* ---- Render ---- */
  if (!orgId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-content, #report-content * { visibility: visible; }
          #report-content {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 0;
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>

      <div className="space-y-5">
        {/* ======== TOOLBAR ======== */}
        <div className="flex items-center justify-between no-print">
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button size="sm" onClick={handleExportPdf}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
        </div>

        {/* ======== MODERN FILTERS ======== */}
        <Card className="no-print shadow-sm border-gray-200">
          <CardContent className="pt-5 pb-4 space-y-4">
            {/* Month chips */}
            {availableMonths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Período
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableMonths.map((m) => (
                    <button
                      key={m.key}
                      onClick={() =>
                        setSelectedMonth(
                          selectedMonth === m.key ? null : m.key
                        )
                      }
                      className={`
                        px-4 py-1.5 rounded-full text-xs font-semibold
                        transition-all duration-150 cursor-pointer
                        ${
                          selectedMonth === m.key
                            ? "bg-gray-900 text-white shadow-md scale-105"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        }
                      `}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdown filters */}
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex items-center gap-2 mr-1 pb-1">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <div className="w-52">
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Retiro
                </label>
                <Select
                  value={selectedDivision || "all"}
                  onValueChange={(v) =>
                    setSelectedDivision(v === "all" ? null : v)
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos os retiros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os retiros</SelectItem>
                    {availableDivisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-60">
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Suplemento
                </label>
                <Select
                  value={selectedSupplement || "all"}
                  onValueChange={(v) =>
                    setSelectedSupplement(v === "all" ? null : v)
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos os suplementos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os suplementos</SelectItem>
                    {availableSupplements.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-9 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============ PRINTABLE REPORT ============ */}
        <div id="report-content" className="space-y-5">
          {loading ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Carregando dados...
              </CardContent>
            </Card>
          ) : sections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                <p className="text-lg">Sem dados para o recorte selecionado.</p>
                <p className="text-sm mt-2">
                  Selecione um período ou ajuste os filtros acima.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ======================================================= */}
              {/*  PAGE 1 — SUMMARY (averages per supplement type)         */}
              {/* ======================================================= */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                <h2 className="text-center font-extrabold text-lg tracking-wide text-gray-800 uppercase">
                  CONSUMO KG/CAB DIA — MÉDIAS CONSUMO
                </h2>
                <p className="text-center text-sm font-bold text-gray-500 mt-1 mb-8">
                  {farmLabel ? farmLabel.toUpperCase() : ""}
                  {periodShort ? ` — ${periodShort}` : ""}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-center">
                  {/* Left: summary table */}
                  <table className="w-full text-sm">
                    <tbody>
                      {sections.map((s) => (
                        <tr
                          key={s.supplementName}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-3 pr-3 font-medium text-gray-700">
                            {s.supplementName}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-900 tabular-nums text-base">
                            {fmt(s.weightedAverage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Right: summary bar chart */}
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summaryData}
                        margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e5e5"
                        />
                        <XAxis
                          dataKey="name"
                          fontSize={12}
                          tick={{ fill: "#333" }}
                          axisLine={{ stroke: "#ccc" }}
                        />
                        <YAxis
                          tickFormatter={(v) => fmt(Number(v))}
                          domain={[0, "auto"]}
                          fontSize={11}
                          tick={{ fill: "#999" }}
                          axisLine={{ stroke: "#ccc" }}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `${fmt(Number(value))} kg/cab dia`,
                            "Média",
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={100}
                        >
                          <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(v: unknown) => fmt(Number(v))}
                            fontSize={14}
                            fontWeight="bold"
                            fill="#333"
                          />
                          {summaryData.map((item, idx) => (
                            <Cell key={idx} fill={item.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/*  PAGES 2-4 — PER-SUPPLEMENT SECTIONS                     */}
              {/* ======================================================= */}
              {sections.map((section, idx) => (
                <div
                  key={section.supplementName}
                  className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${idx >= 0 ? "print-break" : ""}`}
                >
                  {/* ---- Green sheet header (like Excel top bar) ---- */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ backgroundColor: "#0b6b45" }}
                  >
                    <span className="text-white text-sm font-bold tracking-wide">
                      CONTROLE DE CONSUMO SUPLEMENTOS —{" "}
                      {farmLabel
                        ? farmLabel.toUpperCase()
                        : "FAZENDA"}{" "}
                      {periodYear}
                    </span>
                    <span className="text-white text-xs font-bold text-right leading-tight">
                      MOVIMENTO
                      <br />
                      PECUÁRIO
                    </span>
                  </div>

                  <div className="p-6">
                    {/* Section title */}
                    <h3
                      className="text-center font-extrabold text-lg mb-6 uppercase tracking-wide"
                      style={{ color: section.chartColor }}
                    >
                      CONSUMO KG/CAB DIA —{" "}
                      {section.supplementName.toUpperCase()}
                      {periodFull ? ` (${periodFull})` : ""}
                    </h3>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(440px,540px)_1fr] gap-6 items-start">
                      {/* ---- Left: data table ---- */}
                      <div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px] border-collapse">
                            <thead>
                              <tr
                                style={{
                                  borderBottom: `1px solid #000`,
                                }}
                              >
                                <th className="py-2 text-left font-bold">
                                  PASTO
                                </th>
                                <th className="py-2 text-right font-bold w-20">
                                  QUANTIDADE
                                </th>
                                <th className="py-2 text-left font-bold pl-3">
                                  TIPO DE SUPLEMENTO
                                </th>
                                <th className="py-2 text-right font-bold w-20">
                                  PERÍODO
                                  <br />
                                  <span className="font-normal text-[10px] text-gray-400">
                                    (dias)
                                  </span>
                                </th>
                                <th className="py-2 text-right font-bold w-16">
                                  SACOS
                                  <br />
                                  <span className="font-normal text-[10px] text-gray-400">
                                    (25 kg)
                                  </span>
                                </th>
                                <th className="py-2 text-right font-bold w-20">
                                  KG CONSUMIDOS
                                  <br />
                                  <span className="font-normal text-[10px] text-gray-400">
                                    NO PERÍODO
                                  </span>
                                </th>
                                <th className="py-2 text-right font-bold w-24">
                                  CONSUMO
                                  <br />
                                  <span className="font-normal text-[10px] text-gray-400">
                                    (kg/cab dia)
                                  </span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map((row, ri) => (
                                <tr
                                  key={row.pastureName}
                                  className={`border-b border-gray-50 ${
                                    ri % 2 === 0 ? "bg-gray-50/40" : ""
                                  }`}
                                >
                                  <td className="py-1.5 pr-2 font-medium text-gray-800">
                                    {row.pastureName}
                                  </td>
                                  <td className="py-1.5 text-right text-gray-600 tabular-nums">
                                    {row.quantity || ""}
                                  </td>
                                  <td className="py-1.5 pl-3 text-gray-400">
                                    {row.supplementName}
                                  </td>
                                  <td className="py-1.5 text-right text-gray-600 tabular-nums">
                                    {row.periodDays || ""}
                                  </td>
                                  <td className="py-1.5 text-right text-gray-600 tabular-nums">
                                    {row.sacks25 > 0 ? row.sacks25 : ""}
                                  </td>
                                  <td className="py-1.5 text-right text-gray-600 tabular-nums">
                                    {row.kgConsumed > 0
                                      ? Math.round(row.kgConsumed)
                                      : ""}
                                  </td>
                                  <td className="py-1.5 text-right font-semibold text-gray-900 tabular-nums">
                                    {row.consumptionKgCabDay > 0
                                      ? fmt(row.consumptionKgCabDay)
                                      : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary row — "684  média 0,748" */}
                        <div className="flex justify-between items-center mt-4 pt-3 px-1 text-sm font-bold border-t border-gray-300">
                          <span className="text-gray-700">
                            {section.quantityTotal}
                          </span>
                          <span className="text-gray-700">
                            média{" "}
                            <span className="text-gray-900">
                              {fmt(section.weightedAverage)}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* ---- Right: bar chart ---- */}
                      <div
                        className="min-h-[350px]"
                        style={{
                          height: Math.max(
                            380,
                            section.rows.length * 38 + 140
                          ),
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={section.rows.map((r) => ({
                              name: r.pastureName,
                              value: r.consumptionKgCabDay,
                            }))}
                            margin={{
                              top: 25,
                              right: 10,
                              left: 10,
                              bottom: 95,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e5e5e5"
                            />
                            <XAxis
                              dataKey="name"
                              angle={-40}
                              textAnchor="end"
                              interval={0}
                              height={95}
                              fontSize={10}
                              tick={{ fill: "#333" }}
                              axisLine={{ stroke: "#ccc" }}
                            />
                            <YAxis
                              tickFormatter={(v) => fmt(Number(v))}
                              domain={[0, "auto"]}
                              fontSize={11}
                              tick={{ fill: "#999" }}
                              axisLine={{ stroke: "#ccc" }}
                            />
                            <Tooltip
                              formatter={(value) => [
                                `${fmt(Number(value))} kg/cab dia`,
                                "Consumo",
                              ]}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                            {/* Red average line */}
                            <ReferenceLine
                              y={section.weightedAverage}
                              stroke="#ff0000"
                              strokeWidth={2}
                              label={{
                                value: `média ${fmt(section.weightedAverage)}`,
                                position: "right",
                                fill: "#ff0000",
                                fontSize: 11,
                                fontWeight: "bold",
                              }}
                            />
                            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                              <LabelList
                                dataKey="value"
                                position="top"
                                formatter={(v: unknown) => fmt(Number(v))}
                                fontSize={10}
                                fill="#333"
                              />
                              {section.rows.map((row) => (
                                <Cell
                                  key={row.pastureName}
                                  fill={section.chartColor}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
