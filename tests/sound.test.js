const fs = require('fs');
const path = require('path');

// Mock Web Audio API for Jest jsdom environment
class MockGainNode {
    constructor() {
        this.gain = {
            value: 0.3,
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn()
        };
    }
    connect() {}
}

class MockOscillatorNode {
    constructor() {
        this.frequency = {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn()
        };
    }
    connect() {}
    start() {}
    stop() {}
}

class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0.0;
    }
    createGain() {
        return new MockGainNode();
    }
    createOscillator() {
        return new MockOscillatorNode();
    }
}

global.window = global;
global.AudioContext = MockAudioContext;

// Read and evaluate sound.js content in jsdom global scope
const soundCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/core/sound.js'), 'utf8');
eval(soundCode + "\n\nglobal.SoundEngine = SoundEngine;");

describe('Sound Engine Synthesizer & Controls', () => {
    beforeEach(() => {
        SoundEngine.ctx = null;
        SoundEngine.muted = false;
        SoundEngine.masterGain = null;
        SoundEngine.volumeLevel = 0.3;
    });

    test('should initialize with default volume level and muted states', () => {
        expect(SoundEngine.isMuted()).toBe(false);
        expect(SoundEngine.getVolume()).toBe(0.3);
    });

    test('should toggle mute state correctly', () => {
        expect(SoundEngine.isMuted()).toBe(false);
        const firstToggle = SoundEngine.toggleMute();
        expect(firstToggle).toBe(true);
        expect(SoundEngine.isMuted()).toBe(true);

        const secondToggle = SoundEngine.toggleMute();
        expect(secondToggle).toBe(false);
        expect(SoundEngine.isMuted()).toBe(false);
    });

    test('should set and get volume level correctly within bounds [0.0, 1.0]', () => {
        SoundEngine.setVolume(0.85);
        expect(SoundEngine.getVolume()).toBe(0.85);

        // Underflow bound clamping
        SoundEngine.setVolume(-0.5);
        expect(SoundEngine.getVolume()).toBe(0.0);

        // Overflow bound clamping
        SoundEngine.setVolume(1.5);
        expect(SoundEngine.getVolume()).toBe(1.0);
    });

    test('should call oscillator and gain nodes during playTone', () => {
        SoundEngine.init();
        expect(SoundEngine.ctx).not.toBeNull();

        const createOscSpy = jest.spyOn(SoundEngine.ctx, 'createOscillator');
        const createGainSpy = jest.spyOn(SoundEngine.ctx, 'createGain');

        SoundEngine.playTone(440, 'sine', 0.2, 0.5);

        expect(createOscSpy).toHaveBeenCalled();
        expect(createGainSpy).toHaveBeenCalled();

        createOscSpy.mockRestore();
        createGainSpy.mockRestore();
    });
});
