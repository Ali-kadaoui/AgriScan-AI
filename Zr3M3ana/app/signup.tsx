import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signupUser } from '../api';
import { useAppContext } from '../context/AppContext';

export default function SignupScreen() {
  const { theme, t } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert(t.error, "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signupUser(name, email, password);
      if (response.status === 'success') {
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('userName', response.user.name);
        router.replace('/(tabs)');
      } else {
        Alert.alert("Sign Up Failed", response.message);
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
        <Text style={[styles.appName, { color: theme.text }]}>{t.joinApp}</Text>
        <Text style={[styles.tagline, { color: theme.primary }]}>{t.createAccount}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>{t.getStarted}</Text>
        <Text style={[styles.subWelcomeText, { color: theme.subText }]}>{t.registerNew}</Text>

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="account-outline" size={22} color={theme.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t.name}
            placeholderTextColor={theme.subText}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

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

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleSignup} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{t.createAccount}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.subText }]}>{t.or}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={[styles.linkText, { color: theme.subText }]}>
            {t.alreadyHaveAccount} <Text style={[styles.linkTextBold, { color: theme.primary }]}>{t.signIn}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 25 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: 1.5 },
  tagline: { fontSize: 13, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  card: { marginHorizontal: 24, borderRadius: 32, padding: 30, elevation: 4, borderWidth: 1 },
  welcomeText: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subWelcomeText: { fontSize: 15, fontWeight: '600', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 18, height: 60, marginBottom: 18 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  eyeIcon: { padding: 5 },
  primaryBtn: { borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', elevation: 4, marginTop: 15 },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontWeight: 'bold', fontSize: 14 },
  linkBtn: { alignItems: 'center' },
  linkText: { fontSize: 15, fontWeight: '600' },
  linkTextBold: { fontWeight: '900' }
});