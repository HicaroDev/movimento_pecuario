const {
  loadData,
  saveData,
  fmt,
  fmtInt,
  toObjects,
  toRows,
  getDefaultData,
} = window.SuplementoData;

const state = {
  rows: [],
};

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

function load() {
  const existing = loadData();
  if (existing && Array.isArray(existing.rows) && existing.rows.length) {
    state.rows = existing.rows;
  } else {
    state.rows = getDefaultData().rows;
    saveData(state.rows);
  }
  render();
}

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

function render() {
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
  render();
  resetInputs();
}

function removeRow(index) {
  state.rows.splice(index, 1);
  render();
}

function saveAll() {
  saveData(state.rows);
}

function clearAll() {
  state.rows = [];
  render();
  saveAll();
}

document.getElementById("add-row").addEventListener("click", addRow);
document.getElementById("save").addEventListener("click", saveAll);
document.getElementById("clear-all").addEventListener("click", clearAll);
document.getElementById("load-sample").addEventListener("click", () => {
  state.rows = getDefaultData().rows;
  render();
});

tbody.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLButtonElement && target.dataset.index) {
    removeRow(Number(target.dataset.index));
  }
});

load();
