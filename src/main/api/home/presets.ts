import { store } from "../init";
import fsPromises from "fs/promises";
import convert from "xml-js";
import fs from "fs";
import path from "path";

async function getPresets(): Promise<string[]> {
    const files = await fsPromises.readdir(store.get("presetsFolder"));
    return files.filter(isValidPresetFile).map(f => path.basename(f, "xml"));
}

async function isValidPresetFile(file: string) {
    try {
        let mods = readPresetFile(file);
        return mods != null;
    } catch (err) {
        return false;
    }
}

async function readPresetFile(file: string) {
    let data = fs.readFileSync(file, { encoding: "utf-8" });
    let json: object = JSON.parse(convert.xml2json(data, { compact: true }));
    return json["Mods"]["Mod"].map((o: object) => o["_attributes"]);
}

async function savePreset(presetName: string, basePresetFile: string) {
    let destination = path.join(store.get("presetsFolder"), presetName);
    await fsPromises.copyFile(basePresetFile, destination)
}

export {
    getPresets,
    readPresetFile,
    savePreset
}