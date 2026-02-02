const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dialogueBox = document.getElementById("dialogue");

const speed = 10;
let level = 0;
let gameWon = false;

/* --------- Levels --------- */
const levels = [
  {
    dialogue: "Princess: I will save you, my love 💖",
    princessStart: { x: 50, y: 180 },
    prince: { x: 520, y: 180 },
    obstacles: [{ x: 250, y: 80, w: 20, h: 240 }],
    enemies: [{ x: 350, y: 200 }]
  },
  {
    dialogue: "Prince: Be careful! The guards are everywhere 😨",
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

/* --------- State --------- */
let princess, prince, obstacles, enemies, bullets;

/* --------- Init Level --------- */
function loadLevel() {
  const l = levels[level];
  princess = { ...l.princessStart, size: 30 };
  prince = { ...l.prince, size: 30 };
  obstacles = l.obstacles;
  enemies = l.enemies.map(e => ({ ...e, cooldown: 0 }));
  bullets = [];
  dialogueBox.innerText = l.dialogue;
}

loadLevel();

/* --------- Movement --------- */
function move(dir) {
  if (gameWon) return;

  if (dir === "up") princess.y -= speed;
  if (dir === "down") princess.y += speed;
  if (dir === "left") princess.x -= speed;
  if (dir === "right") princess.x += speed;

  princess.x = Math.max(0, Math.min(canvas.width - princess.size, princess.x));
  princess.y = Math.max(0, Math.min(canvas.height - princess.size, princess.y));
}

/* Keyboard */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
});

/* Touch */
if ("ontouchstart" in window) {
  document.getElementById("controls").style.display = "block";
  document.querySelectorAll("#controls button").forEach(b =>
    b.addEventListener("touchstart", e => {
      e.preventDefault();
      move(b.dataset.dir);
    })
  );
}

/* --------- Enemies Shoot --------- */
function enemyShoot() {
  enemies.forEach(e => {
    e.cooldown--;
    if (e.cooldown <= 0) {
      bullets.push({
        x: e.x,
        y: e.y,
        vx: princess.x > e.x ? 3 : -3,
        vy: princess.y > e.y ? 3 : -3
      });
      e.cooldown = 60;
    }
  });
}

/* --------- Collision --------- */
function hit(a, b, size = 10) {
  return (
    a.x < b.x + size &&
    a.x + size > b.x &&
    a.y < b.y + size &&
    a.y + size > b.y
  );
}

function resetLevel() {
  dialogueBox.innerText = "💀 You were hit! Try again, brave princess!";
  setTimeout(loadLevel, 1000);
}

/* --------- Update --------- */
function update() {
  enemyShoot();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;

    if (hit(b, princess, princess.size)) {
      resetLevel();
    }
  });

  if (hit(princess, prince, prince.size)) {
    level++;
    if (level >= levels.length) {
      gameWon = true;
      document.body.innerHTML = `
        <h1>💖 You saved me 💖</h1>
        <p>Prince: I knew you'd come for me.</p>
        <p>Every level, every danger — worth it because it's you.</p>
        <h2>👑 I love you 👑</h2>
      `;
    } else {
      loadLevel();
    }
  }
}

/* --------- Draw --------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Princess
  ctx.fillStyle = "#ff1493";
  ctx.fillRect(princess.x, princess.y, princess.size, princess.size);
  ctx.fillText("👸", princess.x + 5, princess.y + 25);

  // Prince
  ctx.fillStyle = "#4169e1";
  ctx.fillRect(prince.x, prince.y, prince.size, prince.size);
  ctx.fillText("🤴", prince.x + 5, prince.y + 25);

  // Obstacles
  ctx.fillStyle = "#555";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Enemies
  ctx.fillStyle = "#8b0000";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, 25, 25));

  // Bullets
  ctx.fillStyle = "#000";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 6, 6));
}

/* --------- Game Loop --------- */
function loop() {
  if (!gameWon) {
    update();
    draw();
    requestAnimationFrame(loop);
  }
}

loop();
