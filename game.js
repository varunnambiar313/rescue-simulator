const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");

/* Load images */
const anuImg = new Image();
anuImg.src = "anu.png";

const varunImg = new Image();
varunImg.src = "varun.png";

/* Game settings */
const speed = 2.2;
let level = 0;
let gameWon = false;

/* Levels */
const levels = [
  {
    dialogue: "Anu: Varun, I'm coming for you 💖",
    princessStart: { x: 50, y: 180 },
    prince: { x: 520, y: 180 },
    obstacles: [{ x: 250, y: 80, w: 20, h: 240 }],
    enemies: [{ x: 350, y: 200 }]
  },
  {
    dialogue: "Varun: Be careful Anu… I believe in you ❤️",
    princessStart: { x: 50, y: 50 },
    prince: { x: 520, y: 320 },
    obstacles: [
      { x: 200, y: 0, w: 20, h: 200 },
      { x: 350, y: 200, w: 20, h: 200 }
    ],
    enemies: [
      { x: 300, y: 100 },
      { x: 450, y: 300 }
    ]
  }
];

let princess, prince, obstacles, enemies, bullets;

/* Init */
function loadLevel() {
  const l = levels[level];
  princess = { ...l.princessStart, size: 32 };
  prince = { ...l.prince, size: 32 };
  obstacles = l.obstacles;
  enemies = l.enemies.map(e => ({ ...e, cooldown: 0 }));
  bullets = [];
  dialogueBox.innerText = l.dialogue;
}

loadLevel();

/* -------- Virtual Joystick -------- */
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joyActive = false;
let joyX = 0;
let joyY = 0;

joystick.addEventListener("touchstart", () => joyActive = true);
joystick.addEventListener("touchend", resetStick);
joystick.addEventListener("touchmove", e => {
  if (!joyActive) return;
  const rect = joystick.getBoundingClientRect();
  const touch = e.touches[0];
  let x = touch.clientX - rect.left - 60;
  let y = touch.clientY - rect.top - 60;

  const dist = Math.hypot(x, y);
  if (dist > 40) {
    x *= 40 / dist;
    y *= 40 / dist;
  }

  stick.style.left = `${x + 35}px`;
  stick.style.top = `${y + 35}px`;

  joyX = x / 40;
  joyY = y / 40;
});

function resetStick() {
  joyActive = false;
  joyX = joyY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

/* -------- Enemy Shooting -------- */
function enemyShoot() {
  enemies.forEach(e => {
    e.cooldown--;
    if (e.cooldown <= 0) {
      bullets.push({
        x: e.x,
        y: e.y,
        vx: (princess.x - e.x) * 0.01,
        vy: (princess.y - e.y) * 0.01
      });
      e.cooldown = 90;
    }
  });
}

/* Collision */
function hit(a, b, size = 10) {
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

/* Update */
function update() {
  if (!gameWon) {
    princess.x += joyX * speed * 3;
    princess.y += joyY * speed * 3;

    princess.x = Math.max(0, Math.min(canvas.width - princess.size, princess.x));
    princess.y = Math.max(0, Math.min(canvas.height - princess.size, princess.y));
  }

  enemyShoot();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    if (hit(b, princess, princess.size)) resetLevel();
  });

  if (hit(princess, prince, prince.size)) {
    level++;
    if (level >= levels.length) {
      gameWon = true;
      document.body.innerHTML = `
        <h1>💖 Varun Saved 💖</h1>
        <p>Varun: Anu… you came for me.</p>
        <p>No enemy, no distance — only us.</p>
        <h2>👑 I love you 👑</h2>
      `;
    } else loadLevel();
  }
}

/* Draw */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(anuImg, princess.x, princess.y, princess.size, princess.size);
  ctx.drawImage(varunImg, prince.x, prince.y, prince.size, prince.size);

  ctx.fillStyle = "#555";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  ctx.font = "24px serif";
  enemies.forEach(e => ctx.fillText("😈", e.x, e.y));

  ctx.fillStyle = "#000";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 4));
}

/* Loop */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
