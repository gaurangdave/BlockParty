use tauri::Manager;

#[tauri::command]
fn set_overlay_clickable(window: tauri::Window, clickable: bool) -> Result<(), String> {
  // When clickable is true, the window should receive mouse events
  // When clickable is false, the window should ignore mouse events (ghost mode)
  window
    .set_ignore_cursor_events(!clickable)
    .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Explicitly set the window to be transparent on macOS to avoid white background
      if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        {
           // Ensure the window background is transparent
           // This is often required on macOS even if tauri.conf.json has transparent: true
           use tauri::window::Color;
           let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
        }
        
        // Maximize the window to cover the screen (overlay mode) without triggering native fullscreen
        let _ = window.maximize();
        
        // NOTE: We start in INTERACTIVE mode so the window can receive keyboard events
        // The user can toggle to ghost mode by NOT holding the Alt key
        // If we start in ghost mode (set_ignore_cursor_events(true)), the window won't receive any keyboard input
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![set_overlay_clickable])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
