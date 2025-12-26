export interface NotificationPermission {
    granted: boolean;
    denied: boolean;
    default: boolean;
}

export interface NotificationSettings {
    enabled: boolean;
    sound: boolean;
    preview: boolean;
}

export interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    sound?: boolean;
    tag?: string;
}
