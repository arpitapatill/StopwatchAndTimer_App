// Stopwatch & Timer App
// Author: ChatGPT — single-file logic for start/stop/lap + timer alarm (WebAudio)

document.addEventListener("DOMContentLoaded", () => {
  // Mode tabs
  const tabs = document.querySelectorAll(".tab");
  const panels = { stopwatch: document.getElementById("stopwatch"), timer: document.getElementById("timer") };

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => { x.classList.remove("active"); x.setAttribute("aria-selected","false"); });
    t.classList.add("active"); t.setAttribute("aria-selected","true");
    const mode = t.dataset.mode;
    Object.values(panels).forEach(p => p.classList.add("hidden"));
    panels[mode].classList.remove("hidden");
  }));

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  /* ========================= STOPWATCH ========================= */
  const swDisplay = document.getElementById("sw-display");
  const swStartBtn = document.getElementById("sw-start");
  const swStopBtn = document.getElementById("sw-stop");
  const swLapBtn = document.getElementById("sw-lap");
  const swResetBtn = document.getElementById("sw-reset");
  const lapsList = document.getElementById("laps-list");

  let swStartTime = 0, swElapsed = 0, swTimerId = null;
  let lapCounter = 0;

  function formatStopwatch(ms) {
    const totalMs = Math.max(0, ms|0);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
  }

  function updateSW() {
    const now = performance.now();
    swElapsed = now - swStartTime;
    swDisplay.textContent = formatStopwatch(swElapsed + swSavedOffset);
    swTimerId = requestAnimationFrame(updateSW);
  }

  // saved offset persists when paused
  let swSavedOffset = 0;

  swStartBtn.addEventListener("click", () => {
    if (!swTimerId) {
      swStartTime = performance.now();
      swTimerId = requestAnimationFrame(updateSW);
      swStartBtn.disabled = true;
      swStopBtn.disabled = false;
      swLapBtn.disabled = false;
      swResetBtn.disabled = false;
    }
  });

  swStopBtn.addEventListener("click", () => {
    if (swTimerId) {
      cancelAnimationFrame(swTimerId);
      swTimerId = null;
      swSavedOffset += swElapsed;
      swElapsed = 0;
      swStartBtn.disabled = false;
      swStopBtn.disabled = true;
    }
  });

  swLapBtn.addEventListener("click", () => {
    // record lap time relative to savedOffset + elapsed
    const currentMs = swSavedOffset + (swTimerId ? swElapsed : 0);
    lapCounter++;
    const li = document.createElement("li");
    li.innerHTML = `<span>Lap ${lapCounter}</span><span>${formatStopwatch(currentMs)}</span>`;
    lapsList.prepend(li);
  });

  swResetBtn.addEventListener("click", () => {
    if (swTimerId) { cancelAnimationFrame(swTimerId); swTimerId = null; }
    swSavedOffset = 0;
    swElapsed = 0;
    lapCounter = 0;
    lapsList.innerHTML = "";
    swDisplay.textContent = "00:00.000";
    swStartBtn.disabled = false;
    swStopBtn.disabled = true;
    swLapBtn.disabled = true;
    swResetBtn.disabled = true;
  });

  // initialize stopwatch button states
  swStartBtn.disabled = false;
  swStopBtn.disabled = true;
  swLapBtn.disabled = true;
  swResetBtn.disabled = true;

  /* ========================= TIMER ========================= */
  const timerDisplay = document.getElementById("timer-display");
  const tmMin = document.getElementById("timer-min");
  const tmSec = document.getElementById("timer-sec");
  const tmStart = document.getElementById("tm-start");
  const tmPause = document.getElementById("tm-pause");
  const tmReset = document.getElementById("tm-reset");
  const timerInfo = document.getElementById("timer-info");

  let timerTotalMs = 0;
  let timerRemaining = 0;
  let timerIntervalId = null;
  let timerEnd = 0;

  function formatTimer(ms) {
    const t = Math.max(0, Math.ceil(ms/1000)); // whole seconds
    const minutes = Math.floor(t/60);
    const seconds = t % 60;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  function tickTimer() {
    const now = Date.now();
    timerRemaining = Math.max(0, timerEnd - now);
    timerDisplay.textContent = formatTimer(timerRemaining);
    if (timerRemaining <= 0) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
      onTimerFinish();
      tmStart.disabled = false;
      tmPause.disabled = true;
      tmReset.disabled = false;
    }
  }

  function onTimerFinish() {
    timerInfo.textContent = "Time's up!";
    playBeepSequence();
    // small visual flash
    timerDisplay.animate([{ transform: 'scale(1)' },{ transform: 'scale(1.06)' },{ transform: 'scale(1)' }], { duration: 520 });
  }

  tmStart.addEventListener("click", () => {
    // read values
    const m = Math.max(0, Math.floor(Number(tmMin.value) || 0));
    let s = Math.max(0, Math.floor(Number(tmSec.value) || 0));
    if (s >= 60) { // normalize
      m += Math.floor(s / 60);
      s = s % 60;
      tmMin.value = String(m);
      tmSec.value = String(s);
    }
    timerTotalMs = (m * 60 + s) * 1000;
    if (timerTotalMs <= 0) { alert("Set a duration > 0"); return; }

    timerRemaining = timerTotalMs;
    timerEnd = Date.now() + timerRemaining;

    timerDisplay.textContent = formatTimer(timerRemaining);
    timerInfo.textContent = "";
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(tickTimer, 250);

    tmStart.disabled = true;
    tmPause.disabled = false;
    tmReset.disabled = false;
  });

  tmPause.addEventListener("click", () => {
    if (timerIntervalId) {
      // pause
      clearInterval(timerIntervalId);
      timerIntervalId = null;
      // remaining already set in tickTimer
      timerTotalMs = timerRemaining;
      tmStart.disabled = false;
      tmPause.disabled = true;
    }
  });

  tmReset.addEventListener("click", () => {
    if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
    timerTotalMs = 0;
    timerRemaining = 0;
    tmStart.disabled = false;
    tmPause.disabled = true;
    tmReset.disabled = true;
    timerDisplay.textContent = "00:00";
    timerInfo.textContent = "";
  });

  // init timer display
  timerDisplay.textContent = `${String(Number(tmMin.value).toString().padStart(2,'0'))}:${String(Number(tmSec.value).toString().padStart(2,'0'))}`;
  tmPause.disabled = true;
  tmReset.disabled = true;

  /* ========================= SOUND (WebAudio) ========================= */
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function beep(freq=880, duration=120, type='sine', volume=0.08) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      o.disconnect();
      g.disconnect();
    }, duration);
  }

  function playBeepSequence() {
    // three quick beeps
    beep(880, 100, 'sine', 0.08);
    setTimeout(()=> beep(660, 100, 'sine', 0.08), 160);
    setTimeout(()=> beep(1040, 160, 'sine', 0.08), 320);
  }

  /* ========================= KEYBOARD SHORTCUTS ========================= */
  // Space toggles start/stop for currently visible mode
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      const activePanel = document.querySelector(".tab.active").dataset.mode;
      if (activePanel === "stopwatch") {
        e.preventDefault();
        if (swTimerId) swStopBtn.click(); else swStartBtn.click();
      } else {
        e.preventDefault();
        if (timerIntervalId) tmPause.click(); else tmStart.click();
      }
    }
  });

});
