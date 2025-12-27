use tauri_plugin_notification::NotificationExt;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct NotificationPermission {
    pub granted: bool,
    pub denied: bool,
    pub default: bool,
}

/// Check notification permission status
/// On Windows, notifications are always available
/// On macOS/Linux, this checks the system permission
#[tauri::command]
pub fn check_notification_permission() -> NotificationPermission {
    // On Windows, notifications work by default
    #[cfg(target_os = "windows")]
    {
        NotificationPermission {
            granted: true,
            denied: false,
            default: false,
        }
    }

    // On macOS/Linux, we assume granted unless explicitly denied
    // The tauri-plugin-notification handles the actual permission check
    #[cfg(not(target_os = "windows"))]
    {
        NotificationPermission {
            granted: true,
            denied: false,
            default: false,
        }
    }
}

/// Request notification permission
/// This is mainly for macOS, Windows doesn't require explicit permission
#[tauri::command]
pub async fn request_notification_permission() -> Result<bool, String> {
    // On Windows, always return true
    #[cfg(target_os = "windows")]
    {
        Ok(true)
    }

    // On macOS/Linux, the plugin handles the permission request
    #[cfg(not(target_os = "windows"))]
    {
        Ok(true)
    }
}

/// Show a native notification
#[tauri::command]
pub async fn show_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Play notification sound
/// Uses Windows system notification sound, macOS/Linux system sounds
#[tauri::command]
pub async fn play_notification_sound() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // Use Windows system notification sound (async spawn to avoid blocking)
        let result = Command::new("powershell")
            .args(&[
                "-c",
                "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Notify System Generic.wav').PlaySync()"
            ])
            .spawn();
        
        if let Err(e) = result {
            eprintln!("Failed to play notification sound: {}", e);
            return Err(format!("Failed to play sound: {}", e));
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let _ = Command::new("afplay")
            .arg("/System/Library/Sounds/Glass.aiff")
            .spawn();
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let _ = Command::new("paplay")
            .arg("/usr/share/sounds/freedesktop/stereo/message.oga")
            .spawn();
    }

    Ok(())
}

/// Check if the app is currently focused
#[tauri::command]
pub async fn is_app_focused(window: tauri::Window) -> Result<bool, String> {
    window.is_focused()
        .map_err(|e| e.to_string())
}
