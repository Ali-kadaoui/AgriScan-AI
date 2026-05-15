import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const PRIMARY_GREEN = '#098840';

export default function ScannerBottomSheet() {
  const { theme, lang } = useAppContext();
  const isRTL = lang === 'ar';
  
  // 🎭 Fade animation for the darkness
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // This makes the background darkness pop/fade in instantly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => router.back());
  };

  const handleImageAction = async (type: 'camera' | 'library') => {
    let result;
    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    }

    if (result && !result.canceled) {
      router.push({ pathname: '/result', params: { imageUri: result.assets[0].uri } });
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* 🌑 STATIC DARK BACKDROP (Doesn't slide) */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* ⚪ THE SLIDING SHEET */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <Text style={[styles.title, { color: theme.text }]}>
          {isRTL ? 'فحص النبات' : 'Scan Your Plant'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          {isRTL ? 'التقط صورة أو اختر واحدة من المعرض للتحليل' : 'Take a photo or choose from gallery to analyze'}
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]} 
            onPress={() => handleImageAction('camera')}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(9, 136, 64, 0.1)' }]}>
              <MaterialCommunityIcons name="camera-plus" size={32} color={PRIMARY_GREEN} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              {isRTL ? 'الكاميرا' : 'Camera'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, { backgroundColor: theme.background, borderColor: theme.border }]} 
            onPress={() => handleImageAction('library')}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(9, 136, 64, 0.1)' }]}>
              <MaterialCommunityIcons name="image-multiple" size={32} color={PRIMARY_GREEN} />
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>
              {isRTL ? 'المعرض' : 'Gallery'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.cancelBtn, { backgroundColor: theme.border + '50' }]} 
          onPress={handleClose}
        >
          <Text style={[styles.cancelTxt, { color: theme.text }]}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 20,
    opacity: 0.5
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
  },
  optionCard: {
    flex: 0.48,
    paddingVertical: 25,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelTxt: {
    fontSize: 16,
    fontWeight: '700',
  },
});