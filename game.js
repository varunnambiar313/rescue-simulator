const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");
const overlay = document.getElementById("overlay");
const nextBtn = document.getElementById("nextBtn");

/* ---------- Assets ---------- */
const anuImg = new Image();
const varunImg = new Image();
let anuLoaded = false, varunLoaded = false;

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
    obstacles: [{ x: 250, y: 60, w: 20, h: 280 }],
    enemies: [{ x: 350, y: 200 }],
    boss: false
  },
  {
    dialogue: "Varun: Almost there Anu 💙",
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
    dialogue: "Final Boss 💙 Defeat him!",
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
  dialogueBox.innerText = l.dialogue;
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
        vy: (princess.y - e.y) * 0.006
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
  const moveSpeed = levels[level].boss ? BASE_SPEED*1.2 : BASE_SPEED*2;
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
    b.x += b.vx; b.y += b.vy;
    if (hit(b, princess, 32)) {
      princessHealth--;
      enemyBullets.splice(i,1);
      if (princessHealth <= 0) loadLevel();
    }
  });

  // Player bullets
  playerBullets.forEach((b, i) => {
    b.x += b.vx; b.y += b.vy;
    const boss = enemies[0];
    if (boss && hit(b, boss, 32)) {
      boss.health--;
      playerBullets.splice(i,1);
      if (boss.health <= 0) showOverlay();
    }
  });

  // Barriers
  obstacles.forEach(o => { if (hit(princess,o,o.w)) loadLevel(); });

  // Level goal
  if (!levels[level].boss && prince && hit(princess,prince,32)) showOverlay();
}

/* ---------- Draw ---------- */
function draw() {
  ctx.clearRect(0,0,600,400);

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
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(e.x, e.y, 32, 32);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("E", e.x + 8, e.y + 23);
  });

  // Bullets
  ctx.fillStyle="#2563eb";
  enemyBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle="#1d4ed8";
  playerBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill(); });

  // Health bars
  if (levels[level].boss) {
    ctx.fillStyle="red";
    ctx.fillRect(20,10,princessHealth*40,8);
    ctx.fillStyle="#2563eb";
    ctx.fillRect(200,10,enemies[0].health*6,8);
  }
}

/* ---------- Overlay ---------- */
function showOverlay() {
  paused = true;
  overlay.style.display="flex";
}

nextBtn.onclick = () => {
  overlay.style.display="none";
  level++;
  if(level>=levels.length){
    document.body.innerHTML="<h1>💙 Varun Saved 💙<br/>I love you</h1>";
  } else loadLevel();
};

/* ---------- Loop ---------- */
function loop(){
  if(!paused) update();
  draw();
  requestAnimationFrame(loop);
}
loadLevel();
loop();
