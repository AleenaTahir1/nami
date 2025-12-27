import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Phone, Video, MoreVertical,
    Paperclip, Smile, Send, Settings,
    Image, FileText, Film, X, UserPlus, Download, Trash2
} from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { useMessages } from '../hooks/useMessages';
import { useNotifications } from '../hooks/useNotifications';
import { isAppFocused } from '../lib/notifications';
import { subscribeToAllIncomingMessages } from '../lib/messages';
import { useContactsPresence } from '../hooks/useContactsPresence';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { AddContactModal } from '../components/AddContactModal';
import { MessageContextMenu } from '../components/MessageContextMenu';
import { ContactRequestsModal } from '../components/ContactRequestsModal';
import { EmojiPicker } from '../components/EmojiPicker';
import { MessageContent } from '../components/MessageContent';
import type { Profile, Attachment } from '../lib/supabase-types';
import type { EmojiData } from '../lib/emoji-data';
import { getAttachmentUrl, formatFileSize, getFileIcon } from '../lib/attachments';

// Attachment Display Component
const AttachmentDisplay = ({ attachment }: { attachment: Attachment }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAttachmentUrl(attachment.storage_path)
            .then(setUrl)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [attachment.storage_path]);

    if (loading) {
        return <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Loading attachment...</div>;
    }

    const isImage = attachment.file_type.startsWith('image/');

    return (
        <div style={{
            padding: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(157, 23, 77, 0.1)'
        }}>
            {isImage && url ? (
                <img
                    src={url}
                    alt={attachment.file_name}
                    style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        borderRadius: '0.5rem',
                        display: 'block'
                    }}
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getFileIcon(attachment.file_type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachment.file_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            {formatFileSize(attachment.file_size)}
                        </div>
                    </div>
                </div>
            )}
            {url && (
                <a
                    href={url}
                    download={attachment.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--primary)',
                        textDecoration: 'none'
                    }}
                >
                    <Download size={12} />
                    Download
                </a>
            )}
        </div>
    );
};

const DashboardPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileAcceptType, setFileAcceptType] = useState<string>('*');
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { contacts, requests, loading, requestsLoading, addContact, searchUsers, acceptRequest, declineRequest } = useContacts();
    const { messages, loading: messagesLoading, sending, sendMessage: sendChatMessage, deleteMessageForMe, deleteMessageForEveryone, editMessage, messagesEndRef, getMessageStatus, loadMore, hasMore, loadingMore, clearChat } = useMessages(selectedContact?.user_id || null);
    const { isOnline, getLastSeen } = useContactsPresence(contacts.map(c => c.user_id));

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        messageId: string | null;
        isSentByMe: boolean;
        canEdit: boolean;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        messageId: null,
        isSentByMe: false,
        canEdit: false
    });

    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    const { notify, settings: notificationSettings } = useNotifications();
    const contactsRef = useRef<Profile[]>(contacts); // Ref to access current contacts in callback

    // Close header menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
                setHeaderMenuOpen(false);
            }
        };
        if (headerMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [headerMenuOpen]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Infinite scroll observer
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || loadingMore || !hasMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, { threshold: 0.1 });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadingMore, hasMore, loadMore]);

    // Edit mode state
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Restore last selected contact from localStorage on mount
    useEffect(() => {
        if (contacts.length > 0 && !selectedContact) {
            const lastContactId = localStorage.getItem('nami_last_contact_id');
            if (lastContactId) {
                const lastContact = contacts.find(c => c.user_id === lastContactId);
                if (lastContact) {
                    setSelectedContact(lastContact);
                    return;
                }
            }
            // Fallback to first contact
            setSelectedContact(contacts[0]);
        }
    }, [contacts]);

    // Persist selected contact to localStorage
    useEffect(() => {
        if (selectedContact) {
            localStorage.setItem('nami_last_contact_id', selectedContact.user_id);
        }
    }, [selectedContact]);

    // Update contacts ref when contacts change
    useEffect(() => {
        contactsRef.current = contacts;
    }, [contacts]);

    // Handle global notifications
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToAllIncomingMessages(user.id, async (newMessage) => {
            // Don't notify for own messages
            if (newMessage.sender_id === user.id) return;

            // Check if app is focused - properly await
            try {
                const focused = await isAppFocused();
                if (focused) {
                    console.log('App is focused, skipping notification');
                    return;
                }
            } catch (error) {
                console.error('Error checking focus, showing notification anyway:', error);
            }

            // Find sender name
            const sender = contactsRef.current.find(c => c.user_id === newMessage.sender_id);
            const senderName = sender?.display_name || 'New Message';

            // Prepare notification body
            let body = 'Sent an attachment';
            if (newMessage.content && newMessage.content !== '📎 Attachment') {
                body = notificationSettings.preview ? newMessage.content : 'New message received';
            } else if (newMessage.attachments && newMessage.attachments.length > 0) {
                body = 'Sent an attachment';
            }

            // Truncate long messages
            if (body.length > 100) {
                body = body.substring(0, 100) + '...';
            }

            // Show notification
            notify({
                title: senderName,
                body: body,
            });
        });

        return unsubscribe;
    }, [user, notify, notificationSettings.preview]);

    // Close attach menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow sending if there's text OR files (or both)
        if ((messageInput.trim() || selectedFiles.length > 0) && !sending) {
            try {
                await sendChatMessage(messageInput.trim(), selectedFiles);
                setMessageInput('');
                setSelectedFiles([]);
                // Keep focus on input after sending
                setTimeout(() => {
                    messageInputRef.current?.focus();
                }, 10);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const handleAttachmentClick = (type: 'image' | 'video' | 'document') => {
        let acceptType = '*';
        switch (type) {
            case 'image':
                acceptType = 'image/*';
                break;
            case 'video':
                acceptType = 'video/*';
                break;
            case 'document':
                acceptType = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip';
                break;
        }
        setFileAcceptType(acceptType);
        setShowAttachMenu(false);
        // Trigger file input after setting accept type
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles((prev) => [...prev, ...files]);
        setShowAttachMenu(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleEmojiSelect = (emoji: EmojiData) => {
        // Insert emoji unicode at cursor position or append to message
        setMessageInput((prev) => prev + emoji.unicode);
    };


    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Filter messages based on search query
    const filteredMessages = messageSearchQuery.trim()
        ? messages.filter(msg =>
            msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
        )
        : messages;

    const formatLastSeen = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    // Remove duplicates and filter by search query
    const uniqueContacts = contacts.reduce((acc, contact) => {
        if (!acc.find(c => c.user_id === contact.user_id)) {
            acc.push(contact);
        }
        return acc;
    }, [] as Profile[]);

    const filteredContacts = uniqueContacts.filter(contact =>
        contact.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {/* Sidebar - Contact List */}
            <aside className="sidebar">
                {/* Search Header */}
                <div className="sidebar-header">
                    <div className="search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search contacts"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem', fontSize: '0.875rem', height: '2rem' }}
                        onClick={() => setShowAddContact(true)}
                    >
                        <UserPlus size={14} />
                        <span>Add Contact</span>
                    </button>
                    {requests.length > 0 && (
                        <button
                            className="btn btn-ghost"
                            style={{ marginTop: '0.25rem', fontSize: '0.875rem', height: '2rem', position: 'relative' }}
                            onClick={() => setShowRequests(true)}
                        >
                            <span>Requests</span>
                            <span style={{
                                background: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '1rem',
                                marginLeft: '0.5rem',
                            }}>
                                {requests.length}
                            </span>
                        </button>
                    )}
                </div>

                {/* Contact List */}
                <div className="contact-list">
                    {filteredContacts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                            {contacts.length === 0 ? 'No contacts yet. Add some!' : 'No contacts found'}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => {
                            const online = isOnline(contact.user_id);
                            const lastSeen = getLastSeen(contact.user_id);

                            return (
                                <div
                                    key={contact.id}
                                    className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                    onClick={() => setSelectedContact(contact)}
                                >
                                    <div className="contact-avatar" style={{ width: '48px', height: '48px', position: 'relative', flexShrink: 0 }}>
                                        {contact.avatar_url ? (
                                            <img
                                                src={contact.avatar_url}
                                                alt={contact.display_name}
                                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {getInitials(contact.display_name)}
                                            </div>
                                        )}
                                        <span className={`online-indicator ${online ? 'online' : 'offline'}`} />
                                    </div>
                                    <div className="contact-info">
                                        <div className="contact-header">
                                            <h3 className="contact-name">{contact.display_name}</h3>
                                            <span className="contact-time">
                                                {online ? '' : lastSeen ? formatLastSeen(lastSeen) : ''}
                                            </span>
                                        </div>
                                        <p className="contact-message">@{contact.username}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Settings button */}
                <div className="sidebar-footer">
                    <button className="settings-btn" onClick={() => navigate('/settings')}>
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* Chat Area */}
            <main className="chat-area">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <header className="chat-header">
                            <div className="chat-user-info">
                                <div className="chat-avatar" style={{ width: '40px', height: '40px', position: 'relative', flexShrink: 0 }}>
                                    {selectedContact.avatar_url ? (
                                        <img
                                            src={selectedContact.avatar_url}
                                            alt={selectedContact.display_name}
                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder small">
                                            {getInitials(selectedContact.display_name)}
                                        </div>
                                    )}
                                    <span className={`online-indicator small ${isOnline(selectedContact.user_id) ? 'online' : 'offline'}`} />
                                </div>
                                <div>
                                    <h2 className="chat-user-name">{selectedContact.display_name}</h2>
                                    <span className="chat-status-text">
                                        {isOnline(selectedContact.user_id) ? 'Online' : `@${selectedContact.username}`}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <div style={{ position: 'relative', marginRight: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={messageSearchQuery}
                                        onChange={(e) => setMessageSearchQuery(e.target.value)}
                                        className="message-search-input"
                                    />
                                    {messageSearchQuery && (
                                        <button
                                            onClick={() => setMessageSearchQuery('')}
                                            style={{
                                                position: 'absolute',
                                                right: '0.5rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'var(--muted-mauve)'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <button className="action-btn">
                                    <Phone size={16} />
                                </button>
                                <button className="action-btn">
                                    <Video size={16} />
                                </button>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="action-btn"
                                        onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {headerMenuOpen && (
                                        <div
                                            ref={headerMenuRef}
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: '0',
                                                marginTop: '0.5rem',
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '0.75rem',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                                zIndex: 1000,
                                                minWidth: '180px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <button
                                                onClick={() => {
                                                    setHeaderMenuOpen(false);
                                                    setShowDeleteConfirm(true);
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
                                                    textAlign: 'left'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <Trash2 size={16} />
                                                <span>Delete all messages</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Messages Area */}
                        <div className="messages-area" style={{
                            overflowY: 'auto',
                            flex: 1,
                            padding: '1.5rem',
                            paddingBottom: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {messagesLoading ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                                    Loading messages...
                                </div>
                            ) : filteredMessages.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                                    {messageSearchQuery ? 'No messages found' : `No messages yet. Start a conversation with ${selectedContact.display_name}!`}
                                </div>
                            ) : (
                                <>
                                    {/* Load More Sentinel */}
                                    {!messageSearchQuery && hasMore && (
                                        <div
                                            ref={sentinelRef}
                                            style={{ padding: '0.5rem', textAlign: 'center', opacity: 0.6, fontSize: '0.75rem', color: 'var(--text-light)' }}
                                        >
                                            {loadingMore && <div className="loading-spinner" />}
                                        </div>
                                    )}
                                    {!messageSearchQuery && (
                                        <div className="date-divider">
                                            <span>Today</span>
                                        </div>
                                    )}
                                    {filteredMessages.map((message) => {
                                        const isSent = message.sender_id === user?.id;
                                        const status = isSent ? getMessageStatus(message.id) : null;
                                        const isDelivered = status?.delivered_at;
                                        const isRead = status?.read_at;
                                        const isEditing = editingMessageId === message.id;
                                        const isDeleted = message.deleted;

                                        // Check if message can be edited (within 15 minutes)
                                        const messageTime = message.created_at ? new Date(message.created_at).getTime() : 0;
                                        const canEdit = isSent && !isDeleted && (Date.now() - messageTime) < 15 * 60 * 1000;

                                        const handleContextMenu = (e: React.MouseEvent) => {
                                            if (isDeleted) return;
                                            e.preventDefault();
                                            setContextMenu({
                                                isOpen: true,
                                                position: { x: e.clientX, y: e.clientY },
                                                messageId: message.id,
                                                isSentByMe: isSent,
                                                canEdit: canEdit
                                            });
                                        };

                                        const handleSaveEdit = async () => {
                                            if (!editContent.trim()) return;
                                            try {
                                                await editMessage(message.id, editContent);
                                                setEditingMessageId(null);
                                                setEditContent('');
                                            } catch (err) {
                                                alert(err instanceof Error ? err.message : 'Failed to edit message');
                                            }
                                        };

                                        const handleCancelEdit = () => {
                                            setEditingMessageId(null);
                                            setEditContent('');
                                        };

                                        return (
                                            <div
                                                key={message.id}
                                                className={`message ${isSent ? 'sent' : 'received'}`}
                                                onContextMenu={handleContextMenu}
                                                style={{ opacity: isDeleted ? 0.6 : 1 }}
                                            >
                                                {!isSent && (
                                                    <div className="message-avatar" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                                                        {selectedContact.avatar_url ? (
                                                            <img
                                                                src={selectedContact.avatar_url}
                                                                alt={selectedContact.display_name}
                                                                style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                                                            />
                                                        ) : (
                                                            <div className="avatar-placeholder tiny">
                                                                {getInitials(selectedContact.display_name)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="message-content">
                                                    <div className="message-bubble" style={{ fontStyle: isDeleted ? 'italic' : 'normal' }}>
                                                        {isEditing ? (
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '0.75rem',
                                                                width: '100%',
                                                                minWidth: '500px',
                                                                maxWidth: '800px'
                                                            }}>
                                                                <textarea
                                                                    value={editContent}
                                                                    onChange={(e) => setEditContent(e.target.value)}
                                                                    rows={Math.max(3, Math.ceil(editContent.length / 50))}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem',
                                                                        border: '2px solid var(--primary)',
                                                                        borderRadius: '0.75rem',
                                                                        background: isSent
                                                                            ? 'rgba(157, 23, 77, 0.1)'
                                                                            : 'rgba(255, 255, 255, 0.05)',
                                                                        color: 'var(--text-primary)',
                                                                        fontSize: '0.9375rem',
                                                                        fontFamily: 'inherit',
                                                                        lineHeight: '1.5',
                                                                        resize: 'vertical',
                                                                        outline: 'none',
                                                                    }}
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        }
                                                                        if (e.key === 'Escape') handleCancelEdit();
                                                                    }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        onClick={handleCancelEdit}
                                                                        style={{
                                                                            padding: '0.5rem 1rem',
                                                                            background: 'transparent',
                                                                            border: '1px solid var(--border-color)',
                                                                            borderRadius: '0.5rem',
                                                                            cursor: 'pointer',
                                                                            color: 'var(--text-primary)',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 500,
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSaveEdit}
                                                                        style={{
                                                                            padding: '0.5rem 1rem',
                                                                            background: 'var(--primary)',
                                                                            border: 'none',
                                                                            borderRadius: '0.5rem',
                                                                            cursor: 'pointer',
                                                                            color: 'white',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 600,
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <MessageContent content={isDeleted ? 'This message was deleted' : message.content} />
                                                        )}

                                                        {/* Display attachments */}
                                                        {!isEditing && message.attachments && message.attachments.length > 0 && (
                                                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {message.attachments.map((attachment) => (
                                                                    <AttachmentDisplay key={attachment.id} attachment={attachment} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="message-time">
                                                        {new Date(message.created_at || '').toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                        {message.edited_at && !isDeleted && (
                                                            <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>(edited)</span>
                                                        )}
                                                        {isSent && !isDeleted && (
                                                            <span style={{
                                                                marginLeft: '0.5rem',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 500,
                                                                color: isRead ? 'var(--primary)' : 'inherit',
                                                                opacity: isRead ? 1 : 0.6
                                                            }}>
                                                                {isRead ? 'Seen' : isDelivered ? 'Delivered' : 'Sent'}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Message Actions Button (visible on hover) - positioned outside message */}
                                                {!isDeleted && !isEditing && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            // Position menu to avoid going off screen
                                                            let x = rect.left;
                                                            let y = rect.bottom + 4;

                                                            // Check if menu would go off right edge
                                                            if (x + 180 > window.innerWidth) {
                                                                x = window.innerWidth - 190;
                                                            }
                                                            // Check if menu would go off bottom
                                                            if (y + 150 > window.innerHeight) {
                                                                y = rect.top - 150;
                                                            }

                                                            setContextMenu({
                                                                isOpen: true,
                                                                position: { x, y },
                                                                messageId: message.id,
                                                                isSentByMe: isSent,
                                                                canEdit: canEdit
                                                            });
                                                        }}
                                                        className="message-actions-btn"
                                                        style={{
                                                            opacity: 0,
                                                            background: 'var(--bg-secondary)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '1.5rem',
                                                            height: '1.5rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                            transition: 'opacity 0.2s ease',
                                                            flexShrink: 0,
                                                            alignSelf: 'center',
                                                        }}
                                                        title="More options"
                                                    >
                                                        <MoreVertical size={12} style={{ color: 'var(--muted-mauve)' }} />
                                                    </button>
                                                )}

                                                {/* Context Menu Placeholder (Moved to root) */}
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="message-input-container">
                            {/* File Preview */}
                            {selectedFiles.length > 0 && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderTop: '1px solid rgba(157, 23, 77, 0.1)',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    backgroundColor: 'var(--bg-secondary)'
                                }}>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem',
                                            border: '1px solid rgba(157, 23, 77, 0.2)'
                                        }}>
                                            <span>{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: 'var(--muted-mauve)'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form className="message-input-wrapper" onSubmit={handleSendMessage}>
                                {/* Attachment Button with Dropdown */}
                                <div className="attach-wrapper" ref={attachMenuRef}>
                                    <button
                                        type="button"
                                        className="input-action-btn"
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                    >
                                        {showAttachMenu ? <X size={18} /> : <Paperclip size={18} />}
                                    </button>

                                    {showAttachMenu && (
                                        <div className="attach-menu">
                                            <button type="button" onClick={() => handleAttachmentClick('image')}>
                                                <Image size={18} />
                                                <span>Photo</span>
                                            </button>
                                            <button type="button" onClick={() => handleAttachmentClick('video')}>
                                                <Film size={18} />
                                                <span>Video</span>
                                            </button>
                                            <button type="button" onClick={() => handleAttachmentClick('document')}>
                                                <FileText size={18} />
                                                <span>Document</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept={fileAcceptType}
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                </div>

                                <textarea
                                    ref={messageInputRef}
                                    className="message-textarea"
                                    placeholder="Type a message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    rows={1}
                                    disabled={sending}
                                />
                                <button
                                    type="button"
                                    className="input-action-btn"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Smile size={18} />
                                </button>
                                <button type="submit" className="send-btn" disabled={sending || (!messageInput.trim() && selectedFiles.length === 0)}>
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: 'var(--text-light)', opacity: 0.7 }}>
                            Select a contact to start messaging
                        </p>
                    </div>
                )}
            </main>

            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={showAddContact}
                onClose={() => setShowAddContact(false)}
                onSearch={searchUsers}
                onAddContact={async (userId) => {
                    await addContact(userId);
                    setShowAddContact(false);
                }}
            />

            {/* Contact Requests Modal */}
            <ContactRequestsModal
                isOpen={showRequests}
                onClose={() => setShowRequests(false)}
                requests={requests}
                onAccept={acceptRequest}
                onDecline={declineRequest}
                loading={requestsLoading}
            />
            {/* Dashboard Context Menu (Root Level to avoid clipping) */}
            {
                contextMenu.isOpen && (
                    <MessageContextMenu
                        isOpen={true}
                        position={contextMenu.position}
                        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
                        isSentByMe={contextMenu.isSentByMe}
                        canEdit={contextMenu.canEdit}
                        onEdit={() => {
                            const message = messages.find(m => m.id === contextMenu.messageId);
                            if (message) {
                                setEditingMessageId(message.id);
                                setEditContent(message.content);
                            }
                        }}
                        onDeleteForMe={() => {
                            if (contextMenu.messageId) {
                                const message = messages.find(m => m.id === contextMenu.messageId);
                                if (message) {
                                    if (message.sender_id === user?.id) {
                                        // My message: Delete for everyone
                                        deleteMessageForEveryone(contextMenu.messageId);
                                    } else {
                                        // Other's message: Delete for me (local hide)
                                        deleteMessageForMe(contextMenu.messageId);
                                    }
                                }
                            }
                        }}
                    />
                )
            }
            {/* Deletion Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={async () => {
                    try {
                        await clearChat();
                        setShowDeleteConfirm(false);
                    } catch (err) {
                        console.error('Failed to clear chat:', err);
                    }
                }}
                title="Delete Chat History"
                message="Are you sure you want to delete all messages? This cannot be undone."
                confirmText="Delete All"
                cancelText="Keep Messages"
                type="danger"
            />

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}
        </div>
    );
};

export default DashboardPage;
