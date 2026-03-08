import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

async function checkForOTAUpdate() {
    if (__DEV__) return; // Skip in development
    try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            Alert.alert(
                'Update Available',
                'A new version has been downloaded. Restart now to apply?',
                [
                    { text: 'Later', style: 'cancel' },
                    {
                        text: 'Restart',
                        onPress: async () => {
                            await Updates.reloadAsync();
                        },
                    },
                ]
            );
        }
    } catch (e) {
        // Silently fail — don't block app usage
        console.log('OTA update check failed:', e.message);
    }
}

export default function RootLayout() {
    useEffect(() => {
        checkForOTAUpdate();
    }, []);

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ThemeProvider>
                    <StatusBar style="auto" />
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(student)" />
                        <Stack.Screen name="(teacher)" />
                        <Stack.Screen name="(admin)" />
                    </Stack>
                    <Toast />
                </ThemeProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
