
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const screens = ["welcome", "launch", "galaxy", "quiz", "finale"];

  let audioContext = null;
  let musicTimer = null;
  let musicOn = false;
  let launching = false;
  let launchComplete = false;
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let toastTimer = null;

  const exploredPlanets = new Set();

  const questions = [
    {
      emoji: "🌍",
      question: "Which planet is our home?",
      answers: ["Mars", "Earth", "Saturn", "Jupiter"],
      correct: 1,
      fact: "That's right! Earth is our beautiful blue home planet!"
    },
    {
      emoji: "🚀",
      question: "What helps astronauts travel into space?",
      answers: ["A rocket", "A school bus", "A submarine", "A bicycle"],
      correct: 0,
      fact: "Blast off! Rockets help astronauts travel into space!"
    },
    {
      emoji: "🪐",
      question: "What twinkles in the night sky far away?",
      answers: ["Stars", "Fish", "Flowers", "Sandcastles"],
      correct: 0,
      fact: "Superstar! Stars are giant, glowing balls of hot gas!"
    }
  ];

  const planetMessages = {
    space: {
      emoji: "🌟",
      title: "For a curious explorer!",
      text: "Dear Naitik, the universe is HUGE and full of amazing mysteries. Keep asking big questions, looking up at the stars, and following your curiosity. Every great discovery begins with a curious mind!"
    },
    rocket: {
      emoji: "🚀",
      title: "For a future rocket scientist!",
      text: "Commander Naitik, every rocket starts with an idea and a little imagination. Keep dreaming, building, experimenting, and reaching for the stars. Your next big idea could take you anywhere!"
    },
    computer: {
      emoji: "💻",
      title: "For a brilliant computer whiz!",
      text: "Hey, tech superstar! Computers help people create games, explore planets, and solve giant puzzles. Keep learning, creating, and using your clever brain to make wonderful things!"
    }
  };

  // ---------- SCREEN NAVIGATION ----------

  function showScreen(id) {
    screens.forEach((screenId) => {
      const section = $(screenId);
      if (section) {
        section.classList.toggle("hidden", screenId !== id);
      }
    });

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // ---------- ORIGINAL BACKGROUND MUSIC ----------
  // Browsers require a user interaction before playing audio.
  // The tune starts when the visitor clicks Start my mission.

  function getAudioContext() {
    const AudioClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioClass) return null;

    if (!audioContext) {
      audioContext = new AudioClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  }

  function playNote(frequency, duration = 0.3, volume = 0.035) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      volume,
      ctx.currentTime + 0.035
    );
    gain.gain.setValueAtTime(
      volume,
      ctx.currentTime + duration * 0.55
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }

  function startMusic() {
    if (musicOn) return;

    const ctx = getAudioContext();

    if (!ctx) {
      showToast("Music isn't supported here, but your mission still works!");
      return;
    }

    musicOn = true;
    $("musicToggle").setAttribute("aria-pressed", "true");
    $("musicLabel").textContent = "Music: On";

    // Original, gentle space-birthday melody.
    // These are synthesized notes, not a commercial recording.
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      587.33, 698.46, 880.00, 698.46,
      523.25, 659.25, 783.99, 1046.50,
      880.00, 783.99, 659.25, 523.25
    ];

    let noteIndex = 0;

    function playNextNote() {
      if (!musicOn) return;

      playNote(melody[noteIndex % melody.length], 0.48, 0.018);
      noteIndex++;
    }

    playNextNote();
    musicTimer = setInterval(playNextNote, 520);
  }

  function stopMusic() {
    musicOn = false;

    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }

    $("musicToggle").setAttribute("aria-pressed", "false");
    $("musicLabel").textContent = "Music: Off";
  }

  $("musicToggle").addEventListener("click", () => {
    if (musicOn) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  // ---------- START MISSION ----------

  $("startMission").addEventListener("click", () => {
    // Starting the mission also enables music by default.
    startMusic();

    playNote(740, 0.18, 0.04);
    showScreen("launch");

    $("launchButton").focus({ preventScroll: true });
  });

  // ---------- ROCKET COUNTDOWN ----------
  // One click handler only. No separate onclick navigation.

  $("launchButton").addEventListener("click", async () => {
    if (launchComplete) {
      showScreen("galaxy");
      return;
    }

    if (launching) return;

    launching = true;

    const button = $("launchButton");
    const count = $("countdown");
    const status = $("launchStatus");
    const message = $("launchMessage");
    const rocket = $("launchRocket");
    const windowEl = document.querySelector(".launch-window");

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

      playNote(i === 5 ? 880 : 480 + i * 70, 0.2, 0.04);

      if (i === 5) {
        status.textContent = "LIFTOFF CONFIRMED";
        rocket.classList.add("fly");
        windowEl.classList.add("launched");
      }

      await new Promise((resolve) => {
        setTimeout(resolve, i === 5 ? 1400 : 850);
      });
    }

    launchComplete = true;
    launching = false;

    button.disabled = false;
    button.textContent = "Explore the galaxy →";

    showToast("Liftoff successful! Ready to explore, Commander! 🚀");
  });

  // ---------- PLANET EXPLORATION ----------

  $$(".planet-card").forEach((card) => {
    card.addEventListener("click", () => {
      const planetId = card.dataset.planet;
      const data = planetMessages[planetId];

      if (!data) return;

      exploredPlanets.add(planetId);

      $("planetProgress").textContent =
        `Planets explored: ${exploredPlanets.size} / 3`;

      card.classList.add("planet-explored");

      $("planetEmoji").textContent = data.emoji;
      $("planetTitle").textContent = data.title;
      $("planetText").textContent = data.text;
      $("planetMessage").classList.remove("hidden");

      playNote(680, 0.2, 0.035);

      if (exploredPlanets.size === 3) {
        $("toQuizButton").disabled = false;
        $("toQuizButton").textContent =
          "All planets explored — start the quiz →";

        showToast("Amazing! All three planets explored! 🌟");
      }

      $("planetMessage").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    });
  });

  $("closePlanetMessage").addEventListener("click", () => {
    $("planetMessage").classList.add("hidden");
  });

  $("toQuizButton").addEventListener("click", () => {
    if (exploredPlanets.size < 3) {
      showToast("Visit all three planets first, Commander! 🪐");
      return;
    }

    quizIndex = 0;
    quizScore = 0;

    renderQuestion();
    showScreen("quiz");
  });

  // ---------- QUIZ ----------

  function renderQuestion() {
    const question = questions[quizIndex];

    if (!question) return;

    quizAnswered = false;

    $("quizComplete").classList.add("hidden");
    $("quizContent").classList.remove("hidden");

    $("questionCount").textContent =
      `QUESTION ${quizIndex + 1} / ${questions.length}`;

    $("quizProgress").style.width =
      `${((quizIndex + 1) / questions.length) * 100}%`;

    $("quizEmoji").textContent = question.emoji;
    $("quizQuestion").textContent = question.question;
    $("quizFeedback").textContent = "";
    $("nextQuestion").classList.add("hidden");

    const grid = $("answerGrid");
    grid.replaceChildren();

    question.answers.forEach((answer, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "answer-button";
      button.textContent =
        `${String.fromCharCode(65 + index)}. ${answer}`;

      button.addEventListener("click", () => {
        answerQuestion(index, button);
      });

      grid.appendChild(button);
    });
  }

  function answerQuestion(index, selectedButton) {
    if (quizAnswered) return;

    quizAnswered = true;

    const question = questions[quizIndex];

    $$(".answer-button").forEach((button, i) => {
      button.disabled = true;

      if (i === question.correct) {
        button.classList.add("correct");
      }
    });

    if (index === question.correct) {
      quizScore++;
      $("quizFeedback").textContent = `⭐ ${question.fact}`;
      playNote(880, 0.22, 0.04);
    } else {
      selectedButton.classList.add("wrong");
      $("quizFeedback").textContent =
        `Nice try, cadet! ${question.fact}`;

      playNote(320, 0.18, 0.025);
    }

    $("nextQuestion").textContent =
      quizIndex === questions.length - 1
        ? "See my mission results →"
        : "Next question →";

    $("nextQuestion").classList.remove("hidden");
  }

  $("nextQuestion").addEventListener("click", () => {
    if (!quizAnswered) {
      showToast("Choose an answer first, Commander!");
      return;
    }

    if (quizIndex < questions.length - 1) {
      quizIndex++;
      renderQuestion();
      return;
    }

    $("quizContent").classList.add("hidden");
    $("quizComplete").classList.remove("hidden");

    $("quizScoreText").textContent =
      `You got ${quizScore} out of ${questions.length}! ` +
      "Every great explorer learns something new. " +
      "You're officially ready for the Birthday Galaxy!";

    $("quizProgress").style.width = "100%";

    // Avoid adding duplicate surprise buttons after replay.
    let surpriseButton = $("birthdaySurpriseButton");

    if (!surpriseButton) {
      surpriseButton = document.createElement("button");
      surpriseButton.id = "birthdaySurpriseButton";
      surpriseButton.type = "button";
      surpriseButton.className = "button button-primary";
      surpriseButton.textContent = "Unlock my birthday surprise 🎂";

      surpriseButton.addEventListener("click", () => {
        showScreen("finale");
      });

      $("quizComplete").appendChild(surpriseButton);
    }

    playNote(784, 0.25, 0.04);
  });

  $("replayQuiz").addEventListener("click", () => {
    quizIndex = 0;
    quizScore = 0;
    renderQuestion();
  });

  // ---------- BIRTHDAY FINALE ----------

  $("celebrateButton").addEventListener("click", () => {
    $("celebrationBurst").classList.remove("hidden");

    $("celebrateButton").textContent =
      "Galaxy sparkle activated! ✨";

    [523, 659, 784, 1047, 1318].forEach((frequency, index) => {
      setTimeout(() => {
        if (musicOn || audioContext) {
          playNote(frequency, 0.28, 0.035);
        }
      }, index * 150);
    });

    showToast("Birthday sparkle activated, Commander! 🎉");
  });

  // ---------- RESTART EVERYTHING ----------

  $("restartMission").addEventListener("click", () => {
    stopMusic();

    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    launching = false;
    launchComplete = false;

    $("launchButton").disabled = false;
    $("launchButton").textContent = "Begin countdown 🚀";

    $("countdown").textContent = "5";
    $("launchStatus").textContent = "ALL SYSTEMS GO";
    $("launchMessage").textContent =
      "Engines warming up, Commander...";

    $("launchRocket").classList.remove("fly");
    document.querySelector(".launch-window").classList.remove("launched");

    $("planetMessage").classList.add("hidden");

    exploredPlanets.clear();

    $$(".planet-card").forEach((card) => {
      card.classList.remove("planet-explored");
    });

    $("planetProgress").textContent = "Planets explored: 0 / 3";

    $("toQuizButton").disabled = true;
    $("toQuizButton").textContent =
      "Explore all planets to continue →";

    $("celebrationBurst").classList.add("hidden");
    $("celebrateButton").textContent =
      "Make the galaxy sparkle ✨";

    renderQuestion();
    showScreen("welcome");
  });

  // Prepare the first quiz question without showing the quiz screen.
  renderQuestion();

  // Make startup failures visible instead of silently doing nothing.
  console.log("🚀 Naitik's Birthday Mission loaded successfully!");
})();
