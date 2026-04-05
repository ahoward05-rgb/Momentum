// ===============================
// Momentum — Task System (v2)
// ===============================

// Local storage key
const STORAGE_KEY = "momentum_tasks";

// Load tasks from localStorage
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save tasks to localStorage
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Today's date in YYYY-MM-DD
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Calculate streak based on history array
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

// ===============================
// Rendering Tasks
// ===============================

function renderTasks() {
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const tasks = loadTasks();

  taskList.innerHTML = "";

  if (!tasks.length) {
    emptyState.style.display = "block";
    requestAnimationFrame(() => emptyState.classList.add("show"));
    return;
  } else {
    emptyState.classList.remove("show");
    emptyState.style.display = "none";
  }

  const today = todayISO();

  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.dataset.id = task.id; // ⭐ REQUIRED FOR PULSE

    // Icon
    const icon = document.createElement("div");
    icon.className = "task-icon";
    icon.textContent = task.icon || "🔥";
    icon.style.background = task.color || "#1d4ed8";
    icon.style.boxShadow = `0 0 18px ${task.color || "#1d4ed8"}`;

    // Main content
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

    // ⭐ STREAK BAR ⭐
    const streakBar = document.createElement("div");
    streakBar.className = "streak-bar";

    const streakFill = document.createElement("div");
    streakFill.className = "streak-fill";

    const history = task.history || [];
    const last7 = history.filter(date => {
      const diff = (new Date(today) - new Date(date)) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    }).length;

    const percent = (last7 / 7) * 100;
    streakFill.style.width = percent + "%";

    streakBar.appendChild(streakFill);
    main.appendChild(streakBar);

    // Actions
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

    // EDIT BUTTON
    const editBtn = document.createElement("button");
    editBtn.className = "icon-button edit-btn";
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(task.id);
    });

    // DELETE BUTTON
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-button delete-btn";
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    actions.appendChild(status);
    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(icon);
    card.appendChild(main);
    card.appendChild(actions);

    taskList.appendChild(card);
  });
}

// ===============================
// Toggle today's completion
// ===============================

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

  // ⭐ PULSE ANIMATION ⭐
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.classList.remove("pulse");
    void card.offsetWidth; // restart animation
    card.classList.add("pulse");
  }
}

// ===============================
// Modal Logic
// ===============================

let editingTaskId = null;

function openModal() {
  editingTaskId = null;
  document.getElementById("taskNameInput").value = "";
  document.getElementById("taskPresetSelect").value = "";

  document
    .querySelectorAll(".icon-option")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll(".color-option")
    .forEach((el) => el.classList.remove("selected"));

  document.getElementById("saveTaskBtn").querySelector(".btn-label").textContent =
    "Save task";

  document.getElementById("taskModal").classList.remove("hidden");
}

function closeModal() {
  editingTaskId = null;
  document.getElementById("saveTaskBtn").querySelector(".btn-label").textContent =
    "Save task";
  document.getElementById("taskModal").classList.add("hidden");
}

// ===============================
// Icon Picker
// ===============================

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

// ===============================
// Color Picker
// ===============================

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

// ===============================
// Create Task
// ===============================

function createTask() {
  const nameInput = document.getElementById("taskNameInput");
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  const iconEl = document.querySelector(".icon-option.selected");
  const colorEl = document.querySelector(".color-option.selected");

  const tasks = loadTasks();
  const id = Date.now().toString();

  const newTask = {
    id,
    name,
    icon: iconEl ? iconEl.textContent : "🔥",
    color: colorEl ? colorEl.dataset.color : "#3b82f6",
    history: [],
  };

  tasks.push(newTask);
  saveTasks(tasks);

  closeModal();
  renderTasks();
}

// ===============================
// Edit Task
// ===============================

function openEditModal(taskId) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;

  document.getElementById("taskNameInput").value = task.name;
  document.getElementById("taskPresetSelect").value = "";

  document.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.textContent === task.icon);
  });

  document.querySelectorAll(".color-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === task.color);
  });

  document.getElementById("saveTaskBtn").querySelector(".btn-label").textContent =
    "Save changes";

  document.getElementById("taskModal").classList.remove("hidden");
}

function updateTask(taskId) {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return;

  const nameInput = document.getElementById("taskNameInput");
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  const iconEl = document.querySelector(".icon-option.selected");
  const colorEl = document.querySelector(".color-option.selected");

  tasks[idx].name = name;
  tasks[idx].icon = iconEl ? iconEl.textContent : tasks[idx].icon;
  tasks[idx].color = colorEl ? colorEl.dataset.color : tasks[idx].color;

  saveTasks(tasks);

  editingTaskId = null;
  document.getElementById("saveTaskBtn").querySelector(".btn-label").textContent =
    "Save task";

  closeModal();
  renderTasks();
}

// ===============================
// Delete Task
// ===============================

function deleteTask(taskId) {
  if (!confirm("Delete this task? This cannot be undone.")) return;

  const tasks = loadTasks();
  const updated = tasks.filter((t) => t.id !== taskId);

  saveTasks(updated);
  renderTasks();
}

// ===============================
// DOM Ready
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const addTaskBtn = document.getElementById("addTaskBtn");
  const emptyAddTaskBtn = document.getElementById("emptyAddTaskBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveTaskBtn = document.getElementById("saveTaskBtn");

  addTaskBtn.addEventListener("click", openModal);
  emptyAddTaskBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);

  document.getElementById("taskModal").addEventListener("click", (event) => {
    if (event.target.id === "taskModal") {
      closeModal();
    }
  });

  saveTaskBtn.addEventListener("click", () => {
    if (editingTaskId) updateTask(editingTaskId);
    else createTask();
  });

  setupIconPicker();
  setupColorPicker();
  renderTasks();
});
