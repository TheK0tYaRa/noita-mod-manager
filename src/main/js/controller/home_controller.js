const { BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { loadMods } = require('./load_mods');
const logger = require('electron-log');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js')
        }
    });

    win.loadFile('src/main/html/home/home.html');

    ipcMain.handle('dark-mode:toggle', () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light';
        } else {
            nativeTheme.themeSource = 'dark';
        }
        return nativeTheme.shouldUseDarkColors;
    })

    ipcMain.handle('dark-mode:system', () => {
        nativeTheme.themeSource = 'system';
    });

    ipcMain.handle('mod-manager:reload', async () => {
        var noita_mod_config_path = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save00/mod_config.xml");
        logger.log("HARD CODED CONFIG PATH");
        return await loadMods(noita_mod_config_path);
    });
}

exports.createWindow = createWindow;