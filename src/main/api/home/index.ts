import { BrowserWindow } from 'electron';
import path from 'path';
require("./ipcMain");

export interface Mod {
    name: string
    mod_id: string
    description: string
    enabled: string
    is_game_mode: string
    request_no_api_restrictions: string
    workshop_item_id: string
    settings_fold_open: string
    mod_path: string
}

export function createHomeWindow(): BrowserWindow {
    const win = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'ipcRenderer.js'),
        }
    });
    win.loadFile('src/main/web/home/home.html');
    return win;
}
