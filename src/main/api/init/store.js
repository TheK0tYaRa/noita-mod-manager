const path = require('path');
const Store = require('electron-store');
const logger = require('electron-log');
const fs = require('fs');

// initialize data store, `Store` acts as a singleton and can be accessed later
const store = new Store();

// FIXME: remove this line
store.delete("noita")

if (store.get("noita") === undefined) {
    var steam = findSteam();
    var workshopPath = path.join(steam, "steamapps\\workshop\\content\\881100");
    var defaultNoitaModPath = path.join(steam, "steamapps\\common\\Noita\\mods");
    store.set("noita", {
        "modConfig": path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save00/mod_config.xml"),
        "sharedConfig": path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/save_shared/config.xml"),
        "presetsFolder": path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/mod_presets"),
        "modLocations": [workshopPath, defaultNoitaModPath],
    });
    initializePresets();
}

function findSteam() {
    var steamPath = path.join("C:\\Program Files (x86)\\Steam");
    return steamPath;
}

function initializePresets() {
    let presetsFolder = store.get("presetsFolder");
    if (presetsFolder == null) {
        presetsFolder = path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita/mod_presets");
        store.set("noita.presetsFolder", presetsFolder);
    }
    if (!fs.existsSync(presetsFolder)) {
        fs.mkdir(presetsFolder, () => logger.info(`created presets folder ${presetsFolder}`));
    }
    return presetsFolder;
}