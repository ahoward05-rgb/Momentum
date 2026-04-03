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

function renderHabits() {
  const habitList = document.getElementById("habitList");
  const emptyState = document.getElementById("emptyState");
  const habits = loadHabits();

  habitList.innerHTML = "";

  if (!habits.length) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  const today = todayISO();

  habits.forEach((habit) => {
    const card = document.createElement("div");
    card.className = "habit-card";

    const icon = document.createElement("div");
    icon.className = "habit-icon";
    icon.textContent = habit.icon || "🔥";
    icon.style.background = habit.color || "#1d4ed8";
    icon.style.boxShadow = `0 0 18px ${habit.color || "#1d4ed8"}`;

    const main = document.createElement("div");
    main.className = "habit-main";

    const nameEl = document.createElement("p");
    nameEl.className = "habit-name";
    nameEl.textContent = habit.name;

    const streak = calculateStreak(habit.history || []);
    const doneToday = (habit.history || []).includes(today);

    const metaEl = document.createElement("p");
    metaEl.className = "habit-meta";
    metaEl.textContent = `${streak} day streak • ${
      doneToday ? "Completed today" : "Not yet today"
    }`;

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const status = document.createElement("div");
    status.className = "habit-status-pill";
    status.textContent = doneToday ? "Done today" : "Tap to complete";

    const completeBtn = document.createElement("button");
    completeBtn.className = "btn btn-secondary";
    completeBtn.innerHTML = `<span class="btn-label">${
      doneToday ? "Undo today" : "Mark today"
    }</span>`;

    completeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleToday(habit.id);
    });

    actions.appendChild(status);
    actions.appendChild(completeBtn);

    card.appendChild(icon);
    card.appendChild(main);
    card.appendChild(actions);

    card.addEventListener("click", () => {
      window.location.href = `habit.html?id=${encodeURIComponent(habit.id)}`;
    });

    habitList.appendChild(card);
  });
}

function toggleToday(id) {
  const habits = loadHabits();
  const today = todayISO();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx === -1) return;

  const history = habits[idx].history || [];
  const hasToday = history.includes(today);

  if (hasToday) {
    habits[idx].history = history.filter((d) => d !== today);
  } else {
    habits[idx].history = [...history, today];
  }

  saveHabits(habits);
  renderHabits();
}

function openModal() {
  document.getElementById("habitModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("habitModal").classList.add("hidden");
}

function setupIconPicker() {
  const icons = ["🔥", "📚", "🏃‍♂️", "🧘‍♂️", "💧", "📝", "💪", "🧠", "🎧", "🌙"];
  const container = document.getElementById("iconPicker");
  container.innerHTML = "";

  icons.forEach((icon) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-option";
    btn.textContent = icon;

    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".icon-option")
        .forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
    });

    container.appendChild(btn);
  });

  const first = container.querySelector(".icon-option");
  if (first) first.classList.add("selected");
}

function setupColorPicker() {
  const colors = [
    "#3b82f6",
    "#22c55e",
    "#eab308",
    "#f97316",
    "#ec4899",
    "#8b5cf6",
    "#06b6d4",
    "#f97373",
  ];
  const container = document.getElementById("colorPicker");
  container.innerHTML = "";

  colors.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-option";
    btn.style.background = `radial-gradient(circle at top, ${color}, #020617)`;
    btn.dataset.color = color;

    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".color-option")
        .forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
    });

    container.appendChild(btn);
  });

  const first = container.querySelector(".color-option");
  if (first) first.classList.add("selected");
}

function createHabit() {
  const nameInput = document.getElementById("habitNameInput");
  const presetSelect = document.getElementById("habitPresetSelect");

  const preset = presetSelect.value;
  let name = nameInput.value.trim();

  // If preset is chosen and not "Other" and name is empty, use preset as name
  if (preset && preset !== "Other" && !name) {
    name = preset;
  }

  // If preset is "Other", custom name is required
  if (preset === "Other" && !name) {
    nameInput.focus();
    return;
  }

  // If no preset and no name, block
  if (!preset && !name) {
    nameInput.focus();
    return;
  }

  const iconEl = document.querySelector(".icon-option.selected");
  const colorEl = document.querySelector(".color-option.selected");

  const icon = iconEl ? iconEl.textContent : "🔥";
  const color = colorEl ? colorEl.dataset.color : "#3b82f6";

  const habits = loadHabits();
  const id = Date.now().toString();

  const newHabit = {
    id,
    name,
    icon,
    color,
    history: [],
  };

  habits.push(newHabit);
  saveHabits(habits);

  // Reset fields
  nameInput.value = "";
  presetSelect.value = "";
  document
    .querySelectorAll(".icon-option")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll(".color-option")
    .forEach((el) => el.classList.remove("selected"));

  setupIconPicker();
  setupColorPicker();

  closeModal();
  renderHabits();
}

document.addEventListener("DOMContentLoaded", () => {
  const addHabitBtn = document.getElementById("addHabitBtn");
  const emptyAddHabitBtn = document.getElementById("emptyAddHabitBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveHabitBtn = document.getElementById("saveHabitBtn");

  addHabitBtn.addEventListener("click", openModal);
  emptyAddHabitBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);

  document
    .getElementById("habitModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "habitModal") {
        closeModal();
      }
    });

  saveHabitBtn.addEventListener("click", createHabit);

  setupIconPicker();
  setupColorPicker();
  renderHabits();
});
