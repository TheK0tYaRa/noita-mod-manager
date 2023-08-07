import logger from 'electron-log';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import convert from 'xml-js';
import { readPresetFile } from './presets';
import { Mod } from './index';

export async function getModList(modConfigPath: string, ...paths: string[]): Promise<Mod[]> {
    // read modconfig first, maintain this ordering
    return readPresetFile(modConfigPath).then(modSettings => {
        let modList = modSettings.map(interpretAsMod);
        if (modList.length == 0) {
            logger.warn(`Mod list not found in ${modConfigPath}`);
        } else {
            let mapping = generatePartialMapping(paths);
            modList.forEach(mod => {
                let modRef = mapping[mod.mod_id];
                if (modRef) {
                    mod.name = modRef.name;
                    mod.description = modRef.description;
                    mod.mod_path = modRef.mod_path;
                    mod.is_game_mode = modRef.is_game_mode;
                    mod.request_no_api_restrictions = modRef.request_no_api_restrictions;
                    mod.workshop_item_id = modRef.workshop_item_id;
                }
            });
        }
        return modList;
    }).catch(err => {
        logger.error(err);
        return [];
    });
}

function generatePartialMapping(paths: string[]): object {
    let modPaths = paths.flatMap(p => fs.readdirSync(p)
        .map(f => path.join(p, f)))
        .filter(fi => fs.lstatSync(fi).isDirectory());
    let obj = {};
    modPaths.forEach(p => {
        let mod = parseModDirectory(p);
        obj[mod.mod_id] = mod;
    });
    return obj;
}

function interpretAsMod(obj: object): Mod {
    let mod = createModObj("", "", "");
    mod.mod_id = obj["name"] ?? "Name not found";
    mod.enabled = obj["enabled"] ?? "0";
    mod.settings_fold_open = obj["settings_fold_open"] ?? "0";
    return mod;
}

function parseModDirectory(pathlike: string) {
    // detect if mod_id.txt is present
    let mod = createModObj("", "mod.xml not found for this mod", pathlike);

    let filepath = path.join(pathlike, "mod_id.txt")
    if (fs.existsSync(filepath)) {
        mod.mod_id = fs.readFileSync(path.join(pathlike, "mod_id.txt")).toString();
        mod.workshop_item_id = path.basename(pathlike);
    } else {
        mod.mod_id = path.basename(pathlike);
    }

    filepath = path.join(pathlike, "mod.xml");
    if (fs.existsSync(filepath)) {
        let data = JSON.parse(convert.xml2json(fs.readFileSync(filepath, { encoding: 'utf-8' }), { compact: true }));
        try {
            data = data["Mod"]["_attributes"]
        } catch {
            data = data["mod"]["_attributes"]
        }
        mod.name = data?.name;
        mod.description = data?.description;
        mod.request_no_api_restrictions = data?.request_no_api_restrictions === "1" ? "1" : "0";
        mod.is_game_mode = data?.is_game_mode === "1" ? "1" : "0";
    }

    return mod;
}

function createModObj(name: string, description: string, pathlike: string): Mod {
    return {
        name: name,
        mod_id: "",
        description: description,
        mod_path: pathlike,
        enabled: "0",
        is_game_mode: "0",
        request_no_api_restrictions: "0",
        workshop_item_id: "0",
        settings_fold_open: "0",
    };
}

function modToXml(mod: Mod): string {
    return `<Mod enabled="${mod.enabled ? "1" : "0"}" name="${mod.mod_id}" settings_fold_open="${mod.settings_fold_open}" workshop_item_id="${mod.workshop_item_id}"></Mod>`
}

function modListToXml(modList: Mod[]): string {
    return `<Mods>\n\t${modList.map(mod => modToXml(mod)).join("\n\t")}\n</Mods>`;
}

export async function saveMods(savePath: string, modList: Mod[]) {
    return fsPromises.writeFile(savePath, modListToXml(modList), { "encoding": "utf8" })
        .then(() => {
            logger.info(`saved to ${savePath}`);
        }).catch(err => {
            logger.error(err);
            throw err;
        });
}

export async function enableUnsafeMods(sharedConfigPath: string): Promise<boolean> {
    return fsPromises.readFile(sharedConfigPath, { encoding: "utf8" })
        .then(async data => {
            let json = JSON.parse(convert.xml2json(data, { compact: true }));
            json["Config"]["_attributes"]["mods_disclaimer_accepted"] = "1";
            json["Config"]["_attributes"]["mods_sandbox_enabled"] = "0";
            json["Config"]["_attributes"]["mods_sandbox_warning_done"] = "1";
            let xml = convert.json2xml(json, { compact: true }).replace(/ /g, '\n');
            return fsPromises.writeFile(sharedConfigPath, xml, { encoding: "utf-8" })
                .then(() => true);
        })
        .catch(err => {
            logger.error(err);
            return false;
        });
}
