document.addEventListener("DOMContentLoaded", () => {
  let runs = [];
  let runningPlanData = [];

  // --- NEW Element selectors for menu and shortcuts ---
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const navLinks = document.getElementById("nav-links");
  const gotoStrengthCard = document.getElementById("goto-strength");
  const gotoStretchCard = document.getElementById("goto-stretch");

  const tabHome = document.getElementById("tab-home");
  const tabPlan = document.getElementById("tab-plan");
  const tabStrength = document.getElementById("tab-strength");
  const tabStretch = document.getElementById("tab-stretch");

  const homeView = document.getElementById("home-view");
  const planView = document.getElementById("plan-view");
  const strengthView = document.getElementById("strength-view");
  const stretchView = document.getElementById("stretch-view");

  const themeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;

  async function fetchRunningData() {
    try {
      const response = await fetch("data/running-data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      runningPlanData = await response.json();
    } catch (error) {
      console.error("Error loading running data:", error);
      const planView = document.getElementById("plan-view");
      planView.innerHTML =
        "<p>Could not load running plan. Please try again later.</p>";
    }
  }

  function saveState() {
    localStorage.setItem("runningPlanState_v2", JSON.stringify(runs));
  }

  function loadState() {
    const savedState = localStorage.getItem("runningPlanState_v2");

    if (!savedState) {
      runs = runningPlanData;
      return;
    }

    const savedRuns = JSON.parse(savedState);

    runs = runningPlanData.map((runFromJson) => {
      const saved = savedRuns.find((r) => r.id === runFromJson.id);

      return {
        ...runFromJson,
        completed: saved?.completed || false,
        dateCompleted: saved?.dateCompleted || null,
      };
    });
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function markAsComplete(index) {
    if (runs[index]) {
      runs[index].completed = true;
      runs[index].dateCompleted = new Date().toISOString();
      saveState();
      render();
    }
  }

  function markAsIncomplete(index) {
    if (runs[index]) {
      runs[index].completed = false;
      runs[index].dateCompleted = null;
      saveState();
      render();
    }
  }

  // --- UPDATED Home View Rendering ---
  function renderHomeView() {
    const upcomingRunCard = document.getElementById("upcoming-run-card");
    const upcomingRunIndex = runs.findIndex((run) => !run.completed);

    // Upcoming Run Card
    if (upcomingRunIndex !== -1) {
      const run = runs[upcomingRunIndex];
      upcomingRunCard.innerHTML = `
                <h3>Upcoming Run</h3>
                <div class="card-content">
                    <strong>${run.type}</strong> (Week ${run.week}, Day ${run.day})
                    <p>${run.details}</p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-complete" onclick="app.markAsComplete(${upcomingRunIndex})">Mark as Complete</button>
                </div>`;
    } else {
      upcomingRunCard.innerHTML = `
                <h3>All Runs Done!</h3>
                <div class="card-content">
                   <p>Congratulations! You've completed the entire running plan!</p>
                </div>`;
    }
    // The "Last Completed Run" card logic has been removed.
  }

  function renderFullPlanView() {
    const runList = document.getElementById("run-list");
    const firstIncompleteIndex = runs.findIndex((run) => !run.completed);
    runList.innerHTML = "";

    runs.forEach((run, index) => {
      const li = document.createElement("li");
      li.className = `run-item ${run.completed ? "completed" : ""}`;

      let actionButtonHTML = "";
      let dateHTML = "";

      if (run.completed) {
        dateHTML = `<div class="completion-date">Completed: ${formatDate(
          run.dateCompleted
        )}</div>`;
        if (index == firstIncompleteIndex - 1)
          actionButtonHTML = `<button class="btn btn-undo" onclick="app.markAsIncomplete(${index})">Undo</button>`;
      } else {
        if (index == firstIncompleteIndex)
          actionButtonHTML = `<button class="btn btn-complete" onclick="app.markAsComplete(${index})">Complete</button>`;
      }

      li.innerHTML = `
                <div class="run-info">
                    <strong>${run.type}</strong>
                    <div class="details">Week ${run.week}, Day ${run.day} - ${run.details}</div>
                    ${dateHTML}
                </div>
                <div class="run-actions">
                    ${actionButtonHTML}
                </div>`;
      runList.appendChild(li);
    });
  }

  function render() {
    renderHomeView();
    renderFullPlanView();
  }

  function switchTab(tab) {
    // --- NEW: Close mobile menu on tab switch ---
    navLinks.classList.remove("open");

    const allTabs = [tabHome, tabPlan, tabStrength, tabStretch];
    const allViews = [homeView, planView, strengthView, stretchView];

    allTabs.forEach((t) => t.classList.remove("active"));
    allViews.forEach((v) => v.classList.remove("active"));

    if (tab === "home") {
      tabHome.classList.add("active");
      homeView.classList.add("active");
    } else if (tab === "plan") {
      tabPlan.classList.add("active");
      planView.classList.add("active");
    } else if (tab === "strength") {
      tabStrength.classList.add("active");
      strengthView.classList.add("active");
    } else if (tab === "stretch") {
      tabStretch.classList.add("active");
      stretchView.classList.add("active");
    }
  }

  function parseDuration(durationString) {
    const match = durationString.match(/(\d+)\s*(sec|min)/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === "min") {
        return value * 60;
      }
      return value;
    }
    const firstNumMatch = durationString.match(/(\d+)/);
    if (firstNumMatch) {
      return parseInt(firstNumMatch[1], 10);
    }
    return 30;
  }

  let activeTimers = {};

  function startTimer(duration, timerId, buttonId) {
    if (activeTimers[timerId]) {
      return;
    }

    const timerDisplay = document.getElementById(timerId);
    const startButton = document.getElementById(buttonId);
    startButton.disabled = true;

    let timeRemaining = duration;

    const updateDisplay = () => {
      const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
      const seconds = String(timeRemaining % 60).padStart(2, "0");
      timerDisplay.textContent = `${minutes}:${seconds}`;
    };

    updateDisplay();

    activeTimers[timerId] = setInterval(() => {
      timeRemaining--;
      updateDisplay();

      if (timeRemaining < 0) {
        clearInterval(activeTimers[timerId]);
        delete activeTimers[timerId];
        timerDisplay.textContent = "Done!";
        startButton.disabled = false;
      }
    }, 1000);
  }

  async function renderStrengthView() {
    const container = document.getElementById("strength-cards");
    container.innerHTML = "Loading strength routine...";

    try {
      const response = await fetch("data/strength-data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const strengthData = await response.json();
      container.innerHTML = "";

      strengthData.forEach((exercise) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
                <h3>${exercise.title}</h3>
                <div class="card-content">
                    <strong>Reps: ${exercise.reps}</strong>
                    <p>${exercise.description}</p>
                </div>`;
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading strength data:", error);
      container.innerHTML =
        "<p>Could not load strength routine. Please try again later.</p>";
    }
  }

  async function renderStretchingView() {
    const container = document.getElementById("stretch-cards");
    container.innerHTML = "Loading stretches...";

    try {
      const response = await fetch("data/stretching-data.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stretchingData = await response.json();
      container.innerHTML = "";

      stretchingData.forEach((stretch, index) => {
        const card = document.createElement("div");
        card.className = "card";

        const durationInSeconds = parseDuration(stretch.duration);
        const timerId = `timer-${index}`;
        const buttonId = `start-btn-${index}`;

        const minutes = String(Math.floor(durationInSeconds / 60)).padStart(
          2,
          "0"
        );
        const seconds = String(durationInSeconds % 60).padStart(2, "0");

        card.innerHTML = `
                    <h3>${stretch.title}</h3>
                    <img src="${stretch.image}" alt="${stretch.title}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">
                    <div class="card-content">
                        <strong>Duration:</strong> ${stretch.duration}<br>
                        <p>${stretch.description}</p>
                    </div>
                    <div class="card-footer">
                        <span class="timer-display" id="${timerId}">${minutes}:${seconds}</span>
                        <button class="btn btn-start" id="${buttonId}">Start</button>
                    </div>`;
        container.appendChild(card);

        document
          .getElementById(buttonId)
          .addEventListener("click", () =>
            startTimer(durationInSeconds, timerId, buttonId)
          );
      });
    } catch (error) {
      console.error("Error loading stretching data:", error);
      container.innerHTML =
        "<p>Could not load stretching data. Please try again later.</p>";
    }
  }

  function handleTheme() {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark-mode") {
      body.classList.add("dark-mode");
      themeToggle.checked = true;
    }

    themeToggle.addEventListener("change", () => {
      if (themeToggle.checked) {
        body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark-mode");
      } else {
        body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
      }
    });
  }

  async function init() {
    window.app = { markAsComplete, markAsIncomplete };

    handleTheme();

    // --- NEW Hamburger and Shortcut Listeners ---
    hamburgerMenu.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
    gotoStrengthCard.addEventListener("click", () => switchTab("strength"));
    gotoStretchCard.addEventListener("click", () => switchTab("stretch"));

    tabHome.addEventListener("click", () => switchTab("home"));
    tabPlan.addEventListener("click", () => switchTab("plan"));
    tabStrength.addEventListener("click", () => switchTab("strength"));
    tabStretch.addEventListener("click", () => switchTab("stretch"));

    await fetchRunningData();
    loadState();
    render();

    renderStrengthView();
    renderStretchingView();
  }

  init();
});
