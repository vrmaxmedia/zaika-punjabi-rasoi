import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* =====================================================================
   SETTINGS (speed)
   ===================================================================== */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PARALLEL_CALLS = 2;      // ek saath 2 calls, jo pehle sahi aaye wahi use hoga
const MAX_ROUNDS = 2;          // sab fail hone par sirf ek aur round
const CALL_TIMEOUT_MS = 12000; // Gemini 12 sec me na de to cancel
const MAX_OUTPUT_TOKENS = 300;
const HISTORY_SIZE = 60;       // server par yaad rakhe gaye pichhle reviews

/* =====================================================================
   BUSINESS PACK (Zaika Punjabi Rasoi - Yamuna Vihar)
   ===================================================================== */
const OWNER_NAME = process.env.OWNER_NAME || 'Manager';
const PRODUCT_WORD = 'food';

// Restaurant dishes / menu series (weighted for variety)
const MENU_SERIES = [
  { n: 'Starters', w: 3, variants: [['Paneer Tikka', 3], ['Spring Rolls', 2], ['Crispy Corn', 2]] },
  { n: 'Main Course', w: 8, variants: [['Butter Chicken', 3], ['Dal Makhani', 3], ['Shahi Paneer', 2], ['Kadhai Paneer', 2]] },
  { n: 'Breads & Rolls', w: 5, variants: [['Butter Naan', 3], ['Stuffed Paratha', 2], ['Rumali Roti', 2]] },
  { n: 'Chinese & Snacks', w: 4, variants: [['Chowmein', 3], ['Momos', 3], ['Manchurian', 2]] },
];

const SEO_KEYWORDS = [
  'best restaurant in Yamuna Vihar',
  'family restaurant in Delhi',
  'best Punjabi food in Yamuna Vihar',
  'tasty butter chicken in Delhi',
  'hygienic restaurant near me',
  'best dining place in Yamuna Vihar Delhi',
  'North Indian restaurant in Delhi',
  'Zaika Punjabi Rasoi Yamuna Vihar',
  'good restaurant for family dinner Delhi',
  'tasty food in Yamuna Vihar block C',
];

// Topics: id, prompt text, aur check regex
const TOPICS = {
  location: {
    id: 'location',
    text: 'the location: easy to find in Yamuna Vihar, safe and convenient to reach with good accessibility',
    must: /yamuna vihar|location|jagah|rasta|nazdik|paas|easy to find|aasani|market|block/i,
  },
  politeness: {
    id: 'politeness',
    text: 'the behaviour of the staff and service: polite, quick, welcoming, and well-managed',
    must: /staff|behav|polite|patient|service|nature|respect|attend|management|bhaiya|manager/i,
  },
  pricing: {
    id: 'pricing',
    text: 'the price and portions: pocket-friendly, great value for money, generous quantity',
    must: /price|rate|daam|paise|deal|budget|cheap|sasta|pocket|value|portion|quantity|kharcha/i,
  },
  quality: {
    id: 'quality',
    text: 'the food quality: fresh, hot, delicious, and authentic Punjabi taste',
    must: /taste|quality|fresh|hot|delicious|yummy|badhiya|swad|mazedar|zayka|zaika|authentic/i,
  },
  trust: {
    id: 'trust',
    text: 'hygiene and trust: clean dining area, well-maintained space, felt safe eating here',
    must: /hygiene|clean|safai|saaf|trust|bharosa|safe|vishwas|family|mahaul/i,
  },
  ambience: {
    id: 'ambience',
    text: 'the ambience: nice seating, comfortable family atmosphere, good lighting',
    must: /ambience|vibe|atmosphere|lighting|seating|baithne|sukoon|mahool|interior/i,
  },
  dishes: {
    id: 'dishes',
    text: 'the delicious food items available on the menu and finding the exact dish they craved',
    must: /food|dish|paneer|chicken|dal|naan|roti|khaana|khana|item/i,
  },
  service: {
    id: 'service',
    text: 'fast service: food was served hot and within a short time after ordering',
    must: /fast|quick|jaldi|turant|service|time|garam/i,
  },
};

const ALL_TOPICS = ['location', 'politeness', 'pricing', 'quality', 'trust', 'ambience', 'dishes', 'service'];

// Chips = keywords customer clicks
const CHIPS = {
  'Best Taste': { id: 'chip_taste', text: 'the food taste was amazing and authentic', must: /taste|swad|delicious|yummy|badhiya|zayka|zaika/i },
  'Pocket Friendly': { id: 'chip_price', text: 'the pricing was pocket friendly and budget-friendly', must: /price|rate|budget|sasta|pocket|value|paise/i },
  'Family Friendly': { id: 'chip_family', text: 'it is a great family restaurant with a comfortable vibe', must: /family|bachon|parents|ghar|safe|mahool/i },
  'Fresh & Hot': { id: 'chip_fresh', text: 'food was served fresh and piping hot', must: /fresh|hot|garam|ekdum/i },
  'Clean Ambience': { id: 'chip_clean', text: 'the place was clean, hygienic, and well maintained', must: /clean|hygiene|safai|saaf|maintained/i },
  'Fast Service': { id: 'chip_fast', text: 'the service speed was quick and staff was attentive', must: /fast|quick|jaldi|service|staff/i },
  'Yamuna Vihar': { id: 'chip_location', text: 'the location in Yamuna Vihar was very easy to reach', must: /yamuna vihar|location|jagah|metro|market/i },
  'Good Quantity': { id: 'chip_qty', text: 'the portion size and quantity were very satisfying', must: /quantity|portion|pet|bhar|zyada/i },
};

// 13 types of customer personas
const PERSONAS = [
  { id: 'desi', text: 'a simple desi Delhi person, speaks plain and rough, short sentences, no fancy words, a little loose grammar is fine' },
  { id: 'family', text: 'a middle class family person, practical, talks about family or parents enjoying the meal, honest and simple' },
  { id: 'professional', text: 'an educated working professional, polished and clear, well-structured sentences, calm tone' },
  { id: 'young', text: 'a college-age youngster, casual and foodie style, quick typing style, energetic' },
  { id: 'uncle', text: 'an older respectful person (uncle ji), polite, simple words, blesses or thanks the restaurant team' },
  { id: 'blunt', text: 'a straightforward no-nonsense person, few words, says only what mattered to him' },
  { id: 'lowerclass', text: 'a daily-earning working person on a tight budget, very simple words, short plain sentences, cares about good food at fair price' },
  { id: 'business', text: 'a local business owner who came for dinner, practical, talks about value for money and good taste' },
  { id: 'officer', text: 'a well-off senior person or officer, formal and precise, values hygiene and proper service' },
  { id: 'mother', text: 'a housewife or mother eating out with family, careful, talks about what the family liked, warm tone' },
  { id: 'firsttimer', text: 'someone visiting this restaurant for the first time, pleasantly surprised by the great taste' },
  { id: 'foodie', text: 'a food lover who notices flavors and portions, writes in a happy mood' },
  { id: 'techie', text: 'a tech-aware person, writes in a clear matter-of-fact way' },
];

const WRITING_STYLES = [
  'neat spelling and proper grammar',
  'casual WhatsApp-style typing, relaxed',
  'all small letters, casual typing, no capital letters',
  'simple and slightly rough, one tiny spelling slip is fine',
];

const HINGLISH_LEVELS = [
  'mostly Hindi words, only a few English words like food, taste, service',
  'half Hindi, half English words',
  'Hindi grammar but many common English words mixed in',
];

const OPENERS = [
  'start with the food or what you ate',
  'start with the restaurant or the area',
  'start with the staff or service',
  'start with how you feel after eating here',
  'start with why you came here for dinner',
  'start in the middle of a thought, casually',
  'start with what you ordered',
  'start by saying how you found this place',
  'start with your plain verdict in your own words',
  'start with your budget or craving',
  'start with a simple statement about the whole experience',
];

const ENDINGS = [
  'end with a small thanks or compliment',
  'end by saying you would bring friends and family again',
  'end by saying you will become a regular customer here',
  'end with a short plain remark about the meal',
  'end with one line about how happy your tummy is',
  'just stop naturally after your last point, no wrap-up line',
];

const BUYER_LINES = [
  'You came with your family.',
  'You came with your friends.',
  'You ordered food after office.',
  'You visited for weekend dinner.',
];

const EXAMPLES = {
  ENGLISH: [
    'Went in for dinner with family and tried their butter chicken and naan, the taste was exceptionally good and fresh',
    'Great place in Yamuna Vihar, food quality is top notch and prices are very reasonable',
    'Quick service and very polite staff, loved the authentic flavors here',
    'Clean ambience and delicious food, had a great time with friends',
  ],
  HINGLISH: [
    'family ke sath aaye the khane me butter chicken aur naan order kiya, swad ekdum lajawab tha aur garam mila',
    'yamuna vihar me badhiya jagah hai khana khane ke liye, rate bhi saste hain aur quantity bhi achhi hai',
    'staff ka nature bahut accha hai, service fast mili aur khana bilkul fresh tha',
    'saaf-safai acchi hai dukan ki, taste itna pasand aaya ki ab dobara zaroor aayenge',
  ],
};

/* =====================================================================
   ENGINE  (same robust pipeline)
   ===================================================================== */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

function pickDish(recentDishes) {
  const flat = [];
  for (const sr of MENU_SERIES) {
    const total = sr.variants.reduce((a, v) => a + v[1], 0);
    for (const [name, vw] of sr.variants) {
      if (recentDishes.includes(name)) continue;
      flat.push({ name, series: sr.n, w: sr.w * (vw / total) });
    }
  }
  return pickWeighted(flat);
}

const LENGTHS = [
  { w: 12, lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 16, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 30, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 28, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
  { w: 14, lines: 5, min: 40, max: 52, rule: 'FIVE lines, 42 to 50 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  const l3 = lens[lens.length - 3];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  const mid = (n) => n === 3 || n === 4;
  if (lens.length >= 3 && mid(l1) && mid(l2) && mid(l3)) {
    const f = pool.filter((x) => !mid(x.lines));
    if (f.length) pool = f;
  } else if (l1 && !mid(l1)) {
    const f = pool.filter((x) => mid(x.lines));
    if (f.length) pool = f;
  }
  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

function choosePersona(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  const pool = PERSONAS.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : PERSONAS);
}

function chooseTopic(recent) {
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

function chooseFrom(list, key, recent, n = 3) {
  const last = recent.map((r) => r[key]).filter((v) => v !== undefined && v !== null).slice(-n);
  const pool = list.filter((x) => !last.includes(x));
  return pick(pool.length ? pool : list);
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me',
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|—|–/i;

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
]);

const HINDI_WORDS = new Set([
  'hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume',
  'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'kiya', 'mila', 'mil', 'gaya', 'gayi',
  'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha',
  'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin',
  'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne',
  'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'mein', 'yeh', 'ye', 'woh', 'wo', 'ne', 'hu', 'hun', 'tak', 'wahan', 'sabse', 'khana', 'khane', 'swad',
]);

const HISTORY = [];
const HITS = new Map();

const openingOf = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));

function tooSimilar(text, recentOpenings) {
  const open = openingOf(text);
  if (recentOpenings.includes(open)) return true;
  const ws = wordSet(text);
  for (const h of HISTORY) {
    if (h.open === open) return true;
    let inter = 0;
    for (const w of ws) if (h.ws.has(w)) inter++;
    const union = ws.size + h.ws.size - inter || 1;
    if (inter / union > 0.45) return true;
  }
  return false;
}

function remember(text) {
  HISTORY.push({ open: openingOf(text), ws: wordSet(text) });
  while (HISTORY.length > HISTORY_SIZE) HISTORY.shift();
}

function rateLimited(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < 5 * 60 * 1000)) HITS.delete(k);
  }
  return arr.length > 25;
}

function cleanReview(text) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(/\.\s+/g, ', ')
    .replace(/\.+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function hindiCount(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => HINDI_WORDS.has(w)).length;
}

function languageOk(text, language, words) {
  const h = hindiCount(text);
  if (language === 'HINGLISH') return h >= Math.max(3, Math.floor(words * 0.2));
  return h <= 2;
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

function buildPrompt(body, recent) {
  const language = body.language === 'HINGLISH' ? 'HINGLISH' : 'ENGLISH';
  const businessName = String(body.businessName || 'Zaika Punjabi Rasoi').slice(0, 120);
  const category = String(body.category || 'Restaurant').slice(0, 200);
  const city = String(body.city || 'Yamuna Vihar, Delhi').slice(0, 120);

  const recentDishes = recent.map((r) => r.dish).filter(Boolean).slice(-3);
  let chips = chosenChips(body);
  const picked = chance(0.5) ? pickDish(recentDishes) : null;
  const dish = picked ? picked.name : null;

  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : chooseTopic(recent);
  const extraChips = chips.slice(1);
  const opener = chooseFrom(OPENERS, 'opener', recent, 3);
  const ending = chooseFrom(ENDINGS, 'ending', recent, 2);
  const style = pick(WRITING_STYLES);
  const hinglishLevel = pick(HINGLISH_LEVELS);
  const buyerLine = chance(0.5) ? pick(BUYER_LINES) + ' ' : '';

  const longEnough = length.lines >= 3;
  const secondPoint = !extraChips.length && length.lines >= 4 && chance(0.5);
  const mentionName = chance(0.3);
  const useEmoji = chance(0.08);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.3) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like a Delhi person on WhatsApp. Level: ${hinglishLevel}. Grammar must be Hindi (hai, tha, kiya, mila, nahi, bahut, aur, ke liye etc.). Food items and keywords can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian customer. Do not use Hindi words.`;

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');

  const prompt = `${languageBlock}

You are ${persona.text}. ${buyerLine}You ate food at this restaurant and are writing a Google Maps review.
Business: ${businessName} (${city}) | ${category}

Tone samples from other customers (only for feel, never copy words or structure):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}. The review must clearly be about this.
${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : secondPoint ? '- You may add one small extra point at the end, from any other area.' : '- Stick to the main topic only.'}
- Writing style: ${style}.
- Opening: ${opener}.
${longEnough ? `- Ending: ${ending}.` : ''}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention the restaurant name "${businessName}" once, naturally.` : '- Do not repeat the full restaurant name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${dish ? `- You may mention the dish "${dish}".` : ''}
${useEmoji ? '- One emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real customer, not an advertisement. No hashtags, slogans, keyword stuffing, no dashes. Avoid polished marketing words (seamless, hassle-free, top-notch, exceptional).
- Do not invent facts: only talk about what the main topic says. No fake delivery promises or discounts.
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, opener, ending, seo, dish, language };
}

async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  const data = await res.json();
  return { res, data };
}

async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, opener, ending, seo, dish, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the review for ${body.businessName || 'Zaika Punjabi Rasoi'} now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    let { res, data } = await callGemini(apiKey, payload, signal);

    if (!res.ok && /thinking/i.test(data?.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res, data } = await callGemini(apiKey, payload, signal));
    }
    if (!res.ok) return { ok: false, error: data?.error?.message || 'Gemini API request failed.' };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    const review = fixCutOff(cleanReview(raw));
    const words = review.split(/\s+/).filter(Boolean).length;

    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (words > length.max + 8) return { ok: false, error: 'Review too long.' };
    if (words < Math.floor(length.min * 0.75)) return { ok: false, error: 'Review too short.' };
    if (/[ऀ-ॿ]/.test(review)) return { ok: false, error: 'Devanagari used.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    if (!languageOk(review, language, words)) return { ok: false, error: 'Wrong language style.' };
    if (!topic.must.test(review)) return { ok: false, error: 'Review missed the selected topic.' };
    if (extraChips.some((c) => !c.must.test(review))) return { ok: false, error: 'Review missed a selected keyword.' };
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: persona.id,
        topic: topic.id,
        opener,
        ending,
        seo: seo || null,
        dish: dish || null,
        open: openingOf(review),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message || 'Request failed.', aborted: e?.name === 'AbortError' };
  }
}

function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length;
    let firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed to generate review draft.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }
    if (rateLimited(request)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

      const winner = await firstValid(
        Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal))
      );

      clearTimeout(timer);
      controller.abort();

      if (winner.ok) {
        remember(winner.review);
        return NextResponse.json({ review: winner.review, meta: winner.meta });
      }
      lastError = winner.error;
    }

    throw new Error(lastError);
  } catch (error) {
    console.error('API Review Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate review draft.' },
      { status: 500 }
    );
  }
}
