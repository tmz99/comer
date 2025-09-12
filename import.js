// import.js - Versión limpia y corregida
// --------------------------------------------------
// Variables globales
// --------------------------------------------------
let currentScenario = 'base';
let exchangeRate = 350.00;
let tipoCambioActual = 0;

let calculations = {
  valorCIF: 0,
  tributos: 0,
  impuestosNacionales: 0,
  impuestosInternos: 0,
  otrosGastos: 0,
  total: 0
};

// --------------------------------------------------
// Posiciones arancelarias
// --------------------------------------------------
const posicionesArancelarias = [
  { codigo: '8471.30.11', descripcion: 'Máquinas automáticas para tratamiento o procesamiento de datos portátiles' },
  { codigo: '8471.41.00', descripcion: 'Unidades de procesamiento, digitales' },
  { codigo: '8471.49.00', descripcion: 'Las demás máquinas automáticas para tratamiento de datos' },
  { codigo: '8528.42.10', descripcion: 'Monitores con tubo de rayos catódicos policromáticos' },
  { codigo: '8528.42.90', descripcion: 'Los demás monitores con tubo de rayos catódicos' },
  { codigo: '8443.32.10', descripcion: 'Impresoras láser' },
  { codigo: '8517.12.00', descripcion: 'Teléfonos móviles (celulares)' },
  { codigo: '9403.10.00', descripcion: 'Muebles de metal del tipo de los utilizados en oficinas' }
];

// --------------------------------------------------
// Utilidades
// --------------------------------------------------
function safeEl(id) { return document.getElementById(id) || null; }
function toNumber(value) { const v = parseFloat(value); return isNaN(v) ? 0 : v; }
function formatUSD(value) { return `USD ${Number(value || 0).toFixed(2)}`; }
function formatARS(value) { return Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// --------------------------------------------------
// Cálculo y actualización de CIF + resumen
// --------------------------------------------------
function calculateCIF() {
  const fob = toNumber(safeEl('valor-fob')?.value);
  const flete = toNumber(safeEl('flete-internacional')?.value);
  const seguro = toNumber(safeEl('seguro-internacional')?.value);
  const cif = fob + flete + seguro;

  calculations.valorCIF = cif;

  // Campo técnico
  safeEl('valor-cif') && (safeEl('valor-cif').value = cif.toFixed(2));

  // Resumen CIF
  safeEl('summary-cif') && (safeEl('summary-cif').textContent = formatUSD(cif));

  // Actualiza también FOB, Flete y Seguro
  actualizarResumenVisual();

  // Recalcula tributos e impuestos
  calculateTributos();
}

function actualizarResumenVisual() {
  const fob = toNumber(safeEl('valor-fob')?.value);
  const flete = toNumber(safeEl('flete-internacional')?.value);
  const seguro = toNumber(safeEl('seguro-internacional')?.value);

  safeEl('summary-fob') && (safeEl('summary-fob').textContent = formatUSD(fob));
  safeEl('summary-flete') && (safeEl('summary-flete').textContent = formatUSD(flete));
  safeEl('summary-seguro') && (safeEl('summary-seguro').textContent = formatUSD(seguro));
}

// --------------------------------------------------
// Sincronización de campos técnicos con resumen
// --------------------------------------------------
function bindResumenSync() {
  const campos = [
    { input: 'valor-fob', resumen: 'summary-fob' },
    { input: 'flete-internacional', resumen: 'summary-flete' },
    { input: 'seguro-internacional', resumen: 'summary-seguro' }
  ];

  campos.forEach(({ input, resumen }) => {
    const el = safeEl(input);
    if (el) {
      el.addEventListener('input', () => {
        const valor = toNumber(el.value);
        const resumenEl = safeEl(resumen);
        if (resumenEl) resumenEl.textContent = formatUSD(valor);
        calculateCIF(); // recalcula todo en cadena
      });
    }
  });
}

// --------------------------------------------------
// Inicialización
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = sessionStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);

  actualizarDolar();
  setInterval(actualizarDolar, 5 * 60 * 1000);

  setTimeout(() => {
    bindResumenSync();
    calculateCIF(); // fuerza cálculo inicial
  }, 100);
});

// --------------------------------------------------
// Tema
// --------------------------------------------------
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  sessionStorage.setItem('theme', newTheme);
}

// --------------------------------------------------
// Escenarios
// --------------------------------------------------
function selectScenario(arg) {
  let scenario = 'base';
  let targetEl = null;

  if (typeof arg === 'string') scenario = arg;
  else if (arg && arg.currentTarget) targetEl = arg.currentTarget;
  else if (arg && arg.target) targetEl = arg.target;
  else if (arg instanceof Element) targetEl = arg;

  scenario = (targetEl?.dataset?.scenario || targetEl?.textContent || scenario).trim().toLowerCase();

  if (['calculadora', 'calculator', 'base'].includes(scenario)) scenario = 'base';
  if (['premium'].includes(scenario)) scenario = 'premium';
  if (['express'].includes(scenario)) scenario = 'express';

  currentScenario = scenario;

  document.querySelectorAll('.scenario-tab').forEach(tab => tab.classList.remove('active'));
  if (targetEl) targetEl.classList.add('active');
  else {
    const byData = document.querySelector(`.scenario-tab[data-scenario="${scenario}"]`);
    if (byData) byData.classList.add('active');
  }

  applyScenarioConfig(scenario);
}

function applyScenarioConfig(scenario) {
  const configs = {
    base: { seguro: 0.5, flete: 8, honorarios: 500 },
    premium: { seguro: 1.5, flete: 8, honorarios: 750 },
    express: { seguro: 1.0, flete: 15, honorarios: 600 }
  };

  const config = configs[scenario] || configs.base;
  const fobValue = toNumber(safeEl('valor-fob')?.value);

  if (fobValue > 0) {
    safeEl('seguro-internacional') && (safeEl('seguro-internacional').value = (fobValue * config.seguro / 100).toFixed(2));
    safeEl('flete-internacional') && (safeEl('flete-internacional').value = (fobValue * config.flete / 100).toFixed(2));
    safeEl('honorarios-despachante') && (safeEl('honorarios-despachante').value = config.honorarios.toFixed(2));
    calculateCIF();
  }
}

// --------------------------------------------------
// Búsqueda posición arancelaria
// --------------------------------------------------
function searchPosicionArancelaria(query) {
  const resultsContainer = safeEl('search-results');
  if (!resultsContainer) return;

  if (!query || query.length < 2) {
    resultsContainer.style.display = 'none';
    return;
  }

  const filtered = posicionesArancelarias.filter(item =>
    item.codigo.includes(query) || item.descripcion.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length > 0) {
    resultsContainer.innerHTML = filtered.map(item => `
      <div class="search-result-item" onclick="selectPosicionArancelaria('${item.codigo}', '${item.descripcion.replace(/'/g, "\\'")}')">
        <div class="search-result-code">${item.codigo}</div>
        <div class="search-result-description">${item.descripcion}</div>
      </div>
    `).join('');
    resultsContainer.style.display = 'block';
  } else resultsContainer.style.display = 'none';
}

function selectPosicionArancelaria(codigo, descripcion) {
  safeEl('posicion-arancelaria') && (safeEl('posicion-arancelaria').value = codigo);
  safeEl('descripcion-tecnica') && (safeEl('descripcion-tecnica').value = descripcion);
  safeEl('search-results') && (safeEl('search-results').style.display = 'none');
  applyAutomaticTariffs(codigo);
}

function applyAutomaticTariffs(codigo) {
  const tariffs = {
    '8471.30.11': { arancel: 0, iva: 21 },
    '8471.41.00': { arancel: 0, iva: 21 },
    '8528.42.10': { arancel: 16, iva: 21 },
    '8517.12.00': { arancel: 16, iva: 21 },
    default: { arancel: 10, iva: 21 }
  };
  const tariff = tariffs[codigo] || tariffs.default;
  safeEl('arancel-externo') && (safeEl('arancel-externo').value = tariff.arancel);
  safeEl('iva') && (safeEl('iva').value = tariff.iva);
  calculateTributos();
}

// --------------------------------------------------
// Función para tributos % o USD
// --------------------------------------------------
function getValorConTipo(valorInputId, tipoInputId) {
  const valor = toNumber(safeEl(valorInputId)?.value);
  const tipo = safeEl(tipoInputId)?.value || 'percent';
  return tipo === 'percent' ? calculations.valorCIF * (valor / 100) : valor;
}

// --------------------------------------------------
// Cálculos principales
// --------------------------------------------------
function calculateTributos() {
  const arancel = getValorConTipo('arancel-externo', 'arancel-externo-tipo');
  const adValorem = getValorConTipo('ad-valorem', 'ad-valorem-tipo');
  const especificos = getValorConTipo('derechos-especificos', 'derechos-especificos-tipo');
  const estadistica = getValorConTipo('tasa-estadistica', 'tasa-estadistica-tipo');
  const comprobacion = getValorConTipo('comprobacion-destino', 'comprobacion-destino-tipo');
  const antidumping = getValorConTipo('antidumping', 'antidumping-tipo');
  const exportacion = getValorConTipo('derechos-exportacion', 'derechos-exportacion-tipo');
  

  calculations.tributos = arancel + adValorem + especificos + estadistica + comprobacion + antidumping + exportacion;
  calculateImpuestos();

 calculations.arancel = arancel;
 calculations.adValorem = adValorem;
 calculations.especificos = especificos;
 calculations.estadistica = estadistica;
 calculations.comprobacion = comprobacion;
 calculations.antidumping = antidumping;
 calculations.exportacion = exportacion;
actualizarResumenTributos();
}
function actualizarResumenTributos() {
  safeEl('summary-arancel') && (safeEl('summary-arancel').textContent = formatUSD(calculations.arancel));
  safeEl('summary-advalorem') && (safeEl('summary-advalorem').textContent = formatUSD(calculations.adValorem));
  safeEl('summary-especificos') && (safeEl('summary-especificos').textContent = formatUSD(calculations.especificos));
  safeEl('summary-estadistica') && (safeEl('summary-estadistica').textContent = formatUSD(calculations.estadistica));
  safeEl('summary-comprobacion') && (safeEl('summary-comprobacion').textContent = formatUSD(calculations.comprobacion));
  safeEl('summary-antidumping') && (safeEl('summary-antidumping').textContent = formatUSD(calculations.antidumping));
  safeEl('summary-exportacion') && (safeEl('summary-exportacion').textContent = formatUSD(calculations.exportacion));
}


function calculateImpuestos() {
  const iva = getValorConTipo('iva', 'iva-tipo');
  const tasaCom = getValorConTipo('tasa-comercializacion', 'tasa-comercializacion-tipo');
  const ganancias = getValorConTipo('anticipo-ganancias', 'anticipo-ganancias-tipo');
  const iibb = getValorConTipo('anticipo-iibb', 'anticipo-iibb-tipo');

  calculations.impuestosNacionales = iva + tasaCom + ganancias + iibb;
  calculateImpuestosInternos();
}

function calculateImpuestosInternos() {
  const combustibles = getValorConTipo('imp-combustibles', 'imp-combustibles-tipo');
  const suntuarios = getValorConTipo('imp-suntuarios', 'imp-suntuarios-tipo');
  const bebidas = getValorConTipo('imp-bebidas', 'imp-bebidas-tipo');
  const otros = getValorConTipo('imp-otros', 'imp-otros-tipo');
  calculations.impuestosInternos = combustibles + suntuarios + bebidas + otros;
  calculateOtrosGastos();
}

function calculateOtrosGastos() {
  const despachante = toNumber(safeEl('honorarios-despachante')?.value);
  const bancarios   = toNumber(safeEl('gastos-bancarios')?.value);
  const agente      = toNumber(safeEl('gastos-agente')?.value);
  const almacenaje  = toNumber(safeEl('almacenaje')?.value);
  const transporte  = toNumber(safeEl('transporte-local')?.value);
  const otros       = toNumber(safeEl('otros-gastos-misc')?.value);

  const subtotal = despachante + bancarios + agente + almacenaje + transporte + otros;

  calculations.otrosGastos = subtotal;

  // Subtotal en HTML
  const subtotalEl = safeEl('subtotal-gastos');
  if (subtotalEl) subtotalEl.textContent = `USD ${subtotal.toFixed(2)}`;

  updateFinalTotal();
}

function updateFinalTotal() {
  calculations.total = calculations.valorCIF + calculations.tributos + calculations.impuestosInternos + calculations.otrosGastos;
  updateSummary();
}

function updateSummary() {
  safeEl('summary-cif') && (safeEl('summary-cif').textContent = formatUSD(calculations.valorCIF));
  safeEl('subtotal-tributos') && (safeEl('subtotal-tributos').textContent = formatUSD(calculations.tributos));
  safeEl('summary-impuestos-nacionales') && (safeEl('summary-impuestos-nacionales').textContent = formatUSD(calculations.impuestosNacionales));
  safeEl('subtotal-internos') && (safeEl('subtotal-internos').textContent = formatUSD(calculations.impuestosInternos));
  safeEl('subtotal-gastos') && (safeEl('subtotal-gastos').textContent = formatUSD(calculations.otrosGastos));
  safeEl('total-final') && (safeEl('total-final').textContent = formatUSD(calculations.total));
  safeEl('total-ars') && (safeEl('total-ars').textContent = calculations.total && tipoCambioActual ? formatARS(calculations.total * tipoCambioActual) : '—');
}

// --------------------------------------------------
// Cotización del dólar
// --------------------------------------------------
async function actualizarDolar() {
  try {
    const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
    const data = await res.json();

    const valorDolar = data.blue.value_avg;
    exchangeRate = valorDolar;
    tipoCambioActual = valorDolar;

    // Mostrar cotización
    const el = document.getElementById("dolar-valor");
    if (el) el.textContent = `USD 1 = ARS ${exchangeRate.toFixed(2)}`;

    // Si ya hay total, recalcular en pesos
    const totalUsd = calculations.total;
    if (totalUsd > 0) {
      document.getElementById("costo-ars").textContent =
        `Costo total en pesos: ARS ${(totalUsd * exchangeRate).toFixed(2)}`;
    }

  } catch (err) {
    console.error("Error al actualizar dólar:", err);
  }
}

document.getElementById("btn-ver-pesos").addEventListener("click", () => {
  const costoUsdText = document.getElementById("total-final").textContent;
  const costoUsd = parseFloat(costoUsdText.replace("USD", "").trim());

  if (!isNaN(costoUsd) && costoUsd > 0) {
    const costoArs = costoUsd * exchangeRate;
    document.getElementById("costo-ars").textContent =
      `Costo total en pesos: ARS ${costoArs.toFixed(2)}`;
  }

  const el = document.getElementById("dolar-valor");
  if (el) el.textContent = `USD 1 = ARS ${exchangeRate.toFixed(2)}`;
});

// --------------------------------------------------
// Exportar funciones
// --------------------------------------------------
window.calculateCIF = calculateCIF;
window.calculateTributos = calculateTributos;
window.calculateImpuestos = calculateImpuestos;
window.calculateImpuestosInternos = calculateImpuestosInternos;
window.calculateOtrosGastos = calculateOtrosGastos;
window.toggleTheme = toggleTheme;
window.selectScenario = selectScenario;
window.searchPosicionArancelaria = searchPosicionArancelaria;
window.selectPosicionArancelaria = selectPosicionArancelaria;
