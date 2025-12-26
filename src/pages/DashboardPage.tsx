import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Phone, Video, MoreVertical,
    Paperclip, Smile, Send, Settings,
    Image, FileText, Film, X
} from 'lucide-react';

// Mock contact data
const contacts = [
    { id: 1, name: 'Sarah Jenkins', lastMessage: 'See you there!', time: '2m', online: true, active: true },
    { id: 2, name: 'Bob Smith', lastMessage: 'Did you get the file?', time: '1h', online: false, active: false },
    { id: 3, name: 'Emma Wilson', lastMessage: "Let's reschedule for tomorrow.", time: '3h', online: false, active: false },
    { id: 4, name: 'David Chen', lastMessage: 'Thanks for the update!', time: '1d', online: false, active: false },
    { id: 5, name: 'Alice Brown', lastMessage: 'Sent the design files.', time: '2d', online: false, active: false },
];

// Mock messages
const messages = [
    { id: 1, sender: 'them', text: 'Hi! I just wanted to check in about the project timeline. Do we have everything ready for the launch next week?', time: '10:42 AM' },
    { id: 2, sender: 'me', text: 'Hey Sarah! Yes, almost there.', time: '10:44 AM' },
    { id: 3, sender: 'me', text: "I'm just finishing up the final assets for the landing page. I should have them sent over by this afternoon.", time: '10:45 AM' },
    { id: 4, sender: 'them', text: 'That sounds perfect! 🎉', time: '10:46 AM' },
    { id: 5, sender: 'them', text: 'See you there!', time: '10:46 AM' },
];

const DashboardPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [selectedContact, setSelectedContact] = useState(contacts[0]);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            console.log('Sending message:', messageInput);
            setMessageInput('');
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
                </div>

                {/* Contact List */}
                <div className="contact-list">
                    {contacts.map((contact) => (
                        <div
                            key={contact.id}
                            className={`contact-item ${selectedContact.id === contact.id ? 'active' : ''}`}
                            onClick={() => setSelectedContact(contact)}
                        >
                            <div className="contact-avatar">
                                <div className="avatar-placeholder">
                                    {getInitials(contact.name)}
                                </div>
                                {contact.online && <span className="online-indicator" />}
                            </div>
                            <div className="contact-info">
                                <div className="contact-header">
                                    <h3 className="contact-name">{contact.name}</h3>
                                    <span className="contact-time">{contact.time}</span>
                                </div>
                                <p className="contact-message">{contact.lastMessage}</p>
                            </div>
                        </div>
                    ))}
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
                {/* Chat Header */}
                <header className="chat-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            <div className="avatar-placeholder small">
                                {getInitials(selectedContact.name)}
                            </div>
                            {selectedContact.online && <span className="online-indicator small" />}
                        </div>
                        <div>
                            <h2 className="chat-user-name">{selectedContact.name}</h2>
                            <span className="chat-status-text">
                                {selectedContact.online ? 'Online' : 'Offline'}
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
                    <div className="date-divider">
                        <span>Today</span>
                    </div>

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
                        >
                            {message.sender === 'them' && (
                                <div className="message-avatar">
                                    <div className="avatar-placeholder tiny">
                                        {getInitials(selectedContact.name)}
                                    </div>
                                </div>
                            )}
                            <div className="message-content">
                                <div className="message-bubble">
                                    {message.text}
                                </div>
                                <span className="message-time">{message.time}</span>
                            </div>
                        </div>
                    ))}
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
                        />
                        <button type="button" className="input-action-btn">
                            <Smile size={18} />
                        </button>
                        <button type="submit" className="send-btn">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
