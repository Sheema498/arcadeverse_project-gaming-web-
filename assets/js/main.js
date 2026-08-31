/* ==========================================================================
   ArcadeVerse Main Orchestrator and UI Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Setup & Initializations
    StorageEngine.getProfile(); // Ensure profile exists
    StorageEngine.initLeaderboard(); // Ensure fake opponents generated

    // App Wide Theme Control
    const currentTheme = StorageEngine.get('theme', 'cyberpunk');
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Initial Avatar Drawing
    drawGlobalAvatars();

    // 2. Setup Page Routing Checks
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'index.html' || page === '') {
        initDashboardPage();
    } else if (page === 'games.html') {
        initGamesRoomPage();
    } else if (page === 'profile.html') {
        initProfilePage();
    } else if (page === 'leaderboard.html') {
        initLeaderboardPage();
    } else if (page === 'docs.html') {
        initDocsPage();
    }

    // 3. Setup Navbar Navigation toggle on mobile
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // 4. Setup Theme Selector dropdown toggle
    const themeBtn = document.getElementById('themeBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    if (themeBtn && themeDropdown) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('show');
        });

        document.querySelectorAll('.theme-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                const selTheme = opt.getAttribute('data-theme');
                document.documentElement.setAttribute('data-theme', selTheme);
                StorageEngine.set('theme', selTheme);
                themeDropdown.classList.remove('show');
                
                // Redraw procedural avatars to match new palette theme
                drawGlobalAvatars();
            });
        });

        window.addEventListener('click', () => {
            themeDropdown.classList.remove('show');
        });
    }

    // 5. Global Audio FAB trigger mute
    const fabAudioToggle = document.getElementById('fabAudioToggle');
    if (fabAudioToggle) {
        // Init icon representation
        fabAudioToggle.querySelector('.audio-icon').textContent = SoundEngine.isMuted() ? '🔇' : '🔊';

        fabAudioToggle.addEventListener('click', () => {
            const isMuted = SoundEngine.toggleMute();
            fabAudioToggle.querySelector('.audio-icon').textContent = isMuted ? '🔇' : '🔊';
        });
    }
});

// --- Avatar Generation Utility (Procedural 8x8 Symmetry Grid) ---
function drawProceduralAvatar(canvas, seed = 12345, colorTheme = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = 8;
    const pixelWidth = canvas.width / size;

    // Standard color palettes based on theme index selection
    const palettes = [
        ['#00ffff', '#bd00ff', '#ff007f'], // Cyberpunk
        ['#39ff14', '#00aa00', '#ffffff'], // Retro
        ['#ffd319', '#ff2975', '#8c1eff'], // Synthwave
        ['#38bdf8', '#6366f1', '#a78bfa'], // Dark
        ['#2563eb', '#7c3aed', '#ea580c']  // Light
    ];
    const colors = palettes[colorTheme % palettes.length];

    // Seeded random helper
    let s = seed;
    const rand = () => {
        const x = Math.sin(s++) * 10000;
        return x - Math.floor(x);
    };

    // Build left 4 columns, copy symmetrically to right 4 columns
    const grid = [];
    for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size / 2; c++) {
            // 40% chance of block filled
            const active = rand() < 0.45;
            const colorIdx = Math.floor(rand() * colors.length);
            grid[r][c] = active ? colors[colorIdx] : null;
            // Mirror
            grid[r][size - 1 - c] = grid[r][c];
        }
    }

    // Render blocks onto canvas
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c]) {
                ctx.fillStyle = grid[r][c];
                ctx.fillRect(c * pixelWidth, r * pixelWidth, pixelWidth, pixelWidth);
            }
        }
    }
}

function drawGlobalAvatars(stagedProfile = null) {
    const profile = stagedProfile || StorageEngine.getProfile();
    const profileCanvas = document.getElementById('profileAvatarCanvas');
    const editorCanvas = document.getElementById('editorAvatarCanvas');

    if (profileCanvas) drawProceduralAvatar(profileCanvas, profile.avatarSeed, profile.avatarTheme);
    if (editorCanvas) drawProceduralAvatar(editorCanvas, profile.avatarSeed, profile.avatarTheme);
}

// --- Page 1: Dashboard Landing ---
function initDashboardPage() {
    const profile = StorageEngine.getProfile();

    // Stats injection
    const qsg = document.getElementById('qsGamesPlayed');
    const qsa = document.getElementById('qsAchievements');
    const qsc = document.getElementById('qsTotalScore');
    if (qsg) qsg.textContent = profile.gamesPlayed;
    if (qsa) qsa.textContent = `${StorageEngine.getUnlockedAchievements().length}/32`;
    if (qsc) qsc.textContent = profile.cumulativeScore;

    // Profile Details Card
    const nameLbl = document.getElementById('profileUsername');
    const rankLbl = document.getElementById('profileRank');
    const xpBar = document.getElementById('profileXpBar');
    const xpCurrent = document.getElementById('profileXpCurrent');
    const xpNext = document.getElementById('profileXpNext');

    if (nameLbl) nameLbl.textContent = profile.username;
    if (rankLbl) rankLbl.textContent = profile.rank;

    if (xpBar && xpCurrent && xpNext) {
        // Calculate XP progress bar width
        const xpNeeded = profile.level * 100;
        const progress = (profile.xp / xpNeeded) * 100;
        xpBar.style.width = `${progress}%`;
        xpCurrent.textContent = `${profile.xp} XP`;
        xpNext.textContent = `${xpNeeded} XP`;
    }

    // Dashboard Games Card Stats
    const hsTD = document.getElementById('hsTowerDefense');
    const hsSpace = document.getElementById('hsSpaceShooter');
    const hsRace = document.getElementById('hsRacer');
    const hsPuz = document.getElementById('hsPuzzle');

    if (hsTD) hsTD.textContent = profile.stats.tower_defense?.highScore || 0;
    if (hsSpace) hsSpace.textContent = profile.stats.space_shooter?.highScore || 0;
    if (hsRace) hsRace.textContent = profile.stats.racer?.highScore || 0;
    if (hsPuz) hsPuz.textContent = profile.stats.puzzle?.highScore || 0;

    // Build achievements mini list
    const miniAchList = document.getElementById('recentAchievementsList');
    if (miniAchList) {
        miniAchList.innerHTML = '';
        const unlocked = StorageEngine.getUnlockedAchievements();
        // Grab top 3 achievements
        const listToDraw = ACHIEVEMENT_DATABASE.slice(0, 3);
        listToDraw.forEach(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            const li = document.createElement('li');
            li.className = isUnlocked ? 'achievement-item' : 'achievement-itemlocked';
            li.innerHTML = `
                <span class="ach-icon">${isUnlocked ? '🏆' : '🔒'}</span>
                <div class="ach-info">
                    <h5>${ach.title}</h5>
                    <p>${ach.desc}</p>
                </div>
            `;
            miniAchList.appendChild(li);
        });
    }
}

// --- Page 2: Games Room gameplay controller ---
let activeGameLoopId = null;
let currentActiveGame = null;

function initGamesRoomPage() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const input = new InputManager();
    
    // Check parameters routing selector query
    const urlParams = new URLSearchParams(window.location.search);
    let requestedGame = urlParams.get('game') || 'tower_defense';

    // Sidebar selectors setup
    const selectorItems = document.querySelectorAll('.selector-item');
    selectorItems.forEach(item => {
        const gameId = item.getAttribute('data-game');
        if (gameId === requestedGame) item.classList.add('active');

        item.addEventListener('click', () => {
            selectorItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            launchGameCenter(gameId);
        });
    });

    // Control Overlays buttons bindings
    const btnStart = document.getElementById('btnStartGame');
    const overlay = document.getElementById('canvasOverlay');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (currentActiveGame) {
                overlay.classList.add('hide');
                currentActiveGame.start();
                StorageEngine.recordGamePlayed();
                startGameLoop();
            }
        });
    }

    // Top action controls binding
    const restartBtn = document.getElementById('btnRestartGame');
    const pauseBtn = document.getElementById('btnPauseGame');
    const muteBtn = document.getElementById('btnMuteGame');

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (currentActiveGame) {
                overlay.classList.add('hide');
                currentActiveGame.start();
                startGameLoop();
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (currentActiveGame && currentActiveGame.gameState === 'playing') {
                currentActiveGame.gameState = 'paused';
                pauseBtn.textContent = '▶️ Resume';
                SoundEngine.stopMusic();
                
                // Show pause overlay screen
                document.getElementById('overlayTitle').textContent = 'PAUSED';
                document.getElementById('overlayDesc').textContent = 'Game sequence suspended. Click Resume or restart to continue.';
                btnStart.textContent = 'RESUME';
                overlay.classList.remove('hide');
            } else if (currentActiveGame && currentActiveGame.gameState === 'paused') {
                currentActiveGame.gameState = 'playing';
                pauseBtn.textContent = '⏸️ Pause';
                SoundEngine.playMusic(requestedGame);
                overlay.classList.add('hide');
            }
        });
    }

    if (muteBtn) {
        muteBtn.textContent = SoundEngine.isMuted() ? '🔇 Mute' : '🔊 Mute';
        muteBtn.addEventListener('click', () => {
            const muted = SoundEngine.toggleMute();
            muteBtn.textContent = muted ? '🔇 Mute' : '🔊 Mute';
        });
    }

    // Instructions Tab clicks
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const contentId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tabContent-${contentId}`).classList.add('active');
        });
    });

    // Custom RPG dialog keys listener
    window.addEventListener('keydown', (e) => {
        if (currentActiveGame && currentActiveGame.currentDialog) {
            const num = parseInt(e.key);
            if (!isNaN(num)) {
                const opt = currentActiveGame.currentDialog.options[num - 1];
                if (opt && opt.action) {
                    opt.action();
                }
            }
        }
    });

    // Event listener mapping to launch win overlays
    window.addEventListener('game_state_changed', (e) => {
        const data = e.detail;
        if (data.state === 'win') {
            document.getElementById('overlayTitle').textContent = 'VICTORY!';
            document.getElementById('overlayDesc').textContent = `Success! Cumulative score increased by +${data.score} points.`;
            btnStart.textContent = 'REPLAY LEVEL';
            overlay.classList.remove('hide');
            
            // Trigger storage level upgrades check
            const profile = StorageEngine.getProfile();
            StorageEngine.saveHighScore(data.game, data.score);
        } else if (data.state === 'gameover') {
            document.getElementById('overlayTitle').textContent = 'GAME OVER';
            document.getElementById('overlayDesc').textContent = `Dungeon loop ended. Score reached: ${data.score} points.`;
            btnStart.textContent = 'TRY AGAIN';
            overlay.classList.remove('hide');
        }
    });

    // Load initial selection game
    launchGameCenter(requestedGame);
}

function launchGameCenter(gameId) {
    // Clean running states
    if (activeGameLoopId) {
        cancelAnimationFrame(activeGameLoopId);
        activeGameLoopId = null;
    }
    SoundEngine.stopMusic();
    
    const canvas = document.getElementById('gameCanvas');
    const input = new InputManager();
    const overlay = document.getElementById('canvasOverlay');
    const startBtn = document.getElementById('btnStartGame');
    
    // Inject overlays text based on game selection
    const names = {
        tower_defense: 'Neo-Defender',
        space_shooter: 'Cosmic Void',
        racer: 'Synth Racer',
        puzzle: 'Block Cascade'
    };

    const genres = {
        tower_defense: 'Base Grid Strategy TD',
        space_shooter: 'Scrolling Space Shooter',
        racer: 'Pseudo-3D Highway Racer',
        puzzle: 'Falling Glowing Blocks'
    };

    document.getElementById('activeGameTitle').textContent = names[gameId];
    document.getElementById('activeGameGenre').textContent = genres[gameId];
    document.getElementById('overlayTitle').textContent = names[gameId].toUpperCase();
    document.getElementById('overlayDesc').textContent = `Press Start to initialize the procedural engine.`;
    startBtn.textContent = 'START GAME';
    overlay.classList.remove('hide');

    // Instantiate game logic class
    if (gameId === 'tower_defense') {
        currentActiveGame = new TowerDefenseGame(canvas, input, SoundEngine, StorageEngine);
    } else if (gameId === 'space_shooter') {
        currentActiveGame = new SpaceShooterGame(canvas, input, SoundEngine, StorageEngine);
    } else if (gameId === 'racer') {
        currentActiveGame = new SynthRacerGame(canvas, input, SoundEngine, StorageEngine);
    } else if (gameId === 'puzzle') {
        currentActiveGame = new BlockCascadeGame(canvas, input, SoundEngine, StorageEngine);
    }
    
    // Populate tab details instructions
    populateGameInstructions(gameId);
}

function populateGameInstructions(gameId) {
    const instructions = {
        tower_defense: {
            how: 'Click anywhere outside the path segments to place defense towers. Click existing towers to upgrade them (+100 gold cost). Survive waves of bots.',
            ctrl: '<div class="control-key-row"><span>Mouse Left Click</span> <span>Place / Upgrade Towers</span></div><div class="control-key-row"><span>Sidebar Option</span> <span>Toggle between Turret Types</span></div>',
            lore: 'Protect the central processor mainframe from corruption mechanical units.'
        },
        space_shooter: {
            how: 'Dodge bullets and asteroids. Shoot enemy ships. Defeat the Alpha mothership boss at the end of the wave to claim space supremacy.',
            ctrl: '<div class="control-key-row"><span class="key-cap">A</span> / <span class="key-cap">D</span> <span>Slide Left / Right</span></div><div class="control-key-row"><span class="key-cap">Space</span> / <span class="key-cap">J</span> <span>Autofire Laser weapons</span></div>',
            lore: 'Launch your ship into the far reaches of the galactic buffer array.'
        },
        racer: {
            how: 'Accelerate and drift curves to complete checkpoints before the timer expires. Dodge slower yellow traffic vehicles along roads.',
            ctrl: '<div class="control-key-row"><span class="key-cap">W</span> / <span class="key-cap">S</span> <span>Accelerate / Brake</span></div><div class="control-key-row"><span class="key-cap">A</span> / <span class="key-cap">D</span> <span>Steer sports car wheels</span></div>',
            lore: 'Race through Synthwave grids under a digital sun.'
        },
        puzzle: {
            how: 'Align falling blocks to complete row clearances. Combo clearances generate score multipliers. Speed increases on every 10 cleared lines.',
            ctrl: '<div class="control-key-row"><span class="key-cap">A</span> / <span class="key-cap">D</span> <span>Shift block Left / Right</span></div><div class="control-key-row"><span class="key-cap">S</span> <span>Soft drop speed</span></div><div class="control-key-row"><span class="key-cap">W</span> <span>Rotate block clockwise</span></div><div class="control-key-row"><span class="key-cap">Shift</span> / <span class="key-cap">C</span> <span>Hold block piece</span></div><div class="control-key-row"><span class="key-cap">Space</span> <span>Hard Drop block instantly</span></div>',
            lore: 'Construct rows to empty the memory buffer allocation.'
        }
    };

    document.getElementById('gameHowToPlay').innerHTML = instructions[gameId].how;
    document.getElementById('gameControlsGrid').innerHTML = instructions[gameId].ctrl;
    document.getElementById('gameLore').textContent = instructions[gameId].lore;
}

let lastTime = 0;
function startGameLoop() {
    if (activeGameLoopId) {
        cancelAnimationFrame(activeGameLoopId);
        activeGameLoopId = null;
    }
    lastTime = performance.now();
    const frame = (time) => {
        if (!currentActiveGame || currentActiveGame.gameState !== 'playing') {
            activeGameLoopId = null;
            return;
        }

        const dt = time - lastTime;
        lastTime = time;

        // Perform game state calculations
        currentActiveGame.update(dt);
        // Render graphics
        currentActiveGame.render();

        activeGameLoopId = requestAnimationFrame(frame);
    };
    activeGameLoopId = requestAnimationFrame(frame);
}

// --- Page 3: Profile Command Settings ---
function initProfilePage() {
    const profile = StorageEngine.getProfile();

    // Inputs setup
    const userIn = document.getElementById('inputUsername');
    if (userIn) userIn.value = profile.username;

    // Reset button binding
    const resetBtn = document.getElementById('btnResetData');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all settings, scores, and unlocked achievements?')) {
                StorageEngine.resetAllData();
            }
        });
    }

    // Avatar generator controls binding
    const randBtn = document.getElementById('btnRandomizeAvatar');
    const colorBtn = document.getElementById('btnCycleAvatarColor');
    
    if (randBtn) {
        randBtn.addEventListener('click', () => {
            profile.avatarSeed = Math.floor(Math.random() * 90000);
            drawGlobalAvatars(profile);
        });
    }

    if (colorBtn) {
        colorBtn.addEventListener('click', () => {
            profile.avatarTheme++;
            drawGlobalAvatars(profile);
        });
    }

    // Save profile details
    const saveBtn = document.getElementById('btnSaveProfile');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            profile.username = userIn.value.trim() || 'PlayerOne';
            StorageEngine.saveProfile(profile);
            SoundEngine.playQuestCompleted();
            alert('Identity configuration saved successfully.');
        });
    }

    // Stats injection details
    const statPT = document.getElementById('statPlayTime');
    const statCS = document.getElementById('statCumulativeScore');
    const statTW = document.getElementById('statTowerWaves');
    const statBD = document.getElementById('statBossesDefeated');
    const statBL = document.getElementById('statBestLap');
    const statPL = document.getElementById('statPuzzleLines');

    if (statPT) statPT.textContent = `${Math.floor(profile.gamesPlayed * 1.5)}m`;
    if (statCS) statCS.textContent = profile.cumulativeScore;
    if (statTW) statTW.textContent = profile.stats.tower_defense?.maxWave || profile.stats.tower_defense?.highScore / 250 || 0;
    if (statBD) statBD.textContent = profile.stats.space_shooter?.bossesDefeated || 0;
    if (statBL) statBL.textContent = profile.stats.racer?.bestLapTime ? `${profile.stats.racer.bestLapTime}s` : '--s';
    if (statPL) statPL.textContent = profile.stats.puzzle?.linesCleared || 0;

    // Populate Achievements panel list
    populateAchievementsList('all');

    // Filter achievements tabs binding
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateAchievementsList(btn.getAttribute('data-filter'));
        });
    });
}

function populateAchievementsList(filter = 'all') {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const unlocked = StorageEngine.getUnlockedAchievements();
    const progText = document.getElementById('achievementProgressText');
    if (progText) progText.textContent = `${unlocked.length} / 32 Unlocked`;

    ACHIEVEMENT_DATABASE.forEach(ach => {
        if (filter !== 'all' && ach.game !== filter) return;

        const isUnlocked = unlocked.includes(ach.id);
        const card = document.createElement('div');
        card.className = isUnlocked ? 'achievement-item' : 'achievement-itemlocked';
        card.innerHTML = `
            <span class="ach-icon">${isUnlocked ? '🏆' : '🔒'}</span>
            <div class="ach-info">
                <h5>${ach.title}</h5>
                <p>${ach.desc}</p>
                <small style="color:var(--color-accent); font-weight:700;">+${ach.points * 5} XP</small>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Page 4: Leaderboards rankings renderer ---
function initLeaderboardPage() {
    const tabSelectors = document.querySelectorAll('#leaderboardTabSelector .v-tab');
    
    // Trigger initial render
    renderLeaderboardRows('global');

    tabSelectors.forEach(tab => {
        tab.addEventListener('click', () => {
            tabSelectors.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const gameId = tab.getAttribute('data-game');
            renderLeaderboardRows(gameId);
        });
    });

    // Auto-update event listener triggered by background bot updates
    window.addEventListener('leaderboard_updated', () => {
        const activeTab = document.querySelector('#leaderboardTabSelector .v-tab.active');
        if (activeTab) {
            renderLeaderboardRows(activeTab.getAttribute('data-game'));
        }
    });
}

function renderLeaderboardRows(gameId) {
    const body = document.getElementById('leaderboardBody');
    if (!body) return;

    body.innerHTML = '';
    const scores = StorageEngine.getLeaderboard(gameId);

    // Title label configuration
    const titles = {
        global: 'Overall Cumulative Rankings',
        tower_defense: 'Neo-Defender Records',
        space_shooter: 'Cosmic Void Survivors',
        racer: 'Synth Racer Drivers',
        puzzle: 'Block Cascade Builders'
    };
    document.getElementById('leaderboardTitle').textContent = titles[gameId] || 'Leaderboard Rankings';

    // Grab top 12 records
    const displayList = scores.slice(0, 12);
    
    displayList.forEach((entry, index) => {
        const tr = document.createElement('tr');
        if (entry.isPlayer) tr.className = 'user-row';

        const scoreVal = gameId === 'global' ? entry.cumulativeScore : (entry.stats[gameId] || 0);

        const ranks = [
            'Novice Arcade Gamer',
            'Pixel Explorer',
            'Retro Challenger',
            'Coin Collector',
            'Bit Crusher',
            'Grid Strategist',
            'Space Invader',
            'Dungeon Delver',
            'Neon Racer',
            'Cascade Architect',
            'Grand Master of the Verse'
        ];
        const rankIndex = Math.min(Math.floor(entry.level / 2), ranks.length - 1);
        const rankTitle = ranks[rankIndex];

        tr.innerHTML = `
            <td><b>#${index + 1}</b></td>
            <td class="player-cell">${entry.username} ${entry.isPlayer ? '<span class="you-badge">👤 (You)</span>' : ''}</td>
            <td><span class="lvl-badge">Lvl ${entry.level}</span></td>
            <td class="rank-title-cell">${rankTitle}</td>
            <td><b style="color:var(--color-primary);">${scoreVal.toLocaleString()}</b></td>
        `;
        body.appendChild(tr);
    });

    // Update User mini rankings card
    const profile = StorageEngine.getProfile();
    const rankIndex = scores.findIndex(e => e.username === profile.username) + 1;
    document.getElementById('userGlobalRank').textContent = `#${rankIndex}`;
    document.getElementById('userTotalMatches').textContent = profile.gamesPlayed;
    document.getElementById('userTotalXp').textContent = `${profile.xp} XP`;
}

// --- Page 5: Engine API Reference Docs ---
function initDocsPage() {
    const tabs = document.querySelectorAll('#docsNav .v-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const sectionId = tab.getAttribute('data-sec');
            document.querySelectorAll('.docs-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(`sec-${sectionId}`).classList.add('active');
        });
    });
}
