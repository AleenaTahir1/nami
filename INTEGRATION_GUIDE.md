# Integration Guide for New Features

## Overview
All backend migrations and utility files are complete. Now need to integrate into DashboardPage.tsx

## Changes Needed in DashboardPage.tsx

### 1. Add New Imports
```typescript
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useNotifications } from '../hooks/useNotifications';
```

### 2. Add New State
```typescript
const [replyingTo, setReplyingTo] = useState<MessageWithAttachments | null>(null);
```

### 3. Add Hooks
```typescript
// After existing hooks
const { contactTyping, setTyping } = useTypingIndicator(selectedContact?.user_id || null);
useNotifications(); // Global notifications
```

### 4. Update Message Input onChange
```typescript
onChange={(e) => {
    setMessageInput(e.target.value);
    // Trigger typing indicator
    if (e.target.value.length > 0) {
        setTyping(true);
    } else {
        setTyping(false);
    }
}}
```

### 5. Show Typing Indicator in Chat Header
After contact name, add:
```typescript
{contactTyping && (
    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem' }}>
        typing...
    </span>
)}
```

### 6. Fix Last Seen Display
Update the `formatLastSeen` function:
```typescript
const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `Last seen today at ${timeStr}`;
    if (days === 1) return `Last seen yesterday at ${timeStr}`;
    if (days < 7) return `Last seen ${days} days ago`;
    
    return `Last seen ${date.toLocaleDateString()}`;
};
```

### 7. Add Reply Functionality

Add reply button to context menu and update message rendering to show reply preview.

## Status
- ✅ Database migrations complete
- ✅ Utility functions created
- ✅ Hooks created
- ✅ TypeScript types updated
- ⏳ Integration into DashboardPage (manual step required due to complexity)

## Testing
1. Open two browser/app instances
2. Login with different accounts
3. Test:
   - Typing indicator appears when typing
   - Last seen shows correct time
   - Notifications show message preview
   - Reply functionality works
