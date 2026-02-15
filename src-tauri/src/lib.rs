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
      use tauri::Manager;
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
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
