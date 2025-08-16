use std::{collections::HashMap, fs, path::Path, sync::Mutex};
use anyhow::{Context, Result};
use toml::Value;
use tauri::{State, Manager};
use tauri_plugin_shell;
use sys_locale::get_locale;

/// 配置读取器
pub struct TomlConfig {
    root: Value,
}

impl TomlConfig {
    pub fn new<P: AsRef<Path>>(file_path: P) -> Result<Self> {
        let content = fs::read_to_string(&file_path)
            .with_context(|| format!("读取文件失败: {}", file_path.as_ref().display()))?;

        // ✅ 用 toml::from_str 解析整个 TOML 文件
        let root: Value = toml::from_str(&content)
            .with_context(|| format!("解析 TOML 失败: {}", file_path.as_ref().display()))?;

        Ok(Self { root })
    }

    pub fn get(&self, path: &str) -> Option<&Value> {
        get_by_dotted_path(&self.root, path)
    }
}

fn get_by_dotted_path<'a>(value: &'a Value, dotted: &str) -> Option<&'a Value> {
    let mut current = value;
    for key in dotted.split('.') {
        match current {
            Value::Table(map) => current = map.get(key)?,
            _ => return None,
        }
    }
    Some(current)
}

/// 全局缓存结构
pub struct LangCache {
    map: HashMap<String, TomlConfig>,
}

impl LangCache {
    fn new() -> Self {
        LangCache {
            map: HashMap::new(),
        }
    }

    fn get_or_load(&mut self, locale: &str, app: &tauri::AppHandle) -> Option<&TomlConfig> {
        if !self.map.contains_key(locale) {
            let resource_path = app
                .path()
                .resolve(format!("lang/{}.toml", locale), tauri::path::BaseDirectory::Resource)
                .ok()?;

            if resource_path.exists() {
                match TomlConfig::new(&resource_path) {
                    Ok(config) => {
                        self.map.insert(locale.to_string(), config);
                    }
                    Err(e) => {
                        println!("解析 TOML 失败: {}\n{:?}", resource_path.display(), e);
                    }
                }
            } else {
                println!("文件不存在: {}", resource_path.display());
            }
        }
        self.map.get(locale)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(LangCache::new()))
        .invoke_handler(tauri::generate_handler![get_system_encoding, get_i18n_values])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_i18n_values(
    keys: Vec<String>,
    state: State<'_, Mutex<LangCache>>,
    app: tauri::AppHandle,
) -> HashMap<String, String> {
    let locale = get_locale().unwrap_or_else(|| "en-US".to_string());
    let mut state = state.lock().unwrap_or_else(|e| e.into_inner());
    let mut result = HashMap::new();

    let config_opt = state.get_or_load(&locale, &app);

    for key in keys.iter() {
        let value = if let Some(config) = config_opt {
            if let Some(v) = config.get(key) {
                match v {
                    toml::Value::String(s) => s.clone(),
                    toml::Value::Table(table) => {
                        table.get("index").and_then(|v| v.as_str()).unwrap_or(key).to_string()
                    }
                    _ => key.clone(),
                }
            } else {
                key.clone()
            }
        } else {
            key.clone()
        };
        result.insert(key.clone(), value);
    }

    return result
}

#[tauri::command]
fn get_system_encoding() -> String {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::System::Console::GetConsoleOutputCP;
        let cp = unsafe { GetConsoleOutputCP() };
        match cp {
            65001 => "utf-8".to_string(),
            936 => "gbk".to_string(),
            _ => format!("cp{}", cp),
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        std::env::var("LC_CTYPE")
            .or_else(|_| std::env::var("LANG"))
            .unwrap_or_else(|_| "utf-8".to_string())
            .split('.')
            .nth(1)
            .unwrap_or("utf-8")
            .to_lowercase()
    }
}
