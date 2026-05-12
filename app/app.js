const defaults = {
  mode: "calm",
  metrics: { energy: 6, mood: 6, sleep: 7 },
  profile: {
    age: "",
    weight: "",
    sex: "",
    height: "",
    intolerances: "",
    psychology: [],
    environment: "",
    city: "",
    medicine: "",
    medicineDetails: "",
    habits: "",
    goals: "",
    pets: "",
    plants: ""
  },
  dayShift: 0,
  completedPlan: [],
  meals: [],
  diary: [],
  chat: [
    { role: "ai", text: "Ciao, sono Aura. Dimmi cosa devi fare oggi e lo trasformo in un piano sostenibile." }
  ],
  tasks: [
    { title: "Preparare appunti per l'esame", note: "Divisa in 3 micro-step da 25 minuti.", priority: "high", category: "studio", minutes: 70, done: false },
    { title: "Rispondere alle email importanti", note: "Solo le conversazioni urgenti.", priority: "medium", category: "lavoro", minutes: 35, done: false },
    { title: "Sistemare la scrivania", note: "Task leggero da usare come transizione.", priority: "low", category: "casa", minutes: 20, done: false }
  ],
  routines: [
    { title: "Bere acqua", time: "ogni 2 ore", category: "cura", done: false },
    { title: "Passeggiata breve", time: "17:30", category: "fitness", done: false },
    { title: "Routine serale", time: "22:15", category: "riposo", done: false }
  ]
};

let state = loadState();

const els = {
  energy: document.querySelector("#energy"),
  mood: document.querySelector("#mood"),
  sleep: document.querySelector("#sleep"),
  energyValue: document.querySelector("#energyValue"),
  moodValue: document.querySelector("#moodValue"),
  sleepValue: document.querySelector("#sleepValue"),
  capacityScore: document.querySelector("#capacityScore"),
  coachMessage: document.querySelector("#coachMessage"),
  taskList: document.querySelector("#taskList"),
  taskCount: document.querySelector("#taskCount"),
  routineList: document.querySelector("#routineList"),
  routineCount: document.querySelector("#routineCount"),
  nutritionGrid: document.querySelector("#nutritionGrid"),
  nutritionStatus: document.querySelector("#nutritionStatus"),
  mealSuggestions: document.querySelector("#mealSuggestions"),
  careGrid: document.querySelector("#careGrid"),
  diaryForm: document.querySelector("#diaryForm"),
  diaryInput: document.querySelector("#diaryInput"),
  diaryStatus: document.querySelector("#diaryStatus"),
  diaryTimeline: document.querySelector("#diaryTimeline"),
  diaryInsights: document.querySelector("#diaryInsights"),
  timeline: document.querySelector("#timeline"),
  insightList: document.querySelector("#insightList"),
  quickInput: document.querySelector("#quickInput"),
  quickAdd: document.querySelector("#quickAdd"),
  resetDay: document.querySelector("#resetDay"),
  rebalance: document.querySelector("#rebalance"),
  canvas: document.querySelector("#loadCanvas"),
  plannerSummary: document.querySelector("#plannerSummary"),
  brainButton: document.querySelector("#brainButton"),
  brainMood: document.querySelector("#brainMood"),
  chatPanel: document.querySelector("#chatPanel"),
  closeChat: document.querySelector("#closeChat"),
  chatMessages: document.querySelector("#chatMessages"),
  chatInput: document.querySelector("#chatInput"),
  chatSend: document.querySelector("#chatSend"),
  voiceButton: document.querySelector("#voiceButton"),
  profileForm: document.querySelector("#profileForm"),
  profileStatus: document.querySelector("#profileStatus"),
  profileSummary: document.querySelector("#profileSummary"),
  profileFields: {
    age: document.querySelector("#profileAge"),
    weight: document.querySelector("#profileWeight"),
    sex: document.querySelector("#profileSex"),
    height: document.querySelector("#profileHeight"),
    intolerances: document.querySelector("#profileIntolerances"),
    environment: document.querySelector("#profileEnvironment"),
    city: document.querySelector("#profileCity"),
    medicine: document.querySelector("#profileMedicine"),
    medicineDetails: document.querySelector("#profileMedicineDetails"),
    habits: document.querySelector("#profileHabits"),
    goals: document.querySelector("#profileGoals"),
    pets: document.querySelector("#profilePets"),
    plants: document.querySelector("#profilePlants")
  }
};

function loadState() {
  const stored = localStorage.getItem("aura-state");
  if (!stored) return structuredClone(defaults);
  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(defaults),
      ...parsed,
      metrics: { ...defaults.metrics, ...(parsed.metrics || {}) },
      profile: { ...defaults.profile, ...(parsed.profile || {}) },
      chat: parsed.chat || defaults.chat,
      meals: parsed.meals || defaults.meals,
      diary: parsed.diary || defaults.diary,
      completedPlan: parsed.completedPlan || defaults.completedPlan
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem("aura-state", JSON.stringify(state));
}

function capacity() {
  const { energy, mood, sleep } = state.metrics;
  const openTasks = state.tasks.filter((task) => !task.done).length;
  const contextPenalty = state.profile.psychology.includes("Burnout") || state.profile.psychology.includes("Stress cronico") ? 6 : 0;
  const homeLoad = [state.profile.pets, state.profile.plants].filter((item) => item && item !== "No").length * 2;
  const loadPenalty = Math.min(22, openTasks * 4 + contextPenalty + homeLoad);
  return Math.max(18, Math.min(96, Math.round(energy * 4 + mood * 3.5 + sleep * 4 - loadPenalty)));
}

function messageFor(score) {
  const hasStressProfile = state.profile.psychology.some((item) => ["Stress cronico", "Burnout", "Sovraccarico"].includes(item));
  if (score < 50) {
    return "Capacità bassa. Riduciamo il carico visibile: un task essenziale, recupero protetto e reminder morbidi.";
  }
  if (hasStressProfile && score < 70) {
    return "Energia media con segnali di stress. Manteniamo priorità chiare, pause protette e poche decisioni da prendere.";
  }
  if (score < 70) {
    return "Energia media. Manteniamo una giornata realistica: due blocchi focus, pause protette e una routine leggera.";
  }
  return "Buona capacità. Puoi sostenere focus profondo e qualche attività sociale, senza riempire ogni spazio libero.";
}

function priorityWeight(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 1;
}

function minutesForTask(task, score) {
  const base = Number(task.minutes) || 30;
  if (score < 50) return Math.min(base, 25);
  if (score < 70) return Math.min(base, 50);
  return Math.min(base, 90);
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const day = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(day / 60)).padStart(2, "0")}:${String(day % 60).padStart(2, "0")}`;
}

function eventId(title, category, time) {
  return `${category}-${time}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildPlan(score) {
  const start = score < 50 ? "09:45" : score < 70 ? "09:00" : "08:30";
  let cursor = addMinutes(start, state.dayShift);
  const plan = [];
  const maxWorkBlocks = score < 50 ? 1 : score < 70 ? 2 : 3;
  const sortedTasks = state.tasks
    .filter((task) => !task.done)
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
    .slice(0, maxWorkBlocks);

  const pushEvent = (time, title, text, tag, category, minutes = 20) => {
    const id = eventId(title, category, time);
    plan.push({ id, time, title, text, tag, category, minutes, done: state.completedPlan.includes(id) });
  };

  pushEvent(cursor, "Check-in energia", "Aggiorna umore, acqua e priorità reali prima di iniziare.", "check", "cura", 10);
  cursor = addMinutes(cursor, 15);

  sortedTasks.forEach((task, index) => {
    const minutes = minutesForTask(task, score);
    pushEvent(cursor, task.title, `${minutes} minuti realistici. ${task.note}`, task.category || "focus", task.category || "studio", minutes);
    cursor = addMinutes(cursor, minutes + (score < 50 ? 20 : 12));
    if (index < sortedTasks.length - 1) {
      pushEvent(cursor, "Pausa intelligente", score < 50 ? "Recupero senza schermo e respirazione breve." : "Movimento, acqua e reset visivo.", "pause", "tempo libero", 12);
      cursor = addMinutes(cursor, 18);
    }
  });

  pushEvent("10:45", "Snack e idratazione", mealText("snack", "Snack semplice + acqua."), "snack", "alimentazione", 15);
  pushEvent("13:00", "Pranzo", mealText("pranzo", "Pasto stabile con proteine e carboidrati."), "meal", "alimentazione", 40);
  pushEvent("20:00", "Cena", mealText("cena", "Cena leggera e prevedibile."), "meal", "alimentazione", 35);

  if (state.profile.pets && state.profile.pets !== "No") {
    pushEvent("18:10", `Cura ${state.profile.pets.toLowerCase()}`, "Cibo, acqua e breve momento di presenza.", "pet", "casa", 20);
  }
  if (state.profile.plants && state.profile.plants !== "No") {
    pushEvent("18:45", "Cura piante", state.profile.plants === "Molte" ? "Controllo rapido umidità e luce." : "Annaffiatura o controllo foglie.", "plants", "casa", 15);
  }

  pushEvent(score < 50 ? "21:30" : "22:15", "Routine serale", "Igiene, riduzione stimoli e preparazione sonno.", "rest", "riposo", 30);

  return plan
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, score < 50 ? 7 : 10);
}

function mealText(kind, fallback) {
  const meal = state.meals.find((item) => item.kind === kind);
  if (!meal) return fallback;
  return `${meal.title}${state.profile.intolerances ? `, evitando: ${state.profile.intolerances}` : ""}.`;
}

function renderTimeline(score) {
  const plan = buildPlan(score);
  els.timeline.innerHTML = plan.map((event, index) => `
    <div class="time-block ${event.done ? "done" : ""}">
      <span class="time">${event.time}</span>
      <div>
        <h3>${escapeHtml(event.title)}</h3>
        <p>${escapeHtml(event.text)}</p>
      </div>
      <div class="plan-meta">
        <span>${escapeHtml(event.category)}</span>
        <span>${event.minutes} min</span>
        <span>energia ${energyNeed(event)}</span>
      </div>
      <div class="plan-actions">
        <button class="mini-button" type="button" data-plan-done="${index}" title="Completa blocco">✓</button>
        <button class="mini-button" type="button" data-plan-delay="${index}" title="Sono in ritardo">+15</button>
      </div>
    </div>
  `).join("");
  return plan;
}

function energyNeed(event) {
  if (["studio", "lavoro", "focus"].includes(event.category)) return event.minutes > 45 ? "alta" : "media";
  if (["riposo", "tempo libero", "alimentazione"].includes(event.category)) return "bassa";
  return "media";
}

function renderTasks() {
  const active = state.tasks.filter((task) => !task.done).length;
  els.taskCount.textContent = `${active} attivi`;
  els.taskList.innerHTML = state.tasks.map((task, index) => `
    <div class="task-card priority-${task.priority} ${task.done ? "done" : ""}">
      <div class="task-row">
        <div>
          <h3>${task.title}</h3>
          <p>${task.note}</p>
        </div>
        <button class="check" type="button" data-task="${index}" title="Completa task">${task.done ? "✓" : ""}</button>
      </div>
    </div>
  `).join("");
}

function renderRoutines() {
  const done = state.routines.filter((routine) => routine.done).length;
  els.routineCount.textContent = `${done}/${state.routines.length}`;
  els.routineList.innerHTML = state.routines.map((routine, index) => `
    <button class="routine-row ${routine.done ? "done" : ""}" type="button" data-routine="${index}">
      <strong>${routine.title}</strong>
      <span>${routine.time}</span>
    </button>
  `).join("");
}

function renderPlannerSummary(score, plan) {
  const productive = plan.filter((event) => ["studio", "lavoro", "focus"].includes(event.category)).length;
  const wellbeing = plan.filter((event) => ["cura", "riposo", "tempo libero", "alimentazione"].includes(event.category)).length;
  const home = plan.filter((event) => ["casa"].includes(event.category)).length;
  const balance = wellbeing >= productive ? "Equilibrato" : score < 55 ? "Da alleggerire" : "Attivo";
  els.plannerSummary.innerHTML = [
    ["Blocchi oggi", `${plan.length}`],
    ["Produttività", `${productive} blocchi`],
    ["Benessere", `${wellbeing} blocchi`],
    ["Balance check", `${balance}${home ? ` · casa ${home}` : ""}`]
  ].map(([label, value]) => `
    <article class="planner-chip">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function nutritionTargets(score) {
  const age = Number(state.profile.age) || 28;
  const weight = Number(String(state.profile.weight).replace(",", ".")) || 62;
  const height = Number(String(state.profile.height).replace(",", ".")) || 168;
  const sex = state.profile.sex === "Uomo" ? 5 : -161;
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sex);
  const activity = score > 72 ? 1.42 : score > 48 ? 1.32 : 1.22;
  const cognitive = state.profile.psychology.includes("Stress cronico") || score < 50 ? 80 : 130;
  const kcal = Math.round((bmr * activity + cognitive) / 10) * 10;
  const protein = Math.round(weight * 1.45);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  const water = Math.round((weight * 34 + (score > 70 ? 350 : 150)) / 100) / 10;
  return { kcal, protein, carbs, fat, water };
}

function renderNutrition(score) {
  const targets = nutritionTargets(score);
  els.nutritionStatus.textContent = score < 50 ? "Comfort energy" : "Focus energy";
  const cards = [
    ["kcal", targets.kcal, "energia sostenibile", 76],
    ["proteine", `${targets.protein}g`, "stabilità e recupero", 64],
    ["carboidrati", `${targets.carbs}g`, "focus senza crash", 70],
    ["grassi", `${targets.fat}g`, "sazietà e ormoni", 48],
    ["idratazione", `${targets.water}L`, "mente più chiara", 58]
  ];
  els.nutritionGrid.innerHTML = cards.map(([label, value, text, width]) => `
    <article class="nutrition-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <div class="progress"><i style="--value:${width}%"></i></div>
      <p>${text}</p>
    </article>
  `).join("");
  const soft = score < 50;
  const intolerance = state.profile.intolerances ? ` Evita ${escapeHtml(state.profile.intolerances)}.` : "";
  const meals = [
    ["Colazione", soft ? "Yogurt o alternativa, frutta morbida, cereali semplici." : "Pane o avena, proteine leggere, frutta."],
    ["Pranzo", mealText("pranzo", soft ? "Piatto unico caldo, proteine semplici e verdure." : "Proteine, carboidrati stabili e verdure colorate.")],
    ["Cena", mealText("cena", soft ? "Cena calma, digeribile, pochi passaggi." : "Cena bilanciata con quota proteica e carboidrati moderati.")]
  ];
  els.mealSuggestions.innerHTML = meals.map(([title, text]) => `
    <article class="meal-card">
      <div class="plate" aria-hidden="true"></div>
      <h3>${title}</h3>
      <p>${text}${intolerance}</p>
    </article>
  `).join("");
}

function renderCare(score) {
  const low = score < 50;
  const groups = [
    ["Attività fisica", [
      ["Passeggiata", low ? "8 minuti, ritmo morbido." : "20 minuti o stretching dinamico."],
      ["Mobilità", "Collo, spalle, schiena: poco ma continuo."]
    ]],
    ["Igiene", [
      ["Doccia", low ? "Versione minima accettabile." : "Doccia + skincare semplice."],
      ["Routine serale", "Denti, viso, preparazione sonno."]
    ]],
    ["Benessere mentale", [
      ["Respirazione", low ? "3 respiri lenti, nessuna performance." : "2 minuti di decompressione."],
      ["Journaling", "Una frase vera, non un tema."]
    ]]
  ];
  const completed = state.routines.filter((routine) => routine.done).length;
  els.routineCount.textContent = `${completed}/${state.routines.length}`;
  els.careGrid.innerHTML = groups.map(([title, items]) => `
    <section class="care-column">
      <h3>${title}</h3>
      ${items.map(([name, text]) => `
        <div class="care-item">
          <span>${name}</span>
          <p>${text}</p>
          <button type="button" data-care-add="${escapeHtml(name)}">Aggiungi al piano</button>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function inferMoodFromText(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("scarico") || normalized.includes("stress") || normalized.includes("ansia") || normalized.includes("male")) return "overload";
  if (normalized.includes("bene") || normalized.includes("meglio") || normalized.includes("fatto") || normalized.includes("content")) return "stable";
  if (normalized.includes("concentr") || normalized.includes("rimand") || normalized.includes("procrast")) return "focus";
  return "neutro";
}

function renderDiary() {
  els.diaryStatus.textContent = `${state.diary.length} note`;
  els.diaryTimeline.innerHTML = state.diary.length ? state.diary.slice(-6).reverse().map((entry) => `
    <article class="diary-entry">
      <span>${entry.date} · ${entry.mood}</span>
      <h3>${entry.title}</h3>
      <p>${escapeHtml(entry.text)}</p>
    </article>
  `).join("") : `
    <article class="diary-entry">
      <span>Oggi</span>
      <h3>Nessuna pressione</h3>
      <p>Quando vuoi, scrivi una frase. Aura userà il diario per trovare pattern senza giudicare.</p>
    </article>
  `;
  const last = state.diary[state.diary.length - 1];
  const insight = last ? gentleDiaryInsight(last) : "Il diario diventerà una memoria leggera: pattern, progressi realistici e difficoltà ricorrenti.";
  els.diaryInsights.innerHTML = `
    <article class="diary-insight-card">
      <span>Insight gentile</span>
      <p>${escapeHtml(insight)}</p>
    </article>
    <article class="diary-insight-card">
      <span>Pattern osservato</span>
      <p>${state.diary.length > 2 ? "Stai costruendo continuità: è più utile della perfezione." : "Servono poche note per iniziare a vedere pattern utili."}</p>
    </article>
  `;
}

function gentleDiaryInsight(entry) {
  if (entry.mood === "overload") return "Sembra una giornata da carico ridotto: micro-task, pasti semplici e decompressione prima del sonno.";
  if (entry.mood === "focus") return "C’è un tema di concentrazione: domani conviene mostrare meno scelte e un primo blocco molto guidato.";
  if (entry.mood === "stable") return "Nota positiva registrata: il sistema può proteggere le abitudini che hanno funzionato.";
  return "Memoria salvata: anche una nota neutra aiuta Aura a capire il ritmo reale.";
}

function renderInsights(score) {
  const insights = [
    score < 50 ? "Ridotta densità informativa: mostro meno pannelli e meno task." : "Densità stabile: dashboard completa, ma con priorità chiare.",
    state.metrics.sleep < 6 ? "Sonno basso: meglio evitare lavoro cognitivo pesante dopo le 16." : "Sonno sufficiente: puoi programmare focus prima del pomeriggio.",
    state.tasks.some((task) => task.priority === "high" && !task.done) ? "C'è un task critico aperto: proteggo il primo blocco utile." : "Nessuna urgenza alta scoperta: mantengo equilibrio e routine.",
    profileContextInsight()
  ];
  els.insightList.innerHTML = insights.map((text) => `<div class="insight"><p>${text}</p></div>`).join("");
}

function profileContextInsight() {
  const profile = state.profile;
  if (!profile.city && !profile.environment && profile.psychology.length === 0) {
    return "Profilo ancora incompleto: aggiungendo contesto, Aura potrà adattare meglio routine e carico.";
  }
  if (profile.psychology.includes("Disturbo dell'attenzione")) {
    return "Profilo ADHD/attenzione: priorità a micro-task, timer brevi e una sola azione visibile alla volta.";
  }
  if (profile.environment.includes("rumoroso") || profile.environment.includes("urbano")) {
    return "Ambiente stimolante: conviene proteggere blocchi focus e inserire pause di decompressione.";
  }
  return `Contesto registrato${profile.city ? ` per ${profile.city}` : ""}: il piano può usare ambiente, salute percepita e routine.`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProfile() {
  Object.entries(els.profileFields).forEach(([key, field]) => {
    field.value = state.profile[key] || "";
  });
  document.querySelectorAll('input[name="psychology"]').forEach((checkbox) => {
    checkbox.checked = state.profile.psychology.includes(checkbox.value);
  });

  const completed = [
    state.profile.age,
    state.profile.weight,
    state.profile.sex,
    state.profile.height,
    state.profile.intolerances,
    state.profile.psychology.length ? "ok" : "",
    state.profile.environment,
    state.profile.city,
    state.profile.medicine,
    state.profile.habits,
    state.profile.goals,
    state.profile.pets,
    state.profile.plants
  ].filter(Boolean).length;

  els.profileStatus.textContent = completed === 13 ? "Completo" : `${completed}/13`;
  const medicineText = state.profile.medicine === "Sì" && state.profile.medicineDetails
    ? `${state.profile.medicine}: ${state.profile.medicineDetails}`
    : state.profile.medicine || "Non indicato";

  const summary = [
    ["Dati corpo", [withUnit(state.profile.age, "anni"), withUnit(state.profile.weight, "kg"), state.profile.sex, withUnit(state.profile.height, "cm")].filter(Boolean).join(" · ") || "Non indicati"],
    ["Alimentazione", state.profile.intolerances || "Nessuna intolleranza indicata"],
    ["Stato psicologico", state.profile.psychology.join(", ") || "Non indicato"],
    ["Ambiente", [state.profile.environment, state.profile.city].filter(Boolean).join(" · ") || "Non indicato"],
    ["Obiettivi", state.profile.goals || "Non indicati"],
    ["Casa", [state.profile.pets, state.profile.plants ? `piante: ${state.profile.plants}` : ""].filter(Boolean).join(" · ") || "Non indicata"],
    ["Medicine", medicineText]
  ];

  els.profileSummary.innerHTML = `<div class="summary-list">${summary.map(([label, value]) => `
    <div class="summary-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("")}</div>`;
}

function renderChat() {
  els.chatMessages.innerHTML = state.chat.slice(-8).map((message) => `
    <div class="chat-message ${message.role}">
      ${escapeHtml(message.text)}
    </div>
  `).join("");
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function renderBrain(score) {
  if (score < 50) {
    els.brainMood.textContent = "Recovery mode";
    return;
  }
  if (state.tasks.some((task) => !task.done && task.priority === "high")) {
    els.brainMood.textContent = "Sto prioritizzando";
    return;
  }
  els.brainMood.textContent = "Planner attivo";
}

function renderAdaptiveState() {
  const score = capacity();
  els.energyValue.textContent = state.metrics.energy;
  els.moodValue.textContent = score < 50 ? "soft" : score < 70 ? "medio" : "chiaro";
  els.sleepValue.textContent = `${state.metrics.sleep}h`;
  document.querySelector("#energyText").textContent = score < 50 ? "Pochi blocchi, più recupero." : "Ritmo sostenibile e pause integrate.";
  document.querySelector("#moodText").textContent = score < 50 ? "Interfaccia ridotta, meno pressione." : "Priorità chiare, densità stabile.";
  document.querySelector("#sleepText").textContent = state.metrics.sleep < 6 ? "Serata protetta consigliata." : "Recupero sufficiente da mantenere.";
}

function withUnit(value, unit) {
  return value ? `${value} ${unit}` : "";
}

function drawCanvas(score) {
  const ctx = els.canvas.getContext("2d");
  const width = els.canvas.width;
  const height = els.canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--surface").trim();
  ctx.fillRect(0, 0, width, height);

  const colors = ["#3d7c68", "#d98c44", "#bc5e55"];
  const points = [state.metrics.energy, state.metrics.mood, state.metrics.sleep, Math.round(score / 10), state.tasks.filter((task) => !task.done).length + 2];
  const max = 10;

  ctx.strokeStyle = "rgba(105, 115, 111, 0.22)";
  ctx.lineWidth = 1;
  for (let y = 42; y < height - 28; y += 42) {
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(width - 28, y);
    ctx.stroke();
  }

  ctx.beginPath();
  points.forEach((value, index) => {
    const x = 48 + index * ((width - 96) / (points.length - 1));
    const y = height - 38 - (Math.min(max, value) / max) * (height - 78);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = colors[score < 50 ? 2 : score < 70 ? 1 : 0];
  ctx.lineWidth = 4;
  ctx.stroke();

  points.forEach((value, index) => {
    const x = 48 + index * ((width - 96) / (points.length - 1));
    const y = height - 38 - (Math.min(max, value) / max) * (height - 78);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = colors[score < 50 ? 2 : score < 70 ? 1 : 0];
    ctx.fill();
  });

  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim();
  ctx.font = "700 13px Inter, system-ui";
  ["Energia", "Umore", "Sonno", "Capacity", "Carico"].forEach((label, index) => {
    const x = 26 + index * ((width - 96) / (points.length - 1));
    ctx.fillText(label, x, height - 12);
  });
}

function setMode(mode) {
  state.mode = mode;
  document.body.classList.toggle("mode-focus", mode === "focus");
  document.body.classList.toggle("mode-recovery", mode === "recovery");
  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function render() {
  setMode(state.mode);

  const score = capacity();
  document.body.classList.toggle("low-capacity", score < 50);
  els.capacityScore.textContent = score;
  els.coachMessage.textContent = messageFor(score);
  renderAdaptiveState();
  const plan = renderTimeline(score);
  renderPlannerSummary(score, plan);
  renderNutrition(score);
  renderCare(score);
  renderTasks();
  renderInsights(score);
  renderProfile();
  renderDiary();
  renderChat();
  renderBrain(score);
  drawCanvas(score);
  saveState();
}

function inferQuickEntry(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("colazione") || normalized.includes("pranzo") || normalized.includes("cena") || normalized.includes("snack")) {
    const kind = normalized.includes("colazione") ? "colazione" : normalized.includes("pranzo") ? "pranzo" : normalized.includes("cena") ? "cena" : "snack";
    state.meals = state.meals.filter((meal) => meal.kind !== kind);
    state.meals.push({ kind, title: text });
    return `Ho aggiornato ${kind} e ricalcolato il piano alimentare.`;
  }
  if (normalized.includes("cane") || normalized.includes("gatto")) {
    state.profile.pets = normalized.includes("cane") ? "Cane" : "Gatto";
    state.routines.unshift({ title: text, time: "adattivo", category: "casa", done: false });
    return "Ho aggiunto la cura dell'animale nel piano giornaliero.";
  }
  if (normalized.includes("acqua") || normalized.includes("doccia") || normalized.includes("piante") || normalized.includes("medicine") || normalized.includes("medicina")) {
    if (normalized.includes("piante")) state.profile.plants = state.profile.plants || "Poche";
    state.routines.unshift({ title: text, time: "adattivo", category: "cura", done: false });
    return "Ho inserito questa routine e ribilanciato la giornata.";
  }
  if (normalized.includes("ritardo") || normalized.includes("in ritardo")) {
    state.dayShift += 20;
    state.mode = "recovery";
    return "Ok, sposto in avanti i prossimi blocchi e alleggerisco il ritmo.";
  }
  if (normalized.includes("anticipo") || normalized.includes("finito prima")) {
    state.dayShift = Math.max(0, state.dayShift - 15);
    return "Perfetto, recupero margine e tengo una pausa protetta invece di riempire tutto.";
  }
  if (normalized.includes("film") || normalized.includes("hobby") || normalized.includes("relax") || normalized.includes("tempo libero")) {
    state.tasks.unshift({ title: text, note: "Tempo libero pianificato come recupero mentale.", priority: "low", category: "tempo libero", minutes: 45, done: false });
    return "Ho aggiunto tempo libero come parte del bilanciamento, non come extra opzionale.";
  }
  if (normalized.includes("stress") || normalized.includes("scarico") || normalized.includes("stanca") || normalized.includes("stanco")) {
    state.metrics.energy = Math.max(1, state.metrics.energy - 2);
    state.metrics.mood = Math.max(1, state.metrics.mood - 2);
    state.mode = "recovery";
    return "Ho abbassato la capacità stimata e semplificato il piano.";
  }
  if (normalized.includes("bene") || normalized.includes("carico") || normalized.includes("motivato")) {
    state.metrics.energy = Math.min(10, state.metrics.energy + 1);
    state.metrics.mood = Math.min(10, state.metrics.mood + 1);
    state.mode = "focus";
    return "Registro più capacità: aumento un po’ il margine, mantenendo pause e pasti stabili.";
  }

  const minutesMatch = normalized.match(/(\d+)\s*(ore|ora|h|minuti|min)/);
  const minutes = minutesMatch ? (minutesMatch[2].startsWith("or") || minutesMatch[2] === "h" ? Number(minutesMatch[1]) * 60 : Number(minutesMatch[1])) : 35;
  const category = normalized.includes("studio") || normalized.includes("esame") ? "studio" : normalized.includes("lavoro") || normalized.includes("call") ? "lavoro" : "focus";
  const priority = normalized.includes("urgente") || normalized.includes("esame") || normalized.includes("visita") || normalized.includes("scadenza") ? "high" : "medium";
  state.tasks.unshift({ title: text, note: "Creato dall'AI planner e inserito nella prossima fascia sostenibile.", priority, category, minutes, done: false });
  return "Ho trasformato l'input in un task e ricalcolato le fasce orarie.";
}

function sendChatMessage(text) {
  state.chat.push({ role: "user", text });
  const reply = inferQuickEntry(text);
  state.chat.push({ role: "ai", text: reply });
  render();
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
    saveState();
    drawCanvas(capacity());
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-panel="${button.dataset.view}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

els.taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-task]");
  if (!button) return;
  state.tasks[Number(button.dataset.task)].done = !state.tasks[Number(button.dataset.task)].done;
  render();
});

els.careGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-care-add]");
  if (!button) return;
  state.routines.unshift({ title: button.dataset.careAdd, time: "adattivo", category: "cura", done: false });
  state.chat.push({ role: "ai", text: `${button.dataset.careAdd} aggiunto come cura personale sostenibile.` });
  render();
});

els.timeline.addEventListener("click", (event) => {
  const doneButton = event.target.closest("[data-plan-done]");
  const delayButton = event.target.closest("[data-plan-delay]");
  const plan = buildPlan(capacity());
  if (doneButton) {
    const item = plan[Number(doneButton.dataset.planDone)];
    if (!item) return;
    state.completedPlan = state.completedPlan.includes(item.id)
      ? state.completedPlan.filter((id) => id !== item.id)
      : [...state.completedPlan, item.id];
    render();
  }
  if (delayButton) {
    state.dayShift += 15;
    state.chat.push({ role: "ai", text: "Ho spostato i prossimi blocchi di 15 minuti e rifatto il balance check." });
    render();
  }
});

els.quickAdd.addEventListener("click", () => {
  const text = els.quickInput.value.trim();
  if (!text) return;
  const reply = inferQuickEntry(text);
  state.chat.push({ role: "user", text });
  state.chat.push({ role: "ai", text: reply });
  els.quickInput.value = "";
  render();
});

els.quickInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.quickAdd.click();
});

els.brainButton.addEventListener("click", () => {
  els.chatPanel.classList.add("open");
  els.chatInput.focus();
});

els.closeChat.addEventListener("click", () => {
  els.chatPanel.classList.remove("open");
});

els.chatSend.addEventListener("click", () => {
  const text = els.chatInput.value.trim();
  if (!text) return;
  els.chatInput.value = "";
  sendChatMessage(text);
});

els.chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.chatSend.click();
});

els.voiceButton.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    state.chat.push({ role: "ai", text: "Il riconoscimento vocale non è disponibile in questo browser. Puoi scrivermi lo stesso comando qui." });
    render();
    els.chatPanel.classList.add("open");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "it-IT";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    sendChatMessage(text);
  };
  recognition.onerror = () => {
    state.chat.push({ role: "ai", text: "Non sono riuscita ad ascoltare bene. Scrivimi il comando e aggiorno il piano." });
    render();
    els.chatPanel.classList.add("open");
  };
  recognition.start();
});

els.profileForm.addEventListener("input", (event) => {
  const target = event.target;
  if (target.name === "psychology") {
    state.profile.psychology = Array.from(document.querySelectorAll('input[name="psychology"]:checked')).map((checkbox) => checkbox.value);
  } else {
    const entry = Object.entries(els.profileFields).find(([, field]) => field === target);
    if (entry) state.profile[entry[0]] = target.value.trim();
  }
  render();
});

els.profileForm.addEventListener("change", (event) => {
  const target = event.target;
  const entry = Object.entries(els.profileFields).find(([, field]) => field === target);
  if (entry) {
    state.profile[entry[0]] = target.value.trim();
    render();
  }
});

els.diaryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = els.diaryInput.value.trim();
  if (!text) return;
  const mood = inferMoodFromText(text);
  state.diary.push({
    text,
    mood,
    title: mood === "overload" ? "Giornata pesante" : mood === "focus" ? "Focus da proteggere" : mood === "stable" ? "Qualcosa ha funzionato" : "Nota personale",
    date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short" })
  });
  if (mood === "overload") {
    state.metrics.energy = Math.max(1, state.metrics.energy - 1);
    state.mode = "recovery";
  }
  els.diaryInput.value = "";
  render();
});

els.rebalance.addEventListener("click", () => {
  const score = capacity();
  if (score < 50) state.mode = "recovery";
  if (score >= 70) state.mode = "focus";
  render();
});

els.resetDay.addEventListener("click", () => {
  state = structuredClone(defaults);
  render();
});

render();
