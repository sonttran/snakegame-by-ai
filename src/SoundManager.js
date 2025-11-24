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

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);
        oscillator.frequency.linearRampToValueAtTime(1500, this.audioCtx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
}
