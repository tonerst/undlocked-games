const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

const W = canvas.width;
const H = canvas.height;

const road = {
  left: 75,
  right: 405,
  laneW: 110
};

const keys = {};

let player;
let cars;
let score;
let speed;
let roadOffset;
let spawnTimer;
let gameOver;
let running;
let lastTime;

function reset() {
  player = {
    x: W / 2 - 22,
    y: H - 105,
    w: 44,
    h: 78
  };

  cars = [];
  score = 0;
  speed = 260;
  roadOffset = 0;
  spawnTimer = 0;
  gameOver = false;
  running = false;
  lastTime = performance.now();

  scoreEl.textContent = "Score: 0";
  speedEl.textContent = "Speed: 0";
  statusEl.textContent = "Press a steering key to start.";

  draw();
}

function laneX(lane) {
  return road.left +
    lane * road.laneW +
    (road.laneW - 44) / 2;
}

function spawnCar() {
  const lane = Math.floor(Math.random() * 3);

  cars.push({
    x: laneX(lane),
    y: -90,
    w: 44,
    h: 78,
    speed: 40 + Math.random() * 110,
    kind: Math.floor(Math.random() * 3)
  });
}

function overlap(a, b) {
  const pad = 7;

  return (
    a.x + pad < b.x + b.w - pad &&
    a.x + a.w - pad > b.x + pad &&
    a.y + pad < b.y + b.h - pad &&
    a.y + a.h - pad > b.y + pad
  );
}

function update(dt) {
  if (!running || gameOver) return;

  let direction = 0;

  if (keys["arrowleft"] || keys["a"]) {
    direction -= 1;
  }

  if (keys["arrowright"] || keys["d"]) {
    direction += 1;
  }

  player.x += direction * 300 * dt;

  player.x = Math.max(
    road.left + 8,
    Math.min(
      road.right - player.w - 8,
      player.x
    )
  );

  speed = Math.min(620, speed + 8 * dt);

  roadOffset =
    (roadOffset + speed * dt) % 80;

  spawnTimer -= dt;

  const interval =
    Math.max(0.38, 0.95 - score / 1600);

  if (spawnTimer <= 0) {
    spawnCar();
    spawnTimer = interval;
  }

  for (const car of cars) {
    car.y += (speed + car.speed) * dt;

    if (overlap(player, car)) {
      gameOver = true;

      statusEl.textContent =
        "Crash! Score: " + Math.floor(score);

      return;
    }
  }

  cars = cars.filter(car => {
    if (car.y > H + 100) {
      score += 10;
      return false;
    }

    return true;
  });

  score += dt * 2;

  scoreEl.textContent =
    "Score: " + Math.floor(score);

  speedEl.textContent =
    "Speed: " + Math.floor(speed);
}

function drawCar(x, y, w, h, playerCar, kind) {
  const colors = [
    "#ff5252",
    "#ffd166",
    "#6ea8ff"
  ];

  ctx.fillStyle =
    playerCar ? "#32d583" : colors[kind % 3];

  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#18202a";

  ctx.fillRect(
    x + 7,
    y + 12,
    w - 14,
    20
  );

  ctx.fillRect(
    x + 7,
    y + h - 32,
    w - 14,
    20
  );

  ctx.fillStyle = "#111";

  ctx.fillRect(x - 4, y + 12, 7, 20);
  ctx.fillRect(x + w - 3, y + 12, 7, 20);

  ctx.fillRect(
    x - 4,
    y + h - 32,
    7,
    20
  );

  ctx.fillRect(
    x + w - 3,
    y + h - 32,
    7,
    20
  );
}

function draw() {
  ctx.fillStyle = "#1e5b35";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#444";

  ctx.fillRect(
    road.left,
    0,
    road.right - road.left,
    H
  );

  ctx.fillStyle = "#eee";

  ctx.fillRect(
    road.left - 5,
    0,
    5,
    H
  );

  ctx.fillRect(
    road.right,
    0,
    5,
    H
  );

  ctx.fillStyle = "#f6e58d";

  for (let lane = 1; lane < 3; lane++) {
    const x =
      road.left +
      lane * road.laneW -
      3;

    for (
      let y = -80 + roadOffset;
      y < H;
      y += 80
    ) {
      ctx.fillRect(x, y, 6, 42);
    }
  }

  for (const car of cars) {
    drawCar(
      car.x,
      car.y,
      car.w,
      car.h,
      false,
      car.kind
    );
  }

  drawCar(
    player.x,
    player.y,
    player.w,
    player.h,
    true,
    0
  );

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,.65)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px system-ui";
    ctx.textAlign = "center";

    ctx.fillText(
      "CRASH!",
      W / 2,
      H / 2 - 10
    );

    ctx.font = "20px system-ui";

    ctx.fillText(
      "Press Restart to race again",
      W / 2,
      H / 2 + 32
    );
  }
}

function loop(now) {
  const dt = Math.min(
    0.033,
    (now - lastTime) / 1000
  );

  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    key === "arrowleft" ||
    key === "arrowright" ||
    key === "a" ||
    key === "d"
  ) {
    event.preventDefault();

    keys[key] = true;
    running = true;

    if (!gameOver) {
      statusEl.textContent = "Race!";
    }
  }
});

addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

restartBtn.addEventListener("click", reset);

reset();

requestAnimationFrame(loop);
