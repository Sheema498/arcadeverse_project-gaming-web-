/* ==========================================================================
   ArcadeVerse Game - Retro Knight (2D Sidescrolling Platformer)
   ========================================================================== */

class RetroKnightGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.tileSize = 32;
        this.gravity = 0.4;
        this.engine = new ECS_Engine();
        this.camera = new Camera2D(0, 0, canvas.width, canvas.height);

        this.score = 0;
        this.coins = 0;
        this.deaths = 0;
        this.levelIndex = 0;
        this.gameState = 'menu'; // menu, playing, paused, gameover, win
        
        this.player = null;
        this.levelWidth = 0;
        this.levelHeight = 0;
        
        // Define levels. We'll support loaded catalog data or a default grid.
        this.levels = [];
        this.initLevels();
    }

    initLevels() {
        // Retrieve extended levels if present in window.ArcadeData
        if (window.ArcadeData && window.ArcadeData.platformerLevels) {
            this.levels = window.ArcadeData.platformerLevels;
            return;
        }

        // Fallback default levels if data_expansion.js hasn't loaded yet
        this.levels = [
            // Level 1: Simple introductory zone
            {
                grid: [
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "        C  C  C                                             ",
                    "       ########                     C C C                   ",
                    "      #        #                   #######                  ",
                    "     #          #        C   C                               ",
                    "    #            #      #######               ##            ",
                    "   #   S   E      #                          ####           ",
                    "  #################################   #######Exit###########"
                ],
                bg: '#1a0833'
            },
            // Level 2: Spikes and vertical platform shifts
            {
                grid: [
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "                                                            ",
                    "             C C                                            ",
                    "            #####                                           ",
                    "                                                            ",
                    "         #         #     C C C C                            ",
                    "        ###       ###   #########                           ",
                    "       #####                                                ",
                    "      #######                                      ###      ",
                    "   S                                       C C    #####     ",
                    "  ######^^^^^#####^^^^^###########^^^^^^##########Exit######"
                ],
                bg: '#25081b'
            }
        ];
    }

    start(levelIdx = 0) {
        this.levelIndex = levelIdx;
        this.engine = new ECS_Engine();
        this.score = 0;
        this.coins = 0;
        this.gameState = 'playing';

        const currentLvl = this.levels[this.levelIndex];
        this.levelHeight = currentLvl.grid.length * this.tileSize;
        this.levelWidth = currentLvl.grid[0].length * this.tileSize;
        this.camera.setBounds(0, 0, this.levelWidth, this.levelHeight);

        this.loadGrid(currentLvl.grid);
        this.sound.playMusic('platformer');
    }

    loadGrid(grid) {
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                const char = grid[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                switch(char) {
                    case '#': // Solid Ground
                        this.createTile(x, y, '#4b188c', true);
                        break;
                    case '^': // Danger Spike
                        this.createSpike(x, y);
                        break;
                    case 'C': // Gold Coin
                        this.createCoin(x, y);
                        break;
                    case 'E': // Enemy creature
                        this.createEnemy(x, y);
                        break;
                    case 'S': // Start position
                        this.createPlayer(x, y);
                        break;
                    case 'x': // Exit door
                    case 'E' && grid[r][c] === 'x':
                    case 'i':
                    case 't':
                        // Exit door trigger logic
                        break;
                }
                
                // Secondary check for text word exits
                if (grid[r].substr(c, 4) === 'Exit') {
                    this.createExit(x, y);
                }
            }
        }

        // If player wasn't placed, place it safely
        if (!this.player) {
            this.createPlayer(this.tileSize * 2, this.levelHeight - this.tileSize * 3);
        }
    }

    createTile(x, y, color, isSolid) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y, this.tileSize, this.tileSize));
        e.addComponent(new SpriteComponent(color, (ctx, transform) => {
            // Procedural grid drawing for brick look
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, transform.width, transform.height);
            ctx.strokeStyle = '#22084c';
            ctx.strokeRect(0, 0, transform.width, transform.height);
            // Highlights
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(0, 0, transform.width, 4);
            ctx.fillRect(0, 0, 4, transform.height);
        }));
        if (isSolid) {
            e.addComponent(new ColliderComponent());
        }
        e.type = 'tile';
        return e;
    }

    createSpike(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y + 16, this.tileSize, 16));
        e.addComponent(new SpriteComponent('#ff0055', (ctx, transform) => {
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.moveTo(0, transform.height);
            ctx.lineTo(transform.width / 2, 0);
            ctx.lineTo(transform.width, transform.height);
            ctx.closePath();
            ctx.fill();
        }));
        e.addComponent(new ColliderComponent(true));
        e.type = 'spike';
        return e;
    }

    createCoin(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x + 8, y + 8, 16, 16));
        
        let frame = 0;
        e.addComponent(new SpriteComponent('#ffd700', (ctx, transform) => {
            frame = (frame + 1) % 60;
            const w = transform.width * Math.abs(Math.sin(frame * 0.1));
            const offset = (transform.width - w) / 2;
            
            ctx.fillStyle = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(offset + w/2, transform.height/2, w/2, transform.height/2, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }));
        e.addComponent(new ColliderComponent(true));
        e.type = 'coin';
        return e;
    }

    createExit(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y - this.tileSize, this.tileSize * 2, this.tileSize * 2));
        e.addComponent(new SpriteComponent('#00ffcc', (ctx, transform) => {
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffcc';
            ctx.strokeRect(4, 4, transform.width - 8, transform.height - 8);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
            ctx.fillRect(4, 4, transform.width - 8, transform.height - 8);
            ctx.shadowBlur = 0;
            
            // Text indicator
            ctx.fillStyle = '#00ffcc';
            ctx.font = '8px monospace';
            ctx.fillText('EXIT PORTAL', 12, transform.height / 2 + 3);
        }));
        e.addComponent(new ColliderComponent(true));
        e.type = 'exit';
        return e;
    }

    createEnemy(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y, 28, 28));
        e.addComponent(new PhysicsBodyComponent());
        e.getComponent(PhysicsBodyComponent).maxVelocity.set(2, 6);
        e.addComponent(new SpriteComponent('#ff0033', (ctx, transform) => {
            // Draw patroller slime
            ctx.fillStyle = '#ff0033';
            ctx.beginPath();
            ctx.arc(transform.width / 2, transform.height - 8, 12, Math.PI, 0, false);
            ctx.ellipse(transform.width / 2, transform.height - 8, 12, 8, 0, 0, Math.PI);
            ctx.fill();
            
            // Angry eye indicators
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(6, 12, 4, 4);
            ctx.fillRect(16, 12, 4, 4);
            ctx.fillStyle = '#000000';
            ctx.fillRect(7, 13, 2, 2);
            ctx.fillRect(17, 13, 2, 2);
        }));
        
        let moveTimer = 0;
        let direction = 1;
        e.addComponent(new ScriptComponent({
            update: (entity, dt) => {
                const body = entity.getComponent(PhysicsBodyComponent);
                moveTimer += dt;
                if (moveTimer > 1500) {
                    direction *= -1;
                    moveTimer = 0;
                }
                body.velocity.x = direction * 1.2;
            }
        }));
        
        e.addComponent(new ColliderComponent());
        e.type = 'enemy';
        return e;
    }

    createPlayer(x, y) {
        const e = this.engine.createEntity();
        e.addComponent(new TransformComponent(x, y, 24, 30));
        e.addComponent(new PhysicsBodyComponent());
        
        const body = e.getComponent(PhysicsBodyComponent);
        body.maxVelocity.set(5, 11);
        
        // Procedural Sprite for Knight
        let frameCount = 0;
        e.addComponent(new SpriteComponent('#00ffff', (ctx, transform) => {
            frameCount++;
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00ffff';
            
            // Draw helmet visor
            ctx.fillRect(2, 0, transform.width - 4, 10);
            ctx.fillStyle = '#000';
            ctx.fillRect(4, 3, transform.width - 8, 3);
            ctx.fillStyle = '#ff0055'; // glowing eye
            ctx.fillRect(8, 4, 2, 2);

            // Armor body
            ctx.fillStyle = '#00cccc';
            ctx.fillRect(0, 10, transform.width, 14);

            // Animated legs based on movement speed
            ctx.fillStyle = '#008888';
            const moving = Math.abs(body.velocity.x) > 0.15;
            const legOffset = moving ? Math.sin(frameCount * 0.2) * 4 : 0;
            ctx.fillRect(3, 24, 6, 6 + legOffset);
            ctx.fillRect(transform.width - 9, 24, 6, 6 - legOffset);
            
            ctx.shadowBlur = 0;
        }));

        // Knight controls and movement script
        e.addComponent(new ScriptComponent({
            update: (entity, dt) => {
                const trans = entity.getComponent(TransformComponent);
                const phys = entity.getComponent(PhysicsBodyComponent);

                // Horizontal movement
                if (this.input.isPressed('a') || this.input.isPressed('ArrowLeft')) {
                    phys.velocity.x -= 0.6;
                } else if (this.input.isPressed('d') || this.input.isPressed('ArrowRight')) {
                    phys.velocity.x += 0.6;
                }

                // Jumping
                if ((this.input.isPressed('w') || this.input.isPressed('ArrowUp') || this.input.isPressed('Space')) && phys.isGrounded) {
                    phys.velocity.y = -10.5;
                    phys.isGrounded = false;
                    this.sound.playJump();
                    this.engine.particleSystem.spawnExplosion(trans.position.x + trans.width/2, trans.position.y + trans.height, '#00ffff', 6, 3, 20);
                }

                // Check falling below stage limits
                if (trans.position.y > this.levelHeight + 100) {
                    this.die();
                }
            }
        }));

        e.addComponent(new ColliderComponent());
        e.type = 'player';
        this.player = e;
        this.camera.setTarget(e.getComponent(TransformComponent));
    }

    die() {
        this.deaths++;
        this.sound.playHit();
        this.sound.playExplosion();
        
        // Save stats local state
        const profile = this.storage.getProfile();
        profile.stats.platformer.deaths = (profile.stats.platformer.deaths || 0) + 1;
        this.storage.saveProfile(profile);

        // Respawn particle burst
        const playerTrans = this.player.getComponent(TransformComponent);
        this.engine.particleSystem.spawnExplosion(playerTrans.position.x + 12, playerTrans.position.y + 15, '#00ffff', 25, 6, 45);

        this.player.active = false;
        
        setTimeout(() => {
            const currentLvl = this.levels[this.levelIndex];
            this.loadGrid(currentLvl.grid);
        }, 1000);
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        // Custom engine updates
        this.engine.update(dt);
        this.camera.update();

        // 1. Solve Platformer custom tile grids colliders manually for player speed & precision
        this.solveCollisions();
    }

    solveCollisions() {
        const playerTrans = this.player.getComponent(TransformComponent);
        const playerPhys = this.player.getComponent(PhysicsBodyComponent);
        if (!playerTrans || !playerPhys) return;

        playerPhys.isGrounded = false;
        
        // Retrieve colliders and triggers from ECS
        const playerBounds = playerTrans.copy();
        
        this.engine.entities.forEach(entity => {
            if (entity.id === this.player.id || !entity.active) return;

            const trans = entity.getComponent(TransformComponent);
            if (!trans) return;

            // Simple distance check to avoid heavy queries
            if (playerTrans.position.dist(trans.position) > 80) return;

            if (entity.type === 'tile') {
                // Check axis intersections (AABB resolution)
                if (this.checkAABB(playerTrans, trans)) {
                    this.resolveAABBTile(playerTrans, playerPhys, trans);
                }
            } else if (entity.type === 'spike') {
                if (this.checkAABB(playerTrans, trans)) {
                    this.die();
                }
            } else if (entity.type === 'coin') {
                if (this.checkAABB(playerTrans, trans)) {
                    entity.active = false;
                    this.coins++;
                    this.score += 100;
                    this.sound.playCoin();
                    
                    const profile = this.storage.getProfile();
                    profile.stats.platformer.coinsCollected = (profile.stats.platformer.coinsCollected || 0) + 1;
                    this.storage.saveProfile(profile);

                    if (this.coins >= 10) this.storage.unlockAchievement('plat_coin_10');
                    if (this.coins >= 50) this.storage.unlockAchievement('plat_coin_50');

                    // Sparkle particles
                    this.engine.particleSystem.spawnExplosion(trans.position.x + 8, trans.position.y + 8, '#ffd700', 8, 3, 25);
                }
            } else if (entity.type === 'enemy') {
                if (this.checkAABB(playerTrans, trans)) {
                    // Check if player lands on top of slime (y-velocity > 0 and player above enemy)
                    const pBottom = playerTrans.position.y + playerTrans.height;
                    if (playerPhys.velocity.y > 0 && pBottom - playerPhys.velocity.y <= trans.position.y + 8) {
                        entity.active = false;
                        playerPhys.velocity.y = -8; // Bounce knight
                        this.sound.playHit();
                        this.score += 200;

                        const profile = this.storage.getProfile();
                        profile.stats.platformer.enemiesDefeated = (profile.stats.platformer.enemiesDefeated || 0) + 1;
                        this.storage.saveProfile(profile);

                        this.storage.unlockAchievement('plat_kill_1');

                        this.engine.particleSystem.spawnExplosion(trans.position.x + 14, trans.position.y + 14, '#ff0033', 12, 4, 30);
                    } else {
                        this.die();
                    }
                }
            } else if (entity.type === 'exit') {
                if (this.checkAABB(playerTrans, trans)) {
                    this.winLevel();
                }
            }
        });
    }

    checkAABB(t1, t2) {
        return (
            t1.position.x < t2.position.x + t2.width &&
            t1.position.x + t1.width > t2.position.x &&
            t1.position.y < t2.position.y + t2.height &&
            t1.position.y + t1.height > t2.position.y
        );
    }

    resolveAABBTile(pTrans, pPhys, tileTrans) {
        // Calculate overlap on x and y axes
        const px = (pTrans.position.x + pTrans.width / 2) - (tileTrans.position.x + tileTrans.width / 2);
        const py = (pTrans.position.y + pTrans.height / 2) - (tileTrans.position.y + tileTrans.height / 2);

        const halfWidths = (pTrans.width + tileTrans.width) / 2;
        const halfHeights = (pTrans.height + tileTrans.height) / 2;

        const ox = halfWidths - Math.abs(px);
        const oy = halfHeights - Math.abs(py);

        // Resolve along axis of minimum penetration
        if (ox < oy) {
            if (px > 0) {
                pTrans.position.x += ox;
            } else {
                pTrans.position.x -= ox;
            }
            pPhys.velocity.x = 0;
        } else {
            if (py > 0) {
                pTrans.position.y += oy;
                pPhys.velocity.y = 0.1; // slow fall check
            } else {
                pTrans.position.y -= oy;
                pPhys.velocity.y = 0;
                pPhys.isGrounded = true;
            }
        }
    }

    winLevel() {
        this.gameState = 'won';
        this.sound.stopMusic();
        this.sound.playQuestCompleted();
        
        // Save score states
        this.storage.saveHighScore('platformer', this.score);
        this.storage.unlockAchievement('plat_clear_1');
        
        if (this.levelIndex === this.levels.length - 1) {
            this.storage.unlockAchievement('plat_clear_all');
        }

        // Trigger custom screen overlays handler via window events
        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'win', game: 'platformer', score: this.score } }));
    }

    render() {
        // Clear background with level background color
        const currentLvl = this.levels[this.levelIndex];
        this.ctx.fillStyle = currentLvl.bg || '#1a0833';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw parallax sky/stars background
        this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 40; i++) {
            const starX = (i * 97 + this.camera.position.x * 0.1) % this.canvas.width;
            const starY = (i * 123) % this.canvas.height;
            this.ctx.fillRect(starX, starY, 2, 2);
        }

        // Apply camera perspective viewport matrix
        this.camera.applyViewport(this.ctx);

        // Render solid level tiles, spikes, enemies
        this.engine.entities.forEach(entity => {
            if (!entity.active) return;
            const sprite = entity.getComponent(SpriteComponent);
            const trans = entity.getComponent(TransformComponent);
            if (sprite && trans) {
                // Perform quick frustum culling
                if (trans.position.x + trans.width < this.camera.position.x ||
                    trans.position.x > this.camera.position.x + this.canvas.width ||
                    trans.position.y + trans.height < this.camera.position.y ||
                    trans.position.y > this.camera.position.y + this.canvas.height) {
                    return;
                }
                
                this.ctx.save();
                this.ctx.translate(trans.position.x, trans.position.y);
                sprite.draw(this.ctx, trans);
                this.ctx.restore();
            }
        });

        // Update & Render particle engine sparks
        this.engine.particleSystem.render(this.ctx);

        this.camera.restoreViewport(this.ctx);

        // Draw HUD details (Score, Coins, Health)
        this.renderHUD();
    }

    renderHUD() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, 10, 180, 56);
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 180, 56);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`SCORE: ${this.score}`, 18, 25);
        this.ctx.fillText(`COINS: ${this.coins}`, 18, 38);
        this.ctx.fillText(`DEATHS: ${this.deaths}`, 18, 51);

        this.ctx.fillText(`LVL: ${this.levelIndex + 1}/${this.levels.length}`, this.canvas.width - 80, 25);
    }
}
