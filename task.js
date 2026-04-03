const STORAGE_KEY = "momentum_tasks";

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function calculateStreak(history) {
  if (!history || history.length === 0) return 0;
  const dates = [...history].sort().reverse();
  let streak = 0;
  let current = new Date(todayISO());

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    if (
      d.getFullYear() === current.getFullYear() &&
      d.getMonth() === current.getMonth() &&
      d.getDate() === current.getDate()
    ) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (d < current) {
      break;
    }
  }
  return streak;
}

function getTaskFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return null;
  const tasks = loadTasks();
  return tasks.find((t) => t.id === id) || null;
}

function renderTask() {
  const task = getTaskFromQuery();
  if (!task) {
    window.location.href = "index.html";
    return;
  }

  const today = todayISO();
  const streak = calculateStreak(task.history || []);
  const doneToday = (task.history || []).includes(today);

  const iconEl = document.getElementById("taskIcon");
  const nameEl = document.getElementById("taskName");
  const metaEl = document.getElementById("taskMeta");
  const streakEl = document.getElementById("streakValue");
  const completeBtn = document.getElementById("completeTodayBtn");

  iconEl.textContent = task.icon || "🔥";
  iconEl.style.background = task.color || "#1d4ed8";
  iconEl.style.boxShadow = `0 0 22px ${task.color || "#1d4ed8"}`;

  nameEl.textContent = task.name;
  metaEl.textContent = `${streak} day streak • ${
    doneToday ? "Completed today" : "Not yet today"
  }`;

  streakEl.textContent = streak.toString();

  completeBtn.querySelector(".btn-label").textContent = doneToday
    ? "Undo today"
    : "Mark today complete";

  renderWeeklyChart(task);
}

function renderWeeklyChart(task) {
  const container = document.getElementById("weeklyChart");
  container.innerHTML = "";

  const history = new Set(task.history || []);
  const today = new Date(todayISO());

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
    days.push({ iso, label });
  }

  days.forEach((day) => {
    const bar = document.createElement("div");
    bar.className = "weekly-bar";
    const done = history.has(day.iso);

    const height = done ? 100 : 30;
    bar.style.height = `${height}%`;

    if (done) {
      bar.classList.add("done");
    }

    const label = document.createElement("div");
    label.className = "weekly-bar-label";
    label.textContent = day.label;

    bar.appendChild(label);
    container.appendChild(bar);
  });
}

function toggleToday() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const today = todayISO();
  const history = tasks[idx].history || [];
  const hasToday = history.includes(today);

  if (hasToday) {
    tasks[idx].history = history.filter((d) => d !== today);
  } else {
    tasks[idx].history = [...history, today];
  }

  saveTasks(tasks);
  renderTask();
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const completeTodayBtn = document.getElementById("completeTodayBtn");

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  completeTodayBtn.addEventListener("click", toggleToday);

  renderTask();
});
