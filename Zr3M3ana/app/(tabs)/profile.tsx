import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserScans, getUserWikiPlants, API_URL } from '../../api';
import { useAppContext } from '../../context/AppContext';

const { width } = Dimensions.get('window');
const imgSize = width / 3 - 1.35; 
const PRIMARY_GREEN = '#098840';

export default function ProfileScreen() {
  const { theme, t, lang } = useAppContext();
  const [activeTab, setActiveTab] = useState<'scans' | 'wiki'>('scans');
  const [scans, setScans] = useState<any[]>([]);
  const [wikiPlants, setWikiPlants] = useState<any[]>([]); 
  
  const [userName, setUserName] = useState('');
  const [userBio, setUserBio] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const bio = await AsyncStorage.getItem('userBio');
      const avatar = await AsyncStorage.getItem('userAvatar');
      const userId = await AsyncStorage.getItem('userId');

      if (name) setUserName(name);
      if (bio) setUserBio(bio);
      if (avatar) setUserAvatar(avatar);

      if (userId) {
        const [scanData, wikiData] = await Promise.all([
          getUserScans(userId),
          getUserWikiPlants(userId)
        ]);
        setScans(scanData || []);
        setWikiPlants(wikiData || []);
      }
    } catch (error) {
      console.error("Database Load Error", error);
    }
  };

  const isRTL = lang === 'ar';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 🔝 TOP NAVIGATION BAR */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.topBarLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={theme.text} />
          <Text style={[styles.topUsername, { color: theme.text, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            {userName ? userName.toLowerCase().replace(/\s+/g, '_') : 'farmer_account'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <MaterialCommunityIcons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER */}
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: userAvatar || `https://ui-avatars.com/api/?name=${userName || 'User'}&background=098840&color=fff&size=200` }} 
              style={[styles.avatar, { borderColor: theme.border }]} 
              contentFit="cover"
            />
          </View>
          
          <View style={[styles.statsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{scans.length}</Text>
              <Text style={[styles.statLabel, { color: theme.subText }]}>{t.scans}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.text }]}>{wikiPlants.length}</Text>
              <Text style={[styles.statLabel, { color: theme.subText }]}>{t.saved}</Text>
            </View>
          </View>
        </View>

        {/* BIO SECTION */}
        <View style={[styles.bioContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.displayName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.bioText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {userBio || t.student}
          </Text>
          {/* 🌟 FIXED: Removed the emoji and used Material Icon with theme colors */}
          <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MaterialCommunityIcons name="map-marker" size={14} color={theme.subText} />
            <Text style={[styles.locationText, { color: theme.subText, marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }]}>
              {t.city || 'Marrakesh, Morocco'}
            </Text>
          </View>
        </View>

        {/* TABS */}
        <View style={[styles.tabBar, { borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'scans' && { borderBottomColor: theme.text, borderBottomWidth: 1.5 }]} 
            onPress={() => setActiveTab('scans')}
          >
            <MaterialCommunityIcons name="grid" size={26} color={activeTab === 'scans' ? theme.text : theme.subText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'wiki' && { borderBottomColor: theme.text, borderBottomWidth: 1.5 }]} 
            onPress={() => setActiveTab('wiki')}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={26} color={activeTab === 'wiki' ? theme.text : theme.subText} />
          </TouchableOpacity>
        </View>

        {/* CONTENT GRID */}
        <View style={[styles.gridContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {activeTab === 'scans' ? (
            scans.map((scan) => (
              <TouchableOpacity 
                key={scan.id} 
                style={styles.gridItem}
                onPress={() => router.push({ 
                  pathname: '/result', 
                  params: { 
                    imageUri: `${API_URL}/${scan.image_url}`, 
                    pastDisease: scan.disease,
                    id: scan.id,
                    // 🌟 THE FIX: Pass all the detailed info to the Result screen!
                    pastTreatment: scan.treatment,
                    pastConfidence: scan.confidence,
                    pastPlantName: scan.plantName
                  } 
                })}
              >
                <Image 
                  source={{ uri: `${API_URL}/${scan.image_url}` }} 
                  style={styles.gridImage} 
                  transition={200} 
                />
              </TouchableOpacity>
            ))
          ) : (
            wikiPlants.map((plant, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.gridItem}
                onPress={() => router.push({ pathname: '/plant_detail', params: { plantName: plant.name, imageUrl: plant.image } })}
              >
                <Image source={{ uri: plant.image }} style={styles.gridImage} transition={200} />
                <View style={styles.gridLabel}>
                  <Text style={styles.gridLabelText} numberOfLines={1}>{plant.name}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 🚀 FLOATING SCAN BUTTON (Position adapts based on RTL) */}
      <TouchableOpacity 
        style={[styles.floatingScanBtn, isRTL ? { left: 20 } : { right: 20 }]} 
        onPress={() => router.push('/scanner')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="camera-iris" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 50 },
  topBar: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44, marginBottom: 10 },
  topBarLeft: { alignItems: 'center' },
  topUsername: { fontSize: 18, fontWeight: '800' },
  header: { paddingHorizontal: 20, marginTop: 10, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 1 },
  statsContainer: { flex: 1, justifyContent: 'space-around', marginLeft: 15 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  bioContainer: { paddingHorizontal: 20, marginTop: 15 },
  displayName: { fontSize: 15, fontWeight: '700' },
  bioText: { fontSize: 14, marginTop: 2 },
  
  locationRow: { alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 13, fontWeight: '500' },
  
  tabBar: { flexDirection: 'row', marginTop: 25, borderTopWidth: 0.5 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  gridContainer: { flexWrap: 'wrap', marginTop: 1, paddingBottom: 100 },
  gridItem: { width: imgSize, height: imgSize, margin: 0.65, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#eee' },
  gridLabel: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(9, 136, 64, 0.8)', paddingVertical: 4 },
  gridLabelText: { color: '#FFF', fontSize: 10, fontWeight: '800', textAlign: 'center' },

  floatingScanBtn: {
    position: 'absolute',
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 999,
  }
});