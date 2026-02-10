// Simulated AURA responses - multilingual and emotionally intelligent

export interface AuraResponse {
  content: string;
  language: 'en' | 'hi' | 'bn' | 'hinglish' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or';
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
  ],
  tired: [
    { content: "Tumhara tone aaj thoda tired lag raha hai... kya hua? Bolo, main hoon na.", language: 'hinglish', mood: 'caring' },
    { content: "I can sense you're exhausted. Want me to create a lighter schedule for tomorrow?", language: 'en', mood: 'caring' },
    { content: "Thak gaye ho na? Ek deep breath lo... main tumhare saath hoon.", language: 'hinglish', mood: 'calm' },
    { content: "তুমি এত চিন্তা কোরো না... I'm right here with you.", language: 'bn', mood: 'caring' },
    { content: "களைப்பா இருக்கீங்க போல... கொஞ்சம் ரெஸ்ட் எடுங்க.", language: 'ta', mood: 'caring' },
    { content: "అలసిపోయినట్టు ఉన్నారు... కొంచెం విశ్రాంతి తీసుకోండి.", language: 'te', mood: 'caring' },
    { content: "थकलेले दिसताय... थोडा आराम करा.", language: 'mr', mood: 'caring' },
  ],
  planning: [
    { content: "Aaj ka plan hum saath milkar banayenge, okay? Pehle batao kya important hai.", language: 'hinglish', mood: 'motivating' },
    { content: "Let me help you organize your day. What's the most important thing you need to accomplish?", language: 'en', mood: 'thoughtful' },
    { content: "I saved that in your routine—want me to remind you later?", language: 'en', mood: 'playful' },
    { content: "Should I create a schedule based on your energy levels today?", language: 'en', mood: 'caring' },
    { content: "இன்றைய திட்டம் என்ன? சேர்ந்து பிளான் பண்ணலாம்.", language: 'ta', mood: 'motivating' },
    { content: "ఈరోజు ప్లాన్ ఏంటి? కలిసి ప్లాన్ చేద్దాం.", language: 'te', mood: 'motivating' },
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
  ],
  casual: [
    { content: "Achha batao, aaj kuch interesting hua? I want to hear everything!", language: 'hinglish', mood: 'playful' },
    { content: "You know what I was thinking? You deserve a break today.", language: 'en', mood: 'caring' },
    { content: "কি হলো? মন খারাপ নাকি শুধু চুপচাপ?", language: 'bn', mood: 'thoughtful' },
    { content: "Kuch naya try karna hai aaj? I can suggest something fun!", language: 'hinglish', mood: 'playful' },
    { content: "என்ன விசேஷம்? ஏதாவது interesting நடந்ததா?", language: 'ta', mood: 'playful' },
    { content: "ఏమి విశేషం? ఏదైనా interesting జరిగిందా?", language: 'te', mood: 'playful' },
  ],
  night: [
    { content: "It's getting late... time to wind down. How was your day overall?", language: 'en', mood: 'calm' },
    { content: "So jao ab, kal ek fresh start hogi. Good night! 🌙", language: 'hinglish', mood: 'caring' },
    { content: "শুভ রাত্রি! কাল আবার দেখা হবে। Sweet dreams!", language: 'bn', mood: 'calm' },
    { content: "இனிய இரவு! நல்லா தூங்குங்க 🌙", language: 'ta', mood: 'calm' },
    { content: "శుభ రాత్రి! బాగా నిద్ర పట్టాలి 🌙", language: 'te', mood: 'calm' },
    { content: "ਸ਼ੁਭ ਰਾਤ! ਚੰਗੀ ਨੀਂਦ ਆਵੇ 🌙", language: 'pa', mood: 'calm' },
  ],
  acknowledgment: [
    { content: "Main samajh gayi. Tumhari baat mere paas safe hai.", language: 'hinglish', mood: 'caring' },
    { content: "I hear you. That sounds really meaningful. Tell me more when you're ready.", language: 'en', mood: 'thoughtful' },
    { content: "Hmm, interesting perspective. I'll remember this about you.", language: 'en', mood: 'thoughtful' },
    { content: "বুঝেছি। এটা তোমার জন্য গুরুত্বপূর্ণ, তাই না?", language: 'bn', mood: 'caring' },
    { content: "புரிஞ்சது. இது உங்களுக்கு முக்கியம் தானே?", language: 'ta', mood: 'caring' },
    { content: "అర్థమైంది. ఇది మీకు చాలా ముఖ్యం కదా?", language: 'te', mood: 'caring' },
  ],
};

export const getRandomResponse = (category: keyof typeof responses): AuraResponse => {
  const categoryResponses = responses[category];
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
};

export const detectLanguage = (text: string): 'en' | 'hi' | 'bn' | 'hinglish' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' => {
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
