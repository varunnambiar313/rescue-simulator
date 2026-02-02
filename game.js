const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const princess = { x: 50, y: 180, size: 30 };
const prince = { x: 520, y: 180, size: 30 };

const obstacles = [
  { x: 250, y: 100, w: 20, h: 200 }
];

let gameWon = false;
const speed = 10;

/* ---------- Movement Logic ---------- */
function move(dir) {
  if (gameWon) return;

  if (dir === "up") princess.y -= speed;
  if (dir === "down") princess.y += speed;
  if (dir === "left") princess.x -= speed;
  if (dir === "right") princess.x += speed;

  princess.x = Math.max(0, Math.min(canvas.width - princess.size, princess.x));
  princess.y = Math.max(0, Math.min(canvas.height - princess.size, princess.y));

  checkCollision();
}

/* ---------- Keyboard ---------- */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
});

/* ---------- Touch Controls ---------- */
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  document.getElementById("controls").style.display = "block";

  document.querySelectorAll("#controls button").forEach(btn => {
    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      move(btn.dataset.dir);
    });
  });
}

/* ---------- Collision ---------- */
function checkCollision() {
  if (
    princess.x < prince.x + prince.size &&
    princess.x + princess.size > prince.x &&
    princess.y < prince.y + prince.size &&
    princess.y + princess.size > prince.y
  ) {
    gameWon = true;
    setTimeout(() => {
      document.body.innerHTML =
        "<h1>💖 You saved the prince! He loves you forever 💖</h1>";
    }, 100);
  }

  obstacles.forEach(o => {
    if (
      princess.x < o.x + o.w &&
      princess.x + princess.size > o.x &&
      princess.y < o.y + o.h &&
      princess.y + princess.size > o.y
    ) {
      princess.x = 50;
      princess.y = 180;
    }
  });
}

/* ---------- Draw Loop ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff1493";
  ctx.fillRect(princess.x, princess.y, princess.size, princess.size);
  ctx.fillText("👸", princess.x + 5, princess.y + 25);

  ctx.fillStyle = "#4169e1";
  ctx.fillRect(prince.x, prince.y, prince.size, prince.size);
  ctx.fillText("🤴", prince.x + 5, prince.y + 25);

  ctx.fillStyle = "#555";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  requestAnimationFrame(draw);
}

draw();
