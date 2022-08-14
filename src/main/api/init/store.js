const path = require('path');
const Store = require('electron-store');

// initialize data store, `Store` acts as a singleton and can be accessed later
const store = new Store();

if (store.get("noita") !== undefined) {
    store.delete("noita");
}

var steam = findSteam();
var workshopPath = path.join(steam, "steamapps\\workshop\\content\\881100");
var defaultNoitaModPath = path.join(steam, "steamapps\\common\\Noita\\mods");

store.set("noita", {
    "userData": path.join(process.env.APPDATA, "../LocalLow/Nolla_Games_Noita"),
    // added a couple up-dirs for no good reason
    "modLocations": {
        "workshopMods": workshopPath,
        "localMods": defaultNoitaModPath,
        "userAdded": []
    }
});

// fixme: support additional locations, somehow
function findSteam() {
    var steamPath = path.join("C:\\Program Files (x86)\\Steam");
    return steamPath;
}