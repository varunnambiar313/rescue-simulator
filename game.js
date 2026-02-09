const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");
const overlay = document.getElementById("overlay");
const nextBtn = document.getElementById("nextBtn");

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
const BASE_SPEED = 1.8;
let level = 0;
let paused = false;
let princessHealth = 1;

/* ---------- Levels ---------- */
const levels = [
  {
    dialogue: "Anu: I'm coming for you Varun 💙",
    princessStart: { x: 50, y: 180 },
    prince: { x: 520, y: 180 },
    enemies: [{ x: 350, y: 200 }],
    boss: false
  },
  {
    dialogue: "Varun: Almost there Anu 💙",
    princessStart: { x: 50, y: 50 },
    prince: { x: 520, y: 320 },
    enemies: [
      { x: 300, y: 100 },
      { x: 450, y: 300 }
    ],
    boss: false
  },
  {
    dialogue: "Final Boss 💙",
    princessStart: { x: 280, y: 300 },
    prince: { x: 280, y: 40 },
    enemies: [{ x: 280, y: 160, boss: true, health: 20 }],
    boss: true
  }
];

let princess, prince, enemies, bullets;

/* ---------- Init ---------- */
function loadLevel() {
  const l = levels[level];
  princess = { ...l.princessStart, size: 32 };
  prince = { ...l.prince, size: 32 };
  enemies = l.enemies.map(e => ({ ...e, cooldown: 0 }));
  bullets = [];
  princessHealth = l.boss ? 2 : 1;
  paused = false;
  dialogueBox.innerText = l.dialogue;
}

loadLevel();

/* ---------- Joystick ---------- */
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
let joyX = 0, joyY = 0, dragging = false;
const MAX_DIST = 40;

function updateStick(x, y) {
  const r = joystick.getBoundingClientRect();
  let dx = x - r.left - r.width / 2;
  let dy = y - r.top - r.height / 2;
  const d = Math.hypot(dx, dy);
  if (d > MAX_DIST) {
    dx *= MAX_DIST / d;
    dy *= MAX_DIST / d;
  }
  stick.style.left = `${dx + r.width / 2 - 25}px`;
  stick.style.top = `${dy + r.height / 2 - 25}px`;
  joyX = dx / MAX_DIST;
  joyY = dy / MAX_DIST;
}

function resetStick() {
  dragging = false;
  joyX = joyY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

joystick.addEventListener("touchstart", e => dragging = true);
joystick.addEventListener("touchmove", e => updateStick(e.touches[0].clientX, e.touches[0].clientY));
joystick.addEventListener("touchend", resetStick);
joystick.addEventListener("mousedown", e => { dragging = true; updateStick(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => dragging && updateStick(e.clientX, e.clientY));
window.addEventListener("mouseup", resetStick);

/* ---------- Game Logic ---------- */
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

function hit(a, b, s) {
  return a.x < b.x + s && a.x + s > b.x && a.y < b.y + s && a.y + s > b.y;
}

function update() {
  const speed = levels[level].boss ? BASE_SPEED * 1.2 : BASE_SPEED * 2;
  princess.x += joyX * speed;
  princess.y += joyY * speed;

  enemyShoot();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    if (hit(b, princess, princess.size)) {
      princessHealth--;
      bullets.length = 0;
      if (princessHealth <= 0) loadLevel();
    }
  });

  enemies.forEach(e => {
    if (e.boss && hit(princess, e, 32)) {
      e.health--;
      if (e.health <= 0) showOverlay();
    }
  });

  if (!levels[level].boss && hit(princess, prince, 32)) showOverlay();
}

function draw() {
  ctx.clearRect(0,0,600,400);
  ctx.font = "28px serif";
  ctx.fillText(anuLoaded ? "" : "👩", princess.x, princess.y + 28);
  if (anuLoaded) ctx.drawImage(anuImg, princess.x, princess.y, 32, 32);
  ctx.fillText(varunLoaded ? "" : "👨", prince.x, prince.y + 28);
  if (varunLoaded) ctx.drawImage(varunImg, prince.x, prince.y, 32, 32);
  enemies.forEach(e => ctx.fillText("😈", e.x, e.y + 26));
}

function showOverlay() {
  paused = true;
  overlay.style.display = "flex";
}

nextBtn.onclick = () => {
  overlay.style.display = "none";
  level++;
  if (level >= levels.length) {
    document.body.innerHTML = "<h1>💙 Varun Saved 💙<br/>I love you</h1>";
  } else loadLevel();
};

/* ---------- Loop ---------- */
function loop() {
  if (!paused) update();
  draw();
  requestAnimationFrame(loop);
}
loop();
