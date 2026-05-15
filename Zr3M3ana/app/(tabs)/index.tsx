import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAppContext } from '../../context/AppContext';
import { getRandomFacts } from '../../api';

const BACKEND_URL = "http://192.168.11.101:8000";
const PRIMARY_GREEN = '#098840';

const AMAZING_PLANT_FACTS_EN = [
  "Plants can actually communicate! They use chemical signals through their roots to warn neighbors of pests.",
  "Adding a layer of mulch helps retain soil moisture and drastically reduces weeds.",
  "Overwatering is the number one cause of plant decay. Always check soil depth before adding water.",
  "Earthworms are a farmer's best friend. They naturally aerate the soil and break down organic matter.",
  "Certain companion plants, like Marigolds, naturally repel nematodes and pests away from your main crops.",
  "Photosynthesis is most active during the morning hours. Early watering prepares plants for maximum energy absorption."
];

const AMAZING_PLANT_FACTS_AR = [
  "النباتات يمكنها التواصل فعليًا! تستخدم إشارات كيميائية عبر جذورها لتحذير جيرانها من الآفات.",
  "إضافة طبقة من المهاد تساعد في الاحتفاظ برطوبة التربة وتقلل بشكل كبير من الأعشاب الضارة.",
  "الإفراط في الري هو السبب الأول لتعفن النباتات. تحقق دائمًا من عمق التربة قبل إضافة الماء.",
  "ديدان الأرض هي أفضل صديق للمزارع. فهي تهوي التربة بشكل طبيعي وتحلل المواد العضوية.",
  "بعض النباتات المرافقة، مثل المخملية، تطرد بشكل طبيعي الديدان الخيطية والآفات بعيدًا عن محاصيلك الرئيسية.",
  "عملية البناء الضوئي تكون أكثر نشاطًا في الصباح. الري المبكر يعد النباتات لامتصاص الطاقة بأقصى قدر."
];

export default function HomeScreen() {
  const { theme, lang } = useAppContext();
  const isRTL = lang === 'ar';
  
  const [userName, setUserName] = useState('Farmer');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  const [facts, setFacts] = useState<any[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isLoadingFacts, setIsLoadingFacts] = useState(true);

  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(true);
  const [isScansError, setIsScansError] = useState(false);

  const [weather, setWeather] = useState({
    temp: '--', humidity: '--', wind: '--', precipitation: '--',
    condition: isRTL ? 'جاري التحميل' : 'Loading', 
    icon: 'weather-partly-cloudy', 
    city: isRTL ? 'جاري تحديد الموقع...' : 'Locating...',
    isLoading: true, isRefreshing: false
  });

  useEffect(() => {
    fetchLiveFacts();
    fetchLiveWeather(); 
  }, [lang]);

  useFocusEffect(
    useCallback(() => { 
      const loadUserData = async () => {
        const name = await AsyncStorage.getItem('userName');
        if (name) setUserName(name.split(' ')[0]);

        // 🌟 THE FIX: Looking for 'userAvatar' to match your Profile Screen
        const storedImage = await AsyncStorage.getItem('userAvatar');
        if (storedImage) {
          setProfilePic(storedImage);
        } else {
          setProfilePic(null);
        }
      };

      loadUserData();
      fetchUserHistory(); 
    }, [])
  );

  const fetchUserHistory = async () => {
    setIsScansError(false);
    setIsLoadingScans(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`${BACKEND_URL}/users/${userId}/scans`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setRecentScans(data.slice(-5).reverse());
    } catch (error) {
      console.error("History Error:", error);
      setIsScansError(true);
    } finally {
      setIsLoadingScans(false);
    }
  };

  const fetchLiveWeather = async () => {
    setWeather(prev => ({ ...prev, isRefreshing: true }));
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather(prev => ({ ...prev, city: isRTL ? 'تم رفض الإذن' : 'Permission Denied', isLoading: false, isRefreshing: false }));
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let cityName = reverseGeocode[0]?.city || reverseGeocode[0]?.region || (isRTL ? 'موقع غير معروف' : 'Unknown Location');

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&timezone=auto`;
      const res = await fetch(weatherUrl);
      const data = await res.json();

      const code = data.current.weather_code;
      let conditionText = isRTL ? "صافي" : "Clear"; let conditionIcon = "weather-sunny";
      if (code >= 1 && code <= 3) { conditionText = isRTL ? "غائم" : "Cloudy"; conditionIcon = "weather-cloudy"; }
      else if (code >= 45 && code <= 48) { conditionText = isRTL ? "ضبابي" : "Foggy"; conditionIcon = "weather-fog"; }
      else if (code >= 51 && code <= 67) { conditionText = isRTL ? "ممطر" : "Rainy"; conditionIcon = "weather-rainy"; }
      else if (code >= 71 && code <= 77) { conditionText = isRTL ? "مثلج" : "Snowing"; conditionIcon = "weather-snowy"; }
      else if (code >= 95) { conditionText = isRTL ? "عاصف" : "Stormy"; conditionIcon = "weather-lightning"; }

      setWeather({
        temp: Math.round(data.current.temperature_2m).toString(), humidity: data.current.relative_humidity_2m.toString(),
        wind: Math.round(data.current.wind_speed_10m).toString(), precipitation: data.current.precipitation.toString(),
        condition: conditionText, icon: conditionIcon, city: cityName, isLoading: false, isRefreshing: false
      });
    } catch (error) {
      setWeather(prev => ({ ...prev, city: isRTL ? 'الطقس غير متصل' : 'Weather Offline', isLoading: false, isRefreshing: false }));
    }
  };

  const fetchLiveFacts = async () => {
    setIsLoadingFacts(true);
    try {
      const apiFacts = await getRandomFacts();
      if (apiFacts && apiFacts.length > 0) {
        const factList = isRTL ? AMAZING_PLANT_FACTS_AR : AMAZING_PLANT_FACTS_EN;
        const enhancedFacts = apiFacts.map((fact: any, index: number) => ({
          ...fact,
          subtitle: factList[index % factList.length]
        }));
        setFacts(enhancedFacts);
      }
    } catch (error) {
      console.error("Failed to load facts", error);
    } finally {
      setIsLoadingFacts(false);
    }
  };

  const handleNextFact = () => { if (facts?.length > 0) setCurrentFactIndex((prev) => (prev + 1) % facts.length); };
  const currentFact = facts?.length > 0 ? facts[currentFactIndex] : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTextContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.greetingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.greeting, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'مرحباً، ' : 'Hello, '}{userName}
              </Text>
              <MaterialCommunityIcons name="hand-wave" size={26} color="#F5B041" style={{ marginHorizontal: 8 }} />
            </View>
            <Text style={[styles.subGreeting, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'هل أنت مستعد لتفقد محاصيلك؟' : 'Ready to check on your crops?'}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Image 
              source={{ uri: profilePic || `https://ui-avatars.com/api/?name=${userName}&background=098840&color=fff` }} 
              style={styles.profileAvatar} 
              contentFit="cover"
              cachePolicy="none"
              onError={() => setProfilePic(null)}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.scanBanner, { backgroundColor: PRIMARY_GREEN, flexDirection: isRTL ? 'row-reverse' : 'row' }]} 
          onPress={() => router.push('/scanner')}
          activeOpacity={0.8}
        >
          <View style={[styles.scanBannerText, { paddingRight: isRTL ? 0 : 15, paddingLeft: isRTL ? 15 : 0, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.scanBannerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تشخيص صحة النبات' : 'Diagnose Plant Health'}
            </Text>
            <Text style={[styles.scanBannerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'التقط صورة لاكتشاف الأمراض والحصول على خطط علاج فورية.' : 'Take a picture to detect diseases and get instant treatment plans.'}
            </Text>
          </View>
          <View style={styles.scanBannerIconBox}>
            <MaterialCommunityIcons name="camera-iris" size={38} color={PRIMARY_GREEN} />
          </View>
        </TouchableOpacity>

        <View style={[styles.weatherCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={[styles.weatherHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.weatherLocation, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color={PRIMARY_GREEN} />
              <Text style={[styles.cityText, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{weather.city}</Text>
            </View>
            <TouchableOpacity onPress={fetchLiveWeather} disabled={weather.isRefreshing} style={styles.refreshBtn}>
              <MaterialCommunityIcons name="refresh" size={24} color={theme.subText} style={weather.isRefreshing ? { opacity: 0.5 } : {}} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.weatherBody, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.weatherConditionBox}>
              <MaterialCommunityIcons name={weather.icon as any} size={60} color={PRIMARY_GREEN} />
              <Text style={[styles.conditionText, { color: theme.text }]}>{weather.condition}</Text>
            </View>
            {weather.isLoading ? (
              <ActivityIndicator color={PRIMARY_GREEN} size="large" />
            ) : (
              <Text style={[styles.tempText, { color: theme.text }]}>{weather.temp}<Text style={styles.tempDegree}>°C</Text></Text>
            )}
          </View>
          
          <View style={[styles.weatherFooter, { borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.weatherDetailBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="water-percent" size={22} color={PRIMARY_GREEN} />
              <Text style={[styles.weatherDetail, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{weather.humidity}%</Text>
            </View>
            <View style={[styles.weatherDetailBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="weather-windy" size={22} color={PRIMARY_GREEN} />
              <Text style={[styles.weatherDetail, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{weather.wind} km/h</Text>
            </View>
            <View style={[styles.weatherDetailBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialCommunityIcons name="umbrella" size={22} color={PRIMARY_GREEN} />
              <Text style={[styles.weatherDetail, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{weather.precipitation}mm</Text>
            </View>
          </View>
        </View>

        {(recentScans?.length > 0 || isScansError) && (
          <View style={styles.historySection}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{isRTL ? 'الفحوصات الأخيرة' : 'Recent Scans'}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={[styles.linkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.seeAllText, { color: PRIMARY_GREEN }]}>{isRTL ? 'عرض الكل' : 'Show All'}</Text>
                <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={PRIMARY_GREEN} />
              </TouchableOpacity>
            </View>
            
            {isScansError ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D32F2F" />
                <Text style={[styles.errorBannerText, { color: theme.text }]}>{isRTL ? 'تعذر تحميل السجل.' : 'Could not load history.'}</Text>
                <TouchableOpacity style={styles.retrySmallBtn} onPress={fetchUserHistory}>
                   <MaterialCommunityIcons name="refresh" size={16} color="#FFF" />
                   <Text style={styles.retrySmallBtnText}>{isRTL ? 'إعادة' : 'Retry'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {recentScans.map((scan, index) => {
                const plantName = scan.disease.includes(' - ') ? scan.disease.split(' - ')[0] : 'Plant';
                const diseaseName = scan.disease.includes(' - ') ? scan.disease.split(' - ')[1] : scan.disease;
                const isHealthy = diseaseName.toLowerCase().includes('healthy');

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/result', params: { imageUri: `${BACKEND_URL}/${scan.image_url}`, pastDisease: scan.disease, id: scan.id } })}
                  >
                    <Image source={{ uri: `${BACKEND_URL}/${scan.image_url}` }} style={styles.historyImg} contentFit="cover" />
                    <View style={styles.historyTextContainer}>
                      <Text style={[styles.historyPlant, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{plantName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: isHealthy ? 'rgba(9, 136, 64, 0.15)' : 'rgba(211, 47, 47, 0.15)', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.statusText, { color: isHealthy ? PRIMARY_GREEN : '#D32F2F' }]} numberOfLines={1}>
                          {diseaseName}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.factSectionWrapper}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{isRTL ? 'رؤى يومية' : 'Daily Insights'}</Text>
            <TouchableOpacity onPress={handleNextFact} disabled={isLoadingFacts} style={[styles.linkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.seeAllText, { color: PRIMARY_GREEN }]}>{isRTL ? 'حقيقة تالية' : 'Next Fact'}</Text>
              <MaterialCommunityIcons name="refresh" size={18} color={PRIMARY_GREEN} style={{ marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }} />
            </TouchableOpacity>
          </View>

          {isLoadingFacts ? (
            <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            </View>
          ) : currentFact ? (
            <TouchableOpacity 
              style={[styles.factCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/plant_detail', params: { plantName: currentFact.searchName, imageUrl: currentFact.image } })}
            >
              <Image source={{ uri: currentFact.image }} style={styles.factImage} contentFit="cover" transition={300} />
              <View style={styles.factOverlay}>
                <View style={styles.glassmorphismBox}>
                  <Text style={[styles.factTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{currentFact.title}</Text>
                  <Text style={[styles.factSubtitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={3}>{currentFact.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTextContainer: { flex: 1, paddingHorizontal: 10 },
  greetingRow: { alignItems: 'center', flexWrap: 'wrap' },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { fontSize: 15, marginTop: 4, fontWeight: '500' },
  profileAvatar: { width: 55, height: 55, borderRadius: 28, borderWidth: 2, borderColor: PRIMARY_GREEN },

  scanBanner: { alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, marginBottom: 30, elevation: 6, shadowColor: PRIMARY_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  scanBannerText: { flex: 1 },
  scanBannerTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  scanBannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  scanBannerIconBox: { width: 65, height: 65, backgroundColor: '#FFF', borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: 4 },

  weatherCard: { borderRadius: 24, padding: 22, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 30 },
  weatherHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  weatherLocation: { alignItems: 'center' },
  refreshBtn: { padding: 5 },
  cityText: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  weatherBody: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 25, paddingHorizontal: 10 },
  weatherConditionBox: { flexDirection: 'column', alignItems: 'center' },
  conditionText: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  tempText: { fontSize: 64, fontWeight: '800', letterSpacing: -3 },
  tempDegree: { fontSize: 28, fontWeight: '600', opacity: 0.5 },
  weatherFooter: { justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 20 },
  weatherDetailBox: { alignItems: 'center' },
  weatherDetail: { fontSize: 16, fontWeight: '700' },

  sectionHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, flexShrink: 1 },
  linkRow: { alignItems: 'center', flexShrink: 0 },
  seeAllText: { fontSize: 15, fontWeight: '700' },

  factSectionWrapper: { marginBottom: 10 },
  factCard: { height: 280, borderRadius: 28, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
  factImage: { width: '100%', height: '100%', position: 'absolute' },
  factOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  glassmorphismBox: { 
    backgroundColor: 'rgba(9, 136, 64, 0.85)',
    padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden'
  },
  factTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 },
  factSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.95)', lineHeight: 22 },

  historySection: { marginBottom: 15 },
  historyCard: { width: 150, height: 190, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  historyImg: { width: '100%', height: 110, backgroundColor: '#EEE' },
  historyTextContainer: { padding: 12, flex: 1, justifyContent: 'space-between' },
  historyPlant: { fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  loadingCard: { height: 280, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(211, 47, 47, 0.1)', padding: 16, borderRadius: 16, marginTop: 10 },
  errorBannerText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  retrySmallBtn: { flexDirection: 'row', backgroundColor: PRIMARY_GREEN, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  retrySmallBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 4 }
});