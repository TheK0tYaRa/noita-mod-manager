import logger from 'electron-log';
import fs from 'fs';
import path from 'path';
import convert from 'xml-js';
import { readPresetFile } from './presets';

interface Mod {
    name: string
    mod_id: string
    description: string
    enabled: string
    is_game_mode: string
    request_no_api_restrictions: string
    workshop_item_id: string
    settings_fold_open: string
    mod_path: string
}

async function getEnabledMods(modConfigPath: string): Promise<Mod> {
    let mods = await readPresetFile(modConfigPath);
    let obj: Mod = createModObj("", "", "");
    mods.forEach((m: Mod) => {
        obj[m.name] = {
            "enabled": m.enabled,
            "settings_fold_open": m.settings_fold_open
        };
    });
    return obj;
}

async function getModList(modConfigPath: string, ...paths: string[]): Promise<Mod[]> {
    let mods = paths?.flatMap(p => fs.readdirSync(p)
        .map(f => path.join(p, f)))
        .filter(fi => fs.lstatSync(fi).isDirectory());

    if (mods.length == 0) {
        logger.warn(`no found mods`);
        return [
            createModObj("No mods found", "Please configure your settings manually.", "")
        ];
    } else {
        // mods = mods.map(parseModDirectory);
        let modList = mods.map(parseModDirectory);
        let modsEnabledObject = await getEnabledMods(modConfigPath);
        for (let index in modList) {
            let val = modsEnabledObject[modList[index].mod_id];
            modList[index]["enabled"] = val.enabled;
            modList[index]["settings_fold_open"] = val.settings_fold_open;
        }
        logger.info(`found ${modList.length} mods`);
        return modList;
    }
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
        let data = JSON.parse(convert.xml2json(fs.readFileSync(filepath, { encoding: 'utf-8' }), { compact: true }))["Mod"]["_attributes"];
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
        enabled: "0",
        is_game_mode: "0",
        request_no_api_restrictions: "0",
        workshop_item_id: "0",
        settings_fold_open: "0",
        mod_path: pathlike
    };
}

function modToXml(mod: Mod): string {
    return `<Mod enabled="${mod.enabled ? "1" : "0"}" name="${mod.mod_id}" settings_fold_open="${mod.settings_fold_open}" workshop_item_id="${mod.workshop_item_id}"></Mod>`
}

function modListToXml(modList: Mod[]): string {
    let doc = ""
    for (let mod of modList) {
        doc += `\t${modToXml(mod)}\n`;
    }
    return `<Mods>\n${doc}\n</Mods>`;
}

function saveUIModList(modConfigPath: string, modList: Mod[]) {
    logger.info(`saving to ${modConfigPath}`);
    let xml_string = modListToXml(modList)
    fs.writeFileSync(modConfigPath, xml_string, { encoding: 'utf-8' });
}

async function saveMods(save_path: string, shared_config_path: string, mods: Mod[]) {
    let backup = path.resolve(path.dirname(save_path), "mod_config.xml.BACKUP");
    confirmBackup(save_path, backup);
    saveUIModList(save_path, mods);
    if (mods.filter(m => m.request_no_api_restrictions === "1").length > 0) {
        // ensure unsafe mods can be enabled for next boot
        let data = fs.readFileSync(shared_config_path, { encoding: "utf-8" });
        let json = JSON.parse(convert.xml2json(data, { compact: true }));
        json["Config"]["_attributes"]["mods_disclaimer_accepted"] = "1";
        json["Config"]["_attributes"]["mods_sandbox_enabled"] = "0";
        json["Config"]["_attributes"]["mods_sandbox_warning_done"] = "1";

        data = convert.json2xml(json, { compact: true }).replace(/ /g, '\n');
        fs.writeFileSync(shared_config_path, data, { encoding: "utf-8" });
    }
}

function confirmBackup(source: string, backup: string) {
    if (fs.existsSync(source) && !fs.existsSync(backup)) {
        fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
    }
}

export {
    getEnabledMods,
    getModList,
    saveUIModList,
    saveMods
}