/* ==========================================================================
   ArcadeVerse Game - Block Cascade (Glowing Grid Block Puzzle)
   ========================================================================== */

class BlockCascadeGame {
    constructor(canvas, input, sound, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = input;
        this.sound = sound;
        this.storage = storage;

        this.gameState = 'menu'; // menu, playing, won, gameover
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.combo = 0;

        this.cols = 10;
        this.rows = 20;
        this.blockSize = 24; // block size in px on screen

        this.board = [];
        this.initBoard();

        this.shapes = {
            I: { matrix: [[1,1,1,1]], color: '#00ffff' },
            O: { matrix: [[1,1],[1,1]], color: '#ffff00' },
            T: { matrix: [[0,1,0],[1,1,1]], color: '#bd00ff' },
            S: { matrix: [[0,1,1],[1,1,0]], color: '#39ff14' },
            Z: { matrix: [[1,1,0],[0,1,1]], color: '#ff3131' },
            J: { matrix: [[1,0,0],[1,1,1]], color: '#2563eb' },
            L: { matrix: [[0,0,1],[1,1,1]], color: '#ea580c' }
        };

        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.hasHeldThisTurn = false;

        this.dropTimer = 0;
        this.dropInterval = 800; // ms per drop (speeds up on higher levels)
        this.inputCooldown = 0;
        this.particles = [];
    }

    initBoard() {
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = null;
            }
        }
    }

    start() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.combo = 0;
        this.dropInterval = 800;
        this.dropTimer = 0;
        this.holdPiece = null;
        this.hasHeldThisTurn = false;
        
        this.initBoard();
        this.nextPiece = this.spawnRandomPiece();
        this.spawnNewPiece();

        this.sound.playMusic('puzzle');
    }

    spawnRandomPiece() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        const shapeInfo = this.shapes[chosen];

        return {
            type: chosen,
            matrix: JSON.parse(JSON.stringify(shapeInfo.matrix)),
            color: shapeInfo.color,
            x: Math.floor((this.cols - shapeInfo.matrix[0].length) / 2),
            y: 0
        };
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.spawnRandomPiece();
        this.hasHeldThisTurn = false;

        // Check spawn collisions (Game Over state trigger)
        if (this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }

    holdCurrentPiece() {
        if (this.hasHeldThisTurn) return;

        this.sound.playSelect();
        const nextHold = {
            type: this.currentPiece.type,
            matrix: JSON.parse(JSON.stringify(this.shapes[this.currentPiece.type].matrix)),
            color: this.shapes[this.currentPiece.type].color,
            x: 0,
            y: 0
        };

        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = nextHold;
            this.currentPiece = temp;
            this.currentPiece.x = Math.floor((this.cols - this.currentPiece.matrix[0].length) / 2);
            this.currentPiece.y = 0;
        } else {
            this.holdPiece = nextHold;
            this.spawnNewPiece();
        }

        this.hasHeldThisTurn = true;
    }

    update(dt) {
        if (this.gameState !== 'playing') return;

        this.dropTimer += dt;
        if (this.inputCooldown > 0) this.inputCooldown -= dt;

        // 1. Solve User Input Movements
        this.handlePlayerInput();

        // 2. Continuous Gravity Drops
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            this.dropPiece();
        }

        // 3. Update line clear spark particles
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

    handlePlayerInput() {
        if (this.inputCooldown > 0) return;

        let moved = false;
        // Move Left
        if (this.input.isPressed('a') || this.input.isPressed('ArrowLeft')) {
            if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y)) {
                this.currentPiece.x--;
                moved = true;
            }
        }
        // Move Right
        else if (this.input.isPressed('d') || this.input.isPressed('ArrowRight')) {
            if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y)) {
                this.currentPiece.x++;
                moved = true;
            }
        }
        // Fast Drop
        else if (this.input.isPressed('s') || this.input.isPressed('ArrowDown')) {
            this.dropPiece();
            moved = true;
        }
        // Rotate (W key or Up Arrow)
        else if (this.input.isPressed('w') || this.input.isPressed('ArrowUp')) {
            this.rotatePiece();
            moved = true;
        }
        // Hold Piece (Shift key or C key)
        else if (this.input.isPressed('Shift') || this.input.isPressed('c')) {
            this.holdCurrentPiece();
            moved = true;
        }
        // Instant Hard Drop (Space)
        else if (this.input.isPressed('Space')) {
            this.hardDrop();
            moved = true;
        }

        if (moved) {
            this.inputCooldown = 110; // input delay interval
        }
    }

    dropPiece() {
        if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
        } else {
            // Lock piece on board
            this.lockPiece();
        }
    }

    hardDrop() {
        while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.score += 2; // soft drop points
        }
        this.lockPiece();
    }

    rotatePiece() {
        const m = this.currentPiece.matrix;
        const n = m.length;
        const m2 = m[0].length;
        
        // Transpose and reverse rows (clockwise rotation matrix)
        const nextMatrix = [];
        for (let c = 0; c < m2; c++) {
            nextMatrix[c] = [];
            for (let r = 0; r < n; r++) {
                nextMatrix[c][r] = m[n - 1 - r][c];
            }
        }

        // Check if rotated matrix collides, attempt side wall kicks
        let originalX = this.currentPiece.x;
        let kicked = false;

        for (let kickOffset of [0, -1, 1, -2, 2]) {
            if (!this.checkCollision(nextMatrix, originalX + kickOffset, this.currentPiece.y)) {
                this.currentPiece.matrix = nextMatrix;
                this.currentPiece.x = originalX + kickOffset;
                kicked = true;
                this.sound.playSelect();
                break;
            }
        }
    }

    checkCollision(matrix, px, py) {
        const n = matrix.length;
        const m = matrix[0].length;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < m; c++) {
                if (matrix[r][c] !== 0) {
                    const boardX = px + c;
                    const boardY = py + r;

                    // Bounds walls
                    if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
                        return true;
                    }

                    // Check board colliders (excluding offscreen sky area)
                    if (boardY >= 0 && this.board[boardY][boardX] !== null) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        const m = this.currentPiece.matrix;
        const n = m.length;
        const m2 = m[0].length;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < m2; c++) {
                if (m[r][c] !== 0) {
                    const boardY = this.currentPiece.y + r;
                    const boardX = this.currentPiece.x + c;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        this.sound.playHit();
        this.clearFullLines();
        this.spawnNewPiece();
    }

    clearFullLines() {
        let cleared = 0;
        
        for (let r = this.rows - 1; r >= 0; r--) {
            let rowFull = true;
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === null) {
                    rowFull = false;
                    break;
                }
            }

            if (rowFull) {
                // Clear row animation particles spawn
                for (let c = 0; c < this.cols; c++) {
                    const color = this.board[r][c];
                    this.spawnParticles(c * this.blockSize + this.blockSize/2, r * this.blockSize + this.blockSize/2, color, 4);
                }
                
                this.board.splice(r, 1);
                // Insert new empty row at top
                const newRow = [];
                for (let i = 0; i < this.cols; i++) newRow[i] = null;
                this.board.unshift(newRow);
                
                cleared++;
                r++; // shift indexing index back
            }
        }

        if (cleared > 0) {
            this.linesCleared += cleared;
            this.combo++;
            
            // Traditional scoring scale
            let pointsGained = 0;
            if (cleared === 1) pointsGained = 100 * this.level;
            else if (cleared === 2) pointsGained = 300 * this.level;
            else if (cleared === 3) pointsGained = 500 * this.level;
            else if (cleared === 4) {
                pointsGained = 800 * this.level;
                this.storage.unlockAchievement('puz_tetris');
                
                const profile = this.storage.getProfile();
                profile.stats.puzzle.tetrisesCleared = (profile.stats.puzzle.tetrisesCleared || 0) + 1;
                this.storage.saveProfile(profile);
            }

            // Apply combo multiplier
            if (this.combo > 1) {
                pointsGained *= (1 + this.combo * 0.1);
            }

            this.score += Math.floor(pointsGained);
            this.sound.playQuestCompleted();

            // Track stats profiles
            const profile = this.storage.getProfile();
            profile.stats.puzzle.linesCleared = (profile.stats.puzzle.linesCleared || 0) + cleared;
            profile.stats.puzzle.maxCombo = Math.max(profile.stats.puzzle.maxCombo || 0, this.combo);
            this.storage.saveProfile(profile);

            // Check Achievements
            if (this.linesCleared >= 10) this.storage.unlockAchievement('puz_lines_10');
            if (this.linesCleared >= 50) this.storage.unlockAchievement('puz_lines_50');
            if (this.combo >= 3) this.storage.unlockAchievement('puz_combo_3');
            if (this.combo >= 6) this.storage.unlockAchievement('puz_combo_6');

            // Level adjustments
            this.level = Math.floor(this.linesCleared / 10) + 1;
            this.dropInterval = Math.max(100, 800 - (this.level - 1) * 75);
            
            if (this.level >= 10) {
                this.storage.unlockAchievement('puz_level_10');
            }

            this.storage.unlockAchievement('puz_first_line');
        } else {
            this.combo = 0; // reset combo multiplier
        }
    }

    getShadowY() {
        let shadowY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, shadowY + 1)) {
            shadowY++;
        }
        return shadowY;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sp = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * sp,
                vy: Math.sin(angle) * sp,
                color: color,
                alpha: 1.0
            });
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        this.sound.stopMusic();
        this.sound.playHit();
        this.storage.saveHighScore('puzzle', this.score);

        window.dispatchEvent(new CustomEvent('game_state_changed', { detail: { state: 'gameover', game: 'puzzle', score: this.score } }));
    }

    winLevel() {
        // Infinite puzzle mode by default. Stop only on block limit gameover.
    }

    render() {
        // Clear background
        this.ctx.fillStyle = '#0f0514';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Center Board framing dimensions
        const boardW = this.cols * this.blockSize;
        const boardH = this.rows * this.blockSize;
        const bx = (this.canvas.width - boardW) / 2;
        const by = (this.canvas.height - boardH) / 2;

        // Draw Board Background grid
        this.ctx.fillStyle = '#08010c';
        this.ctx.fillRect(bx, by, boardW, boardH);
        this.ctx.strokeStyle = '#3d1654';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bx - 2, by - 2, boardW + 4, boardH + 4);

        // Light background horizontal grid lines
        this.ctx.strokeStyle = 'rgba(61, 22, 84, 0.2)';
        this.ctx.lineWidth = 1;
        for (let c = 0; c < this.cols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(bx + c * this.blockSize, by);
            this.ctx.lineTo(bx + c * this.blockSize, by + boardH);
            this.ctx.stroke();
        }
        for (let r = 0; r < this.rows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(bx, by + r * this.blockSize);
            this.ctx.lineTo(bx + boardW, by + r * this.blockSize);
            this.ctx.stroke();
        }

        // Draw Locked board blocks
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== null) {
                    this.drawBlock(bx + c * this.blockSize, by + r * this.blockSize, this.board[r][c]);
                }
            }
        }

        // Draw Current falling block and shadow indicator
        if (this.currentPiece && this.gameState === 'playing') {
            // Draw Shadow piece guide
            const shadowY = this.getShadowY();
            this.ctx.globalAlpha = 0.22;
            const m = this.currentPiece.matrix;
            for (let r = 0; r < m.length; r++) {
                for (let c = 0; c < m[r].length; c++) {
                    if (m[r][c] !== 0) {
                        this.drawBlock(
                            bx + (this.currentPiece.x + c) * this.blockSize,
                            by + (shadowY + r) * this.blockSize,
                            this.currentPiece.color
                        );
                    }
                }
            }
            this.ctx.globalAlpha = 1.0;

            // Draw Real block
            for (let r = 0; r < m.length; r++) {
                for (let c = 0; c < m[r].length; c++) {
                    if (m[r][c] !== 0) {
                        const cellY = this.currentPiece.y + r;
                        if (cellY >= 0) {
                            this.drawBlock(
                                bx + (this.currentPiece.x + c) * this.blockSize,
                                by + cellY * this.blockSize,
                                this.currentPiece.color
                            );
                        }
                    }
                }
            }
        }

        // Draw particles clearing animation
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(bx + p.x, by + p.y, 4, 4);
            this.ctx.restore();
        });

        // Draw Side Panel Information: Next, Hold
        this.renderSidePanels(bx, by, boardW);

        // Draw HUD details
        this.renderHUD();
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = color;
        this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
        this.ctx.shadowBlur = 0;
        
        // Inner lighting shine
        this.ctx.fillStyle = 'rgba(255,255,255,0.22)';
        this.ctx.fillRect(x + 2, y + 2, this.blockSize - 4, 3);
        this.ctx.fillRect(x + 2, y + 2, 3, this.blockSize - 4);
    }

    renderSidePanels(bx, by, boardW) {
        const ctx = this.ctx;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#fff';

        // 1. Next Piece Panel (Right side)
        const npx = bx + boardW + 20;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(npx, by, 72, 72);
        ctx.strokeStyle = '#bd00ff';
        ctx.strokeRect(npx, by, 72, 72);
        ctx.fillStyle = '#bd00ff';
        ctx.fillText('NEXT', npx + 8, by - 6);

        if (this.nextPiece) {
            const m = this.nextPiece.matrix;
            const offX = (72 - m[0].length * 16) / 2;
            const offY = (72 - m.length * 16) / 2;
            ctx.save();
            ctx.scale(16 / this.blockSize, 16 / this.blockSize); // scale block drawings down
            for (let r = 0; r < m.length; r++) {
                for (let c = 0; c < m[r].length; c++) {
                    if (m[r][c] !== 0) {
                        this.drawBlock(
                            (npx + offX + c * 16) * (this.blockSize / 16),
                            (by + offY + r * 16) * (this.blockSize / 16),
                            this.nextPiece.color
                        );
                    }
                }
            }
            ctx.restore();
        }

        // 2. Hold Piece Panel (Left side)
        const hpx = bx - 92;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(hpx, by, 72, 72);
        ctx.strokeStyle = '#39ff14';
        ctx.strokeRect(hpx, by, 72, 72);
        ctx.fillStyle = '#39ff14';
        ctx.fillText('HOLD', hpx + 8, by - 6);

        if (this.holdPiece) {
            const m = this.holdPiece.matrix;
            const offX = (72 - m[0].length * 16) / 2;
            const offY = (72 - m.length * 16) / 2;
            ctx.save();
            ctx.scale(16 / this.blockSize, 16 / this.blockSize);
            for (let r = 0; r < m.length; r++) {
                for (let c = 0; c < m[r].length; c++) {
                    if (m[r][c] !== 0) {
                        this.drawBlock(
                            (hpx + offX + c * 16) * (this.blockSize / 16),
                            (by + offY + r * 16) * (this.blockSize / 16),
                            this.holdPiece.color
                        );
                    }
                }
            }
            ctx.restore();
        }
    }

    renderHUD() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(10, 10, 180, 56);
        this.ctx.strokeStyle = '#39ff14';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 180, 56);

        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`SCORE: ${this.score}`, 18, 25);
        this.ctx.fillText(`LEVEL: ${this.level}`, 18, 38);
        this.ctx.fillText(`LINES: ${this.linesCleared}`, 18, 51);
    }
}
