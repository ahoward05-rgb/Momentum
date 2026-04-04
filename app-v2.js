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

function renderTasks() {
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const tasks = loadTasks();

  taskList.innerHTML = "";

  if (!tasks.length) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  const today = todayISO();

  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";

    const icon = document.createElement("div");
    icon.className = "task-icon";
    icon.textContent = task.icon || "🔥";
    icon.style.background = task.color || "#1d4ed8";
    icon.style.boxShadow = `0 0 18px ${task.color || "#1d4ed8"}`;

    const main = document.createElement("div");
    main.className = "task-main";

    const nameEl = document.createElement("p");
    nameEl.className = "task-name";
    nameEl.textContent = task.name;

    const streak = calculateStreak(task.history || []);
    const doneToday = (task.history || []).includes(today);

    const metaEl = document.createElement("p");
    metaEl.className = "task-meta";
    metaEl.textContent = `${streak} day streak • ${
      doneToday ? "Completed today" : "Not yet today"
    }`;

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const status = document.createElement("div");
    status.className = "task-status-pill";
    status.textContent = doneToday ? "Done today" : "Tap to complete";

    const completeBtn = document.createElement("button");
    completeBtn.className = "btn btn-secondary";
    completeBtn.innerHTML = `<span class="btn-label">${
      doneToday ? "Undo today" : "Mark today"
    }</span>`;

    completeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleToday(task.id);
    });

    actions.appendChild(status);
    actions.appendChild(completeBtn);

    card.appendChild(icon);
    card.appendChild(main);
    card.appendChild(actions);

    card.addEventListener("click", () => {
      window.location.href = `task.html?id=${encodeURIComponent(task.id)}`;
    });

    taskList.appendChild(card);
  });
}

function toggleToday(id) {
  const tasks = loadTasks();
  const today = todayISO();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const history = tasks[idx].history || [];
  const hasToday = history.includes(today);

  if (hasToday) {
    tasks[idx].history = history.filter((d) => d !== today);
  } else {
    tasks[idx].history = [...history, today];
  }

  saveTasks(tasks);
  renderTasks();
}

function openModal() {
  document.getElementById("taskModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("taskModal").classList.add("hidden");
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

function createTask() {
  const nameInput = document.getElementById("taskNameInput");
  const presetSelect = document.getElementById("taskPresetSelect");

  const preset = presetSelect.value;
  let name = nameInput.value.trim();

  if (preset && preset !== "Other" && !name) {
    name = preset;
  }

  if (preset === "Other" && !name) {
    nameInput.focus();
    return;
  }

  if (!preset && !name) {
    nameInput.focus();
    return;
  }

  const iconEl = document.querySelector(".icon-option.selected");
  const colorEl = document.querySelector(".color-option.selected");

  const icon = iconEl ? iconEl.textContent : "🔥";
  const color = colorEl ? colorEl.dataset.color : "#3b82f6";

  const tasks = loadTasks();
  const id = Date.now().toString();

  const newTask = {
    id,
    name,
    icon,
    color,
    history: [],
  };

  tasks.push(newTask);
  saveTasks(tasks);

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
  renderTasks();
}

document.addEventListener("DOMContentLoaded", () => {
  const addTaskBtn = document.getElementById("addTaskBtn");
  const emptyAddTaskBtn = document.getElementById("emptyAddTaskBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveTaskBtn = document.getElementById("saveTaskBtn");

  addTaskBtn.addEventListener("click", openModal);
  emptyAddTaskBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);

  document
    .getElementById("taskModal")
    .addEventListener("click", (event) => {
      if (event.target.id === "taskModal") {
        closeModal();
      }
    });

  saveTaskBtn.addEventListener("click", createTask);

  setupIconPicker();
  setupColorPicker();
  renderTasks();
});
