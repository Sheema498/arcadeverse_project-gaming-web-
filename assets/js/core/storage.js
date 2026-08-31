/* ==========================================================================
   ArcadeVerse Local Storage Engine & Achievements System
   ========================================================================== */

const STORAGE_KEY_PREFIX = 'arcadeverse_';

// Define the comprehensive achievements database (32 total, 8 per game)
const ACHIEVEMENT_DATABASE = [
    // --- Neo-Defender (Tower Defense) ---
    { id: 'td_first_tower', title: 'Base Command', desc: 'Construct your first defensive turret.', game: 'tower_defense', points: 10 },
    { id: 'td_wave_5', title: 'Hold the Line', desc: 'Survive wave 5 on any map.', game: 'tower_defense', points: 15 },
    { id: 'td_wave_15', title: 'Iron Defense', desc: 'Survive wave 15 on any map.', game: 'tower_defense', points: 25 },
    { id: 'td_wave_30', title: 'Impervious Grid', desc: 'Survive wave 30 on any map.', game: 'tower_defense', points: 50 },
    { id: 'td_max_upgrade', title: 'Overclocked', desc: 'Upgrade any tower to maximum efficiency.', game: 'tower_defense', points: 20 },
    { id: 'td_kill_100', title: 'Scrap Metal', desc: 'Destroy 100 invading mechanical units.', game: 'tower_defense', points: 20 },
    { id: 'td_build_grid', title: 'Megapolis', desc: 'Have 15 active towers on screen at once.', game: 'tower_defense', points: 30 },
    { id: 'td_perfect_health', title: 'Zero Casualties', desc: 'Complete wave 10 with 100% base health.', game: 'tower_defense', points: 40 },

    // --- Cosmic Void (Space Shooter) ---
    { id: 'space_first_launch', title: 'Ignition', desc: 'Launch into the cosmic void.', game: 'space_shooter', points: 10 },
    { id: 'space_score_1k', title: 'Deep Space', desc: 'Score 1,000 points in a single run.', game: 'space_shooter', points: 15 },
    { id: 'space_score_10k', title: 'Galaxy Legend', desc: 'Score 10,000 points in a single run.', game: 'space_shooter', points: 30 },
    { id: 'space_boss_1', title: 'Leviathan Slain', desc: 'Defeat the Alpha mothership.', game: 'space_shooter', points: 25 },
    { id: 'space_boss_3', title: 'Void Purged', desc: 'Defeat the Omega mothership.', game: 'space_shooter', points: 50 },
    { id: 'space_max_power', title: 'Full Arsenal', desc: 'Reach maximum weapon power level.', game: 'space_shooter', points: 20 },
    { id: 'space_graze', title: 'Danger Zone', desc: 'Dodge 50 bullets within close margins.', game: 'space_shooter', points: 25 },
    { id: 'space_pacifist', title: 'Pacifist Pilot', desc: 'Survive 30 seconds without firing a bullet.', game: 'space_shooter', points: 40 },

    // --- Synth Racer (Pseudo-3D Racer) ---
    { id: 'race_first_lap', title: 'Tread Marks', desc: 'Complete your first highway lap.', game: 'racer', points: 10 },
    { id: 'race_lap_90', title: 'Speed Demon', desc: 'Complete a lap in under 90 seconds.', game: 'racer', points: 20 },
    { id: 'race_lap_60', title: 'Light Speed', desc: 'Complete a lap in under 60 seconds.', game: 'racer', points: 40 },
    { id: 'race_top_speed', title: 'Mach One', desc: 'Reach maximum car speed (300 km/h).', game: 'racer', points: 15 },
    { id: 'race_no_crash', title: 'Clean Run', desc: 'Complete a full lap without colliding with traffic.', game: 'racer', points: 35 },
    { id: 'race_drift', title: 'Initial Slide', desc: 'Drift continuously around curves for 3 seconds.', game: 'racer', points: 15 },
    { id: 'race_close_shave', title: 'Near Miss', desc: 'Overtake 15 vehicles with close margins.', game: 'racer', points: 20 },
    { id: 'race_champion', title: 'Apex Racer', desc: 'Win 3 consecutive time trials.', game: 'racer', points: 50 },

    // --- Block Cascade (Puzzle) ---
    { id: 'puz_first_line', title: 'Clear Vision', desc: 'Clear your first block line.', game: 'puzzle', points: 10 },
    { id: 'puz_lines_10', title: 'Brick Layer', desc: 'Clear 10 lines in a single game.', game: 'puzzle', points: 15 },
    { id: 'puz_lines_50', title: 'Architect', desc: 'Clear 50 lines in a single game.', game: 'puzzle', points: 30 },
    { id: 'puz_tetris', title: 'Quad Cascade', desc: 'Clear 4 lines at once (Tetris).', game: 'puzzle', points: 25 },
    { id: 'puz_combo_3', title: 'Combo Novice', desc: 'Reach a 3x score multiplier.', game: 'puzzle', points: 15 },
    { id: 'puz_combo_6', title: 'Combo Master', desc: 'Reach a 6x score multiplier.', game: 'puzzle', points: 35 },
    { id: 'puz_level_10', title: 'Cascade Legend', desc: 'Reach puzzle speed level 10.', game: 'puzzle', points: 40 },
    { id: 'puz_high_score', title: 'High Stacker', desc: 'Score over 50,000 points.', game: 'puzzle', points: 35 },
];

const StorageEngine = {
    // --- Core Helper Functions ---
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('LocalStorage error getting key:', key, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('LocalStorage error setting key:', key, e);
            return false;
        }
    },

    // --- Profile Data Management ---
    getProfile() {
        const defaultProfile = {
            username: 'PlayerOne',
            rank: 'Novice Arcade Gamer',
            xp: 0,
            level: 1,
            avatarSeed: 12345,
            avatarTheme: 0, // color theme index
            playTimeSec: 0,
            gamesPlayed: 0,
            cumulativeScore: 0,
            stats: {
                tower_defense: { highScore: 0, maxWave: 0, towersBuilt: 0, enemiesDestroyed: 0 },
                space_shooter: { highScore: 0, bossesDefeated: 0, shotsFired: 0 },
                racer: { highScore: 0, bestLapTime: null, maxSpeed: 0, collisions: 0 },
                puzzle: { highScore: 0, linesCleared: 0, tetrisesCleared: 0, maxCombo: 0 }
            }
        };
        const loaded = this.get('profile', null);
        if (!loaded) {
            this.set('profile', defaultProfile);
            return defaultProfile;
        }
        // Ensure nesting safety
        return { ...defaultProfile, ...loaded, stats: { ...defaultProfile.stats, ...loaded.stats } };
    },

    saveProfile(profile) {
        this.set('profile', profile);
        this.updateGlobalXPLevel(profile);
    },

    updateGlobalXPLevel(profile) {
        // Simple XP curves: level = floor(sqrt(xp / 100)) + 1
        const calculatedLevel = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
        if (calculatedLevel !== profile.level) {
            profile.level = calculatedLevel;
            
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
            const rankIndex = Math.min(Math.floor(profile.level / 2), ranks.length - 1);
            profile.rank = ranks[rankIndex];
            this.set('profile', profile);
            
            // Dispatch event for UI notifications
            window.dispatchEvent(new CustomEvent('arcadeverse_level_up', { detail: { level: profile.level, rank: profile.rank } }));
        }
    },

    addXP(amount) {
        const profile = this.getProfile();
        profile.xp += amount;
        this.saveProfile(profile);
    },

    recordGamePlayed() {
        const profile = this.getProfile();
        profile.gamesPlayed++;
        this.saveProfile(profile);
        this.unlockAchievement('td_first_tower'); // simple hook for first launch
    },

    // --- High Scores ---
    getHighScore(gameId) {
        const profile = this.getProfile();
        return profile.stats[gameId]?.highScore || 0;
    },

    saveHighScore(gameId, score) {
        const profile = this.getProfile();
        if (score > (profile.stats[gameId]?.highScore || 0)) {
            profile.stats[gameId].highScore = score;
            
            // Update cumulative score
            let newCumScore = 0;
            for (const key in profile.stats) {
                newCumScore += profile.stats[key].highScore || 0;
            }
            profile.cumulativeScore = newCumScore;
            
            this.saveProfile(profile);
            this.updateLeaderboardPlayer(profile.username, score, gameId, profile.level);
            
            // Check specific score achievements
            if (gameId === 'space_shooter') {
                if (score >= 1000) this.unlockAchievement('space_score_1k');
                if (score >= 10000) this.unlockAchievement('space_score_10k');
            }
            if (gameId === 'puzzle' && score >= 50000) {
                this.unlockAchievement('puz_high_score');
            }
            return true;
        }
        return false;
    },

    // --- Achievements System ---
    getUnlockedAchievements() {
        return this.get('unlocked_achievements', []);
    },

    unlockAchievement(id) {
        const unlocked = this.getUnlockedAchievements();
        if (unlocked.includes(id)) return false;

        const ach = ACHIEVEMENT_DATABASE.find(a => a.id === id);
        if (!ach) return false;

        unlocked.push(id);
        this.set('unlocked_achievements', unlocked);
        
        // Reward Player with XP
        this.addXP(ach.points * 5);
        
        // Dispatch achievement unlocked event
        window.dispatchEvent(new CustomEvent('arcadeverse_achievement_unlocked', { detail: ach }));
        return true;
    },

    isAchievementUnlocked(id) {
        return this.getUnlockedAchievements().includes(id);
    },

    // --- Simulated Online Leaderboard (100 Opponents) ---
    initLeaderboard() {
        let leaderboard = this.get('leaderboard_data', null);
        if (leaderboard) return leaderboard;

        leaderboard = [];
        const botNames = [
            'GlitchHunter', 'RetroKid', 'AlphaShip', 'TetrisPro', 'KnightRider',
            'CyberPunk88', 'VoidWalker', 'PixelPrincess', 'SynthDriver', 'GridCommander',
            'PixelBob', 'NeonGlow', 'VectorMaster', 'ChiptuneFan', 'ArcadeSlayer',
            'SpaceDust', 'CoinCollector', 'BitJumper', 'ZeroGravity', 'MageQuest',
            'LaserDragon', 'SpeedyGonzales', 'CastleGuard', 'HighStacker', 'LevelLord',
            'BotOne', 'BotTwo', 'BotThree', 'DungeonLord', 'SpeedStar', 'WaveBreaker'
        ];

        // Fill remaining spaces to make 100 players
        for (let i = 0; i < 70; i++) {
            botNames.push(`ArcadeUser_${Math.floor(Math.random() * 9000 + 1000)}`);
        }

        botNames.forEach((name, index) => {
            const level = Math.floor(Math.random() * 20) + 1;
            const stats = {
                tower_defense: Math.floor(Math.random() * 2500) + 50,
                space_shooter: Math.floor(Math.random() * 8000) + 200,
                racer: Math.floor(Math.random() * 3000) + 100,
                puzzle: Math.floor(Math.random() * 45000) + 500
            };
            const cumulativeScore = stats.tower_defense + stats.space_shooter + stats.racer + stats.puzzle;

            leaderboard.push({
                username: name,
                level: level,
                cumulativeScore: cumulativeScore,
                stats: stats
            });
        });

        this.set('leaderboard_data', leaderboard);
        return leaderboard;
    },

    getLeaderboard(gameId = 'global') {
        const leaderboard = this.initLeaderboard();
        const profile = this.getProfile();
        
        // Add or update current user in global scores
        const userEntryIndex = leaderboard.findIndex(e => e.username === profile.username);
        const userEntry = {
            username: profile.username,
            level: profile.level,
            cumulativeScore: profile.cumulativeScore,
            stats: {
                tower_defense: profile.stats.tower_defense.highScore,
                space_shooter: profile.stats.space_shooter.highScore,
                racer: profile.stats.racer.highScore,
                puzzle: profile.stats.puzzle.highScore
            },
            isPlayer: true
        };

        if (userEntryIndex !== -1) {
            leaderboard[userEntryIndex] = userEntry;
        } else {
            leaderboard.push(userEntry);
        }

        // Sort based on selection
        if (gameId === 'global') {
            leaderboard.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
        } else {
            leaderboard.sort((a, b) => (b.stats[gameId] || 0) - (a.stats[gameId] || 0));
        }

        return leaderboard;
    },

    updateLeaderboardPlayer(username, score, gameId, level) {
        const leaderboard = this.initLeaderboard();
        const entry = leaderboard.find(e => e.username === username);
        if (entry) {
            entry.level = level;
            entry.stats[gameId] = score;
            entry.cumulativeScore = Object.values(entry.stats).reduce((a, b) => a + b, 0);
            this.set('leaderboard_data', leaderboard);
        }
    },

    // Background simulated update: fake players playing games and changing scores
    simulateLeaderboardActivity() {
        const leaderboard = this.initLeaderboard();
        const randomIndex = Math.floor(Math.random() * leaderboard.length);
        const bot = leaderboard[randomIndex];
        
        // Prevent modifying current user
        const profile = this.getProfile();
        if (bot.username === profile.username) return;

        const games = ['tower_defense', 'space_shooter', 'racer', 'puzzle'];
        const gameId = games[Math.floor(Math.random() * games.length)];
        
        // Add random amount to score
        let increment = 0;
        if (gameId === 'puzzle') increment = Math.floor(Math.random() * 500) + 50;
        else increment = Math.floor(Math.random() * 100) + 10;
        
        bot.stats[gameId] = (bot.stats[gameId] || 0) + increment;
        bot.cumulativeScore = Object.values(bot.stats).reduce((a, b) => a + b, 0);
        
        // Chance to level up bot
        if (Math.random() < 0.1) bot.level++;

        this.set('leaderboard_data', leaderboard);
        
        // Dispatch local event for leaderboard display updates
        window.dispatchEvent(new CustomEvent('leaderboard_updated'));
    },

    // --- Reset System ---
    resetAllData() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        this.getProfile(); // Re-initialize default profile
        this.initLeaderboard(); // Re-initialize bot scores
        window.location.reload();
    },

    exportProfileData() {
        const profile = this.getProfile();
        const achievements = this.getUnlockedAchievements();
        return JSON.stringify({
            profile,
            achievements,
            version: '1.0.0',
            exportedAt: new Date().toISOString()
        });
    },

    importProfileData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data && data.profile && Array.isArray(data.achievements)) {
                this.set('profile', data.profile);
                this.set('unlocked_achievements', data.achievements);
                this.updateGlobalXPLevel(data.profile);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to import profile data:', e);
            return false;
        }
        if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            window.location.reload();
        }
    },

    resetHighScore(gameId) {
        const profile = this.getProfile();
        if (profile.stats[gameId]) {
            profile.stats[gameId].highScore = 0;
            
            // Recalculate cumulative score
            let newCumScore = 0;
            for (const key in profile.stats) {
                newCumScore += profile.stats[key].highScore || 0;
            }
            profile.cumulativeScore = newCumScore;
            
            this.saveProfile(profile);
            this.updateLeaderboardPlayer(profile.username, 0, gameId, profile.level);
            return true;
        }
        return false;
    },

    resetAchievements() {
        this.set('unlocked_achievements', []);
        return true;
    }
};

// Start simulated network score updates
setInterval(() => {
    StorageEngine.simulateLeaderboardActivity();
}, 8000);
