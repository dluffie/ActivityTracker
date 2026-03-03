import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/constants/theme';

export default function SplashIndex() {
    const { user, loading, isAuthenticated } = useAuth();

    // Animations
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const dotScale = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate splash sequence
        Animated.sequence([
            // 1. Logo pops in
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            // 2. Glow pulse
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
            // 3. Title slides up
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(titleTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // 4. Subtitle + loading dot
            Animated.parallel([
                Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(dotScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    // Pulse animation for the dot
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(dotScale, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(dotScale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        const timer = setTimeout(() => pulse.start(), 1200);
        return () => { clearTimeout(timer); pulse.stop(); };
    }, []);

    // Navigate after auth resolves
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                if (isAuthenticated && user) {
                    const role = user.role;
                    if (role === 'student') router.replace('/(student)/dashboard');
                    else if (role === 'teacher') router.replace('/(teacher)/dashboard');
                    else if (role === 'admin') router.replace('/(admin)/dashboard');
                } else {
                    router.replace('/(auth)/login');
                }
            }, 1800); // Show splash for at least 1.8s
            return () => clearTimeout(timer);
        }
    }, [loading, isAuthenticated, user]);

    return (
        <View style={styles.container}>
            {/* Background gradient circles */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />
            <View style={styles.bgCircle3} />

            {/* Glow behind logo */}
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoEmoji}>📊</Text>
                </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
                CAPMS
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                College Activity Point{'\n'}Management System
            </Animated.Text>

            {/* Loading dot */}
            <Animated.View style={[styles.loadingDot, { transform: [{ scale: dotScale }] }]} />

            {/* Bottom text */}
            <Animated.Text style={[styles.bottomText, { opacity: subtitleOpacity }]}>
                GPC Kothamangalam
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#faf8ff',
    },
    // Decorative background circles
    bgCircle1: {
        position: 'absolute', top: -80, right: -60,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: '#e9d5ff', opacity: 0.4,
    },
    bgCircle2: {
        position: 'absolute', bottom: -50, left: -40,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: '#ddd6fe', opacity: 0.3,
    },
    bgCircle3: {
        position: 'absolute', top: '35%', left: -30,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#f5e6d3', opacity: 0.5,
    },
    glow: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#a78bfa', opacity: 0.15,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBox: {
        width: 100, height: 100, borderRadius: 30,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },
    logoEmoji: {
        fontSize: 44,
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 4,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b6280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    loadingDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginBottom: 60,
    },
    bottomText: {
        position: 'absolute', bottom: 50,
        fontSize: 12, fontWeight: '500',
        color: '#a09ab0', letterSpacing: 1,
    },
});
