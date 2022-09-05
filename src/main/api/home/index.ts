import { BrowserWindow, ipcMain } from 'electron';
import logger from 'electron-log';
import path from 'path';
import { store } from '../init';
import { getModList, saveMods } from "./mods";

function createHomeWindow(): BrowserWindow {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'bridge.js')
        }
    });
    win.loadFile('src/main/web/home/home.html');
    return win;
}

// register callbacks
ipcMain.handle('mod-manager:get-xml-mods', async () => {
    // scan for additional mod_configs
    const mod_locations = store.get("modLocations");
    const mod_config = store.get("modConfig");
    return await getModList(mod_config, ...mod_locations);
});

ipcMain.on('mod-manager:save-ui-mods', async (_event, mods) => {
    const save_path = store.get("modConfig");
    const shared_config_path = store.get("sharedConfig");
    if (mods != null && mods.length > 0) {
        await saveMods(save_path, shared_config_path, mods);
    }
});

ipcMain.on('logger:info', (_event, ...params) => {
    logger.info("[ipcRender::info]", ...params);
});


// getPresetNames: () => ipcRenderer.invoke('mod-manager:get-presets'),
// ipcMain.handle('mod-manager:get-preset-names', async (_event) => {
//     store.get()
//     return await getPresets();
// });
// getPresetByName: (presetName) => ipcRenderer.send('mod-manager:get-preset', presetName),
// savePreset: (preset) => ipcRenderer.send('mod-manager:save-preset', preset),

export {
    createHomeWindow
}