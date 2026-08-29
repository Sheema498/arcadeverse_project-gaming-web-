/* ==========================================================================
   ArcadeVerse Game - Synth Racer (Pseudo-3D Highway Racer)
   ========================================================================== */

class SynthRacerGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.gameState = 'menu'; // menu, playing, won, gameover
        
        // Pseudo-3D Projection variables
        this.roadWidth = 2000;
        this.segmentLength = 200;
        this.cameraHeight = 1000;
        this.cameraDepth = 1 / Math.tan((60 / 2) * Math.PI / 180); // field of view focus
        
        this.playerX = 0; // -1 to 1 representing road borders
        this.playerZ = 0;
        this.speed = 0;
        this.maxSpeed = 290; // km/h
        this.accel = 2.8;
        this.breaking = -4.5;
        this.deccl = -0.9;
        
        this.position = 0; // current position along track distance
        this.trackLength = 0;
        
        this.segments = [];
        this.cars = [];
        this.scenery = []; // trees, panels

        this.lap = 1;
        this.maxLaps = 2;
        this.timeLimitSec = 90; // reach checkpoints in time
        this.gameTime = 0;
        
        this.initTrack();
    }

    initTrack() {
        this.segments = [];
        // Procedurally generate curved segments and hills
        let sectionLen = 60;
        
        // Start straight
        this.addSection(sectionLen, 0, 0);
        // Low curve left
        this.addSection(sectionLen, -3, 30);
        // Hill climb
        this.addSection(sectionLen * 1.5, 2, -40);
        // S-Curves
        this.addSection(sectionLen, 4, 0);
        this.addSection(sectionLen, -4, 20);
        // Descent
        this.addSection(sectionLen, 0, -60);
        // Speed straight finish
        this.addSection(sectionLen * 2, 0, 0);

        this.trackLength = this.segments.length * this.segmentLength;

        // Place scenic decorations randomly along margins
        this.scenery = [];
        for (let i = 2; i < this.segments.length - 10; i += 6) {
            this.scenery.push({
                segmentIdx: i,
                side: Math.random() < 0.5 ? -1.6 : 1.6,
                type: Math.random() < 0.5 ? 'tree' : 'billboard',
                color: Math.random() < 0.5 ? '#ff007f' : '#00ffff'
            });
        }
    }

    addSection(numSegments, curve, hill) {
        for (let i = 0; i < numSegments; i++) {
            this.segments.push({
                index: this.segments.length,
                p1: { world: { x: 0, y: this.lastY() || 0, z: this.segments.length * this.segmentLength }, screen: { x: 0, y: 0, w: 0 } },
                p2: { world: { x: 0, y: (this.lastY() || 0) + hill, z: (this.segments.length + 1) * this.segmentLength }, screen: { x: 0, y: 0, w: 0 } },
                curve: curve,
                color: Math.floor(this.segments.length / 3) % 2 === 0 ? { road: '#1e0c33', grass: '#050114', rum: '#ff007f' } : { road: '#150625', grass: '#03000b', rum: '#00ffff' }
            });
        }
    }

    lastY() {
        if (this.segments.length === 0) return 0;
        return this.segments[this.segments.length - 1].p2.world.y;
    }

    start() {
        this.gameState = 'playing';
        this.speed = 0;
        this.position = 0;
        this.playerX = 0;
        this.lap = 1;
        this.gameTime = 0;
        this.timeLimitSec = 90;

        // Spawn traffic cars along segments
        this.cars = [];
        for (let i = 20; i < this.segments.length - 10; i += 45) {
            this.cars.push({
                segmentIdx: i,
                offset: Math.random() * 1.4 - 0.7,
                speed: 80 + Math.random() * 80,
                color: Math.random() < 0.5 ? '#ff0033' : '#fbbf24',
                z: i * this.segmentLength
            });
        }

        this.sound.playMusic('racer');
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        this.gameTime += dt / 1000;
        this.timeLimitSec -= dt / 1000;

        if (this.timeLimitSec <= 0) {
            this.gameOver();
        }

        // 1. Player Input Speed Controls
        if (this.input.isPressed('w') || this.input.isPressed('ArrowUp')) {
            this.speed += this.accel;
            // Play procedural revving engine tone occasionally
            if (Math.random() < 0.05) this.sound.playSelect();
        } else if (this.input.isPressed('s') || this.input.isPressed('ArrowDown')) {
            this.speed += this.breaking;
        } else {
            this.speed += this.deccl;
        }

        // Steer left/right
        if (this.input.isPressed('a') || this.input.isPressed('ArrowLeft')) {
            this.playerX -= 0.035 * (this.speed / this.maxSpeed);
        } else if (this.input.isPressed('d') || this.input.isPressed('ArrowRight')) {
            this.playerX += 0.035 * (this.speed / this.maxSpeed);
        }

        // Clamping speed
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
        if (this.speed === this.maxSpeed) {
            this.storage.unlockAchievement('race_top_speed');
        }

        // Track Position
        const step = this.speed * (dt / 16); // scale step to match frame times
        this.position += step;

        // Check Lap Completion
        if (this.position >= this.trackLength) {
            this.position -= this.trackLength;
            this.lap++;
            this.sound.playQuestCompleted();
            this.timeLimitSec += 45; // reward checkpoints

            if (this.lap > this.maxLaps) {
                this.winLevel();
            } else {
                this.storage.unlockAchievement('race_first_lap');
            }
        }

        // 2. Update Traffic Cars positions along segments
        this.cars.forEach(car => {
            car.z += car.speed * (dt / 32); // slower traffic movement
            if (car.z > this.trackLength) {
                car.z -= this.trackLength;
            }

            // Player contact Collision Detection
            if (Math.abs(this.position - car.z) < 180) { // close proximity
                const carSegmentIdx = Math.floor(car.z / this.segmentLength);
                const currentSegmentIdx = Math.floor(this.position / this.segmentLength);
                
                if (Math.abs(this.playerX - car.offset) < 0.65) {
                    // Collision!
                    this.speed = 30; // drop speed
                    this.sound.playHit();
                    this.sound.playExplosion();
                    
                    const profile = this.storage.getProfile();
                    profile.stats.racer.collisions = (profile.stats.racer.collisions || 0) + 1;
                    this.storage.saveProfile(profile);
                }
            }
        });
    }

    winLevel() {
        this.gameState = 'won';
        this.sound.stopMusic();
        this.sound.playQuestCompleted();

        const score = Math.floor(this.timeLimitSec * 150 + this.speed * 2);
        this.storage.saveHighScore('racer', score);

        const profile = this.storage.getProfile();
        const best = profile.stats.racer.bestLapTime;
        const currentLapTime = this.gameTime / 2;
        if (!best || currentLapTime < best) {
            profile.stats.racer.bestLapTime = parseFloat(currentLapTime.toFixed(2));
            this.storage.saveProfile(profile);
        }

        if (currentLapTime < 90) this.storage.unlockAchievement('race_lap_90');
        if (currentLapTime < 60) this.storage.unlockAchievement('race_lap_60');

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'win', game: 'racer', score: score } }));
    }

    gameOver() {
        this.gameState = 'gameover';
        this.sound.stopMusic();
        this.sound.playHit();
        this.storage.saveHighScore('racer', 0);

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'gameover', game: 'racer', score: 0 } }));
    }

    project(p, cameraX, cameraY, cameraZ, width, height) {
        const pz = p.world.z - cameraZ;
        if (pz <= 0) return; // avoid division by zero

        const scale = this.cameraDepth / pz;
        p.screen.x = Math.round(width / 2 + scale * (p.world.x - cameraX) * (width / 2));
        p.screen.y = Math.round(height / 2 - scale * (p.world.y - cameraY) * (height / 2));
        p.screen.w = Math.round(scale * this.roadWidth * (width / 2));
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear background with Synthwave neon sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h/2);
        skyGrad.addColorStop(0, '#060112');
        skyGrad.addColorStop(1, '#ff0055');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw glowing vector grid sun
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(w/2, h/2 - 10, 64, Math.PI, 0);
        ctx.fill();

        // 3D Road Projection parameters
        const startSegmentIdx = Math.floor(this.position / this.segmentLength);
        const playerPercent = (this.position % this.segmentLength) / this.segmentLength;
        
        let dx = -(this.segments[startSegmentIdx].curve * playerPercent);
        let x = 0;

        const playerSegment = this.segments[startSegmentIdx];
        const playerProjectY = playerSegment.p1.world.y + (playerSegment.p2.world.y - playerSegment.p1.world.y) * playerPercent;
        
        const cameraZ = this.position - this.segmentLength;
        const cameraY = playerProjectY + this.cameraHeight;
        const cameraX = this.playerX * this.roadWidth;

        // Render road segments from back to front (painter's algorithm)
        const drawLimit = 90;
        let maxProjectY = h;

        for (let i = 0; i < drawLimit; i++) {
            const seg = this.segments[(startSegmentIdx + i) % this.segments.length];
            const loopZ = (startSegmentIdx + i >= this.segments.length) ? this.trackLength : 0;
            
            // Temporary offset calculations for projection positioning
            const p1 = { world: { x: seg.p1.world.x - x, y: seg.p1.world.y, z: seg.p1.world.z + loopZ }, screen: {} };
            const p2 = { world: { x: seg.p2.world.x - x - dx, y: seg.p2.world.y, z: seg.p2.world.z + loopZ }, screen: {} };

            this.project(p1, cameraX, cameraY, cameraZ, w, h);
            this.project(p2, cameraX, cameraY, cameraZ, w, h);

            x += dx;
            dx += seg.curve;

            // Frustum clipping
            if (p1.screen.y >= maxProjectY || p2.screen.y >= p1.screen.y) continue;

            this.drawRoadSegment(ctx, w, p1.screen, p2.screen, seg.color);
            maxProjectY = p1.screen.y;
        }

        // Draw scenic decorations and traffic cars
        this.renderSprites(ctx, startSegmentIdx, drawLimit, cameraX, cameraY, cameraZ, w, h);

        // Draw Player Car (Bouncing on speed)
        this.renderPlayerCar(ctx, w, h);

        // Draw HUD details
        this.renderHUD();
    }

    drawRoadSegment(ctx, width, p1, p2, color) {
        // Grass margins
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, p2.y, width, p1.y - p2.y);

        // Rumble strips
        const rumW1 = p1.w * 0.12;
        const rumW2 = p2.w * 0.12;

        ctx.fillStyle = color.rum;
        ctx.beginPath();
        ctx.moveTo(p1.x - p1.w - rumW1, p1.y);
        ctx.lineTo(p2.x - p2.w - rumW2, p2.y);
        ctx.lineTo(p2.x - p2.w, p2.y);
        ctx.lineTo(p1.x - p1.w, p1.y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p1.x + p1.w + rumW1, p1.y);
        ctx.lineTo(p2.x + p2.w + rumW2, p2.y);
        ctx.lineTo(p2.x + p2.w, p2.y);
        ctx.lineTo(p1.x + p1.w, p1.y);
        ctx.closePath();
        ctx.fill();

        // Asphalt road surface
        ctx.fillStyle = color.road;
        ctx.beginPath();
        ctx.moveTo(p1.x - p1.w, p1.y);
        ctx.lineTo(p2.x - p2.w, p2.y);
        ctx.lineTo(p2.x + p2.w, p2.y);
        ctx.lineTo(p1.x + p1.w, p1.y);
        ctx.closePath();
        ctx.fill();
    }

    renderSprites(ctx, startIdx, limit, cameraX, cameraY, cameraZ, w, h) {
        // Collect scenery and cars to render based on depth (back to front)
        const renderList = [];

        // Scenery collection
        this.scenery.forEach(s => {
            if (s.segmentIdx >= startIdx && s.segmentIdx < startIdx + limit) {
                renderList.push({
                    type: 'scenery',
                    item: s,
                    z: s.segmentIdx * this.segmentLength
                });
            }
        });

        // Traffic cars collection
        this.cars.forEach(car => {
            const currentIdx = Math.floor(car.z / this.segmentLength);
            if (currentIdx >= startIdx && currentIdx < startIdx + limit) {
                renderList.push({
                    type: 'car',
                    item: car,
                    z: car.z
                });
            }
        });

        // Sort by depth (descending Z)
        renderList.sort((a, b) => b.z - a.z);

        renderList.forEach(obj => {
            const scale = this.cameraDepth / (obj.z - cameraZ);
            if (scale <= 0) return;

            const segmentIdx = Math.floor(obj.z / this.segmentLength);
            const seg = this.segments[segmentIdx % this.segments.length];
            
            // Calculate screen projection offset coordinates
            const xOffset = obj.type === 'scenery' ? obj.item.side * this.roadWidth : obj.item.offset * this.roadWidth;
            const sx = Math.round(w / 2 + scale * (seg.p1.world.x + xOffset - cameraX) * (w / 2));
            const sy = Math.round(h / 2 - scale * (seg.p1.world.y - cameraY) * (h / 2));

            if (obj.type === 'scenery') {
                this.drawScenerySprite(ctx, sx, sy, scale, obj.item);
            } else {
                this.drawTrafficCar(ctx, sx, sy, scale, obj.item);
            }
        });
    }

    drawScenerySprite(ctx, sx, sy, scale, item) {
        const sw = 96 * scale * 10;
        const sh = 120 * scale * 10;

        ctx.fillStyle = item.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = item.color;

        if (item.type === 'tree') {
            // Draw vector triangle tree
            ctx.beginPath();
            ctx.moveTo(sx, sy - sh);
            ctx.lineTo(sx - sw/2, sy);
            ctx.lineTo(sx + sw/2, sy);
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw billboard sign
            ctx.fillRect(sx - sw/2, sy - sh, sw, sh * 0.7);
            ctx.fillStyle = '#050114';
            ctx.fillRect(sx - sw/2 + 2, sy - sh + 2, sw - 4, sh * 0.7 - 4);
            ctx.fillStyle = item.color;
            ctx.font = `${Math.round(8 * scale * 10)}px monospace`;
            ctx.fillText('NEON GRID', sx - sw/3, sy - sh * 0.6);
            ctx.fillRect(sx - 4, sy - sh * 0.3, 8, sh * 0.3); // pole
        }
        ctx.shadowBlur = 0;
    }

    drawTrafficCar(ctx, sx, sy, scale, car) {
        const cw = 110 * scale * 10;
        const ch = 64 * scale * 10;

        ctx.fillStyle = car.color;
        ctx.fillRect(sx - cw/2, sy - ch, cw, ch);
        
        // Windows
        ctx.fillStyle = '#000';
        ctx.fillRect(sx - cw/2 + 6, sy - ch + 6, cw - 12, ch * 0.4);
        
        // Brake light coordinates
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(sx - cw/2 + 4, sy - 12, cw * 0.15, 6);
        ctx.fillRect(sx + cw/2 - cw * 0.15 - 4, sy - 12, cw * 0.15, 6);
    }

    renderPlayerCar(ctx, w, h) {
        const bounce = Math.sin(performance.now() * 0.08) * (this.speed / 100) * 1.5;
        const cw = 160;
        const ch = 80;
        const cx = w / 2 - cw / 2;
        const cy = h - ch - 40 + bounce;

        ctx.fillStyle = '#bd00ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';

        // Custom bumper coordinates
        ctx.beginPath();
        ctx.moveTo(cx, cy + ch);
        ctx.lineTo(cx - 20, cy + ch - 35);
        ctx.lineTo(cx + 10, cy);
        ctx.lineTo(cx + cw - 10, cy);
        ctx.lineTo(cx + cw + 20, cy + ch - 35);
        ctx.lineTo(cx + cw, cy + ch);
        ctx.closePath();
        ctx.fill();

        // Glowing wheels
        ctx.fillStyle = '#050114';
        ctx.fillRect(cx - 16, cy + ch - 24, 18, 22);
        ctx.fillRect(cx + cw - 2, cy + ch - 24, 18, 22);

        // Rear window
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy + 10);
        ctx.lineTo(cx + cw - 20, cy + 10);
        ctx.lineTo(cx + cw - 30, cy + 38);
        ctx.lineTo(cx + 30, cy + 38);
        ctx.closePath();
        ctx.fill();

        // Neon spoiler wing
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(cx - 15, cy - 8, cw + 30, 8);
        ctx.fillRect(cx - 10, cy, 8, 12);
        ctx.fillRect(cx + cw + 2, cy, 8, 12);

        // Red taillights
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(cx + 8, cy + 50, 24, 8);
        ctx.fillRect(cx + cw - 32, cy + 50, 24, 8);

        ctx.shadowBlur = 0;
    }

    renderHUD() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(10, 10, 180, 56);
        this.ctx.strokeStyle = '#bd00ff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 180, 56);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`SPEED: ${Math.round(this.speed)} km/h`, 18, 25);
        this.ctx.fillText(`TIME:  ${this.timeLimitSec.toFixed(1)}s`, 18, 38);
        this.ctx.fillText(`LAP:   ${this.lap}/${this.maxLaps}`, 18, 51);
    }
}
