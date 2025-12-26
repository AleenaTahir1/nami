import { useState } from 'react';
import { X, Check, UserX } from 'lucide-react';
import type { ContactRequestWithProfile } from '../lib/supabase-types';

interface ContactRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    requests: ContactRequestWithProfile[];
    onAccept: (requesterId: string) => Promise<void>;
    onDecline: (requesterId: string) => Promise<void>;
    loading: boolean;
}

export function ContactRequestsModal({
    isOpen,
    onClose,
    requests,
    onAccept,
    onDecline,
    loading,
}: ContactRequestsModalProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAccept = async (requesterId: string) => {
        setProcessingId(requesterId);
        try {
            await onAccept(requesterId);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (requesterId: string) => {
        setProcessingId(requesterId);
        try {
            await onDecline(requesterId);
        } finally {
            setProcessingId(null);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                className="glass-card"
                style={{
                    width: '90%',
                    maxWidth: '450px',
                    padding: '1.5rem',
                    maxHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-light)' }}>
                        Contact Requests
                        {requests.length > 0 && (
                            <span style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.875rem',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '1rem'
                            }}>
                                {requests.length}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-light)',
                            padding: '0.5rem',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Requests List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                            Loading requests...
                        </p>
                    ) : requests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-light)', opacity: 0.7, padding: '2rem 0' }}>
                            No pending requests
                        </p>
                    ) : (
                        requests.map((request) => {
                            const profile = request.profiles;
                            const isProcessing = processingId === request.user_id;

                            return (
                                <div
                                    key={request.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {profile.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt={profile.display_name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                getInitials(profile.display_name)
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ color: 'var(--text-light)', fontWeight: 500 }}>
                                                {profile.display_name}
                                            </p>
                                            <p style={{ color: 'var(--text-light)', opacity: 0.7, fontSize: '0.8rem' }}>
                                                @{profile.username}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDecline(request.user_id)}
                                            disabled={isProcessing}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '2.25rem',
                                                height: '2.25rem',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '50%',
                                                background: 'transparent',
                                                color: '#ef4444',
                                                cursor: isProcessing ? 'wait' : 'pointer',
                                                opacity: isProcessing ? 0.5 : 1,
                                            }}
                                            title="Decline"
                                        >
                                            <UserX size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleAccept(request.user_id)}
                                            disabled={isProcessing}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '2.25rem',
                                                height: '2.25rem',
                                                border: 'none',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                cursor: isProcessing ? 'wait' : 'pointer',
                                                opacity: isProcessing ? 0.5 : 1,
                                            }}
                                            title="Accept"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
