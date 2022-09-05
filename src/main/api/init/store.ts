import path from "path";
import Store from "electron-store";
import logger from "electron-log";
import fs from "fs";

const store = new Store<NoitaStore>();

type NoitaStore = {
    modConfig: string,
    sharedConfig: string,
    modLocations: string[],
    presetsFolder: string,
    lastPreset: string,
};

function initializeStore(): void {
    var steam = findSteam();
    var workshopPath = path.join(steam, "steamapps/workshop/content/881100");
    var defaultNoitaModPath = path.join(steam, "steamapps/common/Noita/mods");
    store.set("modConfig", path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save00/mod_config.xml"));
    store.set("sharedConfig", path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save_shared/config.xml"));
    store.set("modLocations", [workshopPath, defaultNoitaModPath]);
    initializePresets();
}

function findSteam(): string {
    var steamPath = path.join("C:/Program Files (x86)/Steam");
    return steamPath;
}

function initializePresets(): void {
    // ensure key is present and is real: preset folder 
    let presetsFolder = store.get("presetsFolder");
    if (presetsFolder == null) {
        presetsFolder = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/mod_presets");
        store.set("presetsFolder", presetsFolder);
    }
    if (!fs.existsSync(presetsFolder)) {
        fs.mkdir(presetsFolder, () => logger.info(`created presets folder ${presetsFolder}`));
    }

    // ensure key is present and is real: last preset (last used mod_config.xml)
    let lastSelectedPreset = store.get("lastPreset");
    if (lastSelectedPreset == null) {
        lastSelectedPreset = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save00/mod_config.xml");
        if (fs.existsSync(lastSelectedPreset)) { // back this up to presets folder
            fs.copyFileSync(lastSelectedPreset, path.join(presetsFolder, "default.xml"));
            store.set("presetsFolder", path.join(presetsFolder, "default.xml"));
        }
    }
}

if (store.get("modConfig", undefined) === undefined) {
    initializeStore();
}

export { store };