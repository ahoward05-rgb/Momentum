const STORAGE_KEY = "momentum_habits";

function loadHabits() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
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

function getHabitFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return null;
  const habits = loadHabits();
  return habits.find((h) => h.id === id) || null;
}

function renderHabit() {
  const habit = getHabitFromQuery();
  if (!habit) {
    window.location.href = "index.html";
    return;
  }

  const today = todayISO();
  const streak = calculateStreak(habit.history || []);
  const doneToday = (habit.history || []).includes(today);

  const iconEl = document.getElementById("habitIcon");
  const nameEl = document.getElementById("habitName");
  const metaEl = document.getElementById("habitMeta");
  const streakEl = document.getElementById("streakValue");
  const completeBtn = document.getElementById("completeTodayBtn");

  iconEl.textContent = habit.icon || "🔥";
  iconEl.style.background = habit.color || "#1d4ed8";
  iconEl.style.boxShadow = `0 0 22px ${habit.color || "#1d4ed8"}`;

  nameEl.textContent = habit.name;
  metaEl.textContent = `${streak} day streak • ${
    doneToday ? "Completed today" : "Not yet today"
  }`;

  streakEl.textContent = streak.toString();

  completeBtn.querySelector(".btn-label").textContent = doneToday
    ? "Undo today"
    : "Mark today complete";

  renderWeeklyChart(habit);
}

function renderWeeklyChart(habit) {
  const container = document.getElementById("weeklyChart");
  container.innerHTML = "";

  const history = new Set(habit.history || []);
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

  const habits = loadHabits();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx === -1) return;

  const today = todayISO();
  const history = habits[idx].history || [];
  const hasToday = history.includes(today);

  if (hasToday) {
    habits[idx].history = history.filter((d) => d !== today);
  } else {
    habits[idx].history = [...history, today];
  }

  saveHabits(habits);
  renderHabit();
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const completeTodayBtn = document.getElementById("completeTodayBtn");

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  completeTodayBtn.addEventListener("click", toggleToday);

  renderHabit();
});
