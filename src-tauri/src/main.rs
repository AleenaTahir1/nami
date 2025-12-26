// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod notifications;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            notifications::check_notification_permission,
            notifications::request_notification_permission,
            notifications::show_notification,
            notifications::play_notification_sound,
            notifications::is_app_focused,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
