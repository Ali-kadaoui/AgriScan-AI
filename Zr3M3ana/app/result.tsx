import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { predictDisease, chatWithBot, deletePlant, saveScan } from '../api'; 
import { useAppContext } from '../context/AppContext'; 

const PRIMARY_GREEN = '#098840';

export default function ResultScreen() {
  // 🌟 FIX: Added pastTreatment, pastConfidence, and pastPlantName to the params
  const { imageUri, pastDisease, id, pastTreatment, pastConfidence, pastPlantName } = useLocalSearchParams<any>();
  const { theme, lang } = useAppContext(); 
  const isRTL = lang === 'ar'; 

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isError, setIsError] = useState(false);
  const [isSaved, setIsSaved] = useState(!!pastDisease);
  const [serverImageUrl, setServerImageUrl] = useState('');
  const [currentScanId, setCurrentScanId] = useState(id);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);

  const formatTreatmentText = (text: string) => {
    if (!text) return isRTL ? "لا تتوفر معلومات عن العلاج." : "No treatment information available.";

    let cleaned = text;

    try {
      const regex = /['"]?description['"]?\s*:\s*['"](.*?)['"](}|$|,)/g;
      let matches = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push(match[1]);
      }
      if (matches.length > 0) {
        return matches.map((m, i) => `${i + 1}. ${m}`).join('\n\n');
      }
    } catch (e) {}

    // Strip weird JSON brackets if the AI glitches
    cleaned = cleaned.replace(/\{\s*['"]?step['"]?\s*:\s*\d+\s*,\s*['"]?description['"]?\s*:\s*['"]/g, '');
    cleaned = cleaned.replace(/['"]\s*\}/g, '');
    cleaned = cleaned.replace(/\{\s*['"]?description['"]?\s*:\s*['"]/g, '');

    // 🌟 FIX: Add proper double line breaks before numbers (e.g., " 2. ") so it's a list, not a block of text!
    cleaned = cleaned.replace(/ (\d+\.)/g, '\n\n$1');

    return cleaned.trim();
  };

  useEffect(() => {
    if (pastDisease) {
      // 🌟 FIX: Now it uses the real data passed from the history!
      const pName = pastPlantName || (pastDisease.includes(' - ') ? pastDisease.split(' - ')[0] : (isRTL ? 'نبات محفوظ' : 'Saved Plant'));
      const dName = pastDisease.includes(' - ') ? pastDisease.split(' - ')[1] : pastDisease;
      
      setResult({
        disease: dName,
        confidence: pastConfidence || "Loaded from History",
        treatment: pastTreatment ? formatTreatmentText(pastTreatment) : (isRTL ? `التفاصيل محفوظة في السجل الخاص بك لـ ${dName}.` : `Standard treatment protocol for ${dName}. (Details saved in database).`),
        plantName: pName,
        severity: dName.toLowerCase().includes('healthy') ? 'Safe' : 'High',
      });
      
      setMessages([
        { id: '1', text: isRTL ? `هذا هو فحصك السابق لـ ${pName}. هل تحتاج إلى تذكير بكيفية علاجه؟` : `This is your past scan for ${pName}. Do you need a refresher on how to treat it?`, sender: 'ai' }
      ]);
      setLoading(false);
      
    } else if (imageUri) {
      analyzeImage(imageUri);
    }
  }, [imageUri, pastDisease, pastTreatment, pastConfidence, pastPlantName]);

  const handleRetryAnalysis = () => {
    if (imageUri) analyzeImage(imageUri);
  };

  const analyzeImage = async (uri: string) => {
    setLoading(true);
    setIsError(false);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const data = await predictDisease(uri, userId);
      
      setServerImageUrl(data?.image_url || '');

      const enhancedData = {
        ...data,
        plantName: data?.plantName || (isRTL ? "نبات غير معروف" : "Unknown Plant"), 
        severity: data?.disease?.toLowerCase().includes('healthy') ? 'Safe' : 'High',
        treatment: formatTreatmentText(data?.treatment) 
      };
      
      setResult(enhancedData);
      setMessages([
        { 
          id: '1', 
          text: isRTL 
            ? `لقد انتهيت من تحليل ${enhancedData?.plantName}. يبدو أنه يعاني من ${enhancedData?.disease}. أخبرني إذا كنت بحاجة إلى مساعدة خطوة بخطوة في تطبيق العلاج!`
            : `I finished analyzing your ${enhancedData?.plantName}. It looks like ${enhancedData?.disease}. Let me know if you need step-by-step help applying the treatment!`, 
          sender: 'ai' 
        }
      ]);

    } catch (error) {
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScan = async () => {
    if (isSaved || !result) return;
    try {
      const userId = await AsyncStorage.getItem('userId');
      const data = await saveScan(
        userId,
        serverImageUrl,
        `${result.plantName} - ${result.disease}`,
        result.confidence,
        result.treatment
      );
      if (data.status === 'success') {
        setIsSaved(true);
        setCurrentScanId(data.id);
        Alert.alert(isRTL ? "نجاح" : "Success", isRTL ? "تم حفظ الفحص في السجل!" : "Scan saved to history!");
      }
    } catch (error) {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "تعذر الحفظ." : "Could not save scan.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      isRTL ? "حذف الفحص" : "Delete Scan",
      isRTL ? "هل أنت متأكد أنك تريد إزالة هذا النبات من سجلك؟" : "Are you sure you want to remove this plant from your history?",
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        { 
          text: isRTL ? "حذف" : "Delete", 
          style: "destructive", 
          onPress: async () => {
            const targetId = currentScanId || id;
            if (!targetId) {
              Alert.alert(isRTL ? "انتظر!" : "Hold on!", isRTL ? "لم يتم العثور على معرّف." : "No ID found.");
              return;
            }
            try {
              await deletePlant(targetId);
              Alert.alert(isRTL ? "نجاح" : "Success", isRTL ? "تم الحذف بنجاح!" : "Plant deleted from database!");
              router.replace('/(tabs)/profile'); 
            } catch (error) {
              Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "تعذر الحذف." : "Could not delete.");
            }
          } 
        }
      ]
    );
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    const newUserMessage = { id: Date.now().toString(), text: userText, sender: 'user' };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const context = `The user is looking at a ${result?.plantName} that has been diagnosed with ${result?.disease}. Confidence: ${result?.confidence}.`;
      const data = await chatWithBot(userText, context);
      const aiResponse = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMsg = { id: (Date.now() + 1).toString(), text: isRTL ? "خطأ في الشبكة." : "Network error.", sender: 'ai' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MaterialCommunityIcons name={isRTL ? "arrow-right" : "arrow-left"} size={24} color="#FFF" />
          <Text style={[styles.backTxt, { marginLeft: isRTL ? 0 : 5, marginRight: isRTL ? 5 : 0 }]}>{isRTL ? "رجوع" : "Back"}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{pastDisease ? (isRTL ? "سجل الفحوصات" : "Scan History") : (isRTL ? "نتائج الفحص" : "Scan Results")}</Text>
        
        {isSaved ? (
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
             <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSaveScan} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{isRTL ? "حفظ +" : "+ Save"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {imageUri && <Image source={{ uri: imageUri }} style={[styles.image, { opacity: 0.5, borderColor: theme.border }]} />}
          <ActivityIndicator size="large" color={PRIMARY_GREEN} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>{isRTL ? "جاري تحليل النبات..." : "Analyzing Plant Pixels..."}</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#D32F2F" />
          <Text style={styles.errorTitle}>{isRTL ? "فشل التحليل" : "Analysis Failed"}</Text>
          <Text style={styles.errorSubtitle}>{isRTL ? "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك." : "We couldn't connect to the server to analyze your image."}</Text>
          <TouchableOpacity style={[styles.retryBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleRetryAnalysis}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFF" style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.retryBtnText}>{isRTL ? "إعادة المحاولة" : "Retry Analysis"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollArea} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {imageUri && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsFullScreen(true)}>
              <Image source={{ uri: imageUri }} style={[styles.image, { borderColor: theme.border }]} />
            </TouchableOpacity>
          )}

          {result && (
            <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: theme.border }]}>
                <Text style={[styles.plantName, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{result?.plantName}</Text>
              </View>

              <Text style={[styles.label, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? "المشكلة المكتشفة:" : "Detected Issue:"}</Text>
              <Text style={[result?.severity === 'Safe' ? styles.valueSafe : styles.valueError, { textAlign: isRTL ? 'right' : 'left' }]}>
                {result?.disease} ({result?.confidence})
              </Text>

              <View style={[styles.careGrid, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.border }]}>
                <CareItem icon="water" label={isRTL ? "ماء" : "Water"} value={isRTL ? "3x/أسبوع" : "3x/Week"} theme={theme} />
                <CareItem icon="weather-sunny" label={isRTL ? "شمس" : "Light"} value={isRTL ? "شمس كاملة" : "Full Sun"} theme={theme} />
                <CareItem icon="sprout-outline" label={isRTL ? "تربة" : "Soil"} value={isRTL ? "غنية" : "Rich"} theme={theme} />
              </View>

              <Text style={[styles.label, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? "العلاج الموصى به:" : "Recommended Treatment:"}</Text>
              <Text style={[styles.valueText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{result?.treatment}</Text>
            </View>
          )}

          <View style={[styles.chatSectionTitleContainer, { borderTopColor: theme.border }]}>
            <Text style={styles.chatSectionTitle}>{isRTL ? "اسأل AgriBot" : "Ask AgriBot"}</Text>
          </View>
          
          <View style={styles.chatContainer}>
            {messages.map(msg => (
              <View key={msg.id} style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border }]]}>
                <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : { color: theme.text }, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {msg.text}
                </Text>
              </View>
            ))}
            {isTyping && (
               <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border, width: 60, alignItems: 'center', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                 <ActivityIndicator size="small" color={PRIMARY_GREEN} />
               </View>
            )}
          </View>
        </ScrollView>
      )}

      {!loading && !isError && (
        <View style={[styles.inputArea, { backgroundColor: theme.background, borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={isRTL ? "اطرح سؤالاً إضافياً..." : "Ask a follow-up question..."}
            placeholderTextColor={theme.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]} onPress={sendMessage} disabled={isTyping}>
            <MaterialCommunityIcons name={isRTL ? "send-outline" : "send"} size={20} color="#FFF" style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={isFullScreen} transparent={true} animationType="fade">
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={styles.closeFullBtn} onPress={() => setIsFullScreen(false)}>
            <MaterialCommunityIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {imageUri && (
            <ScrollView
              contentContainerStyle={styles.fullScreenScrollContent}
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
            >
              <Image 
                source={{ uri: imageUri }} 
                style={styles.fullScreenImage} 
                resizeMode="contain" 
              />
            </ScrollView>
          )}
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const CareItem = ({ icon, label, value, theme }: any) => (
  <View style={styles.careItem}>
    <MaterialCommunityIcons name={icon} size={20} color={PRIMARY_GREEN} />
    <Text style={[styles.careLabel, { color: theme.subText }]}>{label}</Text>
    <Text style={[styles.careValue, { color: theme.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: PRIMARY_GREEN },
  backBtnWrapper: { alignItems: 'center', padding: 5 },
  iconBtn: { padding: 5 },
  saveBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  backTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 15, fontSize: 18, color: PRIMARY_GREEN, fontWeight: 'bold' },
  
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F', marginTop: 15, marginBottom: 10 },
  errorSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  retryBtn: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, alignItems: 'center', elevation: 3 },
  retryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },
  
  image: { width: '100%', height: 250, borderRadius: 15, marginBottom: 20, borderWidth: 2 },
  
  resultCard: { padding: 20, borderRadius: 15, elevation: 3, borderWidth: 1, marginBottom: 30 },
  cardHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 },
  plantName: { fontSize: 22, fontWeight: 'bold' },
  
  label: { fontSize: 14, marginTop: 10 },
  valueSafe: { fontSize: 20, color: '#2E7D32', fontWeight: 'bold', marginBottom: 5 },
  valueError: { fontSize: 20, color: '#D32F2F', fontWeight: 'bold', marginBottom: 5 },
  valueText: { fontSize: 16, marginTop: 5, lineHeight: 24 },

  careGrid: { justifyContent: 'space-between', marginVertical: 15, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1 },
  careItem: { alignItems: 'center', flex: 1 },
  careLabel: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  careValue: { fontSize: 12, fontWeight: 'bold' },

  chatSectionTitleContainer: { borderTopWidth: 1, paddingTop: 20, marginBottom: 15 },
  chatSectionTitle: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_GREEN, textAlign: 'center' },
  
  chatContainer: { flex: 1 },
  messageBubble: { maxWidth: '85%', padding: 15, borderRadius: 20, marginBottom: 15 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: PRIMARY_GREEN, borderBottomRightRadius: 5 },
  aiBubble: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFF' },

  inputArea: { padding: 15, borderTopWidth: 1, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  sendBtn: { backgroundColor: PRIMARY_GREEN, width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  fullScreenImage: { width: '100%', height: '100%', minWidth: 300, minHeight: 400 },
  closeFullBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25 }
});