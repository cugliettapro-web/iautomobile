/* ═══════════════════════════════════════════════════════
   iAutomobile — script.js
   Comparateur statique : données, calculs, rendu DOM
═══════════════════════════════════════════════════════ */

/* ─── 1. BASE DE DONNÉES VÉHICULES ─────────────────── */
const VEHICLES = [
  {
    id: "dacia-sandero",
    brand: "Dacia",
    model: "Sandero",
    motorisation: "Essence 1.0 TCe 90",
    segment: "citadine",
    power: 90,
    fuelType: "essence",
    realConso: 6.2,     // L/100 km (essence) ou kWh/100 (élec)
    trunkLiters: 328,
    basePrice: 15990,
    depreciationRate: 0.20,  // % valeur perdue par an (année 1)
    maintenanceCostPerKm: 0.045,
    insuranceBase: 800,
    scores: { rational: 82, usage: 70, emotion: 42 }
  },
  {
    id: "renault-clio",
    brand: "Renault",
    model: "Clio",
    motorisation: "Essence 1.0 TCe 100",
    segment: "citadine",
    power: 100,
    fuelType: "essence",
    realConso: 6.5,
    trunkLiters: 391,
    basePrice: 20490,
    depreciationRate: 0.18,
    maintenanceCostPerKm: 0.05,
    insuranceBase: 950,
    scores: { rational: 72, usage: 76, emotion: 58 }
  },
  {
    id: "peugeot-308",
    brand: "Peugeot",
    model: "308",
    motorisation: "Hybride 180 e-EAT8",
    segment: "compacte",
    power: 180,
    fuelType: "hybride",
    realConso: 5.1,
    trunkLiters: 412,
    basePrice: 34900,
    depreciationRate: 0.17,
    maintenanceCostPerKm: 0.055,
    insuranceBase: 1150,
    scores: { rational: 70, usage: 80, emotion: 68 }
  },
  {
    id: "toyota-yaris",
    brand: "Toyota",
    model: "Yaris",
    motorisation: "Hybride 116h",
    segment: "citadine",
    power: 116,
    fuelType: "hybride",
    realConso: 4.4,
    trunkLiters: 286,
    basePrice: 24990,
    depreciationRate: 0.13,
    maintenanceCostPerKm: 0.042,
    insuranceBase: 900,
    scores: { rational: 84, usage: 78, emotion: 52 }
  },
  {
    id: "vw-golf",
    brand: "Volkswagen",
    model: "Golf",
    motorisation: "TDI 115 DSG",
    segment: "compacte",
    power: 115,
    fuelType: "diesel",
    realConso: 5.8,
    trunkLiters: 381,
    basePrice: 31990,
    depreciationRate: 0.16,
    maintenanceCostPerKm: 0.058,
    insuranceBase: 1100,
    scores: { rational: 74, usage: 84, emotion: 60 }
  },
  {
    id: "tesla-model3",
    brand: "Tesla",
    model: "Model 3",
    motorisation: "Grande Autonomie AWD",
    segment: "berline",
    power: 358,
    fuelType: "electrique",
    realConso: 15.5,   // kWh/100 km
    trunkLiters: 594,
    basePrice: 45990,
    depreciationRate: 0.19,
    maintenanceCostPerKm: 0.028,
    insuranceBase: 1400,
    scores: { rational: 76, usage: 85, emotion: 82 }
  },
  {
    id: "bmw-serie3",
    brand: "BMW",
    model: "Série 3",
    motorisation: "320i xDrive",
    segment: "berline-premium",
    power: 184,
    fuelType: "essence",
    realConso: 7.8,
    trunkLiters: 480,
    basePrice: 50400,
    depreciationRate: 0.20,
    maintenanceCostPerKm: 0.075,
    insuranceBase: 1650,
    scores: { rational: 60, usage: 78, emotion: 86 }
  },
  {
    id: "audi-a3",
    brand: "Audi",
    model: "A3 Sportback",
    motorisation: "35 TFSI 150",
    segment: "compacte-premium",
    power: 150,
    fuelType: "essence",
    realConso: 7.2,
    trunkLiters: 380,
    basePrice: 38200,
    depreciationRate: 0.18,
    maintenanceCostPerKm: 0.068,
    insuranceBase: 1350,
    scores: { rational: 62, usage: 75, emotion: 78 }
  }
];

/* ─── 2. CONSTANTES ÉNERGIES ────────────────────────── */
const FUEL_PRICE = {
  essence:    1.82,   // €/L (moyenne France 2025)
  diesel:     1.72,   // €/L
  hybride:    1.82,   // roule majoritairement à l'essence
  electrique: 0.196   // €/kWh (tarif réglementé moyen)
};

/* ─── 3. PROFILS & PONDÉRATIONS ─────────────────────── */
// Poids : [rationnel, usage, émotion]
const PROFILE_WEIGHTS = {
  urbain:   { rational: 0.45, usage: 0.35, emotion: 0.20 },
  long:     { rational: 0.50, usage: 0.35, emotion: 0.15 },
  sportif:  { rational: 0.25, usage: 0.25, emotion: 0.50 },
  famille:  { rational: 0.45, usage: 0.40, emotion: 0.15 }
};

/* ─── 4. CALCULS PRINCIPAUX ─────────────────────────── */

/**
 * Coût annuel total (énergie + entretien + assurance)
 * @param {Object} vehicle
 * @param {number} km - km/an
 * @returns {{ total, energy, maintenance, insurance, per100 }}
 */
function calculateAnnualCost(vehicle, km) {
  const pricePerUnit = FUEL_PRICE[vehicle.fuelType] ?? 1.82;
  const energy       = (vehicle.realConso / 100) * km * pricePerUnit;
  const maintenance  = vehicle.maintenanceCostPerKm * km;
  const insurance    = vehicle.insuranceBase;
  const total        = Math.round(energy + maintenance + insurance);
  const per100       = ((total / km) * 100).toFixed(1);

  return {
    total,
    energy:      Math.round(energy),
    maintenance: Math.round(maintenance),
    insurance:   Math.round(insurance),
    per100:      parseFloat(per100)
  };
}

/**
 * Valeur de revente estimée
 * @param {Object} vehicle
 * @param {number} years - 3 ou 5
 * @returns {number} valeur en €
 */
function calculateResaleValue(vehicle, years) {
  // Décote progressive : plus forte en année 1, se stabilise
  const annualDecay = [
    vehicle.depreciationRate,
    vehicle.depreciationRate * 0.85,
    vehicle.depreciationRate * 0.75,
    vehicle.depreciationRate * 0.65,
    vehicle.depreciationRate * 0.60
  ];
  let value = vehicle.basePrice;
  for (let i = 0; i < years; i++) {
    value = value * (1 - (annualDecay[i] ?? 0.12));
  }
  return Math.round(value);
}

/**
 * Score global pondéré selon le profil
 * @param {Object} vehicle
 * @param {string} profile - 'urbain' | 'long' | 'sportif' | 'famille'
 * @returns {{ global, rational, usage, emotion }}
 */
function calculateScore(vehicle, profile) {
  const w = PROFILE_WEIGHTS[profile] ?? PROFILE_WEIGHTS.urbain;
  const global = Math.round(
    vehicle.scores.rational * w.rational +
    vehicle.scores.usage    * w.usage    +
    vehicle.scores.emotion  * w.emotion
  );
  return {
    global,
    rational: vehicle.scores.rational,
    usage:    vehicle.scores.usage,
    emotion:  vehicle.scores.emotion
  };
}

/**
 * Génère un verdict en 2–3 phrases selon profil et scores
 */
function getVerdictText(vehicle, profile, cost, score, km) {
  const profileLabels = {
    urbain:   "usage urbain",
    long:     "longs trajets",
    sportif:  "conduite sportive",
    famille:  "usage famille"
  };

  const profilLabel = profileLabels[profile] ?? "votre usage";
  const kmLabel = km >= 20000 ? "grand rouleur" : km <= 8000 ? "petit rouleur" : "rouleur modéré";

  // Verdict rationnel
  let verdict = "";

  if (score.global >= 78) {
    verdict += `Excellent choix pour un ${profilLabel} : le ${vehicle.brand} ${vehicle.model} affiche un score global remarquable de ${score.global}/100. `;
  } else if (score.global >= 65) {
    verdict += `Bon équilibre pour un ${profilLabel} : le ${vehicle.brand} ${vehicle.model} coche la plupart des cases avec un score de ${score.global}/100. `;
  } else {
    verdict += `Choix acceptable pour un ${profilLabel}, mais le ${vehicle.brand} ${vehicle.model} présente des compromis à noter (score ${score.global}/100). `;
  }

  // Verdict coût
  if (cost.per100 <= 14) {
    verdict += `Avec seulement ${cost.per100}€/100 km, c'est l'un des plus économiques de la sélection pour un ${kmLabel}. `;
  } else if (cost.per100 <= 20) {
    verdict += `À ${cost.per100}€/100 km, le budget reste raisonnable pour un ${kmLabel}. `;
  } else {
    verdict += `À ${cost.per100}€/100 km, le coût total reste élevé — à peser selon votre budget mensuel. `;
  }

  // Verdict émotion
  if (score.emotion >= 80) {
    verdict += `Le plaisir de conduite est clairement au rendez-vous.`;
  } else if (score.emotion >= 60) {
    verdict += `L'agrément de conduite est satisfaisant sans être exceptionnel.`;
  } else {
    verdict += `Ne cherchez pas de frisson au volant : ce véhicule mise sur la raison, pas les émotions.`;
  }

  return verdict;
}

/* ─── 5. ÉTAT GLOBAL ────────────────────────────────── */
let selectedIds = [];   // max 4 IDs

function getKm()     { return parseInt(document.getElementById("km-slider").value, 10); }
function getProfile(){ return document.getElementById("filter-profile").value; }
function getTrajet() { return document.getElementById("filter-trajet").value; }

/* ─── 6. INITIALISATION ─────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  populateVehicleSelect();
  bindEvents();
  renderAll();
});

function populateVehicleSelect() {
  const sel = document.getElementById("vehicle-select");
  sel.innerHTML = '<option value="">— Choisir un véhicule —</option>';
  VEHICLES.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = `${v.brand} ${v.model} — ${v.motorisation}`;
    sel.appendChild(opt);
  });
}

function bindEvents() {
  // Slider km
  document.getElementById("km-slider").addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    document.getElementById("km-display").textContent =
      val.toLocaleString("fr-FR") + " km";
    renderAll();
  });

  // Filtres profil / trajet
  document.getElementById("filter-profile").addEventListener("change", renderAll);
  document.getElementById("filter-trajet").addEventListener("change", renderAll);

  // Bouton ajouter
  document.getElementById("btn-add").addEventListener("click", () => {
    const sel = document.getElementById("vehicle-select");
    const id  = sel.value;
    if (!id) return;
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 4) {
      alert("Maximum 4 véhicules. Retirez-en un pour en ajouter un autre.");
      return;
    }
    selectedIds.push(id);
    sel.value = "";
    renderAll();
  });
}

/* ─── 7. RENDER PRINCIPAL ───────────────────────────── */
function renderAll() {
  renderChips();
  renderCards();
  renderTable();
  updateCount();
}

/* ─── 8. CHIPS ──────────────────────────────────────── */
function renderChips() {
  const container = document.getElementById("chips-container");
  const empty     = document.getElementById("chips-empty");
  container.innerHTML = "";

  if (selectedIds.length === 0) {
    container.appendChild(createEmptyChip());
    return;
  }

  selectedIds.forEach(id => {
    const v    = VEHICLES.find(x => x.id === id);
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `${v.brand} ${v.model}
      <span class="chip__remove" data-id="${id}" title="Retirer">✕</span>`;
    chip.querySelector(".chip__remove").addEventListener("click", (e) => {
      selectedIds = selectedIds.filter(x => x !== e.target.dataset.id);
      renderAll();
    });
    container.appendChild(chip);
  });
}

function createEmptyChip() {
  const span = document.createElement("span");
  span.className = "chips-empty";
  span.textContent = "Ajoutez jusqu'à 4 véhicules pour comparer ↑";
  return span;
}

/* ─── 9. CARDS ──────────────────────────────────────── */
function renderCards() {
  const container = document.getElementById("vehicle-cards");
  container.innerHTML = "";

  if (selectedIds.length === 0) {
    container.appendChild(buildEmptyState());
    return;
  }

  const km      = getKm();
  const profile = getProfile();
  const vehicles = selectedIds.map(id => VEHICLES.find(v => v.id === id));

  // Calcul de toutes les données
  const data = vehicles.map(v => ({
    vehicle: v,
    cost:    calculateAnnualCost(v, km),
    score:   calculateScore(v, profile),
    resale3: calculateResaleValue(v, 3),
    resale5: calculateResaleValue(v, 5)
  }));

  // Trouver les meilleurs pour les badges
  const minCost  = Math.min(...data.map(d => d.cost.total));
  const maxScore = Math.max(...data.map(d => d.score.global));
  const maxEmo   = Math.max(...data.map(d => d.score.emotion));
  const maxTotal = Math.max(...data.map(d => d.cost.total));

  data.forEach(d => {
    const badge = getBadge(d, minCost, maxScore, maxEmo);
    container.appendChild(buildCard(d, badge, km, profile, maxTotal));
  });
}

function getBadge(d, minCost, maxScore, maxEmo) {
  if (d.cost.total === minCost)    return { text: "Le moins cher",   cls: "vc-badge--cheap" };
  if (d.score.global === maxScore) return { text: "Meilleur score",  cls: "vc-badge--best"  };
  if (d.score.emotion === maxEmo)  return { text: "Plus fun",        cls: "vc-badge--fun"   };
  return null;
}

function buildEmptyState() {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.style.gridColumn = "1 / -1";
  div.innerHTML = `
    <div class="empty-state__icon">🚗</div>
    <div class="empty-state__title">Aucun véhicule sélectionné</div>
    <p class="empty-state__text">Utilisez le menu ci-dessus pour ajouter jusqu'à 4 véhicules et lancer la comparaison.</p>
  `;
  return div;
}

function buildCard(d, badge, km, profile, maxTotal) {
  const { vehicle: v, cost, score, resale3, resale5 } = d;
  const verdict = getVerdictText(v, profile, cost, score, km);
  const barPct  = Math.round((cost.total / maxTotal) * 100);

  const card = document.createElement("div");
  card.className = "vehicle-card";

  card.innerHTML = `
    <div class="vc-header">
      <div>
        <div class="vc-header__title">${v.brand} ${v.model}</div>
        <div class="vc-header__motor">${v.motorisation}</div>
      </div>
      ${badge ? `<span class="vc-badge ${badge.cls}">${badge.text}</span>` : ""}
    </div>

    <div class="vc-body">

      <!-- Coût -->
      <div class="vc-cost">
        <div class="vc-cost__label">Coût annuel estimé</div>
        <div class="vc-cost__total">${cost.total.toLocaleString("fr-FR")} €<span style="font-size:0.9rem;font-weight:400;color:#888;"> / an</span></div>
        <div class="vc-cost__per100">${cost.per100} €/100 km</div>
        <div class="vc-cost__breakdown">
          <div class="vc-cost__item">
            <span class="vc-cost__item-label">Énergie</span>
            <span class="vc-cost__item-val">${cost.energy.toLocaleString("fr-FR")} €</span>
          </div>
          <div class="vc-cost__item">
            <span class="vc-cost__item-label">Entretien</span>
            <span class="vc-cost__item-val">${cost.maintenance.toLocaleString("fr-FR")} €</span>
          </div>
          <div class="vc-cost__item">
            <span class="vc-cost__item-label">Assurance</span>
            <span class="vc-cost__item-val">${cost.insurance.toLocaleString("fr-FR")} €</span>
          </div>
        </div>
        <div class="cost-bar-wrap">
          <div class="cost-bar" style="width:${barPct}%"></div>
        </div>
      </div>

      <!-- Score -->
      <div class="vc-score">
        <div class="vc-score__main">
          <span class="vc-score__label">Score global</span>
          <span class="vc-score__num">${score.global}<span>/100</span></span>
        </div>
        <div class="vc-subscores">
          <div class="vc-subscore">
            <span class="vc-subscore__label">Rationnel</span>
            <div class="vc-subscore__bar-wrap">
              <div class="vc-subscore__bar vc-subscore__bar--rational" style="width:${score.rational}%"></div>
            </div>
            <span class="vc-subscore__val">${score.rational}</span>
          </div>
          <div class="vc-subscore">
            <span class="vc-subscore__label">Usage</span>
            <div class="vc-subscore__bar-wrap">
              <div class="vc-subscore__bar vc-subscore__bar--usage" style="width:${score.usage}%"></div>
            </div>
            <span class="vc-subscore__val">${score.usage}</span>
          </div>
          <div class="vc-subscore">
            <span class="vc-subscore__label">Émotion</span>
            <div class="vc-subscore__bar-wrap">
              <div class="vc-subscore__bar vc-subscore__bar--emotion" style="width:${score.emotion}%"></div>
            </div>
            <span class="vc-subscore__val">${score.emotion}</span>
          </div>
        </div>
      </div>

      <!-- Verdict -->
      <div class="vc-verdict">
        <div class="vc-verdict__label">L'avis iAutomobile</div>
        <p class="vc-verdict__text">${verdict}</p>
      </div>

    </div>
  `;

  return card;
}

/* ─── 10. TABLEAU COMPARATIF ────────────────────────── */
function renderTable() {
  const section = document.getElementById("comp-table-section");

  if (selectedIds.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";

  const km      = getKm();
  const profile = getProfile();
  const vehicles = selectedIds.map(id => VEHICLES.find(v => v.id === id));

  const data = vehicles.map(v => ({
    v,
    cost:   calculateAnnualCost(v, km),
    score:  calculateScore(v, profile),
    r3:     calculateResaleValue(v, 3),
    r5:     calculateResaleValue(v, 5)
  }));

  // ROWS definition: [label, accessor fn]
  const rows = [
    ["Score global",     d => d.score.global + " / 100"],
    ["Coût annuel",      d => d.cost.total.toLocaleString("fr-FR") + " €"],
    ["Coût / 100 km",    d => d.cost.per100 + " €"],
    ["Énergie",          d => d.cost.energy.toLocaleString("fr-FR") + " €"],
    ["Entretien",        d => d.cost.maintenance.toLocaleString("fr-FR") + " €"],
    ["Assurance",        d => d.cost.insurance.toLocaleString("fr-FR") + " €"],
    ["Revente 3 ans",    d => d.r3.toLocaleString("fr-FR") + " €"],
    ["Revente 5 ans",    d => d.r5.toLocaleString("fr-FR") + " €"],
    ["Puissance",        d => d.v.power + " ch"],
    ["Conso réelle",     d => d.v.realConso + (d.v.fuelType === "electrique" ? " kWh/100" : " L/100")],
    ["Coffre",           d => d.v.trunkLiters + " L"]
  ];

  // Rows where "best" = lowest (cost)
  const lowerIsBetter = new Set([1, 2, 3, 4, 5]);

  // Build header
  const thead = document.getElementById("comp-table-head");
  thead.innerHTML = "";
  let headRow = "<tr><th>Critère</th>";
  data.forEach(d => {
    headRow += `<th>${d.v.brand} ${d.v.model}</th>`;
  });
  headRow += "</tr>";
  thead.innerHTML = headRow;

  // Build body
  const tbody = document.getElementById("comp-table-body");
  tbody.innerHTML = "";

  rows.forEach(([label, accessor], rowIdx) => {
    const rawVals = data.map(d => parseFloat(accessor(d)));
    const bestRaw = lowerIsBetter.has(rowIdx)
      ? Math.min(...rawVals)
      : Math.max(...rawVals);

    let tr = `<tr><td>${label}</td>`;
    data.forEach((d, i) => {
      const displayVal = accessor(d);
      const isBest     = !isNaN(rawVals[i]) && rawVals[i] === bestRaw;
      tr += `<td class="${isBest ? "best-val" : ""}">${displayVal}</td>`;
    });
    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}

/* ─── 11. COMPTEUR ──────────────────────────────────── */
function updateCount() {
  const n = selectedIds.length;
  document.getElementById("results-count").textContent =
    n === 0 ? "0 véhicule sélectionné"
    : n === 1 ? "1 véhicule sélectionné"
    : `${n} véhicules comparés`;
}
