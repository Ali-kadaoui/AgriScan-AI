import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, LogBox, Alert } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveWikiPlant, removeWikiPlant, searchWikiPlants, getUserWikiPlants } from '../api';
import { useAppContext } from '../context/AppContext';

// Silences the SafeAreaView warning
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const PRIMARY_GREEN = '#098840';

const InfoRow = ({ icon, label, value, theme }: any) => (
  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
    <View style={styles.infoLabelContainer}>
      <MaterialCommunityIcons name={icon} size={22} color={PRIMARY_GREEN} style={styles.infoIcon} />
      <Text style={[styles.infoLabel, { color: theme.text }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { color: theme.subText }]}>{value || 'N/A'}</Text>
  </View>
);

export default function PlantDetailScreen() {
  const { plantName, imageUrl } = useLocalSearchParams<{ plantName: string, imageUrl?: string }>();
  const { theme } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  
  const [plantData, setPlantData] = useState<any>({
    name: plantName,
    scientific_name: 'Unknown',
    image_url: imageUrl || 'https://images.unsplash.com/photo-1599598425947-330026e16a69?auto=format&fit=crop&w=600&q=80',
    watering: '', sunlight: '', soil: '', temperature: '', harvest_time: '', fertilizer: '', diseases: '', description: ''
  });

  useEffect(() => {
    const fetchPlantAndStatus = async () => {
      try {
        const res = await searchWikiPlants(plantName as string, imageUrl as any);
        if (res && res.length > 0) {
          const fetchedPlant = res[0];
          setPlantData(fetchedPlant);
          
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            const savedList = await getUserWikiPlants(userId);
            const exists = savedList.some((p: any) => p.name === fetchedPlant.name);
            setIsSaved(exists);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlantAndStatus();
  }, [plantName]);

  // 🌟 The Unified Toggle Function (Save & Remove)
  const handleToggleSave = async () => {
    if (isSaving) return;
    
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    if (isSaved) {
      // If already saved, ask to remove
      Alert.alert(
        "Remove Plant",
        `Are you sure you want to remove ${plantData.name} from your library?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove", 
            style: "destructive", 
            onPress: async () => {
              setIsSaving(true);
              try {
                await removeWikiPlant(userId, plantData.name);
                setIsSaved(false);
              } catch (error) {
                Alert.alert("Error", "Could not remove plant.");
              } finally {
                setIsSaving(false);
              }
            } 
          }
        ]
      );
    } else {
      // If not saved, save it
      setIsSaving(true);
      try {
        await saveWikiPlant(userId, plantData.name, plantData.image_url);
        setIsSaved(true);
      } catch (error) {
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <StatusBar hidden={isImageFullScreen} />

      <ImageViewing
        images={[{ uri: plantData.image_url }]}
        imageIndex={0}
        visible={isImageFullScreen}
        onRequestClose={() => setIsImageFullScreen(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        backgroundColor="#000000" 
      />

      {/* 🌟 Top Navigation (Trash Icon Removed) */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsImageFullScreen(true)}>
          <Image source={{ uri: plantData.image_url }} style={styles.mainImage} contentFit="cover" transition={200} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.titleRow}>
              
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="leaf" size={28} color={PRIMARY_GREEN} />
              </View>
              
              <View style={styles.nameContainer}>
                <Text style={[styles.mainTitle, { color: theme.text }]}>{plantData.name}</Text>
                {!isLoading && (
                  <Text style={[styles.subTitle, { color: theme.subText }]}>{plantData.scientific_name}</Text>
                )}
              </View>

              {/* 🌟 Unified Save/Remove Toggle Button */}
              <TouchableOpacity 
                style={[
                  styles.addBtn, 
                  { 
                    backgroundColor: isSaved ? 'rgba(76, 175, 80, 0.1)' : PRIMARY_GREEN,
                    borderWidth: isSaved ? 1 : 0,
                    borderColor: PRIMARY_GREEN
                  }
                ]} 
                onPress={handleToggleSave} // Now triggers the toggle logic
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={isSaved ? PRIMARY_GREEN : '#FFF'} />
                ) : (
                  <Text style={[styles.addBtnText, { color: isSaved ? PRIMARY_GREEN : '#FFF' }]}>
                    {isSaved ? '✓ Saved' : '+ Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="large" color={PRIMARY_GREEN} />
              <Text style={[styles.loadingText, { color: theme.text }]}>AgriBot is analyzing this plant...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <InfoRow icon="water" label="Watering" value={plantData.watering} theme={theme} />
                <InfoRow icon="weather-sunny" label="Sunlight" value={plantData.sunlight} theme={theme} />
                <InfoRow icon="sprout-outline" label="Soil" value={plantData.soil} theme={theme} />
                <InfoRow icon="thermometer" label="Temperature" value={plantData.temperature} theme={theme} />
                <InfoRow icon="barley" label="Harvest" value={plantData.harvest_time} theme={theme} />
                <InfoRow icon="flask-outline" label="Fertilizer" value={plantData.fertilizer} theme={theme} />
                <InfoRow icon="virus-outline" label="Diseases" value={plantData.diseases} theme={theme} />
              </View>

              <View style={[styles.aboutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.aboutHeader}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color={PRIMARY_GREEN} />
                  <Text style={[styles.aboutTitle, { color: theme.text }]}>About</Text>
                </View>
                <Text style={[styles.aboutText, { color: theme.subText }]}>{plantData.description}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  topNav: { position: 'absolute', top: 50, left: 20, zIndex: 10, flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  
  scrollArea: { flex: 1 },
  mainImage: { width: '100%', height: 320 },
  contentContainer: { padding: 15, marginTop: -35 },
  
  headerCard: { borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, marginBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(9, 136, 64, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nameContainer: { flex: 1 },
  mainTitle: { fontSize: 22, fontWeight: '800' },
  subTitle: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 85, alignItems: 'center', marginLeft: 10 },
  addBtnText: { fontWeight: '800', fontSize: 14 },
  
  loadingCard: { borderRadius: 20, padding: 40, alignItems: 'center', elevation: 2, borderWidth: 1, marginBottom: 15 },
  loadingText: { marginTop: 20, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  
  statsCard: { borderRadius: 20, paddingHorizontal: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  infoLabelContainer: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  infoIcon: { marginRight: 12 },
  infoLabel: { fontSize: 14, fontWeight: '700' },
  infoValue: { fontSize: 14, width: '55%', textAlign: 'right', fontWeight: '600' },
  
  aboutCard: { borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, marginBottom: 40 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aboutTitle: { fontSize: 18, fontWeight: '800', marginLeft: 8 },
  aboutText: { fontSize: 15, lineHeight: 24 }
});