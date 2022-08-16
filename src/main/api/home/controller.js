const { BrowserWindow, ipcMain } = require('electron');
const logger = require('electron-log');
const Store = require('electron-store');
const fs = require("fs");
const path = require('path');
const { getModList, saveUIModList } = require("./renderer");
const convert = require('xml-js');

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
    const workshop_path = store.get("noita.modLocations.workshopMods");
    const local_mod_path = store.get("noita.modLocations.localMods");
    const mod_config = store.get("noita.modConfig");
    return await getModList(mod_config, workshop_path, local_mod_path);
});

ipcMain.on('mod-manager:save-ui-mods', async (_event, mods) => {
    const save_path = new Store().get("noita.modConfig");
    const shared_config_path = new Store().get("noita.sharedConfig");
    if (mods != null && mods.length > 0) {
        await handleSaveMods(save_path, shared_config_path, mods);
    }
});

ipcMain.on('logger:info', (_event, ...params) => {
    logger.info("[ipcRender::info]", ...params);
});

async function handleSaveMods(save_path, shared_config_path, mods) {
    let backup = path.resolve(path.dirname(save_path), "mod_config.xml.BACKUP");
    confirmBackup(save_path, backup);
    saveUIModList(save_path, mods);
    if (mods.filter(m => m.request_no_api_restrictions === "1").length > 0) {
        // ensure unsafe mods can be enabled for next boot
        let data = fs.readFileSync(shared_config_path, {encoding: "utf-8"});
        let json = JSON.parse(convert.xml2json(data, {compact: true}));
        json["Config"]["_attributes"]["mods_disclaimer_accepted"] = "1";
        json["Config"]["_attributes"]["mods_sandbox_enabled"] = "0";
        json["Config"]["_attributes"]["mods_sandbox_warning_done"] = "1";
        
        data = convert.json2xml(json, {compact: true}).replace(/ /g, '\n');
        fs.writeFileSync(shared_config_path, data, {encoding: "utf-8"});
    }
}

function confirmBackup(source, backup) {
    if (fs.existsSync(source) && !fs.existsSync(backup)) {
        fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
    }
}

module.exports = {
    "createHomeWindow": createHomeWindow
}