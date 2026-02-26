const STORAGE_KEY = "suplementoControlData";

const sampleRows = [
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

function toRows(objects) {
  return objects.map((r) => [
    r.pasto,
    r.quantidade,
    r.tipo,
    r.periodo,
    r.sacos,
    r.kg,
    r.consumo,
  ]);
}

function toObjects(rows) {
  return rows.map((r) => ({
    pasto: r[0],
    quantidade: r[1],
    tipo: r[2],
    periodo: r[3],
    sacos: r[4],
    kg: r[5],
    consumo: r[6],
  }));
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveData(rows) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ rows, updatedAt: new Date().toISOString() })
  );
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

function getDefaultData() {
  return { rows: sampleRows };
}

window.SuplementoData = {
  STORAGE_KEY,
  sampleRows,
  supplementOrder,
  loadData,
  saveData,
  fmt,
  fmtInt,
  groupByType,
  averageConsumo,
  sumQuantidade,
  getDefaultData,
  toRows,
  toObjects,
};
