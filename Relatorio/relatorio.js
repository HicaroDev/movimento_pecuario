const {
  loadData,
  getDefaultData,
  supplementOrder,
  groupByType,
  averageConsumo,
  sumQuantidade,
  fmt,
  fmtInt,
} = window.SuplementoData;

function renderSummaryTable(summary) {
  const tbody = document.getElementById("summary-table");
  tbody.innerHTML = "";
  summary.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td class="num">${fmt(item.value)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildTable(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
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
    tbody.appendChild(tr);
  });
}

function renderTotals(targetId, totalQtd, avg) {
  const el = document.getElementById(targetId);
  el.innerHTML = `<span>${fmtInt(totalQtd)}</span><span>m\u00e9dia ${fmt(avg)}</span>`;
}

function renderBarChart(container, labels, values, options) {
  const rect = container.getBoundingClientRect();
  const width = rect.width || 560;
  const height = rect.height || 320;
  const margin = { top: 20, right: 10, bottom: 95, left: 50 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const maxVal = options.max;
  const step = options.step;
  const avg = options.avg;
  const color = options.color;

  const scaleY = (v) => margin.top + (1 - v / maxVal) * h;
  const barWidth = w / values.length;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  const ticks = Math.round(maxVal / step);
  for (let i = 0; i <= ticks; i++) {
    const v = step * i;
    const y = scaleY(v);
    const line = document.createElementNS(svg.namespaceURI, "line");
    line.setAttribute("x1", margin.left);
    line.setAttribute("x2", width - margin.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#e5e5e5");
    svg.appendChild(line);

    const text = document.createElementNS(svg.namespaceURI, "text");
    text.setAttribute("x", margin.left - 6);
    text.setAttribute("y", y + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("font-size", "11");
    text.textContent = fmt(v);
    svg.appendChild(text);
  }

  if (typeof avg === "number") {
    const avgY = scaleY(avg);
    const avgLine = document.createElementNS(svg.namespaceURI, "line");
    avgLine.setAttribute("x1", margin.left);
    avgLine.setAttribute("x2", width - margin.right);
    avgLine.setAttribute("y1", avgY);
    avgLine.setAttribute("y2", avgY);
    avgLine.setAttribute("stroke", "#ff0000");
    avgLine.setAttribute("stroke-width", "2");
    svg.appendChild(avgLine);
  }

  values.forEach((v, i) => {
    const x = margin.left + i * barWidth + barWidth * 0.25;
    const barW = barWidth * 0.5;
    const y = scaleY(v);
    const barH = margin.top + h - y;
    const rectEl = document.createElementNS(svg.namespaceURI, "rect");
    rectEl.setAttribute("x", x);
    rectEl.setAttribute("y", y);
    rectEl.setAttribute("width", barW);
    rectEl.setAttribute("height", barH);
    rectEl.setAttribute("fill", color);
    svg.appendChild(rectEl);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", x + barW / 2);
    label.setAttribute("y", y - 6);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.textContent = fmt(v);
    svg.appendChild(label);

    const xLabel = document.createElementNS(svg.namespaceURI, "text");
    xLabel.setAttribute("x", x + barW / 2);
    xLabel.setAttribute("y", height - 8);
    xLabel.setAttribute("text-anchor", "end");
    xLabel.setAttribute("font-size", "10");
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

function renderReport(rows) {
  const groups = groupByType(rows);

  const summary = supplementOrder.map((name) => ({
    name,
    value: averageConsumo(groups[name]),
  }));

  renderSummaryTable(summary);

  renderBarChart(
    document.querySelector('[data-chart="summary"]'),
    summary.map((s) => s.name),
    summary.map((s) => s.value),
    { max: 0.8, step: 0.1, avg: null, color: "#0b6b45" }
  );

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
    renderBarChart(
      document.querySelector(`[data-chart="${section.key}"]`),
      rowsForType.map((r) => r[0]),
      rowsForType.map((r) => r[6]),
      {
        max: section.max,
        step: section.step,
        avg: averageConsumo(rowsForType),
        color: section.color,
      }
    );
  });
}

const loaded = loadData();
const data = loaded ? loaded.rows : getDefaultData().rows;
renderReport(data);
