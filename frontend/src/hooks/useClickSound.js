import { useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Custom hook that plays a short cyberpunk-style click sound
 * using the Web Audio API. Only plays in cyberpunk theme.
 * No external audio files needed.
 */
const useClickSound = () => {
    const { isCyberpunk } = useTheme();
    const audioCtxRef = useRef(null);

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    }, []);

    const playClick = useCallback(() => {
        if (!isCyberpunk) return;

        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Main click tone — short high-freq beep
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(1800, now);
            osc1.frequency.exponentialRampToValueAtTime(600, now + 0.06);
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc1.connect(gain1).connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.08);

            // Secondary harmonic — gives it that cyberpunk "digital" feel
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(3200, now);
            osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
            gain2.gain.setValueAtTime(0.06, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc2.connect(gain2).connect(ctx.destination);
            osc2.start(now);
            osc2.stop(now + 0.05);
        } catch (e) {
            // Silently fail if Web Audio isn't available
        }
    }, [isCyberpunk, getAudioContext]);

    const playSuccess = useCallback(() => {
        if (!isCyberpunk) return;

        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            // Rising tone — success confirmation
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) {
            // Silently fail
        }
    }, [isCyberpunk, getAudioContext]);

    const playHover = useCallback(() => {
        if (!isCyberpunk) return;

        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2400, now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        } catch (e) {
            // Silently fail
        }
    }, [isCyberpunk, getAudioContext]);

    return { playClick, playSuccess, playHover };
};

export default useClickSound;
