/* ==========================================================================
   ArcadeVerse Game - Neo-Defender (Strategy Tower Defense)
   ========================================================================== */

class TowerDefenseGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.gameState = 'menu'; // menu, playing, won, gameover
        this.gold = 350;
        this.lives = 20;
        this.score = 0;
        this.wave = 0;
        this.maxWaves = 20;

        // Path waypoints
        this.waypoints = [
            { x: 0, y: 150 },
            { x: 250, y: 150 },
            { x: 250, y: 450 },
            { x: 550, y: 450 },
            { x: 550, y: 250 },
            { x: 800, y: 250 }
        ];

        this.towers = [];
        this.enemies = [];
        this.particles = [];
        this.bullets = [];

        // Grid configurations
        this.cellSize = 40;
        this.gridWidth = canvas.width / this.cellSize;
        this.gridHeight = canvas.height / this.cellSize;

        this.selectedTowerType = 'gun'; // gun, laser, cryo
        this.towerTypes = {
            gun: { cost: 100, range: 120, damage: 15, cooldown: 30, color: '#38bdf8' },
            laser: { cost: 200, range: 160, damage: 1.5, cooldown: 1, color: '#ff007f' }, // continuous beam
            cryo: { cost: 150, range: 100, damage: 5, cooldown: 45, color: '#00ffff' } // slows enemies
        };

        this.initMouseListener();
    }

    initMouseListener() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState !== 'playing') return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const gridX = Math.floor(mouseX / this.cellSize);
            const gridY = Math.floor(mouseY / this.cellSize);

            // Attempt to build or select tower
            this.handleCellClick(gridX, gridY);
        });
    }

    start() {
        this.gameState = 'playing';
        this.gold = 350;
        this.lives = 20;
        this.score = 0;
        this.wave = 1;
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        this.sound.playMusic('tower_defense');
        this.spawnWave();
    }

    spawnWave() {
        const enemyCount = 5 + this.wave * 3;
        const enemyHp = 30 + this.wave * 25;
        const speed = 1.0 + Math.min(0.5, this.wave * 0.05);

        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                if (this.gameState !== 'playing') return;
                this.enemies.push({
                    x: this.waypoints[0].x - i * 35,
                    y: this.waypoints[0].y,
                    hp: enemyHp,
                    maxHp: enemyHp,
                    speed: speed,
                    slowDuration: 0,
                    normalSpeed: speed,
                    waypointIdx: 0,
                    radius: 12,
                    goldReward: 15 + this.wave * 2
                });
            }, i * 650);
        }
    }

    handleCellClick(gridX, gridY) {
        // Prevent building on path
        if (this.isCellOnPath(gridX, gridY)) return;

        // Prevent building outside canvas
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) return;

        // Check if tower exists at position
        const existingIdx = this.towers.findIndex(t => t.gridX === gridX && t.gridY === gridY);
        if (existingIdx !== -1) {
            // Upgrade tower
            const tower = this.towers[existingIdx];
            if (tower.level < 3 && this.gold >= 100) {
                this.gold -= 100;
                tower.level++;
                tower.range += 15;
                tower.damage *= 1.5;
                this.sound.playPowerUp();
                
                this.storage.unlockAchievement('td_max_upgrade');
            }
            return;
        }

        // Build new tower
        const typeInfo = this.towerTypes[this.selectedTowerType];
        if (this.gold >= typeInfo.cost) {
            this.gold -= typeInfo.cost;
            this.towers.push({
                x: gridX * this.cellSize + this.cellSize / 2,
                y: gridY * this.cellSize + this.cellSize / 2,
                gridX: gridX,
                gridY: gridY,
                type: this.selectedTowerType,
                range: typeInfo.range,
                damage: typeInfo.damage,
                cooldown: typeInfo.cooldown,
                timer: 0,
                color: typeInfo.color,
                level: 1,
                target: null
            });
            this.sound.playSelect();

            const profile = this.storage.getProfile();
            profile.stats.tower_defense.towersBuilt = (profile.stats.tower_defense.towersBuilt || 0) + 1;
            this.storage.saveProfile(profile);

            this.storage.unlockAchievement('td_first_tower');
            if (this.towers.length >= 15) this.storage.unlockAchievement('td_build_grid');
        }
    }

    isCellOnPath(gx, gy) {
        // Calculate cell bounding boxes
        const cellBox = {
            minX: gx * this.cellSize,
            minY: gy * this.cellSize,
            maxX: (gx + 1) * this.cellSize,
            maxY: (gy + 1) * this.cellSize
        };

        // Check against segments of waypoints path
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const p1 = this.waypoints[i];
            const p2 = this.waypoints[i+1];
            
            // Generate bounding box of path segment
            const pad = 24; // path thickness
            const segBox = {
                minX: Math.min(p1.x, p2.x) - pad,
                minY: Math.min(p1.y, p2.y) - pad,
                maxX: Math.max(p1.x, p2.x) + pad,
                maxY: Math.max(p1.y, p2.y) + pad
            };

            if (cellBox.minX < segBox.maxX && cellBox.maxX > segBox.minX &&
                cellBox.minY < segBox.maxY && cellBox.maxY > segBox.minY) {
                return true;
            }
        }
        return false;
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        // 1. Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Handle freeze slow downs
            if (enemy.slowDuration > 0) {
                enemy.slowDuration -= dt;
                enemy.speed = enemy.normalSpeed * 0.55;
            } else {
                enemy.speed = enemy.normalSpeed;
            }

            const targetWaypoint = this.waypoints[enemy.waypointIdx + 1];
            if (targetWaypoint) {
                // Move towards next node waypoint
                const dx = targetWaypoint.x - enemy.x;
                const dy = targetWaypoint.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.speed) {
                    enemy.x = targetWaypoint.x;
                    enemy.y = targetWaypoint.y;
                    enemy.waypointIdx++;
                } else {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                }
            } else {
                // Base breached!
                this.lives--;
                this.enemies.splice(i, 1);
                this.sound.playHit();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                continue;
            }
        }

        // Check if wave cleared
        if (this.enemies.length === 0) {
            this.wave++;
            if (this.wave > this.maxWaves) {
                this.winLevel();
            } else {
                this.gold += 100 + this.wave * 10;
                this.spawnWave();
                
                if (this.wave === 6) this.storage.unlockAchievement('td_wave_5');
                if (this.wave === 16) this.storage.unlockAchievement('td_wave_15');
                if (this.wave === 20) this.storage.unlockAchievement('td_wave_30');
            }
        }

        // 2. Update Towers & firing mechanics
        this.towers.forEach(t => {
            t.timer += dt;
            
            // Validate active targets within range
            if (t.target && (this.getDist(t, t.target) > t.range || !this.enemies.includes(t.target))) {
                t.target = null;
            }

            // Find new target (closest to exit)
            if (!t.target) {
                let maxProgress = -1;
                this.enemies.forEach(e => {
                    if (e.x > 0 && this.getDist(t, e) <= t.range) {
                        const progress = e.waypointIdx * 1000 + e.x;
                        if (progress > maxProgress) {
                            maxProgress = progress;
                            t.target = e;
                        }
                    }
                });
            }

            // Fire tower weapon
            if (t.target) {
                if (t.type === 'laser') {
                    // Continuous damage per frame
                    t.target.hp -= t.damage;
                    this.spawnParticles(t.target.x, t.target.y, t.color, 1);
                    if (t.target.hp <= 0) {
                        this.killEnemy(t.target);
                        t.target = null;
                    }
                } else if (t.timer >= (t.cooldown * 16)) { // cooldown is frame based, convert approximately
                    t.timer = 0;
                    this.fireProjectile(t);
                }
            }
        });

        // 3. Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            if (!this.enemies.includes(b.target)) {
                this.bullets.splice(i, 1);
                continue;
            }

            const dx = b.target.x - b.x;
            const dy = b.target.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 8) {
                // Hit enemy target
                b.target.hp -= b.damage;
                this.spawnParticles(b.x, b.y, b.color, 8);
                this.sound.playHit();

                if (b.type === 'cryo') {
                    b.target.slowDuration = 3000; // freeze for 3 seconds
                }

                if (b.target.hp <= 0) {
                    this.killEnemy(b.target);
                }
                this.bullets.splice(i, 1);
            } else {
                b.x += (dx / dist) * 7.5;
                b.y += (dy / dist) * 7.5;
            }
        }

        // 4. Update Particle sparks
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    getDist(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fireProjectile(tower) {
        this.bullets.push({
            x: tower.x,
            y: tower.y,
            target: tower.target,
            damage: tower.damage,
            type: tower.type,
            color: tower.color
        });
        this.sound.playLaser();
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
            this.gold += enemy.goldReward;
            this.score += 250;
            this.spawnParticles(enemy.x, enemy.y, '#ffd700', 12);
            this.sound.playExplosion();

            const profile = this.storage.getProfile();
            profile.stats.tower_defense.enemiesDestroyed = (profile.stats.tower_defense.enemiesDestroyed || 0) + 1;
            this.storage.saveProfile(profile);

            this.storage.unlockAchievement('td_kill_100');
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2 + 1;
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

    gameOver() {
        this.gameState = 'gameover';
        this.sound.stopMusic();
        this.sound.playHit();
        this.storage.saveHighScore('tower_defense', this.score);
        
        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'gameover', game: 'tower_defense', score: this.score } }));
    }

    winLevel() {
        this.gameState = 'won';
        this.sound.stopMusic();
        this.sound.playQuestCompleted();
        this.storage.saveHighScore('tower_defense', this.score);
        
        if (this.lives === 20) {
            this.storage.unlockAchievement('td_perfect_health');
        }

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'win', game: 'tower_defense', score: this.score } }));
    }

    render() {
        // Clear background
        this.ctx.fillStyle = '#08141a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid coordinates lightly
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw Waypoint Road Path
        this.ctx.strokeStyle = '#1e3a47';
        this.ctx.lineWidth = 36;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            this.ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        this.ctx.stroke();

        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw Towers
        this.towers.forEach(t => {
            // Range outline on hover (simulated overall)
            this.ctx.fillStyle = t.color;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw level indicator dots
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < t.level; i++) {
                this.ctx.fillRect(t.x - 7 + i * 5, t.y - 2, 3, 3);
            }

            // Laser beam visual render
            if (t.type === 'laser' && t.target) {
                this.ctx.strokeStyle = t.color;
                this.ctx.lineWidth = t.level * 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = t.color;
                this.ctx.beginPath();
                this.ctx.moveTo(t.x, t.y);
                this.ctx.lineTo(t.target.x, t.target.y);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        });

        // Draw Bullets
        this.bullets.forEach(b => {
            this.ctx.fillStyle = b.color;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = b.color;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // Draw Enemies
        this.enemies.forEach(e => {
            if (e.x < 0) return; // don't draw offscreen spawns

            this.ctx.fillStyle = e.slowDuration > 0 ? '#00ffff' : '#ff3366';
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // HP Bar
            const hpWidth = e.radius * 2;
            const fillWidth = hpWidth * (e.hp / e.maxHp);
            
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, hpWidth, 4);

            this.ctx.fillStyle = '#39ff14';
            this.ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, fillWidth, 4);
        });

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
        this.ctx.fillRect(10, 10, 200, 72);
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 200, 72);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`GOLD:  💰 ${this.gold}`, 18, 25);
        this.ctx.fillText(`LIVES: 💚 ${this.lives}`, 18, 40);
        this.ctx.fillText(`WAVE:  🌊 ${this.wave}/${this.maxWaves}`, 18, 55);
        this.ctx.fillText(`SCORE: 🏆 ${this.score}`, 18, 70);

        // Highlight selection banner
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        this.ctx.fillRect(this.canvas.width - 210, 10, 200, 48);
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.strokeRect(this.canvas.width - 210, 10, 200, 48);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`TOWER: ${this.selectedTowerType.toUpperCase()}`, this.canvas.width - 200, 25);
        this.ctx.fillText(`COST:  💰 ${this.towerTypes[this.selectedTowerType].cost}`, this.canvas.width - 200, 40);
    }
}
