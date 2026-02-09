const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");

/* ---------- Assets ---------- */
const anuImg = new Image();
const varunImg = new Image();

let anuLoaded = false;
let varunLoaded = false;

anuImg.onload = () => anuLoaded = true;
varunImg.onload = () => varunLoaded = true;
anuImg.onerror = () => anuLoaded = false;
varunImg.onerror = () => varunLoaded = false;

anuImg.src = "anu.png";
varunImg.src = "varun.png";

/* ---------- Game State ---------- */
const speed = 1.8;
let level = 0;
let gameWon = false;
let paused = false;
let princessHealth = 1;

/* ---------- Overlay ---------- */
const overlay = document.getElementById("overlay");
const nextBtn = document.getElementById("nextBtn");

/* ---------- Levels ---------- */
const levels = [
  {
    dialogue: "Anu: Varun, I'm coming for you 💙",
    princessStart: { x: 50, y: 180 },
    prince: { x: 520, y: 180 },
    obstacles: [{ x: 250, y: 80, w: 20, h: 240 }],
    enemies: [{ x: 350, y: 200 }],
    boss: false
  },
  {
    dialogue: "Varun: You're doing amazing Anu 💙",
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
    dialogue: "Final Trial 💙",
    princessStart: { x: 280, y: 300 },
    prince: { x: 280, y: 50 },
    obstacles: [],
    enemies: [{ x: 280, y: 160, boss: true, health: 20 }],
    boss: true
  }
];

let princess, prince, obstacles, enemies, bullets;

/* ---------- Init ---------- */
function loadLevel() {
  const l = levels[level];
  princess = { ...l.princessStart, size: 32 };
  prince = { ...l.prince, size: 32 };
  obstacles = l.obstacles;
  enemies = l.enemies.map(e => ({ ...e, cooldown: 0 }));
  bullets = [];
  princessHealth = l.boss ? 2 : 1;
  paused = false;
  dialogueBox.innerText = l.dialogue;
}

loadLevel();

/* ---------- Virtual Joystick ---------- */
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joyX = 0;
let joyY = 0;
let dragging = false;
const MAX_DIST = 40;

function updateStick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  let x = clientX - rect.left - rect.width / 2;
  let y = clientY - rect.top - rect.height / 2;

  const dist = Math.hypot(x, y);
  if (dist > MAX_DIST) {
    x *= MAX_DIST / dist;
    y *= MAX_DIST / dist;
  }

  stick.style.left = `${x + rect.width / 2 - 25}px`;
  stick.style.top = `${y + rect.height / 2 - 25}px`;

  joyX = x / MAX_DIST;
  joyY = y / MAX_DIST;
}

function resetStick() {
  dragging = false;
  joyX = 0;
  joyY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

/* Touch */
joystick.addEventListener("touchstart", e => {
  e.preventDefault();
  dragging = true;
}, { passive: false });

joystick.addEventListener("touchmove", e => {
  if (!dragging) return;
  const t = e.touches[0];
  updateStick(t.clientX, t.clientY);
}, { passive: false });

joystick.addEventListener("touchend", resetStick);

/* Mouse */
joystick.addEventListener("mousedown", e => {
  dragging = true;
  updateStick(e.clientX, e.clientY);
});
window.addEventListener("mousemove", e => {
  if (dragging) updateStick(e.clientX, e.clientY);
});
window.addEventListener("mouseup", resetStick);

/* ---------- Enemy Shooting ---------- */
function enemyShoot() {
  enemies.forEach(e => {
    e.cooldown--;
    if (e.cooldown <= 0) {
      bullets.push({
        x: e.x,
        y: e.y,
        vx: (princess.x - e.x) * 0.006,
        vy: (princess.y - e.y) * 0.006
      });
      e.cooldown = e.boss ? 40 : 90;
    }
  });
}

/* ---------- Collision ---------- */
function hit(a, b, size) {
  return (
    a.x < b.x + size &&
    a.x + size > b.x &&
    a.y < b.y + size &&
    a.y + size > b.y
  );
}

function resetLevel() {
  dialogueBox.innerText = "💔 Anu was hit… try again!";
  setTimeout(loadLevel, 1000);
}

/* ---------- Overlay ---------- */
function showOverlay() {
  paused = true;
  overlay.style.display = "flex";
}

nextBtn.onclick = () => {
  overlay.style.display = "none";
  if (level >= levels.length) {
    document.body.innerHTML = `
      <h1>💙 Varun Saved 💙</h1>
      <p>Anu, you beat every challenge.</p>
      <h2>I love you 💙</h2>
    `;
  } else {
    loadLevel();
  }
};

/* ---------- Update ---------- */
function update() {
  const moveSpeed = levels[level].boss ? speed * 1.2 : speed * 2;
  princess.x += joyX * moveSpeed;
  princess.y += joyY * moveSpeed;

  princess.x = Math.max(0, Math.min(canvas.width - princess.size, princess.x));
  princess.y = Math.max(0, Math.min(canvas.height - princess.size, princess.y));

  enemyShoot();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    if (hit(b, princess, princess.size)) {
      princessHealth--;
      bullets = [];
      if (princessHealth <= 0) resetLevel();
    }
  });

  enemies.forEach(e => {
    if (e.boss && hit(princess, e, 32)) {
      e.health--;
      if (e.health <= 0) {
        level++;
        showOverlay();
      }
    }
  });

  if (!levels[level].boss && hit(princess, prince, prince.size)) {
    level++;
    showOverlay();
  }
}

/* ---------- Draw ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Princess
  if (anuLoaded) {
    ctx.drawImage(anuImg, princess.x, princess.y, princess.size, princess.size);
  } else {
    ctx.font = "28px serif";
    ctx.fillText("👩", princess.x, princess.y + 28);
  }

  // Prince
  if (varunLoaded) {
    ctx.drawImage(varunImg, prince.x, prince.y, prince.size, prince.size);
  } else {
    ctx.font = "28px serif";
    ctx.fillText("👨", prince.x, prince.y + 28);
  }

  // Obstacles
  ctx.fillStyle = "#1e40af";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Enemies
  ctx.font = "30px serif";
  enemies.forEach(e => ctx.fillText("😈", e.x, e.y + 26));

  // Bullets
  ctx.fillStyle = "#000";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 4));

  // Health bars (final level)
  if (levels[level].boss) {
    ctx.fillStyle = "red";
    ctx.fillRect(20, 10, princessHealth * 40, 8);

    const boss = enemies[0];
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(200, 10, boss.health * 10, 8);
  }
}

/* ---------- Loop ---------- */
function loop() {
  if (!gameWon && !paused) update();
  draw();
  requestAnimationFrame(loop);
}

loop();
