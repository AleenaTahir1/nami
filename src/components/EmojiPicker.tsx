import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import { searchEmojis, type EmojiData, getCachedLottie, setCachedLottie } from '../lib/emoji-data';
import '../styles/EmojiPicker.css';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: EmojiData) => void;
    onClose: () => void;
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEmojis, setFilteredEmojis] = useState<EmojiData[]>([]);
    const [loadedLotties, setLoadedLotties] = useState<Map<string, any>>(new Map());
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const results = searchEmojis(searchQuery);
        setFilteredEmojis(results);
    }, [searchQuery]);

    useEffect(() => {
        // Load Lottie animations for visible emojis
        filteredEmojis.forEach((emoji) => {
            if (!loadedLotties.has(emoji.lottieUrl)) {
                const cached = getCachedLottie(emoji.lottieUrl);
                if (cached) {
                    setLoadedLotties((prev) => new Map(prev).set(emoji.lottieUrl, cached));
                } else {
                    fetch(emoji.lottieUrl)
                        .then((res) => res.json())
                        .then((data) => {
                            setCachedLottie(emoji.lottieUrl, data);
                            setLoadedLotties((prev) => new Map(prev).set(emoji.lottieUrl, data));
                        })
                        .catch((err) => console.error('Failed to load emoji:', err));
                }
            }
        });
    }, [filteredEmojis]);

    // Close picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleEmojiClick = (emoji: EmojiData) => {
        onEmojiSelect(emoji);
        onClose();
    };

    return (
        <div className="emoji-picker-overlay">
            <div className="emoji-picker" ref={pickerRef}>
                <div className="emoji-picker-header">
                    <input
                        type="text"
                        className="emoji-search"
                        placeholder="Search emojis..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button className="emoji-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="emoji-grid">
                    {filteredEmojis.map((emoji) => {
                        const lottieData = loadedLotties.get(emoji.lottieUrl);
                        return (
                            <button
                                key={emoji.unicode}
                                className="emoji-item"
                                onClick={() => handleEmojiClick(emoji)}
                                title={emoji.name}
                            >
                                {lottieData ? (
                                    <Lottie
                                        animationData={lottieData}
                                        loop={true}
                                        autoplay={true}
                                        style={{ width: 40, height: 40 }}
                                    />
                                ) : (
                                    <span className="emoji-fallback">{emoji.unicode}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {filteredEmojis.length === 0 && (
                    <div className="emoji-empty">No emojis found</div>
                )}
            </div>
        </div>
    );
}
