// iAutomobile — MVP statique (HTML)
// Tout est local: données véhicules + scoring + coûts.

const VEHICLES = [
  {
    id: "clio5_tce90_2021",
    brand: "Renault",
    model: "Clio V",
    year: 2021,
    motorisation: "Essence",
    powerHp: 90,
    torqueNm: 160,
    consumptionReal: 5.8, // L/100
    trunkL: 391,
    priceNewEur: 19000,
    resale3yEur: 12500,
    resale5yEur: 9500,
    segment: "Citadine",
    practicality: { comfort: 60, space: 55, sport: 40 }
  },
  {
    id: "308_bluehdi130_2020",
    brand: "Peugeot",
    model: "308",
    year: 2020,
    motorisation: "Diesel",
    powerHp: 130,
    torqueNm: 300,
    consumptionReal: 5.0, // L/100
    trunkL: 420,
    priceNewEur: 28500,
    resale3yEur: 17000,
    resale5yEur: 12500,
    segment: "Compacte",
    practicality: { comfort: 68, space: 65, sport: 55 }
  },
  {
    id: "model3_lr_2023",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    motorisation: "Électrique",
    powerHp: 498,
    torqueNm: 660,
    kwhPer100: 16.5, // kWh/100
    trunkL: 425,
    priceNewEur: 47000,
    resale3yEur: 33500,
    resale5yEur: 26500,
    segment: "Berline",
    practicality: { comfort: 72, space: 70, sport: 75 }
  },
  {
    id: "yaris_hybrid_2022",
    brand: "Toyota",
    model: "Yaris",
    year: 2022,
    motorisation: "Hybride",
    powerHp: 116,
    torqueNm: 141,
    consumptionReal: 4.6, // L/100
    trunkL: 286,
    priceNewEur: 23000,
    resale3yEur: 16500,
    resale5yEur: 13500,
    segment: "Citadine",
    practicality: { comfort: 62, space: 52, sport: 48 }
  },
  {
    id: "tiguan_tsi150_2021",
    brand: "Volkswagen",
    model: "Tiguan",
    year: 2021,
    motorisation: "Essence",
    powerHp: 150,
    torqueNm: 250,
    consumptionReal: 7.3, // L/100
    trunkL: 615,
    priceNewEur: 39500,
    resale3yEur: 27500,
    resale5yEur: 22000,
    segment: "SUV",
    practicality: { comfort: 75, space: 82, sport: 52 }
  },
  {
    id: "bmw_330d_touring_2020",
    brand: "BMW",
    model: "330d Touring",
    year: 2020,
    motorisation: "Diesel",
    powerHp: 265,
    torqueNm: 580,
    consumptionReal: 6.2,
    trunkL: 500,
    priceNewEur: 62000,
    resale3yEur: 41000,
    resale5yEur: 33500,
    segment: "Break",
    practicality: { comfort: 78, space: 76, sport: 72 }
  }
];

// Hypothèses coûts FR (indicatives) — modifiables facilement
const PRICES_FR = {
  gasolineEurPerL: 1.90,
  dieselEurPerL: 1.80,
  electricityEurPerKwh: 0.25,
};

const INSURANCE_BY_SEGMENT = {
  "Citadine": 650,
  "Compacte": 750,
  "Berline": 900,
  "SUV": 950,
  "Break": 950,
  "default": 800,
};

const MAINTENANCE_BY_MOTOR = {
  "Essence": 550,
  "Diesel": 650,
  "Hybride": 520,
  "Hybride rechargeable": 560,
  "Électrique": 380,
  "Mild hybrid": 560,
  "default": 560,
};

// Profils (pondérations)
const PROFILES = {
  urban: { label: "Urbain", w: { rational: 0.45, usage: 0.35, emotion: 0.20 } },
  long:  { label: "Long Trajet", w: { rational: 0.50, usage: 0.35, emotion: 0.15 } },
  sport: { label: "Sportif", w: { rational: 0.25, usage: 0.25, emotion: 0.50 } },
  family:{ label: "Famille Optimisée", w: { rational: 0.45, usage: 0.40, emotion: 0.15 } },
};

const TRIPS = {
  city: { label: "Ville", multiplier: { fuel: 1.08, electric: 1.03 } },
  mix: { label: "Mixte", multiplier: { fuel: 1.00, electric: 1.00 } },
  highway: { label: "Autoroute", multiplier: { fuel: 0.98, electric: 1.07 } },
};

const state = {
  profile: "urban",
  trip: "city",
  kmPerYear: 12000,
  selectedIds: [],
};

function eur(n) {
  const v = Math.round(n);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function getInsurance(segment) {
  return INSURANCE_BY_SEGMENT[segment] ?? INSURANCE_BY_SEGMENT.default;
}

function getMaintenance(motorisation) {
  return MAINTENANCE_BY_MOTOR[motorisation] ?? MAINTENANCE_BY_MOTOR.default;
}

function isElectric(v) { return v.motorisation.toLowerCase().includes("élect"); }

function annualEnergyCost(vehicle, kmPerYear, tripKey) {
  const trip = TRIPS[tripKey] || TRIPS.mix;

  if (isElectric(vehicle)) {
    const kwh100 = vehicle.kwhPer100 ?? 18.0;
    const kwh = (kwh100 / 100) * kmPerYear * trip.multiplier.electric;
    return kwh * PRICES_FR.electricityEurPerKwh;
  }

  // thermiques / hybrides (simple MVP): on utilise consumptionReal L/100
  const l100 = vehicle.consumptionReal ?? 6.5;
  const liters = (l100 / 100) * kmPerYear * trip.multiplier.fuel;

  const mot = vehicle.motorisation.toLowerCase();
  const pricePerL = mot.includes("diesel") ? PRICES_FR.dieselEurPerL : PRICES_FR.gasolineEurPerL;
  return liters * pricePerL;
}

function annualCostBreakdown(vehicle, kmPerYear, tripKey) {
  const energy = annualEnergyCost(vehicle, kmPerYear, tripKey);
  const maintenance = getMaintenance(vehicle.motorisation);
  const insurance = getInsurance(vehicle.segment);

  // Total annuel (on reste "coût d'usage" MVP sans décote dans le total annuel)
  const total = energy + maintenance + insurance;

  const costPer100 = (total / kmPerYear) * 100;

  return { energy, maintenance, insurance, total, costPer100 };
}

function resaleValue(vehicle, years) {
  if (years <= 3) return vehicle.resale3yEur ?? (vehicle.priceNewEur * 0.62);
  return vehicle.resale5yEur ?? (vehicle.priceNewEur * 0.48);
}

function depreciationPerYear(vehicle, years) {
  const base = vehicle.priceNewEur ?? 0;
  const resale = resaleValue(vehicle, years);
  const dep = clamp(base - resale, 0, 1e12);
  return dep / years;
}

// --- Scoring (100) ---
// Rational: coût annuel (incl. décote annualisée) + efficience
// Usage: coffre + (comfort/space) + adéquation profil
// Emotion: puissance + couple + "image" proxy par segment + sport rating
function scoreVehicle(vehicle, profileKey, kmPerYear, tripKey) {
  const prof = PROFILES[profileKey] ?? PROFILES.urban;

  const breakdown = annualCostBreakdown(vehicle, kmPerYear, tripKey);
  const depY = depreciationPerYear(vehicle, 5); // décote annualisée sur 5 ans (stable MVP)
  const tcoAnnual = breakdown.total + depY;

  // Rational score: plus c'est bas, mieux c'est. Normalisation sur une plage MVP.
  // On mappe [3500..14000] -> [100..20]
  const rational = clamp(
    120 - ((tcoAnnual - 3500) / (14000 - 3500)) * 100,
    20,
    100
  );

  // Usage score: coffre + comfort + space, pondéré selon profil
  const trunk = vehicle.trunkL ?? 400;
  const trunkScore = clamp(((trunk - 250) / (650 - 250)) * 100, 10, 100);

  const comfort = vehicle.practicality?.comfort ?? 65;
  const space = vehicle.practicality?.space ?? 65;

  // Adequation profile bonus (simple, efficace)
  let fitBonus = 0;
  if (profileKey === "urban") {
    fitBonus += trunk < 450 ? 6 : -4;
    fitBonus += vehicle.segment === "Citadine" ? 8 : 0;
  }
  if (profileKey === "long") {
    fitBonus += comfort >= 72 ? 8 : 0;
    fitBonus += trunk >= 420 ? 6 : 0;
    fitBonus += (vehicle.torqueNm ?? 200) >= 300 ? 6 : 0;
  }
  if (profileKey === "sport") {
    fitBonus += (vehicle.powerHp ?? 120) >= 200 ? 10 : 0;
    fitBonus += (vehicle.practicality?.sport ?? 55) >= 70 ? 8 : 0;
  }
  if (profileKey === "family") {
    fitBonus += trunk >= 450 ? 10 : -6;
    fitBonus += space >= 72 ? 8 : 0;
  }

  const usage = clamp((0.40 * trunkScore + 0.30 * comfort + 0.30 * space) + fitBonus, 10, 100);

  // Emotion score: puissance, couple, sport rating + "image" proxy segment
  const hp = vehicle.powerHp ?? 120;
  const tq = vehicle.torqueNm ?? 200;
  const hpScore = clamp(((hp - 80) / (500 - 80)) * 100, 5, 100);
  const tqScore = clamp(((tq - 120) / (660 - 120)) * 100, 5, 100);
  const sport = vehicle.practicality?.sport ?? 55;

  let image = 55;
  if (vehicle.brand === "BMW") image = 78;
  if (vehicle.brand === "Tesla") image = 74;
  if (vehicle.brand === "Volkswagen") image = 66;
  if (vehicle.brand === "Toyota") image = 62;
  if (vehicle.brand === "Peugeot") image = 60;
  if (vehicle.brand === "Renault") image = 58;

  const emotion = clamp(0.35 * hpScore + 0.25 * tqScore + 0.20 * sport + 0.20 * image, 5, 100);

  const scoreGlobal = clamp(
    (prof.w.rational * rational) + (prof.w.usage * usage) + (prof.w.emotion * emotion),
    1,
    100
  );

  return {
    scoreGlobal: Math.round(scoreGlobal),
    scores: { rational: Math.round(rational), usage: Math.round(usage), emotion: Math.round(emotion) },
    costs: breakdown,
    depAnnual: depY,
    tcoAnnual,
  };
}

function badgeFor(vehicle, scored, context) {
  // context: minCost, maxScore, maxUsage, maxEmotion etc.
  const { minAnnual, maxGlobal, maxUsage, maxEmotion } = context;

  if (Math.abs(scored.costs.total - minAnnual) < 1e-6) return { text: "Le moins cher", kind: "green" };
  if (scored.scoreGlobal === maxGlobal) return { text: "Meilleur score", kind: "dark" };
  if (scored.scores.usage === maxUsage) return { text: "Meilleure praticité", kind: "green" };
  if (scored.scores.emotion === maxEmotion) return { text: "Plus fun", kind: "dark" };

  return { text: "Comparé", kind: "none" };
}

function verdictFor(vehicle, scored) {
  const p = PROFILES[state.profile].label;
  const s = scored;

  // 3 phrases max, tranchées mais simples
  const lines = [];

  if (s.scores.rational >= 78) lines.push("Très solide sur le coût total (usage + décote).");
  else if (s.scores.rational <= 45) lines.push("Plutôt cher à l’usage et/ou en décote.");

  if (state.profile === "urban") {
    lines.push(vehicle.trunkL < 450 ? "Parfait pour la ville (gabarit/praticité)." : "Un peu volumineux en ville.");
  } else if (state.profile === "long") {
    lines.push((vehicle.torqueNm ?? 0) >= 300 ? "Bon couple et confort pour l’autoroute." : "Moins taillé pour avaler les kilomètres.");
  } else if (state.profile === "sport") {
    lines.push((vehicle.powerHp ?? 0) >= 200 ? "Plaisir/perf au rendez-vous." : "Sportif… mais plutôt soft.");
  } else if (state.profile === "family") {
    lines.push(vehicle.trunkL >= 450 ? "Coffre et espace adaptés à la famille." : "Coffre un peu juste pour une famille.");
  }

  // Conclusion courte
  if (s.scoreGlobal >= 78) lines.push(`Verdict: excellent choix pour le profil ${p}.`);
  else if (s.scoreGlobal >= 62) lines.push(`Verdict: bon compromis pour le profil ${p}.`);
  else lines.push(`Verdict: à choisir seulement si tu acceptes les compromis.`);

  return lines.slice(0, 3).join(" ");
}

// --- UI ---
const $ = (sel) => document.querySelector(sel);

function renderModels() {
  const wrap = $("#modelsList");
  wrap.innerHTML = VEHICLES.map(v => `
    <div class="model">
      <div class="model__name">${v.brand} ${v.model} (${v.year})</div>
      <div class="model__meta">${v.motorisation} • ${v.segment}</div>
      <div class="model__chips">
        <span class="pill">${v.powerHp} ch</span>
        <span class="pill">${v.trunkL} L coffre</span>
        <span class="pill">${isElectric(v) ? (v.kwhPer100 + " kWh/100") : (v.consumptionReal + " L/100")}</span>
      </div>
    </div>
  `).join("");
}

function populateAddSelect() {
  const sel = $("#addSelect");
  sel.innerHTML = VEHICLES.map(v => `<option value="${v.id}">${v.brand} ${v.model} ${v.year} — ${v.motorisation}</option>`).join("");
}

function setSegmentActive(containerSel, dataAttr, value) {
  document.querySelectorAll(`${containerSel} [data-${dataAttr}]`).forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset[dataAttr] === value);
  });
}

function humanMotor(v){
  return `${v.motorisation} • ${v.powerHp} ch • ${v.torqueNm} Nm`;
}

function computeContext(scoredList) {
  const annuals = scoredList.map(s => s.scored.costs.total);
  const globals = scoredList.map(s => s.scored.scoreGlobal);
  const usages = scoredList.map(s => s.scored.scores.usage);
  const emotions = scoredList.map(s => s.scored.scores.emotion);

  return {
    minAnnual: Math.min(...annuals),
    maxGlobal: Math.max(...globals),
    maxUsage: Math.max(...usages),
    maxEmotion: Math.max(...emotions),
  };
}

function renderCards() {
  const wrap = $("#cards");
  if (state.selectedIds.length === 0) {
    wrap.innerHTML = `
      <div class="card">
        <div class="card__title">Ajoute des véhicules</div>
        <p class="muted">Utilise le sélecteur “Ajouter un véhicule” ci-dessus, puis compare jusqu’à 4 véhicules.</p>
      </div>
    `;
    return;
  }

  const selected = state.selectedIds
    .map(id => VEHICLES.find(v => v.id === id))
    .filter(Boolean);

  const scoredList = selected.map(v => ({
    vehicle: v,
    scored: scoreVehicle(v, state.profile, state.kmPerYear, state.trip),
  }));

  const ctx = computeContext(scoredList);

  wrap.innerHTML = scoredList.map(({vehicle:v, scored:s}) => {
    const b = badgeFor(v, s, ctx);
    const breakdown = s.costs;

    const total = breakdown.total;
    const pEnergy = (breakdown.energy / total) * 100;
    const pMaint = (breakdown.maintenance / total) * 100;
    const pIns = (breakdown.insurance / total) * 100;

    const badgeClass =
      b.kind === "green" ? "badge badge--green" :
      b.kind === "dark"  ? "badge badge--dark"  : "badge";

    const remove = `<button class="removeBtn" title="Retirer" data-remove="${v.id}">✕</button>`;

    return `
      <div class="card vcard">
        ${remove}
        <div class="vcard__top">
          <div>
            <div class="vcard__name">${v.brand} ${v.model}</div>
            <div class="vcard__sub">${v.year} • ${humanMotor(v)}</div>
          </div>
          <div class="${badgeClass}">${b.text}</div>
        </div>

        <div class="photo">Photo (placeholder)</div>

        <div class="cost">
          <div class="cost__big">
            <div>
              <div class="cost__small muted">Coût annuel estimé</div>
              <div class="cost__amt mono">${eur(breakdown.total)}</div>
            </div>
            <div style="text-align:right">
              <div class="cost__small muted">Coût / 100 km</div>
              <div class="mono" style="font-weight:800">${breakdown.costPer100.toFixed(1)} €</div>
            </div>
          </div>

          <div class="bars">
            <div class="bar">
              <div class="bar__label"><span>Énergie</span><span class="mono">${eur(breakdown.energy)}</span></div>
              <div class="bar__track"><div class="bar__fill" style="width:${pEnergy.toFixed(0)}%"></div></div>
            </div>
            <div class="bar">
              <div class="bar__label"><span>Entretien</span><span class="mono">${eur(breakdown.maintenance)}</span></div>
              <div class="bar__track"><div class="bar__fill" style="width:${pMaint.toFixed(0)}%"></div></div>
            </div>
            <div class="bar">
              <div class="bar__label"><span>Assurance</span><span class="mono">${eur(breakdown.insurance)}</span></div>
              <div class="bar__track"><div class="bar__fill" style="width:${pIns.toFixed(0)}%"></div></div>
            </div>
          </div>
        </div>

        <div class="scores">
          <div class="scores__top">
            <div>
              <div class="cost__small muted">Score global</div>
              <div class="scoreBig mono">${s.scoreGlobal}/100</div>
            </div>
            <div class="pill pill--green">Profil: ${PROFILES[state.profile].label}</div>
          </div>

          <div class="miniRow">
            ${miniScore("Rationnel", s.scores.rational)}
            ${miniScore("Usage", s.scores.usage)}
            ${miniScore("Émotion", s.scores.emotion)}
          </div>
        </div>

        <div class="verdict">
          ${verdictFor(v, s)}
          <div class="muted" style="margin-top:8px;font-size:12px">
            Décote annualisée (5 ans) ≈ <span class="mono">${eur(s.depAnnual)}</span> / an • Coût “usage + décote” ≈ <span class="mono">${eur(s.tcoAnnual)}</span> / an
          </div>
        </div>
      </div>
    `;
  }).join("");

  // bind remove
  wrap.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.remove;
      state.selectedIds = state.selectedIds.filter(x => x !== id);
      renderAll();
    });
  });

  // animate mini bars after render
  requestAnimationFrame(() => {
    wrap.querySelectorAll(".miniFill").forEach(el => {
      const w = el.getAttribute("data-w");
      el.style.width = w + "%";
    });
  });
}

function miniScore(label, value){
  const v = clamp(value, 0, 100);
  return `
    <div class="mini">
      <span>${label}</span>
      <div class="miniTrack"><div class="miniFill" data-w="${v}" style="width:0%"></div></div>
      <strong class="mono">${v}</strong>
    </div>
  `;
}

function renderTable() {
  const table = $("#compareTable");
  const selected = state.selectedIds.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean);

  if (selected.length === 0) {
    table.innerHTML = `
      <thead><tr><th>Indicateur</th><th>—</th></tr></thead>
      <tbody><tr><td class="rowLabel">Sélection</td><td class="muted">Ajoute des véhicules pour afficher le tableau.</td></tr></tbody>
    `;
    return;
  }

  const scored = selected.map(v => scoreVehicle(v, state.profile, state.kmPerYear, state.trip));

  const headers = `
    <thead>
      <tr>
        <th>Indicateur</th>
        ${selected.map(v => `<th>${v.brand} ${v.model}<div class="muted" style="font-size:11px;margin-top:4px">${v.year} • ${v.motorisation}</div></th>`).join("")}
      </tr>
    </thead>
  `;

  const rows = [
    row("Score global", scored.map(s => `${s.scoreGlobal}/100`)),
    row("Coût annuel (usage)", scored.map(s => eur(s.costs.total))),
    row("Coût / 100 km", scored.map(s => `${s.costs.costPer100.toFixed(1)} €`)),
    row("Énergie (an)", scored.map(s => eur(s.costs.energy))),
    row("Entretien (an)", scored.map(s => eur(s.costs.maintenance))),
    row("Assurance (an)", scored.map(s => eur(s.costs.insurance))),
    row("Décote (3 ans)", selected.map(v => eur((v.priceNewEur - resaleValue(v,3))))),
    row("Revente estimée 3 ans", selected.map(v => eur(resaleValue(v,3)))),
    row("Revente estimée 5 ans", selected.map(v => eur(resaleValue(v,5)))),
    row("Puissance", selected.map(v => `${v.powerHp} ch`)),
    row("Couple", selected.map(v => `${v.torqueNm} Nm`)),
    row("Conso réelle", selected.map(v => isElectric(v) ? `${v.kwhPer100} kWh/100` : `${v.consumptionReal} L/100`)),
    row("Volume coffre", selected.map(v => `${v.trunkL} L`)),
    row("Segment", selected.map(v => v.segment)),
  ].join("");

  table.innerHTML = headers + `<tbody>${rows}</tbody>`;
}

function row(label, values) {
  return `
    <tr>
      <td class="rowLabel">${label}</td>
      ${values.map(v => `<td class="mono">${v}</td>`).join("")}
    </tr>
  `;
}

function renderAll(){
  $("#kmLabel").textContent = String(state.kmPerYear);
  renderCards();
  renderTable();
}

// --- Controls binding ---
function bindControls(){
  // profile buttons
  document.querySelectorAll(`[data-profile]`).forEach(btn => {
    btn.addEventListener("click", () => {
      state.profile = btn.dataset.profile;
      setSegmentActive(".controls", "profile", state.profile);
      renderAll();
    });
  });

  // trip buttons
  document.querySelectorAll(`[data-trip]`).forEach(btn => {
    btn.addEventListener("click", () => {
      state.trip = btn.dataset.trip;
      setSegmentActive(".controls", "trip", state.trip);
      renderAll();
    });
  });

  // km slider
  $("#kmInput").addEventListener("input", (e) => {
    state.kmPerYear = parseInt(e.target.value, 10);
    $("#kmLabel").textContent = String(state.kmPerYear);
    renderAll();
  });

  // add vehicle
  $("#addBtn").addEventListener("click", () => {
    const id = $("#addSelect").value;
    if (!id) return;
    if (state.selectedIds.includes(id)) return;
    if (state.selectedIds.length >= 4) return;

    state.selectedIds.push(id);
    renderAll();
  });

  $("#resetBtn").addEventListener("click", () => {
    state.selectedIds = [];
    state.profile = "urban";
    state.trip = "city";
    state.kmPerYear = 12000;
    $("#kmInput").value = String(state.kmPerYear);
    setSegmentActive(".controls", "profile", state.profile);
    setSegmentActive(".controls", "trip", state.trip);
    renderAll();
  });

  $("#demoBtn").addEventListener("click", () => {
    state.selectedIds = ["308_bluehdi130_2020", "model3_lr_2023"];
    renderAll();
  });
}

function init(){
  $("#year").textContent = String(new Date().getFullYear());
  renderModels();
  populateAddSelect();
  bindControls();
  renderAll();
}
init();
