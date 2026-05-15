import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';

const PRIMARY_GREEN = '#098840';
// Make sure this IP matches your current running Uvicorn server!
const SERVER_URL = 'http://192.168.11.101:8000'; 

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, lang, changeLanguage, theme, t } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    newPassword: '',
    bio: '',
    avatar: ''
  });

  // 1️⃣ LOAD USER DATA ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      const bio = await AsyncStorage.getItem('userBio') || t.student || 'Agronomist in training 🌿';
      const avatar = await AsyncStorage.getItem('userAvatar') || '';
      
      setProfile(prev => ({ 
        ...prev, 
        id: id || '', 
        name: name || '', 
        email: email || '', 
        bio,
        avatar
      }));
    };
    loadData();
  }, []);

  // 2️⃣ HANDLE IMAGE PICKER (Fixed Deprecation & Cropper Bug)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: false, 
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const newAvatar = result.assets[0].uri;
      setProfile({ ...profile, avatar: newAvatar });
      await AsyncStorage.setItem('userAvatar', newAvatar);
    }
  };

  // 3️⃣ STEP 1: VERIFY PASSWORD TO UNLOCK FIELDS
  const handleVerifyUnlock = async () => {
    if (!currentPasswordInput) {
      Alert.alert(isRTL ? "تنبيه" : "Notice", isRTL ? "أدخل كلمة المرور الحالية أولاً" : "Enter current password first.");
      return;
    }
    
    setVerifying(true);
    try {
      const res = await fetch(`${SERVER_URL}/users/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: profile.id, 
          email: profile.email, 
          username: profile.name,
          password: currentPasswordInput 
        }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setIsVerified(true); // 🔓 UNLOCK THE FIELDS!
      } else {
        Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "كلمة المرور غير صحيحة" : "Incorrect current password.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not connect to database. Check your network.");
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  // 4️⃣ STEP 2: SAVE CHANGES AFTER UNLOCKING
  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const updateRes = await fetch(`${SERVER_URL}/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          username: profile.name,
          email: profile.email,
          password: profile.newPassword || currentPasswordInput // keep old if no new one provided
        }),
      });

      if (updateRes.ok) {
        // Update local storage so Profile and Home screen update instantly
        await AsyncStorage.setItem('userName', profile.name);
        await AsyncStorage.setItem('userEmail', profile.email);
        await AsyncStorage.setItem('userBio', profile.bio);
        
        Alert.alert(isRTL ? "نجاح" : "Success", isRTL ? "تم تحديث البيانات بنجاح" : "Profile updated successfully!");
        
        // Relock the fields after saving for security
        setCurrentPasswordInput(''); 
        setProfile({ ...profile, newPassword: '' });
        setIsVerified(false);
      }
    } catch (e) {
      Alert.alert("Error", "Could not update profile.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ LOGOUT LOGIC (Fixed Routing Error)
  const handleLogout = () => {
    Alert.alert(
      t.logout || "Log Out",
      lang === 'ar' ? "هل أنت متأكد أنك تريد تسجيل الخروج؟" : "Are you sure you want to log out?",
      [
        { text: lang === 'ar' ? "إلغاء" : "Cancel", style: "cancel" },
        { 
          text: t.logout || "Log Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/'); // Redirects to root instead of causing a 404
          }
        }
      ]
    );
  };

  const isRTL = lang === 'ar';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PUBLIC PROFILE INFO SECTION */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? "الملف الشخصي العام" : "PUBLIC PROFILE"}
        </Text>

        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
            <Image 
              source={{ uri: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=098840&color=fff` }} 
              style={styles.avatar} 
            />
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>

          <InputField label={t.name} value={profile.name} onChange={(v: string) => setProfile({...profile, name: v})} theme={theme} isRTL={isRTL} />
          <InputField label={isRTL ? "نبذة شخصية" : "Bio"} value={profile.bio} onChange={(v: string) => setProfile({...profile, bio: v})} theme={theme} isRTL={isRTL} multiline />
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
            <Text style={styles.saveBtnText}>{isRTL ? "حفظ الملف الشخصي" : "Save Profile"}</Text>
          </TouchableOpacity>
        </View>


        {/* SECURITY & LOGIN SECTION */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left', marginTop: 30 }]}>
          {isRTL ? "الأمان وتسجيل الدخول" : "SECURITY & LOGIN"}
        </Text>

        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* THE LOCK: Current Password */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: PRIMARY_GREEN, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? "كلمة المرور الحالية (مطلوبة للتعديل)" : "Current Password (Required to edit)"}
            </Text>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: isVerified ? PRIMARY_GREEN : theme.border, borderWidth: 1, textAlign: isRTL ? 'right' : 'left' }]} 
              secureTextEntry 
              value={currentPasswordInput} 
              onChangeText={(text) => {
                setCurrentPasswordInput(text);
                setIsVerified(false); // Relock immediately if they change the text
              }}
              placeholder={isRTL ? "أدخل كلمة المرور لفتح التعديل" : "Enter password to unlock"}
              placeholderTextColor={theme.subText}
              editable={!isVerified} // Lock this input once successfully verified
            />
          </View>

          {/* LOCKED FIELDS: Email & New Password */}
          <InputField 
            label={`${t.email} ${isVerified ? '' : '🔒'}`}
            value={isVerified ? profile.email : "••••••••••••@•••.com"} 
            onChange={(v: string) => setProfile({...profile, email: v})} 
            theme={theme} 
            isRTL={isRTL}
            editable={isVerified}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField 
            label={`${isRTL ? "كلمة مرور جديدة (اختياري)" : "New Password (Optional)"} ${isVerified ? '' : '🔒'}`} 
            value={profile.newPassword} 
            onChange={(v: string) => setProfile({...profile, newPassword: v})} 
            theme={theme}
            isRTL={isRTL}
            secureTextEntry 
            editable={isVerified}
            placeholder={isRTL ? "اتركه فارغاً إذا لم ترد التغيير" : "Leave blank to keep current"}
          />

          {/* DYNAMIC BUTTON: Verify -> Update */}
          <TouchableOpacity 
            style={[styles.saveBtn, { opacity: currentPasswordInput.length > 0 ? 1 : 0.5 }]} 
            onPress={isVerified ? handleSaveChanges : handleVerifyUnlock} 
            disabled={verifying || loading || currentPasswordInput.length === 0}
          >
            {verifying || loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.saveBtnText}>
                {isVerified 
                  ? (isRTL ? "تحديث الأمان" : "Update Security") 
                  : (isRTL ? "التحقق للفتح" : "Verify to Unlock")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* PREFERENCES SECTION */}
        <Text style={[styles.sectionLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left', marginTop: 30 }]}>
          {t.preferences || (isRTL ? "التفضيلات" : "PREFERENCES")}
        </Text>
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.rowLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="weather-night" size={22} color={PRIMARY_GREEN} />
              <Text style={[styles.label, { color: theme.text, marginLeft: isRTL ? 0 : 15, marginRight: isRTL ? 15 : 0 }]}>{t.darkMode}</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: PRIMARY_GREEN }} />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={[styles.rowLabel, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 15 }]}>
            <MaterialCommunityIcons name="translate" size={22} color={PRIMARY_GREEN} />
            <Text style={[styles.label, { color: theme.text, marginLeft: isRTL ? 0 : 15, marginRight: isRTL ? 15 : 0 }]}>{t.language}</Text>
          </View>
          
          <View style={[styles.langRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {['en', 'fr', 'ar'].map((l) => (
              <TouchableOpacity 
                key={l}
                style={[styles.langBtn, lang === l ? { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN } : { borderColor: theme.border }]} 
                onPress={() => changeLanguage(l as any)}
              >
                <Text style={[styles.langTxt, lang === l ? { color: '#FFF' } : { color: theme.subText }]}>
                  {l === 'en' ? 'EN' : l === 'fr' ? 'FR' : 'AR'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={[styles.logoutBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
          <Text style={[styles.logoutTxt, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>{t.logout}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// 🧩 Helper Component for Text Inputs
const InputField = ({ label, value, onChange, theme, isRTL, editable = true, ...props }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={[styles.inputLabel, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
    <TextInput 
      style={[
        styles.input, 
        { color: theme.text, textAlign: isRTL ? 'right' : 'left', opacity: editable ? 1 : 0.5 }
      ]} 
      value={value} 
      onChangeText={onChange} 
      editable={editable}
      placeholderTextColor={theme.subText}
      {...props} 
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingBottom: 40 },
  
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginHorizontal: 25, marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  group: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  
  // Account Styles
  avatarPicker: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: PRIMARY_GREEN },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: PRIMARY_GREEN, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  
  inputWrapper: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 5, paddingHorizontal: 5 },
  input: { fontSize: 15, fontWeight: '600', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)' },
  
  saveBtn: { backgroundColor: PRIMARY_GREEN, padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // Preference Styles
  row: { justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginVertical: 20, opacity: 0.3 },
  langRow: { justifyContent: 'space-between' },
  langBtn: { flex: 0.31, paddingVertical: 12, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  langTxt: { fontWeight: '800', fontSize: 13 },

  logoutBtn: { marginHorizontal: 20, marginTop: 30, alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: 'rgba(211, 47, 47, 0.1)', borderRadius: 16 },
  logoutTxt: { color: '#D32F2F', fontWeight: '800', fontSize: 16 }
});