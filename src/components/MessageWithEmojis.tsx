import { useMemo, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { POPULAR_EMOJIS, getCachedLottie, setCachedLottie } from '../lib/emoji-data';

interface MessageWithEmojisProps {
    content: string;
}

export function MessageWithEmojis({ content }: MessageWithEmojisProps) {
    const [loadedLotties, setLoadedLotties] = useState<Map<string, any>>(new Map());

    // Parse message content to find emojis
    const parts = useMemo(() => {
        const segments: Array<{ type: 'text' | 'emoji'; content: string; lottieUrl?: string }> = [];
        let currentText = '';

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const codePoint = content.codePointAt(i);

            // Check if this character is an emoji we support
            const emoji = POPULAR_EMOJIS.find(e => e.unicode === char || e.unicode.codePointAt(0) === codePoint);

            if (emoji) {
                // Save any accumulated text
                if (currentText) {
                    segments.push({ type: 'text', content: currentText });
                    currentText = '';
                }
                // Add emoji segment
                segments.push({ type: 'emoji', content: emoji.unicode, lottieUrl: emoji.lottieUrl });

                // Skip surrogate pair if present
                if (codePoint && codePoint > 0xFFFF) {
                    i++;
                }
            } else {
                currentText += char;
            }
        }

        // Add remaining text
        if (currentText) {
            segments.push({ type: 'text', content: currentText });
        }

        return segments;
    }, [content]);

    // Load Lottie animations for emojis
    useEffect(() => {
        parts.forEach((part) => {
            if (part.type === 'emoji' && part.lottieUrl && !loadedLotties.has(part.lottieUrl)) {
                const cached = getCachedLottie(part.lottieUrl);
                if (cached) {
                    setLoadedLotties((prev) => new Map(prev).set(part.lottieUrl!, cached));
                } else {
                    fetch(part.lottieUrl)
                        .then((res) => res.json())
                        .then((data) => {
                            setCachedLottie(part.lottieUrl!, data);
                            setLoadedLotties((prev) => new Map(prev).set(part.lottieUrl!, data));
                        })
                        .catch((err) => console.error('Failed to load emoji:', err));
                }
            }
        });
    }, [parts]);

    // Check if message is a single emoji (no text)
    const isSingleEmoji = parts.length === 1 && parts[0].type === 'emoji';
    const emojiSize = isSingleEmoji ? 72 : 24; // 3x larger for single emoji

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    return <span key={index}>{part.content}</span>;
                } else {
                    const lottieData = part.lottieUrl ? loadedLotties.get(part.lottieUrl) : null;
                    return (
                        <span
                            key={index}
                            style={{
                                display: 'inline-block',
                                width: `${emojiSize}px`,
                                height: `${emojiSize}px`,
                                verticalAlign: 'middle'
                            }}
                        >
                            {lottieData ? (
                                <Lottie
                                    animationData={lottieData}
                                    loop={true}
                                    autoplay={true}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : (
                                <span style={{ fontSize: isSingleEmoji ? '64px' : '20px' }}>{part.content}</span>
                            )}
                        </span>
                    );
                }
            })}
        </span>
    );
}
