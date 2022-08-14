const { BrowserWindow, ipcMain } = require('electron');
const logger = require('electron-log');
const Store = require('electron-store');
const fs = require("fs");
const path = require('path');
const { getModList, saveUIModList } = require("./renderer");

function createHomeWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadFile('src/main/web/home/home.html');
    return win;
}

// register callbacks
ipcMain.handle('mod-manager:get-xml-mods', async () => {
    const store = new Store();
    // scan for additional mod_configs
    const workshopPath = store.get("noita.modLocations.workshopMods");
    const localModPath = store.get("noita.modLocations.localMods");
    const userData = store.get("noita.userData");
    const modConfig = path.join(userData, "save00/mod_config.xml");
    return await getModList(modConfig, workshopPath, localModPath);
});

ipcMain.on('mod-manager:save-ui-mods', (_event, mods) => {
    const userData = new Store().get("noita.userData");
    const savePath = path.join(userData, "save00/mod_config.xml");
    if (fs.existsSync(savePath)) {
        fs.copyFile(savePath, path.join(userData, "mod_config.xml.BACKUP"), (err) => {
            if (err) logger.error(err);
        });
    }
    saveUIModList(savePath, mods);
});

module.exports = {
    "createHomeWindow": createHomeWindow
}