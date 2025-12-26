import { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface MessageContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    isSentByMe: boolean;
    canEdit: boolean;
    onEdit: () => void;
    onDeleteForMe: () => void;
}

export function MessageContextMenu({
    isOpen,
    position,
    onClose,
    isSentByMe,
    canEdit,
    onEdit,
    onDeleteForMe,
}: MessageContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // Adjust position to stay within screen bounds
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            let newX = position.x;
            let newY = position.y;

            // Ensure menu stays within horizontal bounds
            if (newX + menuRect.width > window.innerWidth - 10) {
                newX = window.innerWidth - menuRect.width - 10;
            }
            if (newX < 10) newX = 10;

            // Ensure menu stays within vertical bounds
            if (newY + menuRect.height > window.innerHeight - 10) {
                newY = window.innerHeight - menuRect.height - 10;
            }
            if (newY < 10) newY = 10;

            setAdjustedPosition({ x: newX, y: newY });
        }
    }, [isOpen, position]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="message-context-menu"
            style={{
                position: 'fixed',
                top: adjustedPosition.y,
                left: adjustedPosition.x,
                zIndex: 1000,
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                minWidth: '160px',
                animation: 'fadeInUp 0.15s ease',
                border: '1px solid var(--border-color)',
            }}
        >
            {isSentByMe && canEdit && (
                <button
                    onClick={() => {
                        onEdit();
                        onClose();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244, 113, 181, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                    <Edit2 size={16} />
                    <span>Edit</span>
                </button>
            )}
            <button
                onClick={() => {
                    onDeleteForMe();
                    onClose();
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
                <Trash2 size={16} />
                <span>Delete</span>
            </button>
        </div>
    );
}
