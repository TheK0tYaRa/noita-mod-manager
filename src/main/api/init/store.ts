import path from "path";
import Store from "electron-store";
import logger from "electron-log";
import fsPromises from "fs/promises";

type NoitaStore = {
    steamDirectory: string,
    noitaData: string,
    modConfig: string,
    sharedConfig: string,
    modLocations: string[],
    presetsFolder: string,
    currentPreset: string,
};

export const store = new Store<NoitaStore>();
if (!store.get("steamDirectory", undefined)) {
    let steam = path.join("C:/Program Files (x86)/Steam");
    initializeSteam(steam);
}
if (!store.get("noitaData", undefined)) {
    let noitaData = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita");
    initializeDataStore(noitaData);
    initializePresets(noitaData);
}

function initializeSteam(steam: string) {
    store.set("steamDirectory", steam);
    let workshopPath = path.join(steam, "steamapps/workshop/content/881100");
    let defaultNoitaModPath = path.join(steam, "steamapps/common/Noita/mods");
    store.set("modLocations", [workshopPath, defaultNoitaModPath]);
}

function initializeDataStore(noitaData: string) {
    store.set("noitaData", noitaData);
    store.set("modConfig", path.join(noitaData, "save00/mod_config.xml"));
    store.set("sharedConfig", path.join(noitaData, "save_shared/config.xml"));
}

function initializePresets(noitaData: string): void {
    let presetsFolder = store.get("presetsFolder", undefined);
    // ensure key is present and is real: preset folder 
    if (presetsFolder === undefined) {
        presetsFolder = path.join(noitaData, "mod_presets");
        store.set("presetsFolder", presetsFolder);
    }
    fsPromises.mkdir(presetsFolder)
        .catch((err: Error) => {
            if (!err.message.includes("file already exists, mkdir"))
                throw err; // rethrow unexpected errors
        })
        .finally(async () => {
            // folder did not previously exist, copy mod_config.xml over
            // ensure key is present and is real: lastPreset (last used mod_config.xml)
            let lastSelectedPreset = path.join(noitaData, "save00/mod_config.xml");
            let nextSelectedPreset = path.join(presetsFolder, "default.xml");
            store.set("currentPreset", "default");
            fsPromises.copyFile(lastSelectedPreset, nextSelectedPreset)
                .catch(err => logger.error(err));
        });
}