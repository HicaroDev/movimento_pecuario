const dashboard = {
  stats: {
    views: { value: 12450, change: 15.8 },
    revenue: { value: 363.95, change: -34.0 },
    bounce: { value: 86.5, change: 24.2 },
  },
  salesOverview: {
    total: 9257.51,
    months: ["Oct", "Nov", "Dec"],
    series: [
      { name: "China", color: "#4338ca", values: [1200, 560, 1450] },
      { name: "UAE", color: "#7c6cff", values: [980, 420, 1310] },
      { name: "USA", color: "#3b82f6", values: [610, 360, 970] },
      { name: "Canada", color: "#22c1c3", values: [430, 260, 560] },
      { name: "Other", color: "#a8f0e6", values: [210, 165, 310] },
    ],
  },
  subscribers: {
    total: 24473,
    change: { pct: 8.3, delta: 749 },
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    values: [1200, 1800, 3874, 1400, 2100, 1600, 2400],
  },
  distribution: {
    labels: ["Website", "Mobile App", "Other"],
    values: [374.82, 241.6, 213.42],
    colors: ["#4338ca", "#22c1c3", "#e5e7eb"],
  },
  integrations: [
    { name: "Stripe", type: "Finance", rate: 40, profit: 650, badge: "S", color: "blue" },
    { name: "Zapier", type: "CRM", rate: 80, profit: 720.5, badge: "Z", color: "orange" },
    { name: "Shopify", type: "Marketplace", rate: 20, profit: 432.25, badge: "Sh", color: "green" },
  ],
};

const fmtNumber = (value) =>
  new Intl.NumberFormat("en-US").format(value);

const fmtMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderLegend(container, series) {
  container.innerHTML = "";
  series.forEach((s) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="dot" style="background:${s.color}"></span>${s.name}`;
    container.appendChild(item);
  });
}

function renderStackedBars(container, months, series) {
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 260;
  const padding = { top: 16, right: 18, bottom: 36, left: 36 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const totals = months.map((_, i) =>
    series.reduce((sum, s) => sum + s.values[i], 0)
  );
  const maxVal = Math.max(...totals) * 1.1;
  const barWidth = w / months.length;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (h / 4) * i;
    const line = document.createElementNS(svg.namespaceURI, "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#edf0f6");
    svg.appendChild(line);
  }

  months.forEach((label, i) => {
    let stackY = padding.top + h;
    series.forEach((s) => {
      const v = s.values[i];
      const barH = (v / maxVal) * h;
      const rect = document.createElementNS(svg.namespaceURI, "rect");
      rect.setAttribute("x", padding.left + i * barWidth + barWidth * 0.2);
      rect.setAttribute("y", stackY - barH);
      rect.setAttribute("width", barWidth * 0.6);
      rect.setAttribute("height", barH);
      rect.setAttribute("rx", 8);
      rect.setAttribute("fill", s.color);
      svg.appendChild(rect);
      stackY -= barH;
    });

    const totalLabel = document.createElementNS(svg.namespaceURI, "text");
    totalLabel.setAttribute("x", padding.left + i * barWidth + barWidth * 0.5);
    totalLabel.setAttribute("y", stackY - 8);
    totalLabel.setAttribute("text-anchor", "middle");
    totalLabel.setAttribute("font-size", "11");
    totalLabel.setAttribute("fill", "#111827");
    totalLabel.textContent = fmtMoney(totals[i]);
    svg.appendChild(totalLabel);

    const xLabel = document.createElementNS(svg.namespaceURI, "text");
    xLabel.setAttribute("x", padding.left + i * barWidth + barWidth * 0.5);
    xLabel.setAttribute("y", height - 10);
    xLabel.setAttribute("text-anchor", "middle");
    xLabel.setAttribute("font-size", "11");
    xLabel.setAttribute("fill", "#6b7280");
    xLabel.textContent = label;
    svg.appendChild(xLabel);
  });

  container.innerHTML = "";
  container.appendChild(svg);
}

function renderBars(container, labels, values) {
  const width = container.clientWidth || 320;
  const height = container.clientHeight || 240;
  const padding = { top: 16, right: 10, bottom: 26, left: 10 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const maxVal = Math.max(...values) * 1.15;
  const barWidth = w / values.length;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  values.forEach((v, i) => {
    const barH = (v / maxVal) * h;
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("x", padding.left + i * barWidth + barWidth * 0.2);
    rect.setAttribute("y", padding.top + h - barH);
    rect.setAttribute("width", barWidth * 0.6);
    rect.setAttribute("height", barH);
    rect.setAttribute("rx", 10);
    rect.setAttribute("fill", i === 2 ? "#6d5efc" : "#e5e7eb");
    svg.appendChild(rect);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", padding.left + i * barWidth + barWidth * 0.5);
    label.setAttribute("y", height - 6);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#9ca3af");
    label.textContent = labels[i];
    svg.appendChild(label);
  });

  container.innerHTML = "";
  container.appendChild(svg);
}

function renderDonut(container, values, colors) {
  const size = 160;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = values.reduce((sum, v) => sum + v, 0);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  let offset = 0;
  values.forEach((v, i) => {
    const segment = document.createElementNS(svg.namespaceURI, "circle");
    const dash = (v / total) * circumference;
    segment.setAttribute("cx", size / 2);
    segment.setAttribute("cy", size / 2);
    segment.setAttribute("r", radius);
    segment.setAttribute("fill", "transparent");
    segment.setAttribute("stroke", colors[i]);
    segment.setAttribute("stroke-width", stroke);
    segment.setAttribute("stroke-dasharray", `${dash} ${circumference - dash}`);
    segment.setAttribute("stroke-dashoffset", -offset);
    segment.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    segment.setAttribute("stroke-linecap", "round");
    svg.appendChild(segment);
    offset += dash + 6;
  });

  const center = document.createElementNS(svg.namespaceURI, "text");
  center.setAttribute("x", size / 2);
  center.setAttribute("y", size / 2 + 5);
  center.setAttribute("text-anchor", "middle");
  center.setAttribute("font-size", "14");
  center.setAttribute("fill", "#111827");
  center.textContent = "100%";
  svg.appendChild(center);

  container.innerHTML = "";
  container.appendChild(svg);
}

function renderIntegrations(container, rows) {
  const header = document.createElement("div");
  header.className = "table-row head";
  header.innerHTML = `
    <div></div>
    <div>Application</div>
    <div>Type</div>
    <div>Rate</div>
    <div>Profit</div>
  `;
  container.appendChild(header);

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "table-row body";
    item.innerHTML = `
      <div class="badge ${row.color}">${row.badge}</div>
      <div>${row.name}</div>
      <div>${row.type}</div>
      <div>
        <div class="progress"><span style="width:${row.rate}%"></span></div>
      </div>
      <div>${fmtMoney(row.profit)}</div>
    `;
    container.appendChild(item);
  });
}

function initDashboard() {
  const { stats, salesOverview, subscribers, distribution, integrations } = dashboard;

  setText("stat-views", fmtNumber(stats.views.value));
  setText("stat-views-change", `${stats.views.change > 0 ? "+" : ""}${stats.views.change}%`);
  setText("stat-revenue", fmtMoney(stats.revenue.value));
  setText(
    "stat-revenue-change",
    `${stats.revenue.change > 0 ? "+" : ""}${stats.revenue.change}%`
  );
  setText("stat-bounce", `${stats.bounce.value}%`);
  setText(
    "stat-bounce-change",
    `${stats.bounce.change > 0 ? "+" : ""}${stats.bounce.change}%`
  );

  setText("sales-total", fmtMoney(salesOverview.total));
  renderLegend(document.getElementById("sales-legend"), salesOverview.series);
  renderStackedBars(
    document.getElementById("sales-chart"),
    salesOverview.months,
    salesOverview.series
  );

  setText("subs-total", fmtNumber(subscribers.total));
  setText(
    "subs-change",
    `+${subscribers.change.pct}% (+${fmtNumber(subscribers.change.delta)})`
  );
  renderBars(
    document.getElementById("subs-chart"),
    subscribers.days,
    subscribers.values
  );

  setText("dist-web", fmtMoney(distribution.values[0]));
  setText("dist-app", fmtMoney(distribution.values[1]));
  setText("dist-other", fmtMoney(distribution.values[2]));
  renderDonut(
    document.getElementById("dist-chart"),
    distribution.values,
    distribution.colors
  );

  renderIntegrations(
    document.getElementById("integration-table"),
    integrations
  );
}

initDashboard();
