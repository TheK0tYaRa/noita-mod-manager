const logger = require('electron-log');
const Store = require('electron-store');
const fsPromises = require('fs/promises');
const convert = require('xml-js');
const fs = require('fs');
const path = require('path');

let presetsFolder = new Store().get("presetsFolder");

async function getPresets() {
    const files = await fsPromises.readdir(presetsFolder);
    return files.filter(isValidPresetFile).map(f => path.basename(f, "xml"));
}

async function isValidPresetFile(file) {
    try {
        let mods = readPresetFile(file);
        return mods != null;
    } catch (err) {
        return false;
    }
}

async function readPresetFile(file) {
    let data = fs.readFileSync(file, { encoding: "utf-8" });
    let json = JSON.parse(convert.xml2json(data, { compact: true }));
    return json["Mods"]["Mod"].map(o => o["_attributes"]);
}

async function savePreset(presetName, basePresetFile) {
    let destination = path.join(presetsFolder, presetName);
    await fsPromises.copyFile(basePresetFile, destination)
}

module.exports = {
    "getPresets": getPresets,
    "readPresetFile": readPresetFile,
    "savePreset": savePreset
}