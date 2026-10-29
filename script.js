(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const screens = ["welcome", "launch", "galaxy", "quiz", "finale"];
  let currentScreen = "welcome";
  let audioContext = null;
  let musicTimer = null;
  let musicOn = false;
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let toastTimer = null;

  const quizQuestions = [
    { emoji: "🌍", question: "Which planet is our home?", answers: ["Mars", "Earth", "Saturn", "Jupiter"], correct: 1, fact: "That's right! Earth is our beautiful blue home planet." },
    { emoji: "🚀", question: "What helps astronauts travel into space?", answers: ["A rocket", "A school bus", "A submarine", "A bicycle"], correct: 0, fact: "Blast off! Rockets help astronauts travel beyond Earth." },
    { emoji: "🪐", question: "What twinkles in the night sky far, far away?", answers: ["Stars", "Fish", "Flowers", "Sandcastles"], correct: 0, fact: "Superstar answer! Stars are huge, glowing balls of hot gas." }
  ];

  const planetMessages = {
    space: { emoji: "🌟", title: "For a curious explorer!", text: "Dear Naitik, the universe is HUGE and full of amazing mysteries. Keep asking big questions, looking up at the stars, and following your curiosity. Every great discovery begins with a curious mind!" },
    rocket: { emoji: "🚀", title: "For a future rocket scientist!", text: "Commander Naitik, every rocket starts with an idea and a little imagination. Keep dreaming, building, experimenting, and reaching for the stars. Your next big idea could take you anywhere!" },
    computer: { emoji: "💻", title: "For a brilliant computer whiz!", text: "Hey, tech superstar! Computers help people create games, explore planets, and solve giant puzzles. Keep learning, creating, and using your clever brain to make wonderful things!" }
  };

  function showScreen(id) {
    screens.forEach(screen => {
      const el = document.getElementById(screen);
      if (el) el.classList.toggle("hidden", screen !== id);
    });
    currentScreen = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function getAudioContext() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioContext) audioContext = new AudioCtor();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function beep(frequency = 660, duration = 0.12, type = "sine", volume = 0.035) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  function startMusic() {
    if (musicOn) return;
    const ctx = getAudioContext();
    if (!ctx) {
      showToast("Music isn't supported in this browser, but the mission still works!");
      return;
    }
    musicOn = true;
    $("#musicToggle").setAttribute("aria-pressed", "true");
    $("#musicLabel").textContent = "Music: On";
    $("#musicIcon").textContent = "♫";
    const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
    let note = 0;
    musicTimer = setInterval(() => {
      if (!musicOn) return;
      beep(notes[note % notes.length], 0.24, "sine", 0.018);
      note++;
    }, 360);
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    $("#musicToggle").setAttribute("aria-pressed", "false");
    $("#musicLabel").textContent = "Music: Off";
    $("#musicIcon").textContent = "♫";
  }

  $("#musicToggle").addEventListener("click", () => {
    if (musicOn) stopMusic();
    else startMusic();
  });

  $("#startMission").addEventListener("click", () => {
    beep(740, 0.12);
    showScreen("launch");
    $("#launchButton").focus({ preventScroll: true });
  });

  let launching = false;
  $("#launchButton").addEventListener("click", async () => {
    if ($("#launchStatus").textContent === "LIFTOFF CONFIRMED") {
      showScreen("galaxy");
      return;
    }
    if (launching) return;
    launching = true;
    const button = $("#launchButton");
    const count = $("#countdown");
    const status = $("#launchStatus");
    const message = $("#launchMessage");
    const rocket = $("#launchRocket");
    const windowEl = $(".launch-window");
    button.disabled = true;
    button.textContent = "Engines firing...";
    rocket.classList.remove("fly");
    windowEl.classList.remove("launched");
    const sequence = [
      ["5", "Checking oxygen levels..."],
      ["4", "Powering up the cosmic engines..."],
      ["3", "Buckle up, Commander!"],
      ["2", "Destination: Birthday Galaxy!"],
      ["1", "All systems ready..."],
      ["🚀", "LIFTOFF! Happy birthday, Naitik!"]
    ];
    for (let i = 0; i < sequence.length; i++) {
      count.textContent = sequence[i][0];
      message.textContent = sequence[i][1];
      beep(i === sequence.length - 1 ? 880 : 480 + i * 70, 0.2, i === sequence.length - 1 ? "triangle" : "sine", 0.045);
      if (i === sequence.length - 1) {
        status.textContent = "LIFTOFF CONFIRMED";
        rocket.classList.add("fly");
        windowEl.classList.add("launched");
      }
      await new Promise(resolve => setTimeout(resolve, i === sequence.length - 1 ? 1450 : 850));
    }
    button.disabled = false;
    button.textContent = "Explore the galaxy →";
    button.onclick = () => { showScreen("galaxy"); button.onclick = null; };
    launching = false;
  });

  $$(".planet-card").forEach(card => {
    card.addEventListener("click", () => {
      const data = planetMessages[card.dataset.planet];
      $("#planetEmoji").textContent = data.emoji;
      $("#planetTitle").textContent = data.title;
      $("#planetText").textContent = data.text;
      $("#planetMessage").classList.remove("hidden");
      beep(680, 0.12);
      $("#planetMessage").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
  $("#closePlanetMessage").addEventListener("click", () => $("#planetMessage").classList.add("hidden"));

  function renderQuestion() {
    const q = quizQuestions[quizIndex];
    quizAnswered = false;
    $("#quizComplete").classList.add("hidden");
    $("#quizContent").classList.remove("hidden");
    $("#questionCount").textContent = `QUESTION ${quizIndex + 1} / ${quizQuestions.length}`;
    $("#quizProgress").style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
    $("#quizEmoji").textContent = q.emoji;
    $("#quizQuestion").textContent = q.question;
    $("#quizFeedback").textContent = "";
    $("#nextQuestion").classList.add("hidden");
    const grid = $("#answerGrid");
    grid.replaceChildren();
    q.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
      button.addEventListener("click", () => answerQuestion(index, button));
      grid.appendChild(button);
    });
  }

  function answerQuestion(index, button) {
    if (quizAnswered) return;
    quizAnswered = true;
    const q = quizQuestions[quizIndex];
    $$(".answer-button").forEach((el, i) => {
      el.disabled = true;
      if (i === q.correct) el.classList.add("correct");
    });
    if (index === q.correct) {
      quizScore++;
      $("#quizFeedback").textContent = `⭐ ${q.fact}`;
      beep(880, 0.16, "sine", 0.04);
    } else {
      button.classList.add("wrong");
      $("#quizFeedback").textContent = `Nice try, cadet! ${q.fact}`;
      beep(320, 0.14, "sine", 0.025);
    }
    $("#nextQuestion").textContent = quizIndex === quizQuestions.length - 1 ? "See my mission results →" : "Next question →";
    $("#nextQuestion").classList.remove("hidden");
  }

  $("#nextQuestion").addEventListener("click", () => {
    if (quizIndex < quizQuestions.length - 1) {
      quizIndex++;
      renderQuestion();
    } else {
      $("#quizContent").classList.add("hidden");
      $("#quizComplete").classList.remove("hidden");
      $("#quizScoreText").textContent = `You got ${quizScore} out of ${quizQuestions.length}! Every great explorer learns something new. You're officially ready for the Birthday Galaxy!`;
      $("#quizProgress").style.width = "100%";
      $("#nextQuestion").classList.add("hidden");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button button-primary";
      btn.textContent = "Unlock my birthday surprise 🎂";
      btn.addEventListener("click", () => showScreen("finale"));
      $("#quizComplete").appendChild(btn);
      beep(784, 0.15);
    }
  });

  $("#replayQuiz").addEventListener("click", () => {
    quizIndex = 0;
    quizScore = 0;
    const extra = $("#quizComplete").querySelector(".button-primary");
    if (extra) extra.remove();
    renderQuestion();
  });

  $("#celebrateButton").addEventListener("click", () => {
    $("#celebrationBurst").classList.remove("hidden");
    $("#celebrateButton").textContent = "Galaxy sparkle activated! ✨";
    for (let i = 0; i < 5; i++) setTimeout(() => beep([523, 659, 784, 1047, 1318][i], 0.3, "triangle", 0.035), i * 130);
    showToast("Birthday sparkle activated, Commander! 🎉");
  });

  $("#restartMission").addEventListener("click", () => {
    stopMusic();
    quizIndex = 0;
    quizScore = 0;
    launching = false;
    $("#launchButton").textContent = "Begin countdown 🚀";
    $("#launchButton").onclick = null;
    $("#countdown").textContent = "5";
    $("#launchStatus").textContent = "ALL SYSTEMS GO";
    $("#launchMessage").textContent = "Engines warming up, Commander...";
    $("#launchRocket").classList.remove("fly");
    $(".launch-window").classList.remove("launched");
    $("#planetMessage").classList.add("hidden");
    $("#celebrationBurst").classList.add("hidden");
    $("#celebrateButton").textContent = "Make the galaxy sparkle ✨";
    const extra = $("#quizComplete").querySelector(".button-primary");
    if (extra) extra.remove();
    renderQuestion();
    showScreen("welcome");
  });

  renderQuestion();
})();
