import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, LogBox } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../api';
import { useAppContext } from '../context/AppContext';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function LoginScreen() {
  const { theme, t } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkLoginState(); 
  }, []);

  const checkLoginState = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.error, "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.status === 'success') {
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('userName', response.user.name);
        router.replace('/(tabs)');
      } else {
        Alert.alert("Login Failed", response.message);
      }
    } catch (error) {
      Alert.alert(t.error, "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="leaf" size={45} color="#FFF" />
            <MaterialCommunityIcons name="camera-iris" size={20} color="#FFF" style={styles.logoCamera} />
          </View>
        </View>
        <Text style={[styles.appName, { color: theme.text }]}>Zr3 M3ana</Text>
        <Text style={[styles.tagline, { color: theme.primary }]}>SMART FARMING ASSISTANT</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>{t.welcome}</Text>
        <Text style={[styles.subWelcomeText, { color: theme.subText }]}>{t.signInToAccount}</Text>

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="at" size={22} color={theme.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t.email}
            placeholderTextColor={theme.subText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="lock-outline" size={22} color={theme.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t.password}
            placeholderTextColor={theme.subText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: theme.primary }]}>{t.forgotPassword}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{t.signIn}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.subText }]}>{t.or}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/signup')}>
          <Text style={[styles.linkText, { color: theme.subText }]}>
            {t.dontHaveAccount} <Text style={[styles.linkTextBold, { color: theme.primary }]}>{t.createAccount}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 35 },
  logoWrapper: { elevation: 10 },
  logoContainer: { width: 85, height: 85, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoCamera: { position: 'absolute', bottom: 18, right: 18 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: 1.5 },
  tagline: { fontSize: 13, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  card: { marginHorizontal: 24, borderRadius: 32, padding: 30, elevation: 4, borderWidth: 1 },
  welcomeText: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subWelcomeText: { fontSize: 15, fontWeight: '600', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 18, height: 60, marginBottom: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  eyeIcon: { padding: 5 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30, marginTop: -5 },
  forgotText: { fontWeight: '800', fontSize: 14 },
  primaryBtn: { borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontWeight: 'bold', fontSize: 14 },
  linkBtn: { alignItems: 'center' },
  linkText: { fontSize: 15, fontWeight: '600' },
  linkTextBold: { fontWeight: '900' }
});