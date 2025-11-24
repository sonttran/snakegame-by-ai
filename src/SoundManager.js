export class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playEatNormal() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.1);
    }

    playEatSpecial() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Smoother (sine) and lower pitch
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(500, this.audioCtx.currentTime + 0.4);

        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.6);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.6);
    }
}
