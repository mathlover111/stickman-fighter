const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.5;

// === 1. 更新 Player 類別：繪製真正的火柴人 ===
class Player {
    constructor(x, y, color, controls, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = 30; // 繪圖基準寬
        this.height = 60; // 繪圖基準高
        this.color = color;
        this.controls = controls; 
        this.isAI = isAI;
        this.speed = this.isAI ? 4 : 5; // AI 可以稍微慢一點
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.hp = 100;
        this.isAttacking = false;
        this.facing = this.color === "blue" ? 1 : -1; // 1代表右，-1代表左
    }

    // 真正的繪製方法：取代 fillRect
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2); // 移動到角色中心

        // 繪製身體線條
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        // 頭 (Circle)
        ctx.beginPath();
        ctx.arc(0, -this.height / 3.5, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 身體 (Vertical Line)
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 3.5 + 8);
        ctx.lineTo(0, this.height / 8);
        ctx.stroke();

        // 四肢角度
        const limbAngle = 0.5; // 基本角度
        const moveOffset = Math.sin(Date.now() / 100) * 5 * Math.abs(this.vx / this.speed); // 移動時四肢擺動

        // 腿
        ctx.beginPath();
        ctx.moveTo(0, this.height / 8);
        ctx.lineTo(-12 + moveOffset, this.height / 2); // 左腿
        ctx.moveTo(0, this.height / 8);
        ctx.lineTo(12 - moveOffset, this.height / 2); // 右腿
        ctx.stroke();

        // 手 (根據攻擊狀態改變)
        if (this.isAttacking) {
            // 出拳動作
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 10);
            ctx.lineTo(25 * this.facing, -this.height / 10 + Math.sin(Date.now()/50)*3); // 拳
            ctx.moveTo(0, -this.height / 10);
            ctx.lineTo(-10 * this.facing, this.height / 6); // 另一隻手
            ctx.stroke();
            
            // 攻擊光效
            ctx.strokeStyle = "rgba(255, 165, 0, 0.5)";
            ctx.beginPath();
            ctx.arc(28*this.facing, -this.height/10, 10, 0, Math.PI*2);
            ctx.fill();

        } else {
            // 閒置/移動手
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 10);
            ctx.lineTo(-12 + moveOffset, this.height / 5); // 左手
            ctx.moveTo(0, -this.height / 10);
            ctx.lineTo(12 - moveOffset, this.height / 5); // 右手
            ctx.stroke();
        }

        ctx.restore(); // 恢復座標系統

        // 繪製血條 (不變)
        ctx.fillStyle = "red";
        ctx.fillRect(this.x - 10, this.y - 15, 50, 5);
        ctx.fillStyle = this.color === "blue" ? "#3366FF" : "#FF3333"; // 血條顏色根據角色
        ctx.fillRect(this.x - 10, this.y - 15, (this.hp / 100) * 50, 5);
    }

    update() {
        if (!this.isGrounded) this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        // 地板碰撞
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

        // 更新面向
        if (this.vx > 0) this.facing = 1;
        if (this.vx < 0) this.facing = -1;
    }

    attack() {
        if (this.isAttacking) return; // 避免連發
        this.isAttacking = true;
        setTimeout(() => this.isAttacking = false, 150); // 攻擊持續 0.15 秒
    }
}

// === 2. 新增 EnemyAI 類別：簡單的 AI 控制器 ===
class EnemyAI {
    constructor(player, target) {
        this.p = player; // 紅色玩家 (自身)
        this.t = target; // 藍色玩家 (目標)
        this.attackTimer = 0;
        this.attackCooldown = 800; // AI 攻擊間隔
    }

    update() {
        const dx = this.t.x - this.p.x;
        const dy = this.t.y - this.p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const playerNear = dist < 200; // 玩家是否靠近

        // 重設 vx
        this.p.vx = 0;

        // A. 移動邏輯：如果玩家在視野內 (或即使沒在但沒跳躍)
        if (playerNear || (Math.random() > 0.02 && this.p.isGrounded)) {
            if (dx > 50) this.p.vx = this.p.speed; // 往右
            else if (dx < -50) this.p.vx = -this.p.speed; // 往左
        }

        // B. 跳躍邏輯：隨機跳躍，增加多樣性
        if (Math.random() < 0.01 && this.p.isGrounded) {
             this.p.vy = -12;
             this.p.isGrounded = false;
        }

        // C. 攻擊邏輯：如果距離夠近
        if (Math.abs(dx) < 60 && Math.abs(dy) < 50 && Date.now() - this.attackTimer > this.attackCooldown) {
            this.p.attack();
            this.attackTimer = Date.now();
            // 隨機增加攻擊冷卻，讓 AI 不要像機器人
            this.attackCooldown = 600 + Math.random() * 400; 
        }
    }
}

// === 3. 遊戲主體 ===

// 實例化玩家
const p1 = new Player(100, 200, "blue", { left: "a", right: "d", jump: "w", attack: "f" });
const p2 = new Player(650, 200, "red", null, true); // p2 是 AI，沒有控制按鍵

// 實例化 AI
const ai = new EnemyAI(p2, p1);

const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === p1.controls.attack) p1.attack();
});
window.addEventListener("keyup", (e) => keys[e.key] = false);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地板
    ctx.fillStyle = "#666";
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // 更新與繪製 P1 (不變)
    p1.vx = 0;
    if (keys[p1.controls.left]) p1.vx = -p1.speed;
    if (keys[p1.controls.right]) p1.vx = p1.speed;
    if (keys[p1.controls.jump] && p1.isGrounded) { p1.vy = -12; p1.isGrounded = false; }
    p1.update();
    p1.draw();

    // 更新與繪製 AI (P2)
    ai.update(); // 呼叫 AI 邏輯控制 P2
    p2.update();
    p2.draw();
    
    // 傷害判定 (更新攻擊範圍，考慮面向)
    function checkDamage(attacker, victim) {
        if (!attacker.isAttacking) return;
        const punchX = attacker.x + (attacker.width / 2) + (30 * attacker.facing);
        const punchY = attacker.y + 15;
        
        const distToVictimX = Math.abs(punchX - (victim.x + victim.width / 2));
        const distToVictimY = Math.abs(punchY - (victim.y + victim.height / 2));

        if (distToVictimX < 25 && distToVictimY < 30) {
            victim.hp = Math.max(0, victim.hp - 1); // 命中扣血
        }
    }
    
    checkDamage(p1, p2);
    checkDamage(p2, p1);

    // 勝負判定
    ctx.fillStyle = "black"; ctx.font = "30px Arial";
    if (p1.hp <= 0) {
        ctx.fillText("電腦獲勝！重新整理再試？", 230, 200); return;
    }
    if (p2.hp <= 0) {
        ctx.fillText("玩家獲勝！太棒了！", 250, 200); return;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
