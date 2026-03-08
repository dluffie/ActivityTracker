import { useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const useSoundFX = () => {
    const { theme, soundEnabled } = useTheme();
    const audioCtxRef = useRef(null);

    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const playTone = useCallback((freq, duration, type = 'square', volume = 0.15) => {
        if (theme !== 'cyberpunk' || !soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Silently fail if audio is blocked
        }
    }, [theme, getAudioCtx]);

    const playClick = useCallback(() => {
        playTone(880, 0.08, 'square', 0.1);
        setTimeout(() => playTone(1320, 0.06, 'square', 0.08), 30);
    }, [playTone]);

    const playSuccess = useCallback(() => {
        playTone(523, 0.1, 'sine', 0.12);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 160);
    }, [playTone]);

    const playHover = useCallback(() => {
        playTone(1400, 0.04, 'sine', 0.05);
    }, [playTone]);

    return { playClick, playSuccess, playHover };
};

export default useSoundFX;
