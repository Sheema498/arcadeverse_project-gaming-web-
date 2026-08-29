/* ==========================================================================
   ArcadeVerse Audio & Synthesizer Engine - Web Audio API procedural synthesis
   ========================================================================== */

const SoundEngine = {
    ctx: null,
    muted: false,
    masterGain: null,
    currentSeqInterval: null,
    tempo: 120,
    seqStep: 0,
    activeSong: null,
    volumeLevel: 0.3,

    // Initialize Audio Context on user interaction
    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : this.volumeLevel; // Default master volume
            this.masterGain.connect(this.ctx.destination);
            
            // Check state
            if (this.ctx.state === 'suspended') {
                const resume = () => {
                    this.ctx.resume();
                    window.removeEventListener('click', resume);
                    window.removeEventListener('keydown', resume);
                };
                window.addEventListener('click', resume);
                window.addEventListener('keydown', resume);
            }
        } catch (e) {
            console.error('Web Audio API not supported in this browser.', e);
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volumeLevel, this.ctx ? this.ctx.currentTime : 0);
        }
        return this.muted;
    },

    isMuted() {
        return this.muted;
    },

    setVolume(vol) {
        this.volumeLevel = Math.max(0.0, Math.min(1.0, vol));
        if (this.masterGain && !this.muted) {
            this.masterGain.gain.setValueAtTime(this.volumeLevel, this.ctx ? this.ctx.currentTime : 0);
        }
    },

    getVolume() {
        return this.volumeLevel;
    },

    playTone(frequency, type = 'sine', duration = 0.1, volume = 0.15) {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    },

    // --- Procedural Sound Effects ---
    
    // UI selection sound
    playSelect() {
        this.init();
        if (this.muted || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    },

    // Jump sound
    playJump() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    },

    // Coin collection sound
    playCoin() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Classic retro double-chime
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
    },

    // Weapon/laser fire sound
    playLaser() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    },

    // Damage/hit sound
    playHit() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.12);
    },

    // Explosion sound using white noise
    playExplosion() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Populate buffer with random noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noiseNode.start(now);
        noiseNode.stop(now + 0.4);
    },

    // Power-up chord sweep
    playPowerUp() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
        
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.3);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.12, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now + idx * 0.06);
            osc.stop(now + 0.4);
        });
    },

    // Quest completed fanfare
    playQuestCompleted() {
        this.init();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.1 },  // C5
            { f: 587.33, d: 0.1 },  // D5
            { f: 659.25, d: 0.1 },  // E5
            { f: 783.99, d: 0.15 }, // G5
            { f: 659.25, d: 0.1 },  // E5
            { f: 783.99, d: 0.3 }   // G5
        ];

        let accTime = 0;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.f, now + accTime);

            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.18, now + accTime);
            gain.gain.exponentialRampToValueAtTime(0.01, now + accTime + note.d + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + accTime);
            osc.stop(now + accTime + note.d + 0.05);

            accTime += note.d;
        });
    },

    // --- Sequencer Music Tracker ---
    
    // Stop any running music loop
    stopMusic() {
        if (this.currentSeqInterval) {
            clearInterval(this.currentSeqInterval);
            this.currentSeqInterval = null;
        }
        this.activeSong = null;
    },

    // Play a procedurally structured track loop
    playMusic(songName) {
        this.init();
        this.stopMusic();
        
        if (this.muted || !this.ctx) return;
        this.activeSong = songName;
        this.seqStep = 0;

        // Custom note frequency directories for melodies
        const notes = {
            C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
            C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
            C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77
        };

        // Standard 16-step sequencing patterns
        let bassline = [];
        let melody = [];
        let synthType = 'triangle';
        let bassType = 'sine';
        this.tempo = 120;

        switch(songName) {
            case 'platformer': // Bouncy, retro feel
                this.tempo = 130;
                synthType = 'triangle';
                bassType = 'sine';
                bassline = ['C3', null, 'G3', 'C3', 'F3', null, 'C4', 'F3', 'G3', null, 'D3', 'G3', 'C3', 'G3', 'C4', null];
                melody = ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'C6', 'A5', 'G5', 'B5', 'D6', 'B5', 'C6', null, null, null];
                break;

            case 'tower_defense': // Darker, industrial feel
                this.tempo = 110;
                synthType = 'sawtooth';
                bassType = 'triangle';
                bassline = ['A2', 'A2', 'C3', 'A2', 'D3', 'D3', 'A2', 'G2', 'A2', 'A2', 'E3', 'A2', 'G2', 'F2', 'E2', null];
                melody = ['E4', 'G4', 'A4', 'E4', 'G4', 'C5', 'A4', null, 'D4', 'F4', 'G4', 'D4', 'F4', 'A4', 'G4', null];
                break;

            case 'space_shooter': // Fast-paced
                this.tempo = 145;
                synthType = 'sawtooth';
                bassType = 'sawtooth';
                bassline = ['E2', 'E2', 'E2', 'E2', 'A2', 'A2', 'A2', 'A2', 'C3', 'C3', 'D3', 'D3', 'E2', 'E2', 'B2', 'B2'];
                melody = ['B4', 'E5', 'G5', 'F5', 'E5', 'B4', 'A4', 'B4', 'E5', 'G5', 'A5', 'G5', 'F5', 'E5', 'D5', null];
                break;

            case 'rpg': // Calmer dungeon melody
                this.tempo = 95;
                synthType = 'sine';
                bassType = 'triangle';
                bassline = ['D3', null, 'A3', null, 'F3', null, 'C4', null, 'G3', null, 'D3', null, 'A3', null, 'A2', null];
                melody = ['D4', 'F4', 'A4', 'D5', 'C5', 'A4', 'G4', 'E4', 'F4', 'D4', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
                break;

            case 'racer': // Synthwave grid driver
                this.tempo = 125;
                synthType = 'sawtooth';
                bassType = 'triangle';
                bassline = ['C3', 'C3', 'C3', 'C3', 'A2', 'A2', 'A2', 'A2', 'F2', 'F2', 'F2', 'F2', 'G2', 'G2', 'G2', 'G2'];
                melody = ['E4', 'G4', 'C5', 'E5', 'D5', 'B4', 'G4', null, 'C4', 'F4', 'A4', 'C5', 'B4', 'G4', 'D4', null];
                break;

            case 'puzzle': // Casual rhythm
                this.tempo = 115;
                synthType = 'triangle';
                bassType = 'sine';
                bassline = ['F2', null, 'C3', 'F2', 'G2', null, 'D3', 'G2', 'C2', null, 'G2', 'C2', 'E2', 'A2', 'D2', 'G2'];
                melody = ['A4', 'C5', 'E5', 'A5', 'G4', 'B4', 'D5', 'G5', 'E4', 'G4', 'C5', 'E5', 'F4', 'A4', 'D5', null];
                break;
        }

        const stepTimeMs = (60000 / this.tempo) / 4; // 16th notes

        this.currentSeqInterval = setInterval(() => {
            const now = this.ctx.currentTime;
            
            // --- Bass synth trigger ---
            const bassNote = bassline[this.seqStep];
            if (bassNote) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = bassType;
                // Parse lower octave frequency
                const rawNote = bassNote.slice(0, -1);
                const octave = parseInt(bassNote.slice(-1));
                const hz = notes[rawNote + octave] || notes[rawNote + '3'] / 2;
                
                osc.frequency.setValueAtTime(hz, now);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + stepTimeMs / 1000 * 1.5);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start(now);
                osc.stop(now + stepTimeMs / 1000 * 1.5);
            }

            // --- Lead melody synth trigger ---
            const melNote = melody[this.seqStep];
            if (melNote && Math.random() < 0.85) { // Add light humanized gate
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = synthType;
                // Parse octave
                const rawNote = melNote.slice(0, -1);
                const octave = parseInt(melNote.slice(-1));
                const hz = notes[rawNote + octave] || notes[rawNote + '4'];
                
                osc.frequency.setValueAtTime(hz, now);
                
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + stepTimeMs / 1000 * 0.9);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start(now);
                osc.stop(now + stepTimeMs / 1000 * 0.9);
            }

            // --- Basic drum synth triggers (Chiptune drum simulator) ---
            if (this.seqStep % 4 === 0) { // Kick drum on downbeat (1, 5, 9, 13)
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.frequency.setValueAtTime(150, now);
                kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
                kickGain.gain.setValueAtTime(0.2, now);
                kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                kickOsc.connect(kickGain);
                kickGain.connect(this.masterGain);
                kickOsc.start(now);
                kickOsc.stop(now + 0.08);
            }

            if (this.seqStep % 8 === 4) { // Snare noise on beats 5, 13
                const snareBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
                const snareData = snareBuffer.getChannelData(0);
                for(let i=0; i<snareBuffer.length; i++) {
                    snareData[i] = Math.random() * 2 - 1;
                }
                const snareNode = this.ctx.createBufferSource();
                snareNode.buffer = snareBuffer;
                const snareFilter = this.ctx.createBiquadFilter();
                snareFilter.type = 'bandpass';
                snareFilter.frequency.setValueAtTime(1000, now);
                const snareGain = this.ctx.createGain();
                snareGain.gain.setValueAtTime(0.07, now);
                snareGain.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
                
                snareNode.connect(snareFilter);
                snareFilter.connect(snareGain);
                snareGain.connect(this.masterGain);
                
                snareNode.start(now);
                snareNode.stop(now + 0.05);
            }

            // Move to next step
            this.seqStep = (this.seqStep + 1) % 16;

        }, stepTimeMs);
    }
};
