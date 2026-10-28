
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerScoreText = document.getElementById("playerScore");
const botScoreText = document.getElementById("botScore");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

const W = canvas.width;
const H = canvas.height;

const paddleWidth = 12;
const paddleHeight = 85;
const ballRadius = 8;

let player, bot, ball;
let playerScore = 0;
let botScore = 0;
let running = false;
let animationId = null;
let keys = {};
let lastTime = 0;

function resetPositions(direction = 1) {
    player = {
        x: 20,
        y: H / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        speed: 6
    };

    bot = {
        x: W - 20 - paddleWidth,
        y: H / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        speed: 3.5
    };

    ball = {
        x: W / 2,
        y: H / 2,
        radius: ballRadius,
        vx: 4 * direction,
        vy: (Math.random() * 4) - 2
    };
}

function drawBackground() {
    ctx.fillStyle = "#080b20";
    ctx.fillRect(0, 0, W, H);

    // O‘rtadagi uzilgan chiziq
    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);

    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );

    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 18;
    ctx.fill();

    ctx.shadowBlur = 0;
}

function draw() {
    drawBackground();
    drawPaddle(player, "#00f5d4");
    drawPaddle(bot, "#ff4d8d");
    drawBall();
}

function clampPaddle(paddle) {
    paddle.y = Math.max(
        0,
        Math.min(H - paddle.height, paddle.y)
    );
}

function update(delta) {
    const step = Math.min(delta / 16.67, 2);

    // Klaviatura bilan boshqarish
    if (keys.ArrowUp || keys.KeyW) {
        player.y -= player.speed * step;
    }

    if (keys.ArrowDown || keys.KeyS) {
        player.y += player.speed * step;
    }

    clampPaddle(player);

    // Bot to‘pga qarab harakat qiladi
    const botCenter = bot.y + bot.height / 2;

    if (botCenter < ball.y - 8) {
        bot.y += bot.speed * step;
    } else if (botCenter > ball.y + 8) {
        bot.y -= bot.speed * step;
    }

    clampPaddle(bot);

    // To‘p harakati
    ball.x += ball.vx * step;
    ball.y += ball.vy * step;

    // Yuqori va pastki devorlar
    if (
        ball.y - ball.radius <= 0 ||
        ball.y + ball.radius >= H
    ) {
        ball.vy *= -1;
        ball.y = Math.max(
            ball.radius,
            Math.min(H - ball.radius, ball.y)
        );
    }

    // O‘yinchi raketkasi bilan to‘qnashuv
    if (
        ball.vx < 0 &&
        ball.x - ball.radius <= player.x + player.width &&
        ball.x + ball.radius >= player.x &&
        ball.y + ball.radius >= player.y &&
        ball.y - ball.radius <= player.y + player.height
    ) {
        ball.x = player.x + player.width + ball.radius;
        ball.vx = Math.abs(ball.vx) * 1.04;

        const hit =
            (ball.y - (player.y + player.height / 2)) /
            (player.height / 2);

        ball.vy = hit * 5;
    }

    // Bot raketkasi bilan to‘qnashuv
    if (
        ball.vx > 0 &&
        ball.x + ball.radius >= bot.x &&
        ball.x - ball.radius <= bot.x + bot.width &&
        ball.y + ball.radius >= bot.y &&
        ball.y - ball.radius <= bot.y + bot.height
    ) {
        ball.x = bot.x - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 1.02;

        const hit =
            (ball.y - (bot.y + bot.height / 2)) /
            (bot.height / 2);

        ball.vy = hit * 4.5;
    }

    // Hisob
    if (ball.x + ball.radius < 0) {
        botScore++;
        botScoreText.textContent = botScore;
        checkWinner();
        if (running) resetPositions(1);
    }

    if (ball.x - ball.radius > W) {
        playerScore++;
        playerScoreText.textContent = playerScore;
        checkWinner();
        if (running) resetPositions(-1);
    }
}

function checkWinner() {
    if (playerScore >= 5 || botScore >= 5) {
        running = false;

        const won = playerScore >= 5;

        message.innerHTML = `
            <h2>${won ? "🏆 SEN YUTDING!" : "🤖 BOT YUTDI!"}</h2>
            <p>Hisob: ${playerScore} : ${botScore}</p>
            <button id="restartBtn">Qayta o'ynash</button>
        `;

        message.style.display = "block";

        document.getElementById("restartBtn")
            .addEventListener("click", startGame);
    }
}

function gameLoop(timestamp = 0) {
    if (!running) return;

    const delta = lastTime ? timestamp - lastTime : 16.67;
    lastTime = timestamp;

    update(delta);
    draw();

    if (running) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    cancelAnimationFrame(animationId);

    playerScore = 0;
    botScore = 0;

    playerScoreText.textContent = "0";
    botScoreText.textContent = "0";

    resetPositions(Math.random() < 0.5 ? -1 : 1);

    running = true;
    lastTime = 0;
    message.style.display = "none";

    gameLoop();
}

startBtn.addEventListener("click", startGame);

// Telefon va sichqoncha boshqaruvi
function movePlayer(event) {
    if (!running) return;

    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleY = H / rect.height;
    const pointerY = (event.clientY - rect.top) * scaleY;

    player.y = pointerY - player.height / 2;
    clampPaddle(player);
}

canvas.addEventListener("pointerdown", movePlayer);
canvas.addEventListener("pointermove", event => {
    if (event.pointerType === "mouse" && event.buttons === 0) {
        return;
    }

    movePlayer(event);
});

// Klaviatura
document.addEventListener("keydown", event => {
    if (["ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    keys[event.code] = true;
});

document.addEventListener("keyup", event => {
    keys[event.code] = false;
});

resetPositions();
draw();
