import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatWithBot } from '../../api'; 
import { useAppContext } from '../../context/AppContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const PRIMARY_GREEN = '#098840';

export default function ChatScreen() {
  const { theme, lang } = useAppContext();
  const isRTL = lang === 'ar';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const greeting = isRTL 
      ? "مرحباً! أنا AgriBot، مساعدك الزراعي الشخصي. كيف يمكنني مساعدة مزرعتك أو حديقتك اليوم؟"
      : "Hello! I am AgriBot, your personal agronomy assistant. How can I help your farm or garden today?";

    setMessages([{ id: '1', text: greeting, sender: 'ai' }]);
  }, [isRTL]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    const newUserMessage: Message = { id: Date.now().toString(), text: userText, sender: 'user' };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const context = "General agronomy query.";
      const data = await chatWithBot(userText, context, userId as any);
      
      const aiResponse: Message = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: isRTL ? "حدث خطأ في الاتصال بالخادم." : "Connection error. Please try again later.", 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* 🌟 STICKY HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=Agri+Bot&background=098840&color=fff&size=100` }} 
              style={styles.botAvatar} 
            />
            <View style={styles.onlineBadge} />
          </View>
          <View style={[styles.headerTextContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AgriBot</Text>
            <Text style={[styles.headerSubtitle, { color: PRIMARY_GREEN }]}>{isRTL ? 'مساعد زراعي ذكي' : 'Smart Assistant'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Offsets for header height
      >
        {/* 💬 MESSAGES LIST */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollArea} 
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chatContainer}>
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              const alignSelf = isUser ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start');
                
              const bubbleStyle = isUser 
                ? [styles.userBubble, { backgroundColor: PRIMARY_GREEN, borderBottomRightRadius: isRTL ? 20 : 5, borderBottomLeftRadius: isRTL ? 5 : 20 }] 
                : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border, borderBottomLeftRadius: isRTL ? 20 : 5, borderBottomRightRadius: isRTL ? 5 : 20 }];

              return (
                <View key={msg.id} style={[styles.bubble, { alignSelf }, bubbleStyle]}>
                  <Text style={[styles.msgText, isUser ? styles.userText : { color: theme.text }, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {msg.text}
                  </Text>
                </View>
              );
            })}
            
            {isTyping && (
               <View style={[styles.bubble, styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border, width: 65, alignSelf: isRTL ? 'flex-end' : 'flex-start', borderBottomLeftRadius: isRTL ? 20 : 5, borderBottomRightRadius: isRTL ? 5 : 20 }]}>
                 <ActivityIndicator size="small" color={PRIMARY_GREEN} />
               </View>
            )}
          </View>
        </ScrollView>

        {/* ⌨️ FLOATING INPUT AREA */}
        <View style={[styles.inputArea, { backgroundColor: theme.card, borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={isRTL ? "اكتب سؤالك هنا..." : "Ask a question..."}
            placeholderTextColor={theme.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? PRIMARY_GREEN : theme.border, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]} 
            onPress={sendMessage} 
            disabled={isTyping || !inputText.trim()}
          >
            <MaterialCommunityIcons 
              name="send" 
              size={20} 
              color="#FFF" 
              style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, zIndex: 10 },
  headerContent: { alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  botAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFF' },
  headerTextContainer: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 20, paddingTop: 15 },
  chatContainer: { paddingHorizontal: 15 },
  
  bubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, marginBottom: 10 },
  userBubble: { elevation: 1 },
  aiBubble: { borderWidth: 1 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFF' },
  
  inputArea: { paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 35 : 15 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, minHeight: 40, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
});