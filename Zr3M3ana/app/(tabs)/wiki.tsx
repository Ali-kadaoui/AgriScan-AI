import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { getWikiSuggestions } from '../../api';

// 🌿 YOUR CORE BRAND COLOR
const PRIMARY_GREEN = '#098840';

export default function WikiScreen() {
  const { theme, t, lang } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchCache = useRef<Record<string, any[]>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem('wikiSearchHistory');
      if (historyData) setRecentSearches(JSON.parse(historyData));
    } catch (error) {}
  };

  const saveToHistory = async (plant: any) => {
    try {
      const filteredHistory = recentSearches.filter(p => p.name !== plant.name);
      const updatedHistory = [plant, ...filteredHistory].slice(0, 8);
      setRecentSearches(updatedHistory);
      await AsyncStorage.setItem('wikiSearchHistory', JSON.stringify(updatedHistory));
    } catch (error) {}
  };

  const clearHistory = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem('wikiSearchHistory');
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    if (searchCache.current[query]) {
      setSuggestions(searchCache.current[query]);
      setIsSearching(false);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await getWikiSuggestions(query);
        const sortedResults = results.sort((a: any, b: any) => {
          const aStarts = a.name.toLowerCase().startsWith(query) ? -1 : 1;
          const bStarts = b.name.toLowerCase().startsWith(query) ? -1 : 1;
          return aStarts - bStarts;
        });

        searchCache.current[query] = sortedResults;
        setSuggestions(sortedResults);
      } catch (error) {
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectPlant = (plant: any) => {
    Keyboard.dismiss();
    saveToHistory(plant);
    router.push({
      pathname: '/plant_detail',
      params: { plantName: plant.name, imageUrl: plant.image }
    });
  };

  const isRTL = lang === 'ar';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* 🌿 DYNAMIC HEADER */}
        <View style={[styles.header, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t.wikiTitle || (isRTL ? "مكتبة النباتات" : "Plant Library")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? "ابحث في قاعدة البيانات العالمية للنباتات" : "Search our global plant database"}
          </Text>
        </View>

        <View style={styles.contentContainer}>
          
          {/* 🔍 SEARCH BAR (Language Sensitive) */}
          <View style={styles.searchWrapper}>
            <View style={[
              styles.searchInputContainer, 
              { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <MaterialCommunityIcons name="magnify" size={24} color={PRIMARY_GREEN} style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t.search}
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => Keyboard.dismiss()} 
                returnKeyType="done"
                autoCorrect={false}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={PRIMARY_GREEN} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={theme.subText} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollPadding}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* 🕒 RECENT SEARCHES */}
            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <View style={styles.historySection}>
                <View style={[styles.historyHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {t.recentScans}
                  </Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={[styles.clearHistoryTxt, { color: PRIMARY_GREEN }]}>
                      {isRTL ? "مسح الكل" : "Clear"}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={[styles.horizontalScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  {recentSearches.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                      onPress={() => handleSelectPlant(item)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: item.image }} style={styles.historyCardImg} contentFit="cover" transition={200} />
                      <View style={styles.historyCardOverlay}>
                        <View style={styles.glassmorphismBox}>
                          <Text style={styles.historyCardName} numberOfLines={1}>{item.name}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 📚 EMPTY STATE */}
            {searchQuery.length === 0 && recentSearches.length === 0 && (
              <View style={styles.placeholderContainer}>
                <View style={[styles.placeholderIconBg, { backgroundColor: 'rgba(9, 136, 64, 0.1)' }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={50} color={PRIMARY_GREEN} />
                </View>
                <Text style={[styles.placeholderTitle, { color: theme.text }]}>
                  {isRTL ? "ابدأ الاستكشاف" : "Start Exploring"}
                </Text>
                <Text style={[styles.placeholderText, { color: theme.subText }]}>
                  {isRTL 
                    ? "اكتب اسم أي نبات أعلاه لفتح تعليمات الرعاية المتخصصة ، واحتياجات ضوء الشمس ، والأمراض الشائعة."
                    : "Type any plant name above to unlock specialized care instructions, sunlight needs, and common diseases."}
                </Text>
              </View>
            )}

            {/* 📜 SUGGESTIONS LIST */}
            {searchQuery.length > 0 && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                <Text style={[styles.resultsCount, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>
                  {suggestions.length} {isRTL ? "نتائج" : "results found"}
                </Text>
                {suggestions.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.suggestionItem, 
                      { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}
                    onPress={() => handleSelectPlant(item)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.image }} style={styles.suggestionImg} contentFit="cover" transition={200} />
                    <View style={[styles.suggestionTextContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.suggestionName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.suggestionScientific, { color: theme.subText }]} numberOfLines={1}>{item.scientific_name}</Text>
                    </View>
                    <MaterialCommunityIcons 
                      name={isRTL ? "chevron-left" : "chevron-right"} 
                      size={24} 
                      color={PRIMARY_GREEN} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 🚫 NO RESULTS FOUND */}
            {searchQuery.length >= 2 && !isSearching && hasSearched && suggestions.length === 0 && (
              <View style={styles.noResultsContainer}>
                <MaterialCommunityIcons name="cloud-search-outline" size={80} color={theme.border} style={{ opacity: 0.6 }} />
                <Text style={[styles.noResultsText, { color: theme.text }]}>
                  {isRTL ? "لا توجد نتائج لـ" : "No plants found for"} "{searchQuery}"
                </Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 70 : 60, paddingBottom: 25, paddingHorizontal: 25 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 16, fontWeight: '500' },
  contentContainer: { flex: 1 },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  searchInputContainer: { alignItems: 'center', height: 60, borderRadius: 20, paddingHorizontal: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  scrollPadding: { paddingBottom: 50 },
  historySection: { marginTop: 10 },
  historyHeaderRow: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  clearHistoryTxt: { fontSize: 15, fontWeight: '700' },
  horizontalScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  historyCard: { width: 140, height: 180, borderRadius: 22, marginRight: 15, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  historyCardImg: { width: '100%', height: '100%', position: 'absolute' },
  historyCardOverlay: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  glassmorphismBox: { 
    backgroundColor: 'rgba(9, 136, 64, 0.85)', 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden'
  },
  historyCardName: { color: '#FFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  suggestionsBox: { marginHorizontal: 20, marginTop: 5 },
  resultsCount: { fontSize: 14, fontWeight: '700', marginBottom: 15 },
  suggestionItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  suggestionImg: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#EEE' },
  suggestionTextContainer: { flex: 1, marginHorizontal: 15 },
  suggestionName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  suggestionScientific: { fontSize: 14, fontStyle: 'italic' },
  placeholderContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  placeholderIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  placeholderText: { textAlign: 'center', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  noResultsContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  noResultsText: { fontSize: 20, fontWeight: '800', marginTop: 20, textAlign: 'center' }
});