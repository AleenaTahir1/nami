import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Phone, Video, MoreVertical,
    Paperclip, Smile, Send, Settings,
    Image, FileText, Film, X, UserPlus, Check, CheckCheck
} from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { AddContactModal } from '../components/AddContactModal';
import type { Profile } from '../lib/supabase-types';

const DashboardPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { contacts, loading, addContact, searchUsers } = useContacts();
    const { messages, loading: messagesLoading, sending, sendMessage, messagesEndRef, getMessageStatus } = useMessages(selectedContact?.user_id || null);

    // Set initial selected contact
    useEffect(() => {
        if (contacts.length > 0 && !selectedContact) {
            setSelectedContact(contacts[0]);
        }
    }, [contacts]);

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
        if (messageInput.trim() && !sending) {
            try {
                await sendMessage(messageInput);
                setMessageInput('');
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const handleAttachment = (type: string) => {
        console.log('Attaching:', type);
        setShowAttachMenu(false);
        // TODO: Implement file picker based on type
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const filteredContacts = contacts.filter(contact =>
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
                </div>

                {/* Contact List */}
                <div className="contact-list">
                    {filteredContacts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                            {contacts.length === 0 ? 'No contacts yet. Add some!' : 'No contacts found'}
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                                onClick={() => setSelectedContact(contact)}
                            >
                                <div className="contact-avatar">
                                    <div className="avatar-placeholder">
                                        {getInitials(contact.display_name)}
                                    </div>
                                </div>
                                <div className="contact-info">
                                    <div className="contact-header">
                                        <h3 className="contact-name">{contact.display_name}</h3>
                                        <span className="contact-time">-</span>
                                    </div>
                                    <p className="contact-message">@{contact.username}</p>
                                </div>
                            </div>
                        ))
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
                                <div className="chat-avatar">
                                    <div className="avatar-placeholder small">
                                        {getInitials(selectedContact.display_name)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="chat-user-name">{selectedContact.display_name}</h2>
                                    <span className="chat-status-text">
                                        @{selectedContact.username}
                                    </span>
                                </div>
                            </div>
                    <div className="chat-actions">
                        <button className="action-btn">
                            <Phone size={16} />
                        </button>
                        <button className="action-btn">
                            <Video size={16} />
                        </button>
                        <button className="action-btn">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </header>

                        {/* Messages Area */}
                        <div className="messages-area">
                            {messagesLoading ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                                    Loading messages...
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', opacity: 0.7 }}>
                                    No messages yet. Start a conversation with {selectedContact.display_name}!
                                </div>
                            ) : (
                                <>
                                    <div className="date-divider">
                                        <span>Today</span>
                                    </div>
                                    {messages.map((message) => {
                                        const isSent = message.sender_id === user?.id;
                                        const status = isSent ? getMessageStatus(message.id) : null;
                                        const isDelivered = status?.delivered_at;
                                        const isRead = status?.read_at;
                                        
                                        return (
                                            <div
                                                key={message.id}
                                                className={`message ${isSent ? 'sent' : 'received'}`}
                                            >
                                                {!isSent && (
                                                    <div className="message-avatar">
                                                        <div className="avatar-placeholder tiny">
                                                            {getInitials(selectedContact.display_name)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="message-content">
                                                    <div className="message-bubble">
                                                        {message.content}
                                                    </div>
                                                    <span className="message-time">
                                                        {new Date(message.created_at || '').toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                        {isSent && (
                                                            <span style={{ marginLeft: '0.25rem', display: 'inline-flex', alignItems: 'center' }}>
                                                                {isRead ? (
                                                                    <CheckCheck size={12} style={{ color: 'var(--primary)' }} />
                                                                ) : isDelivered ? (
                                                                    <CheckCheck size={12} style={{ opacity: 0.5 }} />
                                                                ) : (
                                                                    <Check size={12} style={{ opacity: 0.5 }} />
                                                                )}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="message-input-container">
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
                                    <button type="button" onClick={() => handleAttachment('image')}>
                                        <Image size={18} />
                                        <span>Photo</span>
                                    </button>
                                    <button type="button" onClick={() => handleAttachment('video')}>
                                        <Film size={18} />
                                        <span>Video</span>
                                    </button>
                                    <button type="button" onClick={() => handleAttachment('document')}>
                                        <FileText size={18} />
                                        <span>Document</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <textarea
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
                        <button type="button" className="input-action-btn">
                            <Smile size={18} />
                        </button>
                                <button type="submit" className="send-btn" disabled={sending || !messageInput.trim()}>
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
        </div>
    );
};

export default DashboardPage;
