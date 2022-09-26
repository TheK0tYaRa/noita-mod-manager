import logger from 'electron-log';
import fsPromises from "fs/promises";
import path from "path";
import convert from "xml-js";

async function getPresetList(modPresetsFolder: string): Promise<string[]> {
    return fsPromises.readdir(modPresetsFolder).then(contents => {
        return contents.filter(s => s.toLowerCase().endsWith("xml")).map(p => path.join(modPresetsFolder, p));
    }).catch(err => {
        logger.error(err);
        return [];
    });
}

export async function getPresetNames(modPresetsFolder: string): Promise<string[]> {
    return fsPromises.readdir(modPresetsFolder).then(contents => {
        return contents.filter(s => s.toLowerCase().endsWith("xml"))
            .map(abbreviatePreset)
            .sort((a, b) => a.localeCompare(b));
    }).catch(err => {
        logger.error(err);
        return [];
    });
}

async function isValidPresetFile(file: string): Promise<boolean> {
    return readPresetFile(file).then(mods => {
        return mods != null && mods.length > 0;
    }).catch(err => {
        logger.error(err);
        return false;
    });
}

export async function readPresetFile(file: string): Promise<object[]> {
    return fsPromises.readFile(file, { encoding: "utf8" }).then(stream => {
        let json = JSON.parse(convert.xml2json(stream, { compact: true }));
        return json["Mods"]["Mod"].map((o: object) => o["_attributes"]);
    }).catch(err => {
        logger.error(err);
        return [];
    });
}

class InvalidPresetFileError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidPresetFileError";
    }
}

export async function loadPreset(presetFile: string, destination: string): Promise<boolean> {
    return isValidPresetFile(presetFile).then(async (ok) => {
        if (!ok) {
            throw new InvalidPresetFileError(`Invalid preset: ${presetFile}`);
        }
        await fsPromises.copyFile(presetFile, destination);
        return true;
    }).catch(err => {
        logger.error(err);
        return false;
    });
}

class PresetNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PresetNotFoundError";
    }
}

export async function getPresetFile(modPresetsFolder: string, presetName: string): Promise<string> {
    return getPresetList(modPresetsFolder)
        .then(presets => {
            presets = presets.filter(p => abbreviatePreset(p) === presetName);
            if (presets.length !== 1) {
                throw new PresetNotFoundError(presets.length ?
                    `Too many presets found:\n\t${presets}` :
                    `Preset not found: ${presetName}`);
            }
            return presets[0];
        }).catch(err => {
            logger.error(err);
            return "";
        });
}

export async function savePreset(presetsFolder: string, presetName: string, basePresetFile: string): Promise<boolean> {
    let destination = path.join(presetsFolder, presetName + ".xml");
    return fsPromises.copyFile(basePresetFile, destination).then(() => {
        return true;
    }).catch(err => {
        logger.error(err);
        return false;
    });
}

export async function deletePreset(presetsFolder: string, presetName: string): Promise<boolean> {
    return getPresetFile(presetsFolder, presetName)
        .then(async file => {
            logger.info(`Deleting preset ${presetName}`);
            await fsPromises.unlink(file);
            return true;
        }).catch(err => {
            logger.error(err);
            return false;
        });
}

function abbreviatePreset(presetFile: string) {
    presetFile = path.basename(presetFile)
    return presetFile.substring(0, presetFile.length - 4);
}