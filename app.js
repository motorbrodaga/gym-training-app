const DB_NAME = "gymTrainingApp";
const DB_VERSION = 1;
const STORE = "sessions";

const workouts = {
  A: {
    title: "Тренировка A",
    day: "Понедельник",
    focus: "Верх тела: грудь, спина, плечи",
    note: "Разминка 8-10 минут: эллипс или велотренажер в легком темпе, суставная разминка плеч, 1-2 разминочных подхода в первом упражнении. Работай с запасом 1-2 повтора, без моста через боль.",
    exercises: [
      { id: "bench_barbell", name: "Жим штанги лежа", weight: 55, sets: 3, reps: "8-10", unit: "кг", step: 2.5, tag: "контроль лопаток" },
      { id: "lat_pulldown", name: "Тяга вертикального блока", weight: 55, sets: 3, reps: "10", unit: "кг", step: 2.5, tag: "без рывков" },
      { id: "bench_dumbbell", name: "Жим гантелей лежа", weight: 18, sets: 3, reps: "10-12", unit: "кг", step: 1, tag: "на каждую руку" },
      { id: "chest_supported_row", name: "Тяга с упором грудью", weight: 35, sets: 3, reps: "10-12", unit: "кг", step: 2.5, tag: "поясница отдыхает" },
      { id: "machine_shoulder_press", name: "Жим плеч в тренажере", weight: 25, sets: 2, reps: "10-12", unit: "кг", step: 2.5, tag: "без прогиба" },
      { id: "face_pull", name: "Face Pull", weight: 20, sets: 3, reps: "15", unit: "кг", step: 1, tag: "плечи спокойно" },
    ],
  },
  B: {
    title: "Тренировка B",
    day: "Среда",
    focus: "Ноги и кор",
    note: "Разминка 8-10 минут: велотренажер или эллипс, мобилизация таза и голеностопа, легкие подходы в жиме ногами. Поясница прижата, амплитуда комфортная, без задержки дыхания.",
    exercises: [
      { id: "leg_press", name: "Жим ногами", weight: 100, sets: 3, reps: "10", unit: "кг", step: 5, tag: "поясница прижата" },
      { id: "leg_extension", name: "Разгибание ног", weight: 48, sets: 3, reps: "12", unit: "кг", step: 2.5, tag: "плавно" },
      { id: "leg_curl", name: "Сгибание ног", weight: 42, sets: 3, reps: "12", unit: "кг", step: 2.5, tag: "без рывков" },
      { id: "seated_calf_raise", name: "Подъемы на икры сидя", weight: 35, sets: 3, reps: "12-15", unit: "кг", step: 2.5, tag: "пауза сверху" },
      { id: "glute_bridge", name: "Ягодичный мост", weight: 0, sets: 3, reps: "12", unit: "кг", step: 2.5, tag: "без боли в пояснице" },
      { id: "dead_bug", name: "Dead Bug", weight: 0, sets: 3, reps: "8-10/стор.", unit: "повт.", step: 0, tag: "поясница нейтральна" },
      { id: "side_plank", name: "Боковая планка", weight: 0, sets: 2, reps: "20-30 сек/стор.", unit: "сек", step: 0, tag: "без скручивания" },
    ],
  },
  C: {
    title: "Тренировка C",
    day: "Пятница",
    focus: "Спина, руки и задняя дельта",
    note: "Разминка 8-10 минут: легкий тренажер, плечи и лопатки, 1-2 легких подхода тяги. Тяги делай корпусом спокойно, без добивания поясницей.",
    exercises: [
      { id: "seated_row", name: "Тяга горизонтального блока", weight: 59, sets: 3, reps: "10", unit: "кг", step: 2.5, tag: "корпус тихий" },
      { id: "assisted_pullup", name: "Гравитрон", weight: 45, sets: 3, reps: "6-8", unit: "кг помощи", step: -2.5, tag: "меньше помощи = тяжелее" },
      { id: "reverse_pec_deck", name: "Обратная бабочка", weight: 25, sets: 3, reps: "12-15", unit: "кг", step: 2.5, tag: "задняя дельта" },
      { id: "db_curl", name: "Сгибание рук с гантелями", weight: 12, sets: 3, reps: "10", unit: "кг", step: 1, tag: "без раскачки" },
      { id: "triceps_pushdown", name: "Разгибание рук в блоке", weight: 32, sets: 3, reps: "10", unit: "кг", step: 2.5, tag: "локти спокойно" },
      { id: "cable_lateral_raise", name: "Отведение руки в блоке в сторону", weight: 5, sets: 2, reps: "12-15/рука", unit: "кг", step: 1, tag: "без рывков" },
      { id: "bird_dog", name: "Bird Dog", weight: 0, sets: 3, reps: "12", unit: "повт.", step: 0, tag: "стабилизация" },
    ],
  },
};

const failureReasons = ["мало сна", "усталость", "боль или дискомфорт", "не хватило времени", "слишком тяжелый вес", "плохое самочувствие", "другое"];
const weekdayMap = { 1: "A", 3: "B", 5: "C" };
let db;
let selectedWorkout = getWorkoutForDate(new Date());
let sessions = [];
const selectedReasons = new Set();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("date", "date");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllSessions() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.date.localeCompare(a.date)));
    request.onerror = () => reject(request.error);
  });
}

function saveSession(session) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(session);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function clearSessions() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function getWorkoutForDate(date) {
  const day = date.getDay();
  if (weekdayMap[day]) return weekdayMap[day];
  if (day < 3) return "A";
  if (day < 5) return "B";
  return "C";
}

function exerciseById(id) {
  return Object.values(workouts).flatMap((workout) => workout.exercises).find((exercise) => exercise.id === id);
}

function latestExerciseResult(id) {
  for (const session of sessions) {
    const item = session.exercises.find((exercise) => exercise.id === id);
    if (item) return item;
  }
  return null;
}

function recommendedWeight(exercise) {
  const latest = latestExerciseResult(exercise.id);
  if (!latest) return exercise.weight;
  return Number(latest.nextWeight ?? latest.weight ?? exercise.weight);
}

function nextWeight(exercise, weight, feeling, pain) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || exercise.step === 0) return numeric || 0;
  if (pain === "pain") return numeric;
  if (feeling === "easy" && pain === "none") return Math.max(0, numeric + exercise.step);
  return numeric;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", weekday: "short" });
}

function renderToday() {
  const workout = workouts[selectedWorkout];
  $("#todayLabel").textContent = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  $("#screenTitle").textContent = "Тренировка дня";
  $("#workoutDay").textContent = workout.day;
  $("#workoutName").textContent = `${workout.title}: ${workout.focus}`;
  $("#safetyNote").textContent = workout.note;
  $("#nextWorkoutPill").textContent = `Сегодня: ${selectedWorkout}`;

  $$(".chip").forEach((button) => button.classList.toggle("active", button.dataset.workout === selectedWorkout));

  $("#exerciseList").innerHTML = workout.exercises.map((exercise) => {
    const weight = recommendedWeight(exercise);
    return `
      <article class="exercise-card">
        <div class="exercise-head">
          <div>
            <h3>${exercise.name}</h3>
            <p>${exercise.sets} x ${exercise.reps} · ${exercise.tag}</p>
          </div>
          <span>${weight} ${exercise.unit}</span>
        </div>
        <div class="input-grid">
          <label>Вес<input name="${exercise.id}-weight" type="number" inputmode="decimal" step="0.5" value="${weight}" /></label>
          <label>Подходы<input name="${exercise.id}-sets" type="number" inputmode="numeric" value="${exercise.sets}" /></label>
          <label>Повторы<input name="${exercise.id}-reps" type="text" value="${exercise.reps}" /></label>
        </div>
      </article>
    `;
  }).join("");
}

function renderReasons() {
  $("#failureReasons").innerHTML = failureReasons.map((reason) => (
    `<button type="button" class="reason-chip" data-reason="${reason}">${reason}</button>`
  )).join("");
}

function renderHistory() {
  if (!sessions.length) {
    $("#historyList").innerHTML = `<div class="empty-state">История пока пустая. Сохрани первую тренировку, и здесь появится дневник.</div>`;
    return;
  }

  $("#historyList").innerHTML = sessions.map((session) => `
    <article class="history-card">
      <div class="history-top">
        <strong>${formatDate(session.date)} · ${session.workout}</strong>
        <span>${feelingLabel(session.feeling)}</span>
      </div>
      <p>${session.exercises.map((exercise) => `${exercise.name}: ${exercise.weight} ${exercise.unit}`).join(" · ")}</p>
      ${session.reasons.length ? `<small>Причина: ${session.reasons.join(", ")}</small>` : ""}
    </article>
  `).join("");
}

function renderPlan() {
  $("#planList").innerHTML = Object.entries(workouts).map(([key, workout]) => `
    <article class="plan-card">
      <h3>${key} · ${workout.day}</h3>
      <p>${workout.focus}</p>
      <ul>${workout.exercises.map((exercise) => `<li>${exercise.name}: ${recommendedWeight(exercise)} ${exercise.unit}, ${exercise.sets} x ${exercise.reps}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderProgressOptions() {
  const exercises = Object.values(workouts).flatMap((workout) => workout.exercises);
  $("#progressExerciseSelect").innerHTML = exercises.map((exercise) => `<option value="${exercise.id}">${exercise.name}</option>`).join("");
}

function renderProgress() {
  const id = $("#progressExerciseSelect").value || "bench_barbell";
  const exercise = exerciseById(id);
  const points = sessions
    .slice()
    .reverse()
    .map((session) => {
      const item = session.exercises.find((entry) => entry.id === id);
      return item ? { date: session.date, value: Number(item.weight) } : null;
    })
    .filter(Boolean);

  drawChart(points, exercise?.unit || "кг");

  if (!points.length) {
    $("#progressSummary").innerHTML = `<strong>${exercise.name}</strong><p>Пока нет данных. После первой сохраненной тренировки появится график.</p>`;
    return;
  }

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const diff = Math.round((last - first) * 10) / 10;
  $("#progressSummary").innerHTML = `<strong>${exercise.name}</strong><p>Последний вес: ${last} ${exercise.unit}. Изменение за историю: ${diff >= 0 ? "+" : ""}${diff} ${exercise.unit}.</p>`;
}

function drawChart(points, unit) {
  const canvas = $("#progressChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dce5df";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 24, width - 70, height - 70);

  if (!points.length) {
    ctx.fillStyle = "#647067";
    ctx.font = "24px sans-serif";
    ctx.fillText("Нет данных", 70, 180);
    return;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const xStep = points.length === 1 ? 0 : (width - 100) / (points.length - 1);

  ctx.strokeStyle = "#147d64";
  ctx.lineWidth = 5;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = 52 + index * xStep;
    const y = height - 58 - ((point.value - min) / range) * (height - 110);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#0f614e";
  points.forEach((point, index) => {
    const x = 52 + index * xStep;
    const y = height - 58 - ((point.value - min) / range) * (height - 110);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#647067";
  ctx.font = "20px sans-serif";
  ctx.fillText(`${max} ${unit}`, 46, 20);
  ctx.fillText(`${min} ${unit}`, 46, height - 26);
}

function feelingLabel(value) {
  return {
    easy: "легко",
    normal: "нормально",
    hard: "тяжело",
    failed: "не удалось",
  }[value] || value;
}

async function refresh() {
  sessions = await getAllSessions();
  renderToday();
  renderHistory();
  renderPlan();
  renderProgress();
}

function collectSession(form) {
  const workout = workouts[selectedWorkout];
  const feeling = $("#sessionFeeling").value;
  const pain = $("#painLevel").value;
  const exercises = workout.exercises.map((exercise) => {
    const weight = Number(form.elements[`${exercise.id}-weight`].value || 0);
    const sets = form.elements[`${exercise.id}-sets`].value;
    const reps = form.elements[`${exercise.id}-reps`].value;
    return {
      id: exercise.id,
      name: exercise.name,
      weight,
      sets,
      reps,
      unit: exercise.unit,
      nextWeight: nextWeight(exercise, weight, feeling, pain),
    };
  });

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    workout: selectedWorkout,
    feeling,
    pain,
    reasons: [...selectedReasons],
    note: $("#sessionNote").value.trim(),
    exercises,
  };
}

function exportCsv() {
  const rows = [["date", "workout", "exercise", "weight", "unit", "sets", "reps", "feeling", "pain", "reasons", "note"]];
  sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      rows.push([session.date, session.workout, exercise.name, exercise.weight, exercise.unit, exercise.sets, exercise.reps, session.feeling, session.pain, session.reasons.join("|"), session.note]);
    });
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "training-history.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.view}`).classList.add("active");
      if (button.dataset.view === "progressView") renderProgress();
    });
  });

  $$(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      selectedWorkout = button.dataset.workout;
      renderToday();
    });
  });

  $("#sessionFeeling").addEventListener("change", () => {
    $("#failureBox").classList.toggle("hidden", $("#sessionFeeling").value !== "failed");
  });

  $("#failureReasons").addEventListener("click", (event) => {
    const button = event.target.closest(".reason-chip");
    if (!button) return;
    const reason = button.dataset.reason;
    if (selectedReasons.has(reason)) selectedReasons.delete(reason);
    else selectedReasons.add(reason);
    button.classList.toggle("active", selectedReasons.has(reason));
  });

  $("#sessionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await saveSession(collectSession(form));
    $("#formMessage").textContent = "Сохранено. Следующая рекомендация обновлена.";
    form.reset();
    selectedReasons.clear();
    $$(".reason-chip").forEach((button) => button.classList.remove("active"));
    $("#failureBox").classList.add("hidden");
    await refresh();
  });

  $("#progressExerciseSelect").addEventListener("change", renderProgress);
  $("#exportCsvButton").addEventListener("click", exportCsv);
  $("#clearHistoryButton").addEventListener("click", async () => {
    await clearSessions();
    await refresh();
  });
  $("#installHintButton").addEventListener("click", () => $("#infoDialog").showModal());
  $("#closeInfoButton").addEventListener("click", () => $("#infoDialog").close());
}

async function init() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
  db = await openDb();
  renderReasons();
  renderProgressOptions();
  bindEvents();
  await refresh();
}

init().catch((error) => {
  console.error(error);
  $("#screenTitle").textContent = "Ошибка запуска";
});
