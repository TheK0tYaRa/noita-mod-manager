const logger = require('electron-log');
const fs = require('fs');
const path = require('path');
const convert = require('xml-js');
const { getPresets, readPresetFile, writePresetFile } = require('./presets');

async function getEnabledMods(mod_config_path) {
    let mods = await readPresetFile(mod_config_path);
    let obj = {}
    mods.forEach(m => {
        obj[m["name"]] = {
            "enabled": m["enabled"],
            "settings_fold_open": m["settings_fold_open"]
        };
    });
    return obj;
}

async function getModList(mod_cofig_path, ...paths) {
    let mods = paths?.flatMap(p => fs.readdirSync(p)
        .map(f => path.join(p, f)))
        .filter(fi => fs.lstatSync(fi).isDirectory());

    if (mods.length == 0) {
        logger.warn(`no found mods`);
        return [
            createModObj("No mods found", "Please configure your settings manually.", pathlike)
        ];
    } else {
        mods = mods.map(parseModDirectory);
        let mods_enabled_json = await getEnabledMods(mod_cofig_path);
        for (let index in mods) {
            let val = mods_enabled_json[mods[index].mod_id];
            mods[index]["enabled"] = val.enabled;
            mods[index]["settings_fold_open"] = val.settings_fold_open;
        }
        logger.info(`found ${mods.length} mods`);
        return mods;
    }
}

function parseModDirectory(pathlike) {
    // detect if mod_id.txt is present
    let obj = createModObj("", "mod.xml not found for this mod", pathlike);

    let filepath = path.join(pathlike, "mod_id.txt")
    if (fs.existsSync(filepath)) {
        obj["mod_id"] = fs.readFileSync(path.join(pathlike, "mod_id.txt")).toString();
        obj["workshop_item_id"] = path.basename(pathlike);
    } else {
        obj["mod_id"] = path.basename(pathlike);
    }

    filepath = path.join(pathlike, "mod.xml")
    if (fs.existsSync(filepath)) {
        let data = JSON.parse(convert.xml2json(fs.readFileSync(filepath, { encoding: 'utf-8' }), { compact: true }))["Mod"]["_attributes"];
        obj["name"] = data?.name;
        obj["description"] = data?.description;
        obj["request_no_api_restrictions"] = data?.request_no_api_restrictions === "1" ? "1" : "0";
        obj["is_game_mode"] = data?.is_game_mode === "1" ? "1" : "0";
    }

    return obj;
}

function createModObj(name, description, pathlike) {
    return {
        "name": name,
        "mod_id": "",
        "description": description,
        "enabled": "0",
        "is_game_mode": "0",
        "request_no_api_restrictions": "0",
        "workshop_item_id": "0",
        "settings_fold_open": "0",
        "mod_path": pathlike
    };
}

function modToXml(mod) {
    return `<Mod enabled="${mod.enabled ? "1" : "0"}" name="${mod.mod_id}" settings_fold_open="${mod.settings_fold_open}" workshop_item_id="${mod.workshop_item_id}"></Mod>`
}

function modListToXml(mod_list) {
    let doc = ""
    for (let mod of mod_list) {
        doc += `\t${modToXml(mod)}\n`;
    }
    return `<Mods>\n${doc}\n</Mods>`;
}

function saveUIModList(mod_config_path, mod_list) {
    logger.info(`saving to ${mod_config_path}`);
    let xml_string = modListToXml(mod_list)
    fs.writeFileSync(mod_config_path, xml_string, { encoding: 'utf-8' });
}

async function saveMods(save_path, shared_config_path, mods) {
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

function confirmBackup(source, backup) {
    if (fs.existsSync(source) && !fs.existsSync(backup)) {
        fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
    }
}

module.exports = {
    "getEnabledMods": getEnabledMods,
    "getModList": getModList,
    "saveUIModList": saveUIModList,
    "saveMods": saveMods
}