import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import Lottie from 'lottie-react';
import { POPULAR_EMOJIS, getCachedLottie, setCachedLottie } from '../lib/emoji-data';

interface MessageContentProps {
    content: string;
}

// Check if message is a single emoji
function isSingleEmoji(text: string): boolean {
    const trimmed = text.trim();
    // Check if it's a single emoji (no other text)
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(trimmed);
}

// Get Lottie URL for an emoji
function getLottieUrlForEmoji(emoji: string): string | null {
    const emojiData = POPULAR_EMOJIS.find(e => e.unicode === emoji);
    return emojiData?.lottieUrl || null;
}

export function MessageContent({ content }: MessageContentProps) {
    const [lottieData, setLottieData] = useState<any>(null);
    const isSingle = isSingleEmoji(content);

    // Load Lottie animation for single emoji
    useEffect(() => {
        if (isSingle) {
            const lottieUrl = getLottieUrlForEmoji(content.trim());
            if (lottieUrl) {
                const cached = getCachedLottie(lottieUrl);
                if (cached) {
                    setLottieData(cached);
                } else {
                    fetch(lottieUrl)
                        .then(res => res.json())
                        .then(data => {
                            setCachedLottie(lottieUrl, data);
                            setLottieData(data);
                        })
                        .catch(err => console.error('Failed to load emoji animation:', err));
                }
            }
        }
    }, [content, isSingle]);

    // If it's a single emoji and we have the Lottie data, show animated version
    if (isSingle && lottieData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Lottie
                    animationData={lottieData}
                    loop={true}
                    autoplay={true}
                    style={{ width: 120, height: 120 }}
                />
            </div>
        );
    }

    const handleCopy = (text: string, setCopied: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Code blocks & Inline code
                    code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const textContent = String(children).replace(/\n$/, '');

                        // Inline code styling
                        if (inline) {
                            return (
                                <code className="inline-code" {...props}>
                                    {children}
                                </code>
                            );
                        }

                        // Code block styling
                        const [isCopied, setIsCopied] = useState(false);

                        return (
                            <div className="code-block-wrapper">
                                <div className="code-block-header">
                                    <span className="code-language">{language || 'code'}</span>
                                    <button
                                        onClick={() => handleCopy(textContent, setIsCopied)}
                                        className="copy-button"
                                        title="Copy code"
                                    >
                                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={language}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: '0 0 0.5rem 0.5rem',
                                        fontSize: '0.875rem',
                                    }}
                                    {...props}
                                >
                                    {textContent}
                                </SyntaxHighlighter>
                            </div>
                        );
                    },
                    // Links - open in new tab
                    a({ node, ...props }) {
                        return <a target="_blank" rel="noopener noreferrer" {...props} />;
                    },
                    // Table styling container (optional if we add more CSS)
                    table({ children }) {
                        return <div className="table-wrapper"><table>{children}</table></div>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
