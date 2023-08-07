import path from "path";
import Store from "electron-store";
import logger from "electron-log";
import fsPromises from "fs/promises";
//
type NoitaStore = {
    steamID: string,
    steamDirectory: string,
    noitaData: string,
    modConfig: string,
    sharedConfig: string,
    modLocations: string[],
    presetsFolder: string,
    currentPreset: string,
};
//
export const store = new Store<NoitaStore>();
//
store.set("steamID", "881100");
//
logger.info(store.get("steamID"));
{
    let steam: string;
    let noitaData: string;
    let workshopPath: string;
    let defaultNoitaModPath: string;
    //
    if(process.platform === "win32"){
        steam = "C:/Program Files (x86)/Steam";
        //
        noitaData = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita");
        //
    }else if(process.platform === "darwin"){
        steam = "/Applications/Steam.app/Contents/MacOS/Steam";
        throw new Error("TODO");
    }else if(process.platform === "linux"){
        steam = path.join(process.env.HOME, ".local/share/Steam");
        //
        noitaData = path.join(store.get("steamDirectory"), "steamapps/compatdata", store.get("steamID"), "pfx/drive_c/users/steamuser/AppData/LocalLow/Nolla_Games_Noita");
        //
    }else{
        throw new Error("Unsupported platform");
    }
    workshopPath = path.join(steam, "steamapps/workshop/content", store.get("steamID"));
    defaultNoitaModPath = path.join(steam, "steamapps/common/Noita/mods");
    //
    store.set("modLocations", [workshopPath, defaultNoitaModPath]);
    store.set("steamDirectory", steam);
    //
    // initializeDataStore(noitaData);
    store.set("noitaData", noitaData);
    store.set("modConfig", path.join(noitaData, "save00/mod_config.xml"));
    store.set("sharedConfig", path.join(noitaData, "save_shared/config.xml"));
    //
    // initializePresets(noitaData);
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
