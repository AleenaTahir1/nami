// Google Noto Animated Emoji Data
// Lottie files hosted on Google's CDN

export interface EmojiData {
    unicode: string;
    name: string;
    category: string;
    keywords: string[];
    lottieUrl: string;
}

export const EMOJI_CATEGORIES = [
    'Smileys & Emotion',
    'People & Body',
    'Animals & Nature',
    'Food & Drink',
    'Activities',
    'Travel & Places',
    'Objects',
    'Symbols',
] as const;

export type EmojiCategory = typeof EMOJI_CATEGORIES[number];

// Top 50 most used emojis with Google Noto Lottie URLs
export const POPULAR_EMOJIS: EmojiData[] = [
    {
        unicode: '😀',
        name: 'Grinning Face',
        category: 'Smileys & Emotion',
        keywords: ['smile', 'happy', 'joy', 'grin'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/lottie.json',
    },
    {
        unicode: '😃',
        name: 'Grinning Face with Big Eyes',
        category: 'Smileys & Emotion',
        keywords: ['smile', 'happy', 'joy'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f603/lottie.json',
    },
    {
        unicode: '😄',
        name: 'Grinning Face with Smiling Eyes',
        category: 'Smileys & Emotion',
        keywords: ['smile', 'happy', 'joy', 'laugh'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/lottie.json',
    },
    {
        unicode: '😁',
        name: 'Beaming Face with Smiling Eyes',
        category: 'Smileys & Emotion',
        keywords: ['smile', 'happy', 'grin'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f601/lottie.json',
    },
    {
        unicode: '😆',
        name: 'Grinning Squinting Face',
        category: 'Smileys & Emotion',
        keywords: ['happy', 'laugh', 'smile'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/lottie.json',
    },
    {
        unicode: '😂',
        name: 'Face with Tears of Joy',
        category: 'Smileys & Emotion',
        keywords: ['laugh', 'cry', 'tears', 'joy'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/lottie.json',
    },
    {
        unicode: '🤣',
        name: 'Rolling on the Floor Laughing',
        category: 'Smileys & Emotion',
        keywords: ['laugh', 'lol', 'rofl'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/lottie.json',
    },
    {
        unicode: '😊',
        name: 'Smiling Face with Smiling Eyes',
        category: 'Smileys & Emotion',
        keywords: ['smile', 'blush', 'happy'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/lottie.json',
    },
    {
        unicode: '😍',
        name: 'Smiling Face with Heart-Eyes',
        category: 'Smileys & Emotion',
        keywords: ['love', 'heart', 'crush'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/lottie.json',
    },
    {
        unicode: '🥰',
        name: 'Smiling Face with Hearts',
        category: 'Smileys & Emotion',
        keywords: ['love', 'hearts', 'adore'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/lottie.json',
    },
    {
        unicode: '😘',
        name: 'Face Blowing a Kiss',
        category: 'Smileys & Emotion',
        keywords: ['kiss', 'love', 'heart'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/lottie.json',
    },
    {
        unicode: '😎',
        name: 'Smiling Face with Sunglasses',
        category: 'Smileys & Emotion',
        keywords: ['cool', 'sunglasses', 'confident'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/lottie.json',
    },
    {
        unicode: '🤔',
        name: 'Thinking Face',
        category: 'Smileys & Emotion',
        keywords: ['think', 'hmm', 'consider'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/lottie.json',
    },
    {
        unicode: '😢',
        name: 'Crying Face',
        category: 'Smileys & Emotion',
        keywords: ['sad', 'cry', 'tear'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/lottie.json',
    },
    {
        unicode: '😭',
        name: 'Loudly Crying Face',
        category: 'Smileys & Emotion',
        keywords: ['cry', 'sob', 'sad', 'tears'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/lottie.json',
    },
    {
        unicode: '😡',
        name: 'Pouting Face',
        category: 'Smileys & Emotion',
        keywords: ['angry', 'mad', 'rage'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/lottie.json',
    },
    {
        unicode: '🤯',
        name: 'Exploding Head',
        category: 'Smileys & Emotion',
        keywords: ['mind', 'blown', 'shocked'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/lottie.json',
    },
    {
        unicode: '😴',
        name: 'Sleeping Face',
        category: 'Smileys & Emotion',
        keywords: ['sleep', 'tired', 'zzz'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/lottie.json',
    },
    {
        unicode: '🤗',
        name: 'Hugging Face',
        category: 'Smileys & Emotion',
        keywords: ['hug', 'embrace', 'love'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/lottie.json',
    },
    {
        unicode: '🤩',
        name: 'Star-Struck',
        category: 'Smileys & Emotion',
        keywords: ['star', 'eyes', 'amazed'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/lottie.json',
    },
    {
        unicode: '👍',
        name: 'Thumbs Up',
        category: 'People & Body',
        keywords: ['like', 'approve', 'ok', 'yes'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/lottie.json',
    },
    {
        unicode: '👎',
        name: 'Thumbs Down',
        category: 'People & Body',
        keywords: ['dislike', 'disapprove', 'no'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e/lottie.json',
    },
    {
        unicode: '👏',
        name: 'Clapping Hands',
        category: 'People & Body',
        keywords: ['clap', 'applause', 'congrats'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/lottie.json',
    },
    {
        unicode: '🙏',
        name: 'Folded Hands',
        category: 'People & Body',
        keywords: ['pray', 'thanks', 'please'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/lottie.json',
    },
    {
        unicode: '💪',
        name: 'Flexed Biceps',
        category: 'People & Body',
        keywords: ['strong', 'muscle', 'power'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/lottie.json',
    },
    {
        unicode: '❤️',
        name: 'Red Heart',
        category: 'Smileys & Emotion',
        keywords: ['love', 'heart', 'like'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json',
    },
    {
        unicode: '💔',
        name: 'Broken Heart',
        category: 'Smileys & Emotion',
        keywords: ['heartbreak', 'sad', 'break'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/lottie.json',
    },
    {
        unicode: '🔥',
        name: 'Fire',
        category: 'Travel & Places',
        keywords: ['fire', 'hot', 'lit'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json',
    },
    {
        unicode: '✨',
        name: 'Sparkles',
        category: 'Activities',
        keywords: ['sparkle', 'shine', 'magic'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/lottie.json',
    },
    {
        unicode: '🎉',
        name: 'Party Popper',
        category: 'Activities',
        keywords: ['party', 'celebrate', 'congrats'],
        lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/lottie.json',
    },
];

// Search emojis by keyword
export function searchEmojis(query: string): EmojiData[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return POPULAR_EMOJIS;

    return POPULAR_EMOJIS.filter(
        (emoji) =>
            emoji.name.toLowerCase().includes(lowerQuery) ||
            emoji.keywords.some((keyword) => keyword.includes(lowerQuery))
    );
}

// Get emojis by category
export function getEmojisByCategory(category: EmojiCategory): EmojiData[] {
    return POPULAR_EMOJIS.filter((emoji) => emoji.category === category);
}

// Cache for loaded Lottie animations
const lottieCache = new Map<string, any>();

export function getCachedLottie(url: string): any | null {
    return lottieCache.get(url) || null;
}

export function setCachedLottie(url: string, data: any): void {
    lottieCache.set(url, data);
}
