const fs = require('fs');
const path = require('path');

// Read and evaluate storage.js content in jsdom global scope
const storageCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/core/storage.js'), 'utf8');
eval(storageCode + "\n\nglobal.StorageEngine = StorageEngine;\nglobal.ACHIEVEMENT_DATABASE = ACHIEVEMENT_DATABASE;");

describe('Storage Engine and Achievements System', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('should fetch default profile values when empty', () => {
        const profile = StorageEngine.getProfile();
        expect(profile.username).toBe('PlayerOne');
        expect(profile.level).toBe(1);
        expect(profile.xp).toBe(0);
        expect(profile.gamesPlayed).toBe(0);
    });

    test('should save and reload modified profile details', () => {
        const profile = StorageEngine.getProfile();
        profile.username = 'GamerAlpha';
        profile.xp = 250;
        StorageEngine.saveProfile(profile);

        const reloaded = StorageEngine.getProfile();
        expect(reloaded.username).toBe('GamerAlpha');
        expect(reloaded.xp).toBe(250);
        // Level recalculation check: floor(sqrt(250 / 100)) + 1 = floor(1.58) + 1 = 2
        expect(reloaded.level).toBe(2);
    });

    test('should unlock achievements correctly', () => {
        const unlockSuccess = StorageEngine.unlockAchievement('td_first_tower');
        expect(unlockSuccess).toBe(true);

        const isUnlocked = StorageEngine.isAchievementUnlocked('td_first_tower');
        expect(isUnlocked).toBe(true);

        // Attempting to unlock again should return false
        const doubleUnlock = StorageEngine.unlockAchievement('td_first_tower');
        expect(doubleUnlock).toBe(false);
    });

    test('should calculate high scores correctly', () => {
        const firstScore = StorageEngine.saveHighScore('space_shooter', 1500);
        expect(firstScore).toBe(true);

        const high = StorageEngine.getHighScore('space_shooter');
        expect(high).toBe(1500);

        // Lower score should not overwrite
        const lowerScore = StorageEngine.saveHighScore('space_shooter', 1200);
        expect(lowerScore).toBe(false);
        expect(StorageEngine.getHighScore('space_shooter')).toBe(1500);

        // Higher score should overwrite
        const higherScore = StorageEngine.saveHighScore('space_shooter', 2000);
        expect(higherScore).toBe(true);
        expect(StorageEngine.getHighScore('space_shooter')).toBe(2000);
    });
});
