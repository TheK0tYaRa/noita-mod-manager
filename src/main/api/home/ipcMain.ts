import { ipcMain, nativeTheme } from 'electron';
import logger from 'electron-log';
import { Mod } from "./index"
import { store } from '../init';
import { enableUnsafeMods, getModList, saveMods } from "./mods";
import { getPresetFile, getPresetNames, savePreset, loadPreset, deletePreset } from "./presets";

// theme settings
ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light';
    } else {
        nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system';
});

ipcMain.handle('mod-manager:get-mods', async (): Promise<Mod[]> => {
    return getModList(store.get("modConfig"), ...store.get("modLocations"));
});

ipcMain.handle('mod-manager:get-current-preset', (): string => {
    return store.get("currentPreset");
});

ipcMain.handle('mod-manager:get-preset-names', async (): Promise<string[]> => {
    const modPresetsFolder = store.get("presetsFolder");
    return getPresetNames(modPresetsFolder);
});

ipcMain.on('mod-manager:load-preset', async (_event: Electron.IpcMainEvent, presetName: string) => {
    store.set("currentPreset", presetName);
    return getPresetFile(store.get("presetsFolder"), presetName)
        .then(async presetFile => {
            logger.info(`Loading preset '${presetName}' from ${presetFile}`);
            await loadPreset(presetFile, store.get("modConfig"));
            _event.sender.send("mod-manager:preset-is-loaded", await getModList(store.get("modConfig"), ...store.get("modLocations")));
        }).catch(err => {
            console.error(err);
        });
});

ipcMain.on('mod-manager:save-preset', (_event, mods: Mod[]) => {
    if (mods == null || mods.length == 0) {
        logger.error(`mods not transmitted during event: ${_event}`);
        return;
    }
    savePresetAs(store.get("currentPreset"), mods);
});

ipcMain.on('mod-manager:new-preset', (_event, presetName: string, mods: Mod[]) => {
    if (mods == null || mods.length == 0) {
        logger.error(`mods not transmitted during event: ${_event}`);
        return;
    }
    savePresetAs(presetName, mods);
    store.set("currentPreset", presetName);
});

ipcMain.on('mod-manager:delete-preset', (_event, presetName: string) => {
    deletePreset(store.get("presetsFolder"), presetName);
});

function savePresetAs(presetName: string, mods: Mod[]) {
    let presetsFolder = store.get("presetsFolder");
    let modConfig = store.get("modConfig");
    let sharedConfig = store.get("sharedConfig");
    // update both preset files: mod_config.xml, the actual preset
    saveMods(modConfig, mods).then(async ok => {
        await savePreset(presetsFolder, presetName, modConfig)
            .then(() => {
                logger.info(`Updated preset ${presetName}`);
            }).catch(err => logger.error(err));
    }).catch(err => logger.error(err));
    // update the shared_config.xml file if unsafe mods must be used
    if (mods.filter(m => m.request_no_api_restrictions === "1").length > 0) {
        enableUnsafeMods(sharedConfig);
    }
}

logger.info("ipcmain finished")