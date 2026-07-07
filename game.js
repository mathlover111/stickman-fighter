const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 遊戲設定
const gravity = 0.5;

// 玩家類別
class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 60;
        this.color = color;
        this.controls = controls; // 按鍵設定
        this.speed = 5;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.hp = 100;
        this.isAttacking = false;
    }

    draw() {
        // 繪製角色本體 (先用方塊代替，之後可以用線條畫火柴人)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 繪製攻擊範圍 (出拳時)
        if (this.isAttacking) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.x + (this.color === "blue" ? 30 : -20), this.y + 15, 20, 10);
        }

        // 繪製血條
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 10, this.y - 15, 50, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 10, this.y - 15, (this.hp / 100) * 50, 5);
    }

    update() {
        // 套用重力
        if (!this.isGrounded) {
            this.vy += gravity;
        }
        
        this.x += this.vx;
        this.y += this.vy;

        // 地板碰撞偵測
        if (this.y + this.height >= canvas.height - 20) {
            this.y = canvas.height - 20 - this.height;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // 邊界限制
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => this.isAttacking = false, 100); // 攻擊判定持續 0.1 秒
    }
}

// 實例化兩個玩家
const p1 = new Player(100, 200, "blue", { left: "a", right: "d", jump: "w", attack: "f" });
const p2 = new Player(650, 200, "red", { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", attack: "l" });

// 按鍵監聽
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === p1.controls.attack) p1.attack();
    if (e.key === p2.controls.attack) p2.attack();
});
window.addEventListener("keyup", (e) => keys[e.key] = false);

// 遊戲主迴圈
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製地板
    ctx.fillStyle = "#666";
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // P1 控制
    p1.vx = 0;
    if (keys[p1.controls.left]) p1.vx = -p1.speed;
    if (keys[p1.controls.right]) p1.vx = p1.speed;
    if (keys[p1.controls.jump] && p1.isGrounded) { p1.vy = -12; p1.isGrounded = false; }

    // P2 控制
    p2.vx = 0;
    if (keys[p2.controls.left]) p2.vx = -p2.speed;
    if (keys[p2.controls.right]) p2.vx = p2.speed;
    if (keys[p2.controls.jump] && p2.isGrounded) { p2.vy = -12; p2.isGrounded = false; }

    // 更新與繪製角色
    p1.update();
    p2.update();
    
    // 簡單的傷害判定邏輯 (範例)
    if (p1.isAttacking && Math.abs(p1.x - p2.x) < 50 && Math.abs(p1.y - p2.y) < 50) {
        p2.hp = Math.max(0, p2.hp - 0.5);
    }
    if (p2.isAttacking && Math.abs(p1.x - p2.x) < 50 && Math.abs(p1.y - p2.y) < 50) {
        p1.hp = Math.max(0, p1.hp - 0.5);
    }

    p1.draw();
    p2.draw();

    // 勝負判定
    if (p1.hp <= 0) {
        ctx.fillStyle = "black"; ctx.font = "30px Arial"; ctx.fillText("紅方獲勝！", 320, 200);
        return;
    }
    if (p2.hp <= 0) {
        ctx.fillStyle = "black"; ctx.font = "30px Arial"; ctx.fillText("藍方獲勝！", 320, 200);
        return;
    }

    requestAnimationFrame(gameLoop);
}

// 啟動遊戲
gameLoop();
