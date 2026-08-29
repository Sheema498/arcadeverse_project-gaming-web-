/* ==========================================================================
   ArcadeVerse Game - Dungeon Quest (Top-Down Adventure Action RPG)
   ========================================================================== */

class DungeonRpgGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.tileSize = 32;
        this.gameState = 'menu'; // menu, playing, won, gameover
        
        this.camera = new Camera2D(0, 0, canvas.width, canvas.height);
        this.engine = new ECS_Engine();

        this.playerX = 120;
        this.playerY = 120;
        this.playerHp = 100;
        this.playerMaxHp = 100;
        this.playerGold = 50;
        this.playerXp = 0;
        this.playerLevel = 1;
        this.score = 0;

        // Combat/Invuln timers
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackAngle = 0;
        this.invulnTime = 0;

        // Quest Tracking Database (5 core quests)
        this.quests = [
            { id: 'q_slime', name: 'Slime Infestation', desc: 'Slay 5 Slimes in the dungeon entrance.', progress: 0, target: 5, status: 'available' },
            { id: 'q_chests', name: 'Royal Looting', desc: 'Unlock 3 hidden iron chests.', progress: 0, target: 3, status: 'locked' },
            { id: 'q_sword', name: 'Blacksmith Request', desc: 'Purchase a Silver Sword from the Merchant.', progress: 0, target: 1, status: 'locked' },
            { id: 'q_skeletons', name: 'Grave Digging', desc: 'Vanquish 8 Skeleton guards.', progress: 0, target: 8, status: 'locked' },
            { id: 'q_dragon', name: 'The Wyrm Chamber', desc: 'Defeat the Red Dragon boss.', progress: 0, target: 1, status: 'locked' }
        ];

        this.activeQuestIdx = 0;
        this.currentDialog = null; // { text, options }
        
        this.map = [];
        this.items = [];
        this.enemies = [];
        this.npcs = [];
        this.swordType = 'Bronze'; // Bronze (+5), Silver (+12), Mythic (+35)
        
        this.initMap();
    }

    initMap() {
        // Retrieve dynamic map if present in ArcadeData
        if (window.ArcadeData && window.ArcadeData.rpgMap) {
            this.map = window.ArcadeData.rpgMap;
            return;
        }

        // Standard default map grid (18x24 layout size)
        this.map = [
            "WWWWWWWWWWWWWWWWWWWWWWWW",
            "W......W...............W",
            "W.P....W...M...........W",
            "W......W...............W",
            "WW.DD.WW......WWWWWW.WWW",
            "W......W......W........W",
            "W......W.C....W........W",
            "W......WWWWWWWW....E...W",
            "W.C....................W",
            "WWWWWW.WWWWWWWWWW.WWWWWW",
            "W......W......W........W",
            "W...N..W......W..C.....W",
            "W......W......W........W",
            "WW.WW.WW..B...WW..WWWWWW",
            "W...W..W......W........W",
            "W...W..W......W...K....W",
            "W.C.W..W......W........W",
            "WWWWWWWWWWWWWWWWWWWWWWWW"
        ];
    }

    start() {
        this.gameState = 'playing';
        this.playerHp = 100;
        this.playerGold = 50;
        this.playerXp = 0;
        this.playerLevel = 1;
        this.score = 0;
        this.swordType = 'Bronze';
        this.activeQuestIdx = 0;
        
        // Reset quests
        this.quests.forEach((q, idx) => {
            q.progress = 0;
            q.status = idx === 0 ? 'available' : 'locked';
        });

        this.engine = new ECS_Engine();
        this.loadMap();
        this.sound.playMusic('rpg');
    }

    loadMap() {
        this.enemies = [];
        this.items = [];
        this.npcs = [];
        this.currentDialog = null;

        const rows = this.map.length;
        const cols = this.map[0].length;
        this.camera.setBounds(0, 0, cols * this.tileSize, rows * this.tileSize);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const char = this.map[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                switch (char) {
                    case 'W': // Solid stone Wall
                        this.createWall(x, y);
                        break;
                    case 'P': // Player position
                        this.playerX = x + 8;
                        this.playerY = y + 8;
                        break;
                    case 'C': // Loot Chest
                        this.createChest(x, y);
                        break;
                    case 'N': // NPC "Eldar"
                        this.createNpc(x, y, 'Eldar the Wise', 'elder');
                        break;
                    case 'M': // Merchant Shop NPC
                        this.createNpc(x, y, 'Merchant Jack', 'shop');
                        break;
                    case 'E': // Patrol Slime
                        this.createEnemy(x, y, 'slime', 25, 1.2);
                        break;
                    case 'K': // Patrol Skeleton
                        this.createEnemy(x, y, 'skeleton', 65, 1.0);
                        break;
                    case 'B': // Red Dragon Boss
                        this.createEnemy(x, y, 'dragon', 300, 0.7);
                        break;
                }
            }
        }
    }

    createWall(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y, this.tileSize, this.tileSize));
        e.addComponent(new SpriteComponent('#3e3a47', (ctx, transform) => {
            ctx.fillStyle = '#3e3a47';
            ctx.fillRect(0, 0, transform.width, transform.height);
            ctx.strokeStyle = '#221e29';
            ctx.strokeRect(0, 0, transform.width, transform.height);
        }));
        e.type = 'wall';
    }

    createChest(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x + 6, y + 8, 20, 16));
        e.addComponent(new SpriteComponent('#8b5a2b', (ctx, transform) => {
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(0, 0, transform.width, transform.height);
            ctx.fillStyle = '#ffd700'; // Lock plate
            ctx.fillRect(8, 6, 4, 6);
        }));
        e.type = 'chest';
        this.items.push(e);
    }

    createNpc(x, y, name, role) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x + 4, y + 4, 24, 24));
        e.addComponent(new SpriteComponent(role === 'elder' ? '#a78bfa' : '#fbbf24', (ctx, transform) => {
            ctx.fillStyle = role === 'elder' ? '#a78bfa' : '#fbbf24';
            ctx.beginPath();
            ctx.arc(transform.width / 2, transform.height / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            // Robe look
            ctx.fillRect(2, 12, transform.width - 4, 12);
        }));
        e.name = name;
        e.role = role;
        e.type = 'npc';
        this.npcs.push(e);
    }

    createEnemy(x, y, type, hp, speed) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x + 4, y + 4, 24, 24));
        
        let color = '#34d399'; // slime
        if (type === 'skeleton') color = '#e5e7eb';
        if (type === 'dragon') {
            e.getComponent(TransformComponent).width = 48;
            e.getComponent(TransformComponent).height = 48;
            color = '#ef4444';
        }

        e.addComponent(new SpriteComponent(color, (ctx, transform) => {
            ctx.fillStyle = color;
            if (type === 'slime') {
                ctx.beginPath();
                ctx.arc(transform.width/2, transform.height/2 + 4, 10, Math.PI, 0);
                ctx.ellipse(transform.width/2, transform.height/2 + 4, 10, 6, 0, 0, Math.PI);
                ctx.fill();
            } else if (type === 'skeleton') {
                // Rib cage and skull
                ctx.fillRect(8, 0, 8, 8); // head
                ctx.fillStyle = '#000';
                ctx.fillRect(9, 3, 2, 2);
                ctx.fillRect(13, 3, 2, 2);
                ctx.fillStyle = color;
                ctx.fillRect(10, 8, 4, 12); // spine
                ctx.fillRect(4, 10, 16, 2); // shoulders
            } else if (type === 'dragon') {
                // Dragon wings and body
                ctx.fillRect(8, 8, 32, 28);
                // Wings
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(0, 12, 10, 16);
                ctx.fillRect(38, 12, 10, 16);
            }
        }));

        e.type = 'enemy';
        e.enemyType = type;
        e.hp = hp;
        e.maxHp = hp;
        e.speed = speed;
        e.dirX = 1;
        e.dirY = 0;
        e.moveTimer = 0;

        this.enemies.push(e);
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.invulnTime > 0) this.invulnTime -= dt;

        // Freeze game during active quest text dialogs
        if (this.currentDialog) {
            this.handleDialogInput();
            return;
        }

        // 1. Player Input Movement
        let dx = 0;
        let dy = 0;
        if (this.input.isPressed('a') || this.input.isPressed('ArrowLeft')) dx = -1;
        if (this.input.isPressed('d') || this.input.isPressed('ArrowRight')) dx = 1;
        if (this.input.isPressed('w') || this.input.isPressed('ArrowUp')) dy = -1;
        if (this.input.isPressed('s') || this.input.isPressed('ArrowDown')) dy = 1;

        const speed = 3.2;
        const nextX = this.playerX + dx * speed;
        const nextY = this.playerY + dy * speed;

        // Collision Resolve with Walls
        this.movePlayerWithCollision(nextX, nextY);

        // Update Camera
        this.camera.position.x = this.playerX - this.canvas.width / 2;
        this.camera.position.y = this.playerY - this.canvas.height / 2;
        this.camera.update();

        // 2. Space or mouse Click to Attack
        if ((this.input.isPressed('Space') || this.input.isPressed('j') || this.input.mouseClicked) && this.attackCooldown <= 0) {
            this.performMeleeAttack();
        }

        // Attack animation tick
        if (this.isAttacking) {
            this.attackAngle += 0.28;
            if (this.attackAngle >= 2.0) {
                this.isAttacking = false;
            }
        }

        // 3. Update Enemies behaviors
        this.enemies.forEach(e => {
            if (!e.active) return;
            const trans = e.getComponent(TransformComponent);

            // Follow player if nearby, else random patrol
            const distToPlayer = trans.position.dist(new Vector2(this.playerX, this.playerY));
            if (distToPlayer < 140) {
                const ex = this.playerX - trans.position.x;
                const ey = this.playerY - trans.position.y;
                const mag = Math.sqrt(ex*ex + ey*ey);
                trans.position.x += (ex / mag) * e.speed;
                trans.position.y += (ey / mag) * e.speed;
            } else {
                e.moveTimer += dt;
                if (e.moveTimer > 1800) {
                    e.moveTimer = 0;
                    const angle = Math.random() * Math.PI * 2;
                    e.dirX = Math.cos(angle);
                    e.dirY = Math.sin(angle);
                }
                trans.position.x += e.dirX * e.speed;
                trans.position.y += e.dirY * e.speed;
            }

            // Contact Damage
            if (distToPlayer < 20 && this.invulnTime <= 0) {
                this.playerHp -= e.enemyType === 'dragon' ? 30 : 15;
                this.invulnTime = 800; // 800ms invuln window
                this.sound.playHit();
                this.engine.particleSystem.spawnExplosion(this.playerX, this.playerY, '#ff0033', 6, 2, 20);

                if (this.playerHp <= 0) {
                    this.gameOver();
                }
            }
        });

        // 4. Update Engine Particles
        this.engine.update(dt);
    }

    movePlayerWithCollision(nextX, nextY) {
        const pSize = 18;
        const playerBoxX = { position: new Vector2(nextX, this.playerY), width: pSize, height: pSize };
        const playerBoxY = { position: new Vector2(this.playerX, nextY), width: pSize, height: pSize };

        let collideX = false;
        let collideY = false;

        this.engine.entities.forEach(entity => {
            if (entity.type !== 'wall') return;
            const trans = entity.getComponent(TransformComponent);
            if (!trans) return;

            // X-Axis Check
            if (this.checkAABB(playerBoxX, trans)) collideX = true;
            // Y-Axis Check
            if (this.checkAABB(playerBoxY, trans)) collideY = true;
        });

        if (!collideX) this.playerX = nextX;
        if (!collideY) this.playerY = nextY;
    }

    checkAABB(t1, t2) {
        return (
            t1.position.x < t2.position.x + t2.width &&
            t1.position.x + t1.width > t2.position.x &&
            t1.position.y < t2.position.y + t2.height &&
            t1.position.y + t1.height > t2.position.y
        );
    }

    performMeleeAttack() {
        this.isAttacking = true;
        this.attackAngle = -0.5;
        this.attackCooldown = 350; // attack delay

        this.sound.playLaser(); // sword swing swoosh

        // Check weapon reach
        const swordDmg = this.swordType === 'Bronze' ? 10 : (this.swordType === 'Silver' ? 22 : 55);
        const reach = 40;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const trans = e.getComponent(TransformComponent);
            const dist = trans.position.dist(new Vector2(this.playerX, this.playerY));

            if (dist <= reach) {
                e.hp -= swordDmg;
                this.sound.playHit();
                this.engine.particleSystem.spawnExplosion(trans.position.x + 10, trans.position.y + 10, '#ffffff', 8, 3, 20);
                
                if (e.hp <= 0) {
                    this.killEnemy(e);
                }
            }
        }

        // Interacting with chests
        this.items.forEach(chest => {
            if (chest.active && chest.getComponent(TransformComponent).position.dist(new Vector2(this.playerX, this.playerY)) < 35) {
                chest.active = false;
                this.playerGold += 100;
                this.score += 500;
                this.sound.playCoin();
                this.engine.particleSystem.spawnExplosion(chest.getComponent(TransformComponent).position.x + 10, chest.getComponent(TransformComponent).position.y + 8, '#ffd700', 12, 4, 30);
                
                this.storage.unlockAchievement('rpg_loot_chest');

                // Track Quest
                this.trackQuestProgress('q_chests', 1);
                
                const profile = this.storage.getProfile();
                profile.stats.rpg.chestsOpened = (profile.stats.rpg.chestsOpened || 0) + 1;
                this.storage.saveProfile(profile);
            }
        });

        // Interacting with NPCs
        this.npcs.forEach(npc => {
            if (npc.getComponent(TransformComponent).position.dist(new Vector2(this.playerX, this.playerY)) < 38) {
                this.launchDialog(npc);
            }
        });
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) {
            this.enemies.splice(idx, 1);
            this.sound.playExplosion();

            let xpReward = 15;
            let goldReward = 20;

            if (enemy.enemyType === 'slime') {
                this.trackQuestProgress('q_slime', 1);
                this.storage.unlockAchievement('rpg_kill_slime');
            } else if (enemy.enemyType === 'skeleton') {
                this.trackQuestProgress('q_skeletons', 1);
                xpReward = 35;
                goldReward = 40;
            } else if (enemy.enemyType === 'dragon') {
                this.trackQuestProgress('q_dragon', 1);
                xpReward = 200;
                goldReward = 500;
                this.storage.unlockAchievement('rpg_kill_dragon');
            }

            this.playerGold += goldReward;
            this.score += xpReward * 10;
            this.addXp(xpReward);

            const profile = this.storage.getProfile();
            profile.stats.rpg.monstersSlain = (profile.stats.rpg.monstersSlain || 0) + 1;
            this.storage.saveProfile(profile);
        }
    }

    addXp(amount) {
        this.playerXp += amount;
        const xpNeeded = this.playerLevel * 120;
        if (this.playerXp >= xpNeeded) {
            this.playerXp -= xpNeeded;
            this.playerLevel++;
            this.playerHp = this.playerMaxHp;
            this.sound.playPowerUp();
            this.engine.particleSystem.spawnExplosion(this.playerX, this.playerY, '#fbbf24', 20, 5, 40);
            
            if (this.playerLevel >= 10) {
                this.storage.unlockAchievement('rpg_level_10');
            }
        }
    }

    launchDialog(npc) {
        if (npc.role === 'elder') {
            const activeQuest = this.quests[this.activeQuestIdx];
            if (activeQuest.status === 'available') {
                this.currentDialog = {
                    text: `Eldar: "Greetings Hero! I need your assistance. ${activeQuest.desc}"`,
                    options: [
                        { text: 'Accept Quest', action: () => { this.currentDialog = null; } }
                    ]
                };
            } else if (activeQuest.status === 'completed') {
                this.currentDialog = {
                    text: `Eldar: "Wonderful work! You cleared the challenge. Take this gold."`,
                    options: [
                        { text: 'Complete Quest', action: () => { this.completeQuest(activeQuest); } }
                    ]
                };
            } else {
                this.currentDialog = {
                    text: `Eldar: "Your active task is: ${activeQuest.name}. Keep working on it!"`,
                    options: [
                        { text: 'Dismiss', action: () => { this.currentDialog = null; } }
                    ]
                };
            }
        } else if (npc.role === 'shop') {
            this.currentDialog = {
                text: `Merchant: "Need better steel, traveler? Select equipment."`,
                options: [
                    { text: 'Buy Silver Sword (150 Gold)', action: () => { this.buySword('Silver', 150); } },
                    { text: 'Buy Mythic Sword (450 Gold)', action: () => { this.buySword('Mythic', 450); } },
                    { text: 'Leave Shop', action: () => { this.currentDialog = null; } }
                ]
            };
        }
    }

    buySword(type, cost) {
        if (this.playerGold >= cost) {
            this.playerGold -= cost;
            this.swordType = type;
            this.sound.playPowerUp();
            this.currentDialog = null;

            this.storage.unlockAchievement('rpg_buy_item');

            if (type === 'Silver') {
                this.trackQuestProgress('q_sword', 1);
            }

            const profile = this.storage.getProfile();
            profile.stats.rpg.bestSword = type;
            this.storage.saveProfile(profile);

            if (type === 'Mythic') {
                this.storage.unlockAchievement('rpg_max_gear');
            }
        } else {
            this.currentDialog.text = 'Merchant: "Not enough gold coins, stranger!"';
        }
    }

    handleDialogInput() {
        // Checking button overlays clicks handled in main JS controller
    }

    trackQuestProgress(id, amount) {
        const quest = this.quests.find(q => q.id === id);
        if (quest && quest.status === 'available') {
            quest.progress += amount;
            if (quest.progress >= quest.target) {
                quest.progress = quest.target;
                quest.status = 'completed';
                this.sound.playQuestCompleted();
            }
        }
    }

    completeQuest(quest) {
        quest.status = 'claimed';
        this.playerGold += 200;
        this.addXp(100);
        this.score += 1500;
        this.currentDialog = null;

        const profile = this.storage.getProfile();
        profile.stats.rpg.questsCompleted = (profile.stats.rpg.questsCompleted || 0) + 1;
        this.storage.saveProfile(profile);

        this.storage.unlockAchievement('rpg_first_quest');

        // Unlock next quest in sequence
        this.activeQuestIdx++;
        if (this.activeQuestIdx < this.quests.length) {
            this.quests[this.activeQuestIdx].status = 'available';
        } else {
            this.winGame();
        }
    }

    winGame() {
        this.gameState = 'won';
        this.sound.stopMusic();
        this.sound.playQuestCompleted();
        this.storage.saveHighScore('rpg', this.score);
        this.storage.unlockAchievement('rpg_all_quests');

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'win', game: 'rpg', score: this.score } }));
    }

    gameOver() {
        this.gameState = 'gameover';
        this.sound.stopMusic();
        this.sound.playHit();
        this.storage.saveHighScore('rpg', this.score);
        
        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'gameover', game: 'rpg', score: this.score } }));
    }

    render() {
        // Clear background
        this.ctx.fillStyle = '#110c14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Camera Translate
        this.camera.applyViewport(this.ctx);

        // Draw Dungeon Floor Grid
        const rows = this.map.length;
        const cols = this.map[0].length;
        this.ctx.fillStyle = '#1c1622';
        this.ctx.strokeStyle = '#27202e';
        this.ctx.lineWidth = 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.map[r][c] !== 'W') {
                    this.ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                    this.ctx.strokeRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        // Draw chest andNPC entities
        this.engine.entities.forEach(entity => {
            if (!entity.active) return;
            const sprite = entity.getComponent(SpriteComponent);
            const trans = entity.getComponent(TransformComponent);
            if (sprite && trans) {
                this.ctx.save();
                this.ctx.translate(trans.position.x, trans.position.y);
                sprite.draw(this.ctx, trans);
                this.ctx.restore();
            }
        });

        // Draw Player (Sword swing rotation indicator)
        if (this.invulnTime <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.beginPath();
            this.ctx.arc(this.playerX + 9, this.playerY + 9, 9, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Render weapon sword arc
            if (this.isAttacking) {
                this.ctx.strokeStyle = this.swordType === 'Bronze' ? '#b55a1e' : (this.swordType === 'Silver' ? '#cbd5e1' : '#00ffff');
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(this.playerX + 9, this.playerY + 9, 22, this.attackAngle, this.attackAngle + 1.2);
                this.ctx.stroke();
            }
        }

        // Restore Camera Viewport matrix
        this.camera.restoreViewport(this.ctx);

        // Render Dialogue Text bubble Box
        if (this.currentDialog) {
            this.renderDialogBox();
        }

        // Render HUD stats
        this.renderHUD();
    }

    renderDialogBox() {
        const boxH = 120;
        this.ctx.fillStyle = 'rgba(27, 22, 35, 0.95)';
        this.ctx.strokeStyle = '#a78bfa';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(20, this.canvas.height - boxH - 20, this.canvas.width - 40, boxH);
        this.ctx.strokeRect(20, this.canvas.height - boxH - 20, this.canvas.width - 40, boxH);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px monospace';
        
        // Wrap conversation lines simply
        const words = this.currentDialog.text.split(' ');
        let line = '';
        let posY = this.canvas.height - boxH + 5;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            if (this.ctx.measureText(testLine).width > this.canvas.width - 80) {
                this.ctx.fillText(line, 40, posY);
                line = words[i] + ' ';
                posY += 15;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, 40, posY);

        // Draw Interactive Choices Options
        this.currentDialog.options.forEach((opt, idx) => {
            const yOffset = this.canvas.height - 48 + idx * 14;
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.fillText(`[Press ${idx+1}] : ${opt.text}`, 40, yOffset - 12);
        });
    }

    renderHUD() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(10, 10, 200, 72);
        this.ctx.strokeStyle = '#a78bfa';
        this.ctx.strokeRect(10, 10, 200, 72);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`HEALTH:  ${'❤️'.repeat(Math.ceil(this.playerHp / 20))} (${this.playerHp}%)`, 18, 25);
        this.ctx.fillText(`GOLD:    💰 ${this.playerGold}`, 18, 40);
        this.ctx.fillText(`LEVEL:   🌟 Lvl ${this.playerLevel} (${this.playerXp}/${this.playerLevel*120} XP)`, 18, 55);
        this.ctx.fillText(`WEAPON:  🗡️ ${this.swordType} Sword`, 18, 70);

        // Quest progress indicator
        const aq = this.quests[this.activeQuestIdx];
        if (aq) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(this.canvas.width - 250, 10, 240, 52);
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.strokeRect(this.canvas.width - 250, 10, 240, 52);

            this.ctx.fillStyle = '#fbbf24';
            this.ctx.fillText(`QUEST: ${aq.name.toUpperCase()}`, this.canvas.width - 240, 25);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(aq.desc, this.canvas.width - 240, 38);
            this.ctx.fillText(`PROGRESS: [${aq.progress}/${aq.target}] (${aq.status.toUpperCase()})`, this.canvas.width - 240, 51);
        }
    }
}
