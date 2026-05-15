import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const translations = {
  en: {
    scans: "Scanned", saved: "Wiki Plants", logout: "Logout", settings: "Settings", darkMode: "Dark Mode", language: "Language", student: "Engineering Student | AgriScan AI Creator 🌿", emptyScans: "No scans yet. Try scanning a plant!",
    recentScans: "Recent Scans", didYouKnow: "Did you know?", seeAll: "See All", nextFact: "Next Fact ➡️", wikiTitle: "Plant Library", search: "Search plants...", tapToView: "Tap to view treatment", emptyWiki: "No plants found.",
    scannedRecently: "Scanned recently",
    city: "Marrakesh", humidity: "Humidity", wind: "Wind", uvIndex: "UV Index", uvHigh: "High",
    facts: [
      { title: 'The Magic of Mint', searchName: 'Mint', subtitle: 'Mint aggressively takes over gardens. Keep it in pots!', image: 'https://images.unsplash.com/photo-1629837237072-4d2a1d2f66ff?auto=format&fit=crop&w=500&q=80' },
      { title: 'Drought Survivor', searchName: 'Aloe Vera', subtitle: 'Aloe Vera stores water in leaves, surviving extreme Moroccan heat.', image: 'https://images.unsplash.com/photo-1596547609652-9fc5d8d428ae?auto=format&fit=crop&w=500&q=80' },
      { title: 'Natural Pesticide', searchName: 'Marigold', subtitle: 'Marigolds naturally repel nematodes and tomato hornworms.', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=500&q=80' },
      { title: 'Nitrogen Fixers', searchName: 'Bean', subtitle: 'Beans and peas actually pull nitrogen from the air to fertilize the soil.', image: 'https://images.unsplash.com/photo-1590680680145-af1c23f25603?auto=format&fit=crop&w=500&q=80' }
    ],
    // NEW LOGIN TRANSLATIONS
    welcome: "Welcome Back", signInToAccount: "Sign in to your account", email: "Email", password: "Password", forgotPassword: "Forgot Password?", signIn: "Sign In", or: "or", dontHaveAccount: "Don't have an account?", createAccount: "Create Account", name: "Full Name", alreadyHaveAccount: "Already have an account?", error: "Error", joinApp: "Join Zr3 M3ana", getStarted: "Get Started", registerNew: "Register a new account"
  },
  fr: {
    scans: "Scanné", saved: "Plantes", logout: "Déconnexion", settings: "Paramètres", darkMode: "Mode Sombre", language: "Langue", student: "Étudiant en Ingénierie | Créateur d'AgriScan AI 🌿", emptyScans: "Aucun scan. Essayez de scanner !",
    recentScans: "Scans Récents", didYouKnow: "Le saviez-vous ?", seeAll: "Voir Tout", nextFact: "Fait Suivant ➡️", wikiTitle: "Bibliothèque", search: "Chercher des plantes...", tapToView: "Appuyez pour le traitement", emptyWiki: "Aucune plante trouvée.",
    scannedRecently: "Scanné récemment",
    city: "Marrakech", humidity: "Humidité", wind: "Vent", uvIndex: "Indice UV", uvHigh: "Élevé",
    facts: [
      { title: 'La Magie de la Menthe', searchName: 'Mint', subtitle: 'La menthe envahit les jardins. Gardez-la en pot !', image: 'https://images.unsplash.com/photo-1629837237072-4d2a1d2f66ff?auto=format&fit=crop&w=500&q=80' },
      { title: 'Survivant à la Sécheresse', searchName: 'Aloe Vera', subtitle: "L'Aloe Vera stocke l'eau dans ses feuilles, survivant à la chaleur.", image: 'https://images.unsplash.com/photo-1596547609652-9fc5d8d428ae?auto=format&fit=crop&w=500&q=80' },
      { title: 'Pesticide Naturel', searchName: 'Marigold', subtitle: 'Les œillets d\'Inde repoussent naturellement les vers.', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=500&q=80' },
      { title: 'Fixateurs d\'Azote', searchName: 'Bean', subtitle: "Les haricots et les pois tirent l'azote de l'air pour fertiliser le sol.", image: 'https://images.unsplash.com/photo-1590680680145-af1c23f25603?auto=format&fit=crop&w=500&q=80' }
    ],
    // NEW LOGIN TRANSLATIONS
    welcome: "Bon retour", signInToAccount: "Connectez-vous à votre compte", email: "E-mail", password: "Mot de passe", forgotPassword: "Mot de passe oublié ?", signIn: "Se connecter", or: "ou", dontHaveAccount: "Vous n'avez pas de compte ?", createAccount: "Créer un compte", name: "Nom complet", alreadyHaveAccount: "Vous avez déjà un compte ?", error: "Erreur", joinApp: "Rejoindre Zr3 M3ana", getStarted: "Commencer", registerNew: "Créer un nouveau compte"
  },
  ar: {
    scans: "عمليات المسح", saved: "نباتات", logout: "تسجيل خروج", settings: "الإعدادات", darkMode: "الوضع الداكن", language: "اللغة", student: "طالب هندسة | صانع تطبيق AgriScan AI 🌿", emptyScans: "لا توجد عمليات مسح بعد.",
    recentScans: "عمليات المسح الأخيرة", didYouKnow: "هل تعلم؟", seeAll: "عرض الكل", nextFact: "التالي ➡️", wikiTitle: "مكتبة النباتات", search: "ابحث عن النباتات...", tapToView: "انقر لعرض العلاج", emptyWiki: "لم يتم العثور على نباتات.",
    scannedRecently: "تم مسحه مؤخرًا",
    city: "مراكش", humidity: "الرطوبة", wind: "الرياح", uvIndex: "مؤشر الأشعة فوق البنفسجية", uvHigh: "مرتفع",
    facts: [
      { title: 'سحر النعناع', searchName: 'Mint', subtitle: 'النعناع يغزو الحدائق بسرعة. احتفظ به في أواني!', image: 'https://images.unsplash.com/photo-1629837237072-4d2a1d2f66ff?auto=format&fit=crop&w=500&q=80' },
      { title: 'الناجي من الجفاف', searchName: 'Aloe Vera', subtitle: 'يخزن الصبار الماء في أوراقه، ليتحمل الحرارة الشديدة.', image: 'https://images.unsplash.com/photo-1596547609652-9fc5d8d428ae?auto=format&fit=crop&w=500&q=80' },
      { title: 'مبيد حشري طبيعي', searchName: 'Marigold', subtitle: 'القطيفة تطرد الديدان الخيطية بشكل طبيعي.', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=500&q=80' },
      { title: 'مثبتات النيتروجين', searchName: 'Bean', subtitle: 'يسحب الفول والبازلاء النيتروجين من الهواء لتخصيب التربة.', image: 'https://images.unsplash.com/photo-1590680680145-af1c23f25603?auto=format&fit=crop&w=500&q=80' }
    ],
    // NEW LOGIN TRANSLATIONS
    welcome: "مرحباً بعودتك", signInToAccount: "تسجيل الدخول إلى حسابك", email: "البريد الإلكتروني", password: "كلمة المرور", forgotPassword: "هل نسيت كلمة المرور؟", signIn: "تسجيل الدخول", or: "أو", dontHaveAccount: "ليس لديك حساب؟", createAccount: "إنشاء حساب", name: "الاسم الكامل", alreadyHaveAccount: "لديك حساب بالفعل؟", error: "خطأ", joinApp: "انضم إلى Zr3 M3ana", getStarted: "ابدأ الآن", registerNew: "تسجيل حساب جديد"
  }
};

export const themes = {
  light: {
    background: '#E8F5E9',
    card: '#FFFFFF',
    text: '#333333',
    primary: '#437d45',
    border: '#A5D6A7',
    subText: '#666666'
  },
  dark: {
    background: '#1A3320', 
    card: '#142517',       
    text: '#FFFFFF',
    primary: '#6BBA62',    
    border: '#2A4A30',
    subText: '#A3C4A8'
  }
};

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<'en' | 'fr' | 'ar'>('en');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedTheme = await AsyncStorage.getItem('theme');
    const savedLang = await AsyncStorage.getItem('lang');
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedLang) setLang(savedLang as any);
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const changeLanguage = async (newLang: 'en' | 'fr' | 'ar') => {
    setLang(newLang);
    await AsyncStorage.setItem('lang', newLang);
  };

  const theme = isDarkMode ? themes.dark : themes.light;
  const t = translations[lang];

  return (
    <AppContext.Provider value={{ isDarkMode, toggleTheme, lang, changeLanguage, theme, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);