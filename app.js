const DEFAULT_SETTINGS = {
  monthlySalary: 12000,
  attendanceDays: 22,
  startTime: "09:00",
  endTime: "18:00",
  breakMinutes: 60,
};

const STORAGE_KEY = "worangfei-settings-v1";

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const elements = {
  form: document.querySelector("#settingsForm"),
  monthlySalary: document.querySelector("#monthlySalary"),
  attendanceDays: document.querySelector("#attendanceDays"),
  startTime: document.querySelector("#startTime"),
  endTime: document.querySelector("#endTime"),
  breakMinutes: document.querySelector("#breakMinutes"),
  resetButton: document.querySelector("#resetButton"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsCloseButton: document.querySelector("#settingsCloseButton"),
  settingsOverlay: document.querySelector("#settingsOverlay"),
  dateText: document.querySelector("#dateText"),
  timeText: document.querySelector("#timeText"),
  todayAmount: document.querySelector("#todayAmount"),
  moneyBag: document.querySelector("#moneyBag"),
  coinStream: document.querySelector("#coinStream"),
  leftCoin: document.querySelector("#leftCoin"),
  rightCoin: document.querySelector("#rightCoin"),
  offWorkCountdown: document.querySelector("#offWorkCountdown"),
  workProgressPercent: document.querySelector("#workProgressPercent"),
};

let currentSettings = loadSettings();
let lastWholeSecond = null;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function hydrateForm(settings) {
  elements.monthlySalary.value = settings.monthlySalary;
  elements.attendanceDays.value = settings.attendanceDays;
  elements.startTime.value = settings.startTime;
  elements.endTime.value = settings.endTime;
  elements.breakMinutes.value = settings.breakMinutes;
}

function readForm() {
  return {
    monthlySalary: Math.max(0, Number(elements.monthlySalary.value) || 0),
    attendanceDays: Math.max(1, Number(elements.attendanceDays.value) || 1),
    startTime: elements.startTime.value || DEFAULT_SETTINGS.startTime,
    endTime: elements.endTime.value || DEFAULT_SETTINGS.endTime,
    breakMinutes: Math.max(0, Number(elements.breakMinutes.value) || 0),
  };
}

function parseTimeOnDate(time, baseDate) {
  const [hours = "0", minutes = "0"] = time.split(":");
  const next = new Date(baseDate);
  next.setHours(Number(hours), Number(minutes), 0, 0);
  return next;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function secondsBetween(start, end) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

function getWorkWindow(now, settings) {
  const start = parseTimeOnDate(settings.startTime, now);
  const end = parseTimeOnDate(settings.endTime, now);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const spanSeconds = Math.max(1, secondsBetween(start, end));
  const breakSeconds = clamp(settings.breakMinutes * 60, 0, Math.max(0, spanSeconds - 60));
  const paidSeconds = Math.max(1, spanSeconds - breakSeconds);
  const breakStart = new Date(start.getTime() + ((spanSeconds - breakSeconds) / 2) * 1000);
  const breakEnd = new Date(breakStart.getTime() + breakSeconds * 1000);

  return { start, end, spanSeconds, breakSeconds, paidSeconds, breakStart, breakEnd };
}

function getPaidElapsed(now, window) {
  if (now <= window.start) return 0;
  if (now >= window.end) return window.paidSeconds;

  const elapsed = secondsBetween(window.start, now);

  if (window.breakSeconds <= 0) {
    return clamp(elapsed, 0, window.paidSeconds);
  }

  if (now < window.breakStart) {
    return clamp(elapsed, 0, window.paidSeconds);
  }

  if (now <= window.breakEnd) {
    return secondsBetween(window.start, window.breakStart);
  }

  return clamp(elapsed - window.breakSeconds, 0, window.paidSeconds);
}

function getPhase(now, window, amount, dailySalary) {
  if (now < window.start) {
    return { earning: false };
  }

  if (window.breakSeconds > 0 && now >= window.breakStart && now <= window.breakEnd) {
    return { earning: false };
  }

  if (now >= window.end || amount >= dailySalary) {
    return { earning: false };
  }

  return { earning: true };
}

function buildSnapshot(now, settings) {
  const dailySalary = settings.monthlySalary / settings.attendanceDays;
  const window = getWorkWindow(now, settings);
  const paidElapsed = getPaidElapsed(now, window);
  const perSecond = dailySalary / window.paidSeconds;
  const amount = clamp(paidElapsed * perSecond, 0, dailySalary);
  const phase = getPhase(now, window, amount, dailySalary);

  return { amount, dailySalary, perSecond, paidElapsed, phase, window };
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}小时${String(minutes).padStart(2, "0")}分钟`;
  }

  if (minutes > 0) {
    return `${minutes}分钟${String(seconds).padStart(2, "0")}秒`;
  }

  return `${seconds}秒`;
}

function getWorkdayProgress(now, window) {
  const totalSeconds = Math.max(1, secondsBetween(window.start, window.end));
  const elapsedSeconds = clamp(secondsBetween(window.start, now), 0, totalSeconds);
  const remainingSeconds = now < window.start
    ? totalSeconds
    : Math.max(0, Math.ceil((window.end.getTime() - now.getTime()) / 1000));

  return {
    percent: elapsedSeconds / totalSeconds,
    remainingSeconds,
  };
}

function render() {
  const now = new Date();
  const snapshot = buildSnapshot(now, currentSettings);
  const workdayProgress = getWorkdayProgress(now, snapshot.window);

  elements.dateText.textContent = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  elements.timeText.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
  elements.todayAmount.textContent = moneyFormatter.format(snapshot.amount);
  elements.leftCoin.textContent = `¥${Math.floor(snapshot.amount)}`;
  elements.rightCoin.textContent = `¥${snapshot.perSecond.toFixed(2)}`;
  elements.offWorkCountdown.textContent = workdayProgress.percent >= 1
    ? "已经下班啦"
    : `距离下班还剩 ${formatDuration(workdayProgress.remainingSeconds)}`;
  elements.workProgressPercent.textContent = percentFormatter.format(workdayProgress.percent);
  document.documentElement.style.setProperty("--work-progress", `${workdayProgress.percent * 100}%`);

  const wholeSecond = Math.floor(now.getTime() / 1000);
  if (snapshot.phase.earning && wholeSecond !== lastWholeSecond) {
    animateIncome();
  }
  lastWholeSecond = wholeSecond;
}

function openSettings() {
  elements.settingsOverlay.hidden = false;
  requestAnimationFrame(() => {
    document.body.classList.add("settings-open");
    elements.settingsButton.setAttribute("aria-expanded", "true");
  });
}

function closeSettings() {
  document.body.classList.remove("settings-open");
  elements.settingsButton.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    if (!document.body.classList.contains("settings-open")) {
      elements.settingsOverlay.hidden = true;
    }
  }, 260);
}

function animateIncome() {
  elements.moneyBag.classList.remove("is-earning");
  void elements.moneyBag.offsetWidth;
  elements.moneyBag.classList.add("is-earning");

  const coin = document.createElement("span");
  coin.className = "coin";
  coin.textContent = "¥";
  coin.style.setProperty("--coin-x-start", `${randomBetween(-92, 82)}px`);
  coin.style.setProperty("--coin-x-end", `${randomBetween(-36, 48)}px`);
  coin.style.setProperty("--coin-duration", `${randomBetween(0.95, 1.26)}s`);
  elements.coinStream.appendChild(coin);
  coin.addEventListener("animationend", () => coin.remove(), { once: true });

  for (let index = 0; index < 4; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.setProperty("--spark-x", `${randomBetween(-86, 86)}px`);
    sparkle.style.setProperty("--spark-y", `${randomBetween(34, 118)}px`);
    elements.coinStream.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

elements.form.addEventListener("input", () => {
  currentSettings = readForm();
  saveSettings(currentSettings);
  render();
});

elements.resetButton.addEventListener("click", () => {
  currentSettings = { ...DEFAULT_SETTINGS };
  saveSettings(currentSettings);
  hydrateForm(currentSettings);
  render();
});

elements.settingsButton.addEventListener("click", openSettings);
elements.settingsCloseButton.addEventListener("click", closeSettings);
elements.settingsOverlay.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-settings]")) {
    closeSettings();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("settings-open")) {
    closeSettings();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works without offline caching, for example when opened via file://.
    });
  });
}

hydrateForm(currentSettings);
render();
setInterval(render, 1000);
