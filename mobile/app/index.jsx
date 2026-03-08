import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

export default function SplashIndex() {
    const { user, loading, isAuthenticated } = useAuth();
    const { colors } = useTheme();

    // Animations
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const dotScale = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(titleTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(dotScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

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
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [loading, isAuthenticated, user]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.bgCircle1, { backgroundColor: colors.primaryLight, opacity: 0.25 }]} />
            <View style={[styles.bgCircle2, { backgroundColor: colors.primaryBorder, opacity: 0.2 }]} />
            <View style={[styles.bgCircle3, { backgroundColor: colors.accent, opacity: 0.3 }]} />

            <Animated.View style={[styles.glow, { opacity: glowOpacity, backgroundColor: colors.primary }]} />

            <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                <View style={[styles.logoBox, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
                    <Image source={require('../assets/logo.png')} style={styles.logoImage} />
                </View>
            </Animated.View>

            <Animated.Text style={[styles.title, { color: colors.primary, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
            </Animated.Text>

            <Animated.Text style={[styles.subtitle, { color: colors.textSecondary, opacity: subtitleOpacity }]}>
                College Activity Point{'\n'}Management System
            </Animated.Text>

            <Animated.View style={[styles.loadingDot, { backgroundColor: colors.primary, transform: [{ scale: dotScale }] }]} />

            <Animated.Text style={[styles.bottomText, { color: colors.textTertiary, opacity: subtitleOpacity }]}>
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
    },
    bgCircle1: {
        position: 'absolute', top: -80, right: -60,
        width: 220, height: 220, borderRadius: 110,
    },
    bgCircle2: {
        position: 'absolute', bottom: -50, left: -40,
        width: 180, height: 180, borderRadius: 90,
    },
    bgCircle3: {
        position: 'absolute', top: '35%', left: -30,
        width: 100, height: 100, borderRadius: 50,
    },
    glow: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        opacity: 0.15,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoBox: {
        width: 110, height: 110, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
    },
    logoImage: {
        width: 90, height: 90,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: 4,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    loadingDot: {
        width: 10, height: 10, borderRadius: 5,
        marginBottom: 60,
    },
    bottomText: {
        position: 'absolute', bottom: 50,
        fontSize: 12, fontWeight: '500',
        letterSpacing: 1,
    },
});
