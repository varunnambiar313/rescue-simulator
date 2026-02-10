const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayContent = document.getElementById("overlayContent");
const overlayChoices = document.getElementById("overlayChoices");
const overlayFeedback = document.getElementById("overlayFeedback");
const nextBtn = document.getElementById("nextBtn");

/* ---------- Assets ---------- */
const anuImg = new Image();
const varunImg = new Image();
const enemyImg = new Image();
let anuLoaded = false, varunLoaded = false, enemyLoaded = false;

anuImg.onload = () => anuLoaded = true;
varunImg.onload = () => varunLoaded = true;
enemyImg.onload = () => enemyLoaded = true;
anuImg.onerror = () => anuLoaded = false;
varunImg.onerror = () => varunLoaded = false;
enemyImg.onerror = () => enemyLoaded = false;

anuImg.src = "anu.png";
varunImg.src = "varun.png";
enemyImg.src = "enemy.png";

/* ---------- Game State ---------- */
const BASE_SPEED = 1.8;
let level = 0;
let paused = false;
let princessHealth = 1;
let transitioning = false;

const quizData = {
  0: {
    question: "What Video game is Varun looking forward to playing this month?",
    options: [
      { text: "Resident Evil 9;Requiem", correct: false, message: "Anu, Yar aapko itna bhi nahi pata mere games ke bare mai" },
      { text: "Vo Horror wali game", correct: true, message: "Ye hui na baat, yar ab to naam yad kar lo xD" },
      { text: "Varun plays too many games he needs to stop", correct: false, message: "Anu yar you have to learn how to live with it ab koi choice nhi hai" },
      { text: "Varun is playing with Anu's life", correct: false, message: "Anu wo ye month hi nhi I plan to play with it for a looooooooooooooot longer than that xD" }
    ]
  },
  1: {
    question: "How much older is Varun to Anu?",
    options: [
      { text: "50 years", correct: false, message: "uda lo yar mazak mai nhi baat kar raha" },
      { text: "Varun is younger", correct: false, message: "Mentally yes but wrong answer" },
      { text: "4 years", correct: false, message: "Sorry apko Maths nahi aati" },
      { text: "3 years", correct: true, message: "Ye hui na baat" }
    ]
  }
};

const finalMessage = `
Yar Anu,

Since you are a weirdo who does not accepts gifts I decided to make something like this. This is my way of introducing you to video games and getting you ready for your future xD.

In the last few weeks, we have talked so much and gotten to know each other really well so I decided to compile list of things we have in common. It's a very long list so brace yourself:

A) Death Note
B) Favorite Color: Blue
The END.

Yaar kaise phas gaye hum is situation mai xD? Anyways this is what we signed up for. Now we have to learn to live navigating all of our differences (there will be many more that we have not discovered yet xD). Which sounds kinda fun secretly.

Aur upar se long distance, cannot even annoy you in person. But hopefully we get to see each other in a couple of months.

Until then we need to stick to more calls, voice notes and texts jo is always fun with you. I mean apne mujhe tak voice note person bana diya which I thought was impossible.

Even though we are only at the beginning of our journey of getting to know each other, but I do feel like we have a deeper connection. A level of understanding of each other that is not easy to find.

We have such good chemistry and understanding ki sometimes I wonder how hard it would be to achieve my goal of making you mad/annoyed at me xD.
I am sure I will find a way.

I don't know what I did to deserve a pretty, smart, funny and short tempered (apparently?) girl like you but I am not complaining. xD

Anyways, I hope this is the last Valentine's day we have to celebrate not being together. Looking forward to endless laughs and sleep deprived nights talking to you.

Happy Valentines Day, Anu!
`;

/* ---------- Levels ---------- */
const levels = [
  {
    dialogue: "Varun: Anu Please save me from DP world executives telling me Palantir sucks 💙",
    princessStart: { x: 50, y: 180 },
    prince: { x: 520, y: 180 },
    obstacles: [{ x: 250, y: 60, w: 20, h: 280 }],
    enemies: [{ x: 350, y: 200 }],
    boss: false
  },
  {
    dialogue: "Anu this time there is two of them and I NEED you to take them out to make Palantir happen 💙",
    princessStart: { x: 50, y: 50 },
    prince: { x: 520, y: 320 },
    obstacles: [
      { x: 200, y: 0, w: 20, h: 200 },
      { x: 350, y: 200, w: 20, h: 200 }
    ],
    enemies: [
      { x: 300, y: 100 },
      { x: 450, y: 300 }
    ],
    boss: false
  },
  {
    dialogue: "Anu this is the DP World IT VP, take him out and end this 💙",
    princessStart: { x: 280, y: 320 },
    prince: null,
    obstacles: [],
    enemies: [{ x: 280, y: 120, boss: true, health: 30, cooldown: 0 }],
    boss: true
  }
];

let princess, prince, enemies, obstacles;
let enemyBullets = [];
let playerBullets = [];

/* ---------- Init ---------- */
function loadLevel() {
  const l = levels[level];
  princess = { ...l.princessStart, size: 32 };
  prince = l.prince;
  enemies = l.enemies.map(e => ({
    cooldown: 20,
    health: e.boss ? 30 : 1,
    ...e
  }));
  obstacles = l.obstacles;
  enemyBullets = [];
  playerBullets = [];
  princessHealth = l.boss ? 2 : 1;
  paused = false;
  transitioning = false;
  dialogueBox.innerText = l.dialogue;
}

/* ---------- Overlay / Quiz ---------- */
function openOverlay() {
  paused = true;
  overlay.style.display = "flex";
}

function closeOverlay() {
  overlay.style.display = "none";
  paused = false;
}

function clearOverlayUI() {
  overlayTitle.innerText = "";
  overlayContent.innerText = "";
  overlayChoices.innerHTML = "";
  overlayFeedback.innerText = "";
  nextBtn.style.display = "none";
  nextBtn.onclick = null;
}

function startNextLevelAfterDelay() {
  setTimeout(() => {
    level++;
    closeOverlay();
    if (level >= levels.length) {
      showFinalMessage();
      return;
    }
    loadLevel();
  }, 5000);
}

function renderQuiz(levelIndex) {
  const quiz = quizData[levelIndex];
  clearOverlayUI();
  overlayTitle.innerText = "Relationship Test ( Take very seriously";
  overlayContent.innerText = quiz.question;
  openOverlay();

  const setChoiceButtonsState = (enabled) => {
    overlayChoices.querySelectorAll("button.quiz-choice").forEach(btn => btn.disabled = !enabled);
  };

  const showRetry = () => {
    nextBtn.style.display = "inline-block";
    nextBtn.innerText = "Retry ❣️";
    nextBtn.onclick = () => {
      overlayFeedback.innerText = "Pick the answer again.";
      nextBtn.style.display = "none";
      setChoiceButtonsState(true);
    };
  };

  quiz.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-choice";
    btn.innerText = `${idx + 1}) ${option.text}`;
    btn.onclick = () => {
      overlayFeedback.innerText = option.message;
      if (option.correct) {
        setChoiceButtonsState(false);
        overlayFeedback.innerText = `${option.message}\n\nCorrect answer! Moving to next level in 5 seconds...`;
        nextBtn.style.display = "none";
        startNextLevelAfterDelay();
      } else {
        setChoiceButtonsState(false);
        showRetry();
      }
    };
    overlayChoices.appendChild(btn);
  });
}

function showFinalMessage() {
  clearOverlayUI();
  overlayTitle.innerText = "💙 Happy Valentine’s Day 💙";
  overlayContent.innerText = finalMessage;
  openOverlay();
  nextBtn.style.display = "inline-block";
  nextBtn.innerText = "Restart Game";
  nextBtn.onclick = () => {
    level = 0;
    closeOverlay();
    loadLevel();
  };
}

function handleLevelComplete() {
  if (transitioning) return;
  transitioning = true;

  if (level < levels.length - 1) {
    renderQuiz(level);
  } else {
    showFinalMessage();
  }
}

/* ---------- Joystick ---------- */
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
let joyX = 0, joyY = 0, dragging = false;
const MAX_DIST = 40;

function updateStick(x, y) {
  const r = joystick.getBoundingClientRect();
  let dx = x - r.left - r.width / 2;
  let dy = y - r.top - r.height / 2;
  const dist = Math.hypot(dx, dy);
  if (dist > MAX_DIST) {
    dx *= MAX_DIST / dist;
    dy *= MAX_DIST / dist;
  }
  stick.style.left = `${dx + r.width / 2 - 25}px`;
  stick.style.top = `${dy + r.height / 2 - 25}px`;
  joyX = dx / MAX_DIST;
  joyY = dy / MAX_DIST;
}

function resetStick() {
  dragging = false;
  joyX = 0; joyY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

joystick.addEventListener("touchstart", e => { e.preventDefault(); dragging = true; });
joystick.addEventListener("touchmove", e => { e.preventDefault(); dragging && updateStick(e.touches[0].clientX, e.touches[0].clientY); });
joystick.addEventListener("touchend", e => { e.preventDefault(); resetStick(); });

joystick.addEventListener("mousedown", e => { dragging = true; updateStick(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => dragging && updateStick(e.clientX, e.clientY));
window.addEventListener("mouseup", resetStick);

/* ---------- Utility ---------- */
function hit(a, b, s) {
  return a.x < b.x + s && a.x + s > b.x && a.y < b.y + s && a.y + s > b.y;
}

/* ---------- Shooting ---------- */
function enemyShoot() {
  enemies.forEach(e => {
    e.cooldown--;
    if (e.cooldown <= 0) {
      enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: (princess.x - e.x) * 0.006,
        vy: (princess.y - e.y) * 0.006,
        color: e.boss ? "#ef4444" : "#2563eb"
      });
      e.cooldown = e.boss ? 50 : 90;
    }
  });
}

let shootTimer = 0;
function playerShoot() {
  if (!levels[level].boss) return;
  const boss = enemies[0];
  if (!boss) return;
  playerBullets.push({
    x: princess.x,
    y: princess.y,
    vx: (boss.x - princess.x) * 0.01,
    vy: (boss.y - princess.y) * 0.01
  });
}

/* ---------- Update ---------- */
function update() {
  const moveSpeed = levels[level].boss ? BASE_SPEED * 1.2 : BASE_SPEED * 2;
  princess.x += joyX * moveSpeed;
  princess.y += joyY * moveSpeed;

  // Keep inside canvas
  princess.x = Math.max(0, Math.min(canvas.width - 32, princess.x));
  princess.y = Math.max(0, Math.min(canvas.height - 32, princess.y));

  enemyShoot();
  shootTimer++;
  if (shootTimer > 25) { playerShoot(); shootTimer = 0; }

  // Enemy bullets
  enemyBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (hit(b, princess, 32)) {
      princessHealth--;
      enemyBullets.splice(i, 1);
      if (princessHealth <= 0) loadLevel();
    }
  });

  // Player bullets
  playerBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    const boss = enemies[0];
    if (boss && hit(b, boss, 32)) {
      boss.health--;
      playerBullets.splice(i, 1);
      if (boss.health <= 0) handleLevelComplete();
    }
  });

  // Barriers
  obstacles.forEach(o => { if (hit(princess, o, o.w)) loadLevel(); });

  // Level goal
  if (!levels[level].boss && prince && hit(princess, prince, 32)) handleLevelComplete();
}

/* ---------- Draw ---------- */
function draw() {
  ctx.clearRect(0, 0, 600, 400);

  // Obstacles
  ctx.fillStyle = "#1e40af";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Princess
  if (anuLoaded) ctx.drawImage(anuImg, princess.x, princess.y, 32, 32);
  else {
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(princess.x, princess.y, 32, 32);
    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("A", princess.x + 8, princess.y + 24);
  }

  // Prince
  if (prince) {
    if (varunLoaded) ctx.drawImage(varunImg, prince.x, prince.y, 32, 32);
    else {
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(prince.x, prince.y, 32, 32);
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("V", prince.x + 8, prince.y + 24);
    }
  }

  // Enemies
  enemies.forEach(e => {
    if (enemyLoaded) {
      ctx.drawImage(enemyImg, e.x, e.y, 32, 32);
    } else {
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(e.x, e.y, 32, 32);
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("E", e.x + 8, e.y + 23);
    }
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(e.x, e.y, 32, 32);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("E", e.x + 8, e.y + 23);
  });

  // Bullets
  enemyBullets.forEach(b => {
    ctx.fillStyle = b.color || "#2563eb";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#1d4ed8";
  playerBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Health bars
  if (levels[level].boss) {
    ctx.font = "14px sans-serif";

    ctx.fillStyle = "#111827";
    ctx.fillText("Anu Health", 20, 10);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(20, 16, princessHealth * 40, 8);

    ctx.fillStyle = "#111827";
    ctx.fillText("DP World VP of IT", 200, 10);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(200, 16, enemies[0].health * 6, 8);
  }
}


    ctx.fillStyle = "#111827";
    ctx.fillText("Anu Health", 20, 10);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(20, 16, princessHealth * 40, 8);

    ctx.fillStyle = "#111827";
    ctx.fillText("DP World VP of IT", 200, 10);
    ctx.fillText("Boss Health", 200, 10);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(200, 16, enemies[0].health * 6, 8);
  }
}

/* ---------- Loop ---------- */
function loop() {
  if (!paused) update();
  draw();
  requestAnimationFrame(loop);
}

loadLevel();
loop();
