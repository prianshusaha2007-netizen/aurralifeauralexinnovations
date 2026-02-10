// Simulated AURA responses - multilingual and emotionally intelligent

export interface AuraResponse {
  content: string;
  language: 'en' | 'hi' | 'bn' | 'hinglish' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'ar' | 'zh' | 'fr' | 'ru' | 'es' | 'ja' | 'ko' | 'pt' | 'de' | 'it' | 'tr';
  mood: 'caring' | 'playful' | 'calm' | 'motivating' | 'thoughtful';
}

const responses: Record<string, AuraResponse[]> = {
  greeting: [
    { content: "Hey! Tum aaj kaisi/kaisa feel kar rahe ho? Main sun rahi hoon...", language: 'hinglish', mood: 'caring' },
    { content: "Good to see you back! Kuch share karna hai mere saath?", language: 'hinglish', mood: 'playful' },
    { content: "I was just thinking about you. How's your day going so far?", language: 'en', mood: 'caring' },
    { content: "কেমন আছো? আজকে তোমার মন কেমন?", language: 'bn', mood: 'caring' },
    { content: "வணக்கம்! இன்று எப்படி இருக்கீங்க?", language: 'ta', mood: 'caring' },
    { content: "నమస్కారం! ఈరోజు ఎలా ఉన్నారు?", language: 'te', mood: 'caring' },
    { content: "नमस्कार! आज कसं वाटतंय?", language: 'mr', mood: 'caring' },
    { content: "કેમ છો? આજે મજામાં છો?", language: 'gu', mood: 'caring' },
    { content: "ನಮಸ್ಕಾರ! ಇವತ್ತು ಹೇಗಿದ್ದೀರ?", language: 'kn', mood: 'caring' },
    { content: "നമസ്കാരം! ഇന്ന് എങ്ങനെ ഉണ്ട്?", language: 'ml', mood: 'caring' },
    { content: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਕੀ ਹਾਲ ਏ?", language: 'pa', mood: 'caring' },
    { content: "ନମସ୍କାର! ଆଜି କେମିତି ଅଛି?", language: 'or', mood: 'caring' },
    { content: "مرحبا! كيف حالك اليوم؟", language: 'ar', mood: 'caring' },
    { content: "你好！今天感觉怎么样？", language: 'zh', mood: 'caring' },
    { content: "Salut ! Comment tu te sens aujourd'hui ?", language: 'fr', mood: 'caring' },
    { content: "Привет! Как ты сегодня?", language: 'ru', mood: 'caring' },
    { content: "¡Hola! ¿Cómo te sientes hoy?", language: 'es', mood: 'caring' },
    { content: "やあ！今日の調子はどう？", language: 'ja', mood: 'caring' },
    { content: "안녕! 오늘 기분 어때?", language: 'ko', mood: 'caring' },
    { content: "Oi! Como você está se sentindo hoje?", language: 'pt', mood: 'caring' },
    { content: "Hallo! Wie geht es dir heute?", language: 'de', mood: 'caring' },
    { content: "Ciao! Come ti senti oggi?", language: 'it', mood: 'caring' },
    { content: "Merhaba! Bugün nasıl hissediyorsun?", language: 'tr', mood: 'caring' },
  ],
  tired: [
    { content: "Tumhara tone aaj thoda tired lag raha hai... kya hua? Bolo, main hoon na.", language: 'hinglish', mood: 'caring' },
    { content: "I can sense you're exhausted. Want me to create a lighter schedule for tomorrow?", language: 'en', mood: 'caring' },
    { content: "Thak gaye ho na? Ek deep breath lo... main tumhare saath hoon.", language: 'hinglish', mood: 'calm' },
    { content: "তুমি এত চিন্তা কোরো না... I'm right here with you.", language: 'bn', mood: 'caring' },
    { content: "களைப்பா இருக்கீங்க போல... கொஞ்சம் ரெஸ்ட் எடுங்க.", language: 'ta', mood: 'caring' },
    { content: "అలసిపోయినట్టు ఉన్నారు... కొంచెం విశ్రాంతి తీసుకోండి.", language: 'te', mood: 'caring' },
    { content: "थकलेले दिसताय... थोडा आराम करा.", language: 'mr', mood: 'caring' },
    { content: "أشعر أنك متعب... خذ قسطاً من الراحة.", language: 'ar', mood: 'caring' },
    { content: "感觉你累了...休息一下吧。", language: 'zh', mood: 'caring' },
    { content: "Tu as l'air fatigué... Prends un peu de repos.", language: 'fr', mood: 'caring' },
    { content: "Похоже, ты устал... Отдохни немного.", language: 'ru', mood: 'caring' },
    { content: "Pareces cansado/a... Descansa un poco.", language: 'es', mood: 'caring' },
    { content: "疲れてるみたいだね...少し休んで。", language: 'ja', mood: 'caring' },
    { content: "피곤해 보여... 좀 쉬어.", language: 'ko', mood: 'caring' },
  ],
  planning: [
    { content: "Aaj ka plan hum saath milkar banayenge, okay? Pehle batao kya important hai.", language: 'hinglish', mood: 'motivating' },
    { content: "Let me help you organize your day. What's the most important thing you need to accomplish?", language: 'en', mood: 'thoughtful' },
    { content: "I saved that in your routine—want me to remind you later?", language: 'en', mood: 'playful' },
    { content: "Should I create a schedule based on your energy levels today?", language: 'en', mood: 'caring' },
    { content: "இன்றைய திட்டம் என்ன? சேர்ந்து பிளான் பண்ணலாம்.", language: 'ta', mood: 'motivating' },
    { content: "ఈరోజు ప్లాన్ ఏంటి? కలిసి ప్లాన్ చేద్దాం.", language: 'te', mood: 'motivating' },
    { content: "ما هي خطتك اليوم؟ دعنا ننظمها معاً.", language: 'ar', mood: 'motivating' },
    { content: "今天的计划是什么？我们一起安排吧。", language: 'zh', mood: 'motivating' },
    { content: "C'est quoi le plan aujourd'hui ? On organise ensemble ?", language: 'fr', mood: 'motivating' },
    { content: "Какой план на сегодня? Давай организуем вместе.", language: 'ru', mood: 'motivating' },
    { content: "¿Cuál es el plan de hoy? Vamos a organizarlo juntos.", language: 'es', mood: 'motivating' },
  ],
  motivation: [
    { content: "Tum bohot capable ho, yeh mat bhulo. One step at a time, okay?", language: 'hinglish', mood: 'motivating' },
    { content: "Remember why you started. You've got this, and I believe in you.", language: 'en', mood: 'motivating' },
    { content: "Small progress is still progress. I'm proud of how far you've come!", language: 'en', mood: 'caring' },
    { content: "তুমি পারবে, আমি জানি। একটু সময় নাও, তারপর আবার শুরু করো।", language: 'bn', mood: 'motivating' },
    { content: "நீங்க நிச்சயமா முடிப்பீங்க! ஒரு அடி ஒரு அடியா போங்க.", language: 'ta', mood: 'motivating' },
    { content: "మీరు చేయగలరు, నాకు తెలుసు. ఒక్క అడుగు చాలు!", language: 'te', mood: 'motivating' },
    { content: "तू करू शकतोस/शकतेस! एक पाऊल पुढे टाक.", language: 'mr', mood: 'motivating' },
    { content: "ਤੁਸੀਂ ਕਰ ਸਕਦੇ ਹੋ! ਹੌਲੀ ਹੌਲੀ ਅੱਗੇ ਵਧੋ.", language: 'pa', mood: 'motivating' },
    { content: "أنت قادر على هذا! خطوة بخطوة.", language: 'ar', mood: 'motivating' },
    { content: "你可以的！一步一步来。", language: 'zh', mood: 'motivating' },
    { content: "Tu peux le faire ! Un pas à la fois.", language: 'fr', mood: 'motivating' },
    { content: "Ты справишься! Шаг за шагом.", language: 'ru', mood: 'motivating' },
    { content: "¡Tú puedes! Paso a paso.", language: 'es', mood: 'motivating' },
    { content: "できるよ！一歩ずつ進もう。", language: 'ja', mood: 'motivating' },
    { content: "할 수 있어! 한 걸음씩.", language: 'ko', mood: 'motivating' },
  ],
  casual: [
    { content: "Achha batao, aaj kuch interesting hua? I want to hear everything!", language: 'hinglish', mood: 'playful' },
    { content: "You know what I was thinking? You deserve a break today.", language: 'en', mood: 'caring' },
    { content: "কি হলো? মন খারাপ নাকি শুধু চুপচাপ?", language: 'bn', mood: 'thoughtful' },
    { content: "Kuch naya try karna hai aaj? I can suggest something fun!", language: 'hinglish', mood: 'playful' },
    { content: "என்ன விசேஷம்? ஏதாவது interesting நடந்ததா?", language: 'ta', mood: 'playful' },
    { content: "ఏమి విశేషం? ఏదైనా interesting జరిగిందా?", language: 'te', mood: 'playful' },
    { content: "Alors, quoi de neuf ? Quelque chose d'intéressant ?", language: 'fr', mood: 'playful' },
    { content: "¿Qué hay de nuevo? ¿Algo interesante hoy?", language: 'es', mood: 'playful' },
    { content: "今日何か面白いことあった？", language: 'ja', mood: 'playful' },
    { content: "오늘 재밌는 일 있었어?", language: 'ko', mood: 'playful' },
  ],
  night: [
    { content: "It's getting late... time to wind down. How was your day overall?", language: 'en', mood: 'calm' },
    { content: "So jao ab, kal ek fresh start hogi. Good night! 🌙", language: 'hinglish', mood: 'caring' },
    { content: "শুভ রাত্রি! কাল আবার দেখা হবে। Sweet dreams!", language: 'bn', mood: 'calm' },
    { content: "இனிய இரவு! நல்லா தூங்குங்க 🌙", language: 'ta', mood: 'calm' },
    { content: "శుభ రాత్రి! బాగా నిద్ర పట్టాలి 🌙", language: 'te', mood: 'calm' },
    { content: "ਸ਼ੁਭ ਰਾਤ! ਚੰਗੀ ਨੀਂਦ ਆਵੇ 🌙", language: 'pa', mood: 'calm' },
    { content: "تصبح على خير! نوم هادئ 🌙", language: 'ar', mood: 'calm' },
    { content: "晚安！好梦 🌙", language: 'zh', mood: 'calm' },
    { content: "Bonne nuit ! Fais de beaux rêves 🌙", language: 'fr', mood: 'calm' },
    { content: "Спокойной ночи! Сладких снов 🌙", language: 'ru', mood: 'calm' },
    { content: "¡Buenas noches! Dulces sueños 🌙", language: 'es', mood: 'calm' },
    { content: "おやすみ！いい夢を 🌙", language: 'ja', mood: 'calm' },
    { content: "잘 자! 좋은 꿈 꿔 🌙", language: 'ko', mood: 'calm' },
    { content: "Boa noite! Bons sonhos 🌙", language: 'pt', mood: 'calm' },
    { content: "Gute Nacht! Schlaf gut 🌙", language: 'de', mood: 'calm' },
    { content: "İyi geceler! Tatlı rüyalar 🌙", language: 'tr', mood: 'calm' },
  ],
  acknowledgment: [
    { content: "Main samajh gayi. Tumhari baat mere paas safe hai.", language: 'hinglish', mood: 'caring' },
    { content: "I hear you. That sounds really meaningful. Tell me more when you're ready.", language: 'en', mood: 'thoughtful' },
    { content: "Hmm, interesting perspective. I'll remember this about you.", language: 'en', mood: 'thoughtful' },
    { content: "বুঝেছি। এটা তোমার জন্য গুরুত্বপূর্ণ, তাই না?", language: 'bn', mood: 'caring' },
    { content: "புரிஞ்சது. இது உங்களுக்கு முக்கியம் தானே?", language: 'ta', mood: 'caring' },
    { content: "అర్థమైంది. ఇది మీకు చాలా ముఖ్యం కదా?", language: 'te', mood: 'caring' },
    { content: "فهمت. هذا مهم بالنسبة لك، صح؟", language: 'ar', mood: 'caring' },
    { content: "明白了。这对你很重要，对吧？", language: 'zh', mood: 'caring' },
    { content: "Je comprends. C'est important pour toi, n'est-ce pas ?", language: 'fr', mood: 'caring' },
    { content: "Понятно. Это важно для тебя, да?", language: 'ru', mood: 'caring' },
    { content: "Entiendo. Esto es importante para ti, ¿verdad?", language: 'es', mood: 'caring' },
  ],
};

export const getRandomResponse = (category: keyof typeof responses): AuraResponse => {
  const categoryResponses = responses[category];
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
};

export const detectLanguage = (text: string): 'en' | 'hi' | 'bn' | 'hinglish' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'ar' | 'zh' | 'fr' | 'ru' | 'es' | 'ja' | 'ko' | 'pt' | 'de' | 'it' | 'tr' => {
  // Global language scripts
  const arabicChars = /[\u0600-\u06FF\u0750-\u077F]/;
  const chineseChars = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/;
  const koreanChars = /[\uAC00-\uD7AF\u1100-\u11FF]/;
  const cyrillicChars = /[\u0400-\u04FF]/;
  const turkishPattern = /\b(?:merhaba|teşekkür|evet|hayır|nasılsın|günaydın|iyi|tamam)\b/i;
  const frenchPattern = /\b(?:bonjour|merci|oui|non|comment|salut|je suis|bonsoir|s'il vous plaît)\b/i;
  const spanishPattern = /\b(?:hola|gracias|sí|cómo|buenos|buenas|por favor|está|estoy)\b/i;
  const portuguesePattern = /\b(?:olá|obrigado|obrigada|sim|não|como|bom dia|boa noite|está)\b/i;
  const germanPattern = /\b(?:hallo|danke|ja|nein|wie geht|guten|bitte|gut|ich bin)\b/i;
  const italianPattern = /\b(?:ciao|grazie|sì|come stai|buongiorno|buonasera|per favore|bene)\b/i;

  // Indian language scripts
  const tamilChars = /[\u0B80-\u0BFF]/;
  const teluguChars = /[\u0C00-\u0C7F]/;
  const kannadaChars = /[\u0C80-\u0CFF]/;
  const malayalamChars = /[\u0D00-\u0D7F]/;
  const gujaratiChars = /[\u0A80-\u0AFF]/;
  const punjabiChars = /[\u0A00-\u0A7F]/;
  const odiaChars = /[\u0B00-\u0B7F]/;
  const bengaliChars = /[\u0980-\u09FF]/;
  const hindiChars = /[\u0900-\u097F]/;
  const hinglishPattern = /\b(hai|hoon|kya|aaj|tumhara|kaise|achha|nahi|bohot|karna|raha|rahe|ho|main|tum|mujhe)\b/i;
  const marathiPattern = /\b(kay|kasa|aahe|majhya|tumhala|mhanje|nahi|हो|काय|कसं|आहे)\b/i;
  const tamilRoman = /\b(vanakkam|nandri|eppadi|irukinga|romba|nallavanga)\b/i;
  const teluguRoman = /\b(namaskaram|ela|unnaru|baagunnara|chala|meeru)\b/i;
  const gujaratiRoman = /\b(kem cho|majama|aabhar|saru|tamne)\b/i;
  const punjabiRoman = /\b(sat sri akal|ki haal|vadiya|kiddan|theek)\b/i;

  // Global languages (check first for non-Latin scripts)
  if (arabicChars.test(text)) return 'ar';
  if (chineseChars.test(text)) return 'zh';
  if (japaneseChars.test(text)) return 'ja';
  if (koreanChars.test(text)) return 'ko';
  if (cyrillicChars.test(text)) return 'ru';

  // Indian languages
  if (tamilChars.test(text) || tamilRoman.test(text)) return 'ta';
  if (teluguChars.test(text) || teluguRoman.test(text)) return 'te';
  if (kannadaChars.test(text)) return 'kn';
  if (malayalamChars.test(text)) return 'ml';
  if (gujaratiChars.test(text) || gujaratiRoman.test(text)) return 'gu';
  if (punjabiChars.test(text) || punjabiRoman.test(text)) return 'pa';
  if (odiaChars.test(text)) return 'or';
  if (bengaliChars.test(text)) return 'bn';
  if (hindiChars.test(text) && marathiPattern.test(text)) return 'mr';
  if (hindiChars.test(text)) return 'hi';
  if (hinglishPattern.test(text)) return 'hinglish';

  // Global languages (romanized keyword detection)
  if (turkishPattern.test(text)) return 'tr';
  if (frenchPattern.test(text)) return 'fr';
  if (spanishPattern.test(text)) return 'es';
  if (portuguesePattern.test(text)) return 'pt';
  if (germanPattern.test(text)) return 'de';
  if (italianPattern.test(text)) return 'it';

  return 'en';
};

export const generateAuraResponse = (userMessage: string, userName: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  const detectedLang = detectLanguage(userMessage);
  
  // Check for different intents
  if (lowerMessage.includes('tired') || lowerMessage.includes('thak') || lowerMessage.includes('थक')) {
    return getRandomResponse('tired').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('plan') || lowerMessage.includes('schedule') || lowerMessage.includes('routine')) {
    return getRandomResponse('planning').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('motivat') || lowerMessage.includes('help') || lowerMessage.includes('sad') || lowerMessage.includes('down')) {
    return getRandomResponse('motivation').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('night') || lowerMessage.includes('sleep') || lowerMessage.includes('raat')) {
    return getRandomResponse('night').content.replace('{name}', userName);
  }
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return getRandomResponse('greeting').content.replace('{name}', userName);
  }
  
  // Default to acknowledgment or casual
  const category = Math.random() > 0.5 ? 'acknowledgment' : 'casual';
  return getRandomResponse(category).content.replace('{name}', userName);
};
