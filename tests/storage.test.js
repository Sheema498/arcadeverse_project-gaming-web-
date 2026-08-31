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

    test('should export and import profile data correctly', () => {
        // Setup custom profile state
        const originalProfile = StorageEngine.getProfile();
        originalProfile.username = 'ExportTester';
        originalProfile.xp = 1000;
        StorageEngine.saveProfile(originalProfile);
        StorageEngine.unlockAchievement('plat_first_step');

        const exported = StorageEngine.exportProfileData();
        expect(exported).toContain('ExportTester');
        expect(exported).toContain('plat_first_step');

        // Clear data
        localStorage.clear();

        // Import the data back
        const importSuccess = StorageEngine.importProfileData(exported);
        expect(importSuccess).toBe(true);

        const importedProfile = StorageEngine.getProfile();
        expect(importedProfile.username).toBe('ExportTester');
        expect(importedProfile.xp).toBe(1050);
        expect(StorageEngine.isAchievementUnlocked('plat_first_step')).toBe(true);
    });

    test('should reject invalid import profile data', () => {
        const importSuccess = StorageEngine.importProfileData('invalid-json');
        expect(importSuccess).toBe(false);

        const importSuccessEmpty = StorageEngine.importProfileData('{}');
        expect(importSuccessEmpty).toBe(false);
    test('should reset a single game high score correctly', () => {
        StorageEngine.saveHighScore('platformer', 3000);
        expect(StorageEngine.getHighScore('platformer')).toBe(3000);

        const resetSuccess = StorageEngine.resetHighScore('platformer');
        expect(resetSuccess).toBe(true);
        expect(StorageEngine.getHighScore('platformer')).toBe(0);

        const resetSuccessInvalid = StorageEngine.resetHighScore('nonexistent_game');
        expect(resetSuccessInvalid).toBe(false);
    });

    test('should reset achievements correctly', () => {
        StorageEngine.unlockAchievement('plat_first_step');
        expect(StorageEngine.isAchievementUnlocked('plat_first_step')).toBe(true);

        StorageEngine.resetAchievements();
        expect(StorageEngine.isAchievementUnlocked('plat_first_step')).toBe(false);
    });

    test('should safely reset data without touching non-prefixed keys', () => {
        localStorage.setItem('other_app_key', 'should_remain');
        StorageEngine.saveHighScore('platformer', 1000);

        StorageEngine.resetAllData();
        expect(localStorage.getItem('other_app_key')).toBe('should_remain');
        expect(StorageEngine.getHighScore('platformer')).toBe(0);
    });
});
