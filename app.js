const fallbackSampleRows = [
  ["Cana", 30, "Energ\u00e9tico 0,3%", 30, 96, 2400, 0.842],
  ["Tamboril", 30, "Energ\u00e9tico 0,3%", 30, 48, 1200, 1.0],
  ["Sujo 1", 40, "Energ\u00e9tico 0,3%", 30, 54, 1350, 1.452],
  ["Mama de Baixo Piquete 2", 117, "Energ\u00e9tico 0,3%", 30, 16, 400, 0.833],
  ["Mama de Baixo Piquete 1", 98, "Energ\u00e9tico 0,3%", 30, 44, 1100, 0.78],
  ["Palhad\u00e3o do Meio", 31, "Energ\u00e9tico 0,3%", 30, 70, 1750, 0.729],
  ["Rio do Ouro de Baixo", 64, "Energ\u00e9tico 0,3%", 30, 120, 3000, 0.862],
  ["Rio do Ouro de Cima", 80, "Energ\u00e9tico 0,3%", 30, 40, 1000, 0.45],
  ["Pequi 2", 20, "Energ\u00e9tico 0,3%", 30, 45, 1125, 0.586],
  ["Jo\u00e3o Jacinto de Cima", 74, "Energ\u00e9tico 0,3%", 30, 40, 1000, 0.606],
  ["Da Maternidade", 34, "Energ\u00e9tico 0,3%", 30, 38, 950, 0.772],
  ["Ponte Cima", 36, "Energ\u00e9tico 0,3%", 30, 28, 700, 0.496],
  ["Luizinho", 30, "Energ\u00e9tico 0,3%", 30, 25, 625, 0.326],
  ["Boiada Gorda", 97, "Mineral Adensado \u00c1guas", 30, 18, 450, 0.155],
  ["Divaldo", 174, "Mineral Adensado \u00c1guas", 30, 30, 750, 0.144],
  ["Pasto do Braquiar\u00e3o", 57, "Mineral Adensado \u00c1guas", 30, 12, 300, 0.175],
  ["Jo\u00e3o Jacinto de Baixo", 78, "Mineral Adensado \u00c1guas", 30, 15, 375, 0.16],
  ["Tucuz\u00e3o Braqui\u00e1ra", 85, "Mineral Adensado \u00c1guas", 30, 17, 425, 0.167],
  ["Da Pedra", 82, "Mineral Adensado \u00c1guas", 30, 15, 375, 0.152],
  ["Tamboril", 40, "Ra\u00e7\u00e3o Creep", 30, 27, 675, 0.563],
  ["Boiada Gorda", 94, "Ra\u00e7\u00e3o Creep", 30, 9, 225, 0.08],
  ["Rio do Ouro de Cima", 75, "Ra\u00e7\u00e3o Creep", 30, 75, 1875, 0.833],
  ["Pasto do Braquiar\u00e3o", 56, "Ra\u00e7\u00e3o Creep", 30, 25, 625, 0.372],
  ["Jo\u00e3o Jacinto de Cima", 53, "Ra\u00e7\u00e3o Creep", 30, 20, 500, 0.314],
  ["Tucuz\u00e3o Braqui\u00e1ra", 82, "Ra\u00e7\u00e3o Creep", 30, 20, 500, 0.203],
  ["Da Pedra", 80, "Ra\u00e7\u00e3o Creep", 30, 20, 500, 0.208],
  ["Da Maternidade", 39, "Ra\u00e7\u00e3o Creep", 30, 12, 300, 0.256],
  ["Ponte Cima", 45, "Ra\u00e7\u00e3o Creep", 30, 16, 400, 0.296],
];

const supplementOrder = [
  "Energ\u00e9tico 0,3%",
  "Mineral Adensado \u00c1guas",
  "Ra\u00e7\u00e3o Creep",
];

/* Colour per supplement type (matches the Excel PDF exactly) */
const supplementColors = {
  "Energ\u00e9tico 0,3%": "#0b6b45",
  "Mineral Adensado \u00c1guas": "#0b2748",
  "Ra\u00e7\u00e3o Creep": "#6b2fa0",
};

const storageKey = "suplementoControlData";

function loadData() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveData(rows) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ rows, updatedAt: new Date().toISOString() })
    );
  } catch {}
}

function fmt(value, decimals = 3) {
  return Number(value).toFixed(decimals).replace(".", ",");
}

function fmtInt(value) {
  return String(Math.round(Number(value)));
}

function groupByType(rows) {
  const groups = {};
  supplementOrder.forEach((t) => {
    groups[t] = [];
  });
  rows.forEach((row) => {
    if (!groups[row[2]]) groups[row[2]] = [];
    groups[row[2]].push(row);
  });
  return groups;
}

function averageConsumo(rows) {
  if (!rows.length) return 0;
  const total = rows.reduce((acc, r) => acc + Number(r[6] || 0), 0);
  return total / rows.length;
}

function sumQuantidade(rows) {
  return rows.reduce((acc, r) => acc + Number(r[1] || 0), 0);
}

/* ================================================================ */
/*  DOM references                                                   */
/* ================================================================ */

const state = { rows: [] };

const inputs = {
  pasto: document.getElementById("pasto"),
  quantidade: document.getElementById("quantidade"),
  tipo: document.getElementById("tipo"),
  periodo: document.getElementById("periodo"),
  sacos: document.getElementById("sacos"),
  kg: document.getElementById("kg"),
  consumo: document.getElementById("consumo"),
};

const tbody = document.getElementById("rows");

const filterSupplement = document.getElementById("filter-supplement");
const filterPasto = document.getElementById("filter-pasto");
const filterPeriodo = document.getElementById("filter-periodo");

/* ================================================================ */
/*  Tab switching                                                    */
/* ================================================================ */

function activateTab(targetId) {
  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.toggle("active", section.id === targetId);
  });
  document.querySelectorAll(".side-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === targetId);
  });
  if (targetId === "relatorio") {
    renderReport(state.rows);
  }
}

/* ================================================================ */
/*  Form handling                                                    */
/* ================================================================ */

function resetInputs() {
  inputs.pasto.value = "";
  inputs.quantidade.value = "";
  inputs.periodo.value = "30";
  inputs.sacos.value = "";
  inputs.kg.value = "";
  inputs.consumo.value = "";
}

function readInputs() {
  const pasto = inputs.pasto.value.trim();
  const quantidade = Number(inputs.quantidade.value || 0);
  const tipo = inputs.tipo.value;
  const periodo = Number(inputs.periodo.value || 0);
  const sacos = Number(inputs.sacos.value || 0);
  const kg = Number(inputs.kg.value || 0);
  const consumo = Number(inputs.consumo.value || 0);
  if (!pasto) return null;
  return [pasto, quantidade, tipo, periodo, sacos, kg, consumo];
}

function renderRows() {
  tbody.innerHTML = "";
  state.rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row[0]}</td>
      <td class="num">${fmtInt(row[1])}</td>
      <td>${row[2]}</td>
      <td class="num">${fmtInt(row[3])}</td>
      <td class="num">${fmtInt(row[4])}</td>
      <td class="num">${fmtInt(row[5])}</td>
      <td class="num">${fmt(row[6])}</td>
      <td><button class="badge-delete" data-index="${index}">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function addRow() {
  const row = readInputs();
  if (!row) return;
  state.rows.push(row);
  renderRows();
  resetInputs();
  refreshFilters();
}

function removeRow(index) {
  state.rows.splice(index, 1);
  renderRows();
  refreshFilters();
}

function saveAll() {
  saveData(state.rows);
}

function clearAll() {
  state.rows = [];
  renderRows();
  saveAll();
  refreshFilters();
}

/* ================================================================ */
/*  Report: summary table + KPI cards                                */
/* ================================================================ */

function renderSummaryTable(summary) {
  const stbody = document.getElementById("summary-table");
  stbody.innerHTML = "";
  summary.forEach((item) => {
    const color = supplementColors[item.name] || "#333";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:8px;vertical-align:middle"></span>${item.name}</td>
      <td class="num" style="color:${color}">${fmt(item.value)}</td>
    `;
    stbody.appendChild(tr);
  });

  document.getElementById("summary-energetico").textContent = fmt(
    summary.find((s) => s.name === "Energ\u00e9tico 0,3%")?.value || 0
  );
  document.getElementById("summary-mineral").textContent = fmt(
    summary.find((s) => s.name === "Mineral Adensado \u00c1guas")?.value || 0
  );
  document.getElementById("summary-creep").textContent = fmt(
    summary.find((s) => s.name === "Ra\u00e7\u00e3o Creep")?.value || 0
  );

  // Update badge counts
  const groups = groupByType(getFilteredRows(state.rows));
  document.getElementById("badge-energetico").textContent =
    (groups["Energ\u00e9tico 0,3%"]?.length || 0) + " pastos";
  document.getElementById("badge-mineral").textContent =
    (groups["Mineral Adensado \u00c1guas"]?.length || 0) + " pastos";
  document.getElementById("badge-creep").textContent =
    (groups["Ra\u00e7\u00e3o Creep"]?.length || 0) + " pastos";
}

/* ================================================================ */
/*  Report: data tables + totals                                     */
/* ================================================================ */

function buildTable(tbodyId, rows) {
  const el = document.getElementById(tbodyId);
  el.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r[0]}</td>
      <td class="num">${fmtInt(r[1])}</td>
      <td>${r[2]}</td>
      <td class="num">${fmtInt(r[3])}</td>
      <td class="num">${fmtInt(r[4])}</td>
      <td class="num">${fmtInt(r[5])}</td>
      <td class="num">${fmt(r[6])}</td>
    `;
    el.appendChild(tr);
  });
}

function renderTotals(targetId, totalQtd, avg) {
  const el = document.getElementById(targetId);
  el.innerHTML = `<span>Total cabe\u00e7as: <strong>${fmtInt(totalQtd)}</strong></span><span>M\u00e9dia consumo: <strong>${fmt(avg)}</strong> kg/cab dia</span>`;
}

/* ================================================================ */
/*  SVG bar chart renderer                                           */
/*  options.colors = per-bar colour array (overrides options.color)  */
/* ================================================================ */

function renderBarChart(container, labels, values, options) {
  const rect = container.getBoundingClientRect();
  const width = rect.width || 560;
  const height = rect.height || 340;
  const margin = { top: 24, right: 14, bottom: 95, left: 52 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const maxVal = options.max;
  const step = options.step;
  const avg = options.avg;
  const defaultColor = options.color || "#0b6b45";
  const perBarColors = options.colors; // optional array

  const scaleY = (v) => margin.top + (1 - v / maxVal) * h;
  const barWidth = Math.max(40, w / Math.max(values.length, 1));
  const barPad = 0.2; // 20% padding each side

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.display = "block";

  // Grid lines + Y labels
  const ticks = Math.round(maxVal / step);
  for (let i = 0; i <= ticks; i++) {
    const v = +(step * i).toFixed(6);
    const y = scaleY(v);

    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", margin.left);
    line.setAttribute("x2", width - margin.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#ececec");
    svg.appendChild(line);

    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", margin.left - 8);
    text.setAttribute("y", y + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("font-size", "11");
    text.setAttribute("fill", "#999");
    text.textContent = fmt(v);
    svg.appendChild(text);
  }

  // Red average line + label
  if (typeof avg === "number" && avg > 0) {
    const avgY = scaleY(avg);
    const avgLine = document.createElementNS(NS, "line");
    avgLine.setAttribute("x1", margin.left);
    avgLine.setAttribute("x2", width - margin.right);
    avgLine.setAttribute("y1", avgY);
    avgLine.setAttribute("y2", avgY);
    avgLine.setAttribute("stroke", "#e53e3e");
    avgLine.setAttribute("stroke-width", "2");
    avgLine.setAttribute("stroke-dasharray", "6 3");
    svg.appendChild(avgLine);

    const avgLabel = document.createElementNS(NS, "text");
    avgLabel.setAttribute("x", width - margin.right - 4);
    avgLabel.setAttribute("y", avgY - 6);
    avgLabel.setAttribute("text-anchor", "end");
    avgLabel.setAttribute("font-size", "10");
    avgLabel.setAttribute("font-weight", "700");
    avgLabel.setAttribute("fill", "#e53e3e");
    avgLabel.textContent = `m\u00e9dia ${fmt(avg)}`;
    svg.appendChild(avgLabel);
  }

  // Bars + labels
  values.forEach((v, i) => {
    const x = margin.left + i * barWidth + barWidth * barPad;
    const barW = barWidth * (1 - 2 * barPad);
    const y = scaleY(v);
    const barH = Math.max(0, margin.top + h - y);
    const barColor = (perBarColors && perBarColors[i]) || defaultColor;

    const rectEl = document.createElementNS(NS, "rect");
    rectEl.setAttribute("x", x);
    rectEl.setAttribute("y", y);
    rectEl.setAttribute("width", barW);
    rectEl.setAttribute("height", barH);
    rectEl.setAttribute("fill", barColor);
    rectEl.setAttribute("rx", "3");
    svg.appendChild(rectEl);

    // Value label on top
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x + barW / 2);
    label.setAttribute("y", y - 6);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("font-weight", "700");
    label.setAttribute("fill", "#333");
    label.textContent = fmt(v);
    svg.appendChild(label);

    // X-axis label (rotated)
    const xLabel = document.createElementNS(NS, "text");
    xLabel.setAttribute("x", x + barW / 2);
    xLabel.setAttribute("y", height - 8);
    xLabel.setAttribute("text-anchor", "end");
    xLabel.setAttribute("font-size", "10");
    xLabel.setAttribute("fill", "#555");
    xLabel.setAttribute(
      "transform",
      `rotate(-40 ${x + barW / 2} ${height - 8})`
    );
    xLabel.textContent = labels[i];
    svg.appendChild(xLabel);
  });

  container.innerHTML = "";
  container.appendChild(svg);
}

/* ================================================================ */
/*  Filters                                                          */
/* ================================================================ */

function getFilteredRows(rows) {
  const supplement = filterSupplement.value;
  const pasto = filterPasto.value;
  const periodo = filterPeriodo.value;
  return rows.filter((row) => {
    if (supplement && row[2] !== supplement) return false;
    if (pasto && row[0] !== pasto) return false;
    if (periodo && String(row[3]) !== periodo) return false;
    return true;
  });
}

function refreshFilters() {
  const pastos = Array.from(new Set(state.rows.map((r) => r[0]))).sort();
  filterPasto.innerHTML = '<option value="">Todos</option>';
  pastos.forEach((pasto) => {
    const option = document.createElement("option");
    option.value = pasto;
    option.textContent = pasto;
    filterPasto.appendChild(option);
  });
}

/* ================================================================ */
/*  renderReport — main orchestrator                                 */
/* ================================================================ */

function renderReport(rows) {
  const filtered = getFilteredRows(rows);
  const groups = groupByType(filtered);

  const summary = supplementOrder.map((name) => ({
    name,
    value: averageConsumo(groups[name]),
  }));

  renderSummaryTable(summary);

  // Summary chart — each bar gets its own colour (green / navy / purple)
  const summaryMax = Math.max(...summary.map((s) => s.value), 0.1);
  const niceMax = Math.ceil(summaryMax * 10) / 10 + 0.1;
  renderBarChart(
    document.querySelector('[data-chart="summary"]'),
    summary.map((s) => s.name),
    summary.map((s) => s.value),
    {
      max: niceMax,
      step: +(niceMax / 10).toFixed(3),
      avg: null,
      color: "#0b6b45",
      colors: summary.map((s) => supplementColors[s.name] || "#0b6b45"),
    }
  );

  // Per-supplement sections
  const sections = [
    {
      key: "energetico",
      name: "Energ\u00e9tico 0,3%",
      max: 1.5,
      step: 0.05,
      color: "#0b6b45",
      tableId: "table-energetico",
      totalId: "total-energetico",
    },
    {
      key: "mineral",
      name: "Mineral Adensado \u00c1guas",
      max: 0.2,
      step: 0.02,
      color: "#0b2748",
      tableId: "table-mineral",
      totalId: "total-mineral",
    },
    {
      key: "creep",
      name: "Ra\u00e7\u00e3o Creep",
      max: 1.0,
      step: 0.1,
      color: "#6b2fa0",
      tableId: "table-creep",
      totalId: "total-creep",
    },
  ];

  sections.forEach((section) => {
    const rowsForType = groups[section.name] || [];
    buildTable(section.tableId, rowsForType);
    renderTotals(
      section.totalId,
      sumQuantidade(rowsForType),
      averageConsumo(rowsForType)
    );

    // Auto-calculate max if data exceeds preset
    const dataMax = Math.max(...rowsForType.map((r) => r[6]), 0);
    const chartMax = dataMax > section.max ? Math.ceil(dataMax * 10) / 10 + 0.1 : section.max;
    const chartStep = dataMax > section.max ? +(chartMax / 10).toFixed(3) : section.step;

    renderBarChart(
      document.querySelector(`[data-chart="${section.key}"]`),
      rowsForType.map((r) => r[0]),
      rowsForType.map((r) => r[6]),
      {
        max: chartMax,
        step: chartStep,
        avg: averageConsumo(rowsForType),
        color: section.color,
      }
    );
  });
}

/* ================================================================ */
/*  Init                                                             */
/* ================================================================ */

function init() {
  const loaded = loadData();
  if (loaded && Array.isArray(loaded.rows) && loaded.rows.length) {
    state.rows = loaded.rows;
  } else {
    state.rows = fallbackSampleRows;
    saveData(state.rows);
  }
  renderRows();
  refreshFilters();
  renderReport(state.rows);

  document.querySelectorAll(".side-link").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.target));
  });

  document.getElementById("add-row").addEventListener("click", addRow);
  document.getElementById("save").addEventListener("click", saveAll);
  document.getElementById("clear-all").addEventListener("click", clearAll);
  document.getElementById("load-sample").addEventListener("click", () => {
    state.rows = fallbackSampleRows;
    renderRows();
    refreshFilters();
    renderReport(state.rows);
  });

  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.index) {
      removeRow(Number(target.dataset.index));
    }
  });

  filterSupplement.addEventListener("change", () => renderReport(state.rows));
  filterPasto.addEventListener("change", () => renderReport(state.rows));
  filterPeriodo.addEventListener("change", () => renderReport(state.rows));

  document.getElementById("print-report").addEventListener("click", () => {
    activateTab("relatorio");
    setTimeout(() => window.print(), 200);
  });
}

init();
