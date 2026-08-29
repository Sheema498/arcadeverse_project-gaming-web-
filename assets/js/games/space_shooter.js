/* ==========================================================================
   ArcadeVerse Game - Cosmic Void (Space Shoot 'Em Up)
   ========================================================================== */

class SpaceShooterGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.gameState = 'menu'; // menu, playing, won, gameover
        this.score = 0;
        this.lives = 3;
        this.weaponPower = 1; // 1: single, 2: double, 3: triple, 4: shield + burst
        this.bossMode = false;
        this.boss = null;

        this.player = {
            x: canvas.width / 2,
            y: canvas.height - 80,
            width: 32,
            height: 32,
            speed: 5.5,
            shield: 100,
            invulnerableTime: 0
        };

        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.stars = [];
        this.particles = [];

        this.fireCooldown = 0;
        this.spawnTimer = 0;
        this.timeElapsed = 0;

        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 3 + 1,
                size: Math.random() * 2 + 1
            });
        }
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.weaponPower = 1;
        this.bossMode = false;
        this.boss = null;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 80;
        this.player.shield = 100;
        this.player.invulnerableTime = 0;

        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        this.timeElapsed = 0;
        this.spawnTimer = 0;

        this.sound.playMusic('space_shooter');
        this.storage.unlockAchievement('space_first_launch');
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        this.timeElapsed += dt;
        this.fireCooldown -= dt;
        this.spawnTimer += dt;

        if (this.player.invulnerableTime > 0) {
            this.player.invulnerableTime -= dt;
        }

        // 1. Update Starfield
        this.stars.forEach(s => {
            s.y += s.speed;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });

        // 2. Player Input Movement
        let dx = 0;
        let dy = 0;
        if (this.input.isPressed('a') || this.input.isPressed('ArrowLeft')) dx = -1;
        if (this.input.isPressed('d') || this.input.isPressed('ArrowRight')) dx = 1;
        if (this.input.isPressed('w') || this.input.isPressed('ArrowUp')) dy = -1;
        if (this.input.isPressed('s') || this.input.isPressed('ArrowDown')) dy = 1;

        this.player.x += dx * this.player.speed;
        this.player.y += dy * this.player.speed;

        // Keep player in bounds
        this.player.x = Math.max(16, Math.min(this.player.x, this.canvas.width - 16));
        this.player.y = Math.max(16, Math.min(this.player.y, this.canvas.height - 16));

        // Fire Weapons (Autofire or Space)
        if ((this.input.isPressed('Space') || this.input.isPressed('j') || this.input.mouseClicked) && this.fireCooldown <= 0) {
            this.firePlayerWeapon();
            this.fireCooldown = 120; // fire every 120ms
        }

        // 3. Enemy Spawns (Wave control)
        if (!this.bossMode) {
            // Standard enemy spawning
            if (this.spawnTimer > 1800) {
                this.spawnTimer = 0;
                this.spawnEnemyGroup();
            }

            // Trigger boss fight at 30 seconds
            if (this.timeElapsed > 30000) {
                this.triggerBossMode();
            }
        } else if (this.boss) {
            this.updateBoss(dt);
        }

        // 4. Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.y += e.speedY;
            e.x += Math.sin(this.timeElapsed * 0.005 + e.patternOffset) * e.amplitude;
            
            // Firing code
            e.fireTimer += dt;
            if (e.fireTimer > e.fireRate) {
                e.fireTimer = 0;
                this.enemyBullets.push({
                    x: e.x,
                    y: e.y + 12,
                    vx: 0,
                    vy: 4,
                    color: '#ff0055'
                });
            }

            // Boundary clean
            if (e.y > this.canvas.height + 40) {
                this.enemies.splice(i, 1);
            }
        }

        // 5. Update Player Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y += b.vy;
            b.x += b.vx;

            if (b.y < -20) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Hit enemy detection
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (this.checkCollision(b, e)) {
                    e.hp -= b.damage;
                    this.bullets.splice(i, 1);
                    this.spawnParticles(b.x, b.y, '#00ffff', 4);
                    this.sound.playHit();

                    if (e.hp <= 0) {
                        this.killEnemy(e);
                    }
                    hit = true;
                    break;
                }
            }

            // Boss hit detection
            if (!hit && this.bossMode && this.boss) {
                if (this.checkCollision(b, this.boss)) {
                    this.boss.hp -= b.damage;
                    this.bullets.splice(i, 1);
                    this.spawnParticles(b.x, b.y, '#ffd700', 5);
                    this.sound.playHit();

                    if (this.boss.hp <= 0) {
                        this.killBoss();
                    }
                }
            }
        }

        // 6. Update Enemy Bullets (Bullet Hell resolver)
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx;
            eb.y += eb.vy;

            if (eb.y > this.canvas.height + 20 || eb.x < -20 || eb.x > this.canvas.width + 20) {
                this.enemyBullets.splice(i, 1);
                continue;
            }

            // Hit player check
            if (this.player.invulnerableTime <= 0 && this.checkCollision(eb, this.player)) {
                this.playerBulletsHit();
                this.enemyBullets.splice(i, 1);
            }
        }

        // 7. Update Power-ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += 2.5;

            if (p.y > this.canvas.height + 20) {
                this.powerups.splice(i, 1);
                continue;
            }

            // Collide with player
            if (this.checkCollision(p, this.player)) {
                this.grabPowerup(p);
                this.powerups.splice(i, 1);
            }
        }

        // 8. Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollision(obj1, obj2) {
        const w1 = obj1.width || 10;
        const h1 = obj1.height || 10;
        const w2 = obj2.width || 24;
        const h2 = obj2.height || 24;

        return (
            obj1.x - w1/2 < obj2.x + w2/2 &&
            obj1.x + w1/2 > obj2.x - w2/2 &&
            obj1.y - h1/2 < obj2.y + h2/2 &&
            obj1.y + h1/2 > obj2.y - h2/2
        );
    }

    firePlayerWeapon() {
        const p = this.player;
        const d = 15; // bullet damage
        
        const profile = this.storage.getProfile();
        profile.stats.space_shooter.shotsFired = (profile.stats.space_shooter.shotsFired || 0) + 1;
        this.storage.saveProfile(profile);

        if (this.weaponPower === 1) {
            this.bullets.push({ x: p.x, y: p.y - 16, vx: 0, vy: -9, damage: d });
        } else if (this.weaponPower === 2) {
            this.bullets.push({ x: p.x - 10, y: p.y - 12, vx: 0, vy: -9, damage: d });
            this.bullets.push({ x: p.x + 10, y: p.y - 12, vx: 0, vy: -9, damage: d });
        } else if (this.weaponPower === 3) {
            this.bullets.push({ x: p.x, y: p.y - 16, vx: 0, vy: -9, damage: d });
            this.bullets.push({ x: p.x - 12, y: p.y - 8, vx: -1.5, vy: -8.5, damage: d });
            this.bullets.push({ x: p.x + 12, y: p.y - 8, vx: 1.5, vy: -8.5, damage: d });
        } else {
            // Level 4 Max fire (Triple + shield bursts)
            this.bullets.push({ x: p.x, y: p.y - 16, vx: 0, vy: -10, damage: d * 1.5 });
            this.bullets.push({ x: p.x - 14, y: p.y - 6, vx: -2.5, vy: -9, damage: d * 1.2 });
            this.bullets.push({ x: p.x + 14, y: p.y - 6, vx: 2.5, vy: -9, damage: d * 1.2 });
            
            this.storage.unlockAchievement('space_max_power');
        }

        this.sound.playLaser();
    }

    spawnEnemyGroup() {
        const count = Math.floor(Math.random() * 3) + 3;
        const speed = Math.random() * 1.5 + 2.0;
        const amplitude = Math.random() * 3 + 1;
        const hp = 20 + Math.floor(this.timeElapsed / 5000) * 10;

        for (let i = 0; i < count; i++) {
            this.enemies.push({
                x: (this.canvas.width / (count + 1)) * (i + 1) + (Math.random() * 40 - 20),
                y: -30 - i * 20,
                width: 24,
                height: 24,
                speedY: speed,
                amplitude: amplitude,
                patternOffset: i * 0.8,
                hp: hp,
                maxHp: hp,
                fireTimer: Math.random() * 500,
                fireRate: Math.random() * 1000 + 1500
            });
        }
    }

    triggerBossMode() {
        this.bossMode = true;
        this.boss = {
            x: this.canvas.width / 2,
            y: -100,
            width: 96,
            height: 64,
            hp: 600,
            maxHp: 600,
            speedX: 2.5,
            fireTimer: 0,
            patternPhase: 0,
            phaseTime: 0
        };
        this.enemies = []; // Clear small minions
    }

    updateBoss(dt) {
        const b = this.boss;
        b.phaseTime += dt;
        b.fireTimer += dt;

        // Enter transition
        if (b.y < 120) {
            b.y += 2;
            return;
        }

        // Horizontal sway movement
        b.x += b.speedX;
        if (b.x > this.canvas.width - 64 || b.x < 64) {
            b.speedX *= -1;
        }

        // Boss firing loop (Bullet hell radial pattern)
        if (b.fireTimer > 1200) {
            b.fireTimer = 0;
            b.patternPhase = (b.patternPhase + 1) % 3;
            
            this.sound.playLaser();

            if (b.patternPhase === 0) {
                // Ring shoot
                const bulletCount = 12;
                for (let i = 0; i < bulletCount; i++) {
                    const angle = (i / bulletCount) * Math.PI * 2;
                    this.enemyBullets.push({
                        x: b.x,
                        y: b.y + 20,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        color: '#ffff00'
                    });
                }
            } else if (b.patternPhase === 1) {
                // Focused wave shoot
                for (let i = -2; i <= 2; i++) {
                    this.enemyBullets.push({
                        x: b.x + i * 15,
                        y: b.y + 28,
                        vx: i * 0.7,
                        vy: 4.5,
                        color: '#ff0055'
                    });
                }
            } else {
                // Alternate spiral
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI + Math.sin(b.phaseTime * 0.01);
                    this.enemyBullets.push({
                        x: b.x,
                        y: b.y + 20,
                        vx: Math.cos(angle) * 3.5,
                        vy: Math.sin(angle) * 3.5,
                        color: '#00ffff'
                    });
                }
            }
        }
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
            this.score += 150;
            this.spawnParticles(enemy.x, enemy.y, '#ff3366', 12);
            this.sound.playExplosion();

            // Chance to drop power-ups
            if (Math.random() < 0.25) {
                this.powerups.push({
                    x: enemy.x,
                    y: enemy.y,
                    width: 14,
                    height: 14,
                    type: Math.random() < 0.4 ? 'shield' : 'weapon'
                });
            }
        }
    }

    killBoss() {
        this.bossMode = false;
        this.boss = null;
        this.score += 5000;
        this.sound.playQuestCompleted();
        this.sound.playExplosion();
        this.storage.saveHighScore('space_shooter', this.score);
        this.storage.unlockAchievement('space_boss_1');

        const profile = this.storage.getProfile();
        profile.stats.space_shooter.bossesDefeated = (profile.stats.space_shooter.bossesDefeated || 0) + 1;
        this.storage.saveProfile(profile);

        // Win State
        this.gameState = 'won';
        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'win', game: 'space_shooter', score: this.score } }));
    }

    playerBulletsHit() {
        this.player.shield -= 25;
        this.sound.playHit();
        this.spawnParticles(this.player.x, this.player.y, '#ffffff', 8);
        this.player.invulnerableTime = 1000; // 1s invulnerability

        if (this.player.shield <= 0) {
            this.lives--;
            this.player.shield = 100;
            this.weaponPower = Math.max(1, this.weaponPower - 1); // decrease weapon power on death
            
            if (this.lives <= 0) {
                this.gameOver();
            }
        }
    }

    grabPowerup(p) {
        this.sound.playPowerUp();
        if (p.type === 'shield') {
            this.player.shield = Math.min(100, this.player.shield + 40);
            this.spawnParticles(this.player.x, this.player.y, '#39ff14', 15);
        } else {
            this.weaponPower = Math.min(4, this.weaponPower + 1);
            this.spawnParticles(this.player.x, this.player.y, '#ffff00', 15);
        }
        this.score += 50;
    }

    gameOver() {
        this.gameState = 'gameover';
        this.sound.stopMusic();
        this.sound.playHit();
        this.storage.saveHighScore('space_shooter', this.score);

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'gameover', game: 'space_shooter', score: this.score } }));
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                alpha: 1.0
            });
        }
    }

    render() {
        // Clear background
        this.ctx.fillStyle = '#05030a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Draw Player Ship (Procedural glowing polygon)
        if (this.player.invulnerableTime <= 0 || Math.floor(this.timeElapsed / 100) % 2 === 0) {
            const p = this.player;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ffff';
            
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y - 18);
            this.ctx.lineTo(p.x - 16, p.y + 14);
            this.ctx.lineTo(p.x - 6, p.y + 8);
            this.ctx.lineTo(p.x + 6, p.y + 8);
            this.ctx.lineTo(p.x + 16, p.y + 14);
            this.ctx.closePath();
            this.ctx.fill();

            // Thrust flame animation
            this.ctx.fillStyle = Math.random() < 0.5 ? '#ff3300' : '#ffaa00';
            this.ctx.beginPath();
            this.ctx.moveTo(p.x - 4, p.y + 10);
            this.ctx.lineTo(p.x + 4, p.y + 10);
            this.ctx.lineTo(p.x, p.y + 22 + Math.random() * 6);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw shield circle if full weapon level
            if (this.weaponPower === 4) {
                this.ctx.strokeStyle = 'rgba(0,255,255,0.25)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.shadowBlur = 0;
        }

        // Draw Player Bullets
        this.bullets.forEach(b => {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
            this.ctx.shadowBlur = 0;
        });

        // Draw Enemy Ships
        this.enemies.forEach(e => {
            this.ctx.fillStyle = '#ff0055';
            this.ctx.beginPath();
            this.ctx.moveTo(e.x, e.y + 14);
            this.ctx.lineTo(e.x - 14, e.y - 10);
            this.ctx.lineTo(e.x, e.y - 4);
            this.ctx.lineTo(e.x + 14, e.y - 10);
            this.ctx.closePath();
            this.ctx.fill();
        });

        // Draw Enemy Bullets
        this.enemyBullets.forEach(eb => {
            this.ctx.fillStyle = eb.color;
            this.ctx.beginPath();
            this.ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw Power-ups
        this.powerups.forEach(p => {
            this.ctx.fillStyle = p.type === 'shield' ? '#39ff14' : '#ffff00';
            this.ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '8px monospace';
            this.ctx.fillText(p.type === 'shield' ? 'S' : 'W', p.x - 3, p.y + 3);
        });

        // Draw Boss
        if (this.bossMode && this.boss) {
            const b = this.boss;
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ffaa00';
            
            // Draw large Mothership polygon outline
            this.ctx.beginPath();
            this.ctx.moveTo(b.x, b.y + 32);
            this.ctx.lineTo(b.x - 48, b.y - 16);
            this.ctx.lineTo(b.x - 24, b.y - 32);
            this.ctx.lineTo(b.x + 24, b.y - 32);
            this.ctx.lineTo(b.x + 48, b.y - 16);
            this.ctx.closePath();
            this.ctx.fill();

            // Core reactor indicator
            this.ctx.fillStyle = Math.floor(this.timeElapsed / 200) % 2 === 0 ? '#ff0033' : '#770000';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowBlur = 0;

            // Boss HP Bar
            const hpWidth = 300;
            const fillWidth = hpWidth * (b.hp / b.maxHp);
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(this.canvas.width / 2 - hpWidth / 2, 20, hpWidth, 8);
            this.ctx.fillStyle = '#ff0055';
            this.ctx.fillRect(this.canvas.width / 2 - hpWidth / 2, 20, fillWidth, 8);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '9px monospace';
            this.ctx.fillText('VOID HARBINGER', this.canvas.width / 2 - 40, 16);
        }

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 3, 3);
            this.ctx.restore();
        });

        // Draw HUD details
        this.renderHUD();
    }

    renderHUD() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(10, 10, 180, 56);
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 180, 56);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`SCORE:  ${this.score}`, 18, 24);
        this.ctx.fillText(`SHIELD: ${this.player.shield}%`, 18, 37);
        this.ctx.fillText(`SHIPS:  ${'🚀 '.repeat(this.lives)}`, 18, 50);
    }
}
