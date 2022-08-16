const logger = require('electron-log');
const fs = require('fs');
const convert = require('xml-js');
const path = require('path');

async function getEnabledMods(mod_config_path) {
    let data = fs.readFileSync(mod_config_path, { encoding: "utf-8" });
    let mods = JSON.parse(convert.xml2json(data, { compact: true }))["Mods"]["Mod"];
    let obj = {}
    mods = mods.forEach(m => {
        obj[m["_attributes"]["name"]] = {
            "enabled": m["_attributes"]["enabled"],
            "settings_fold_open": m["_attributes"]["settings_fold_open"]
        };
    });
    return obj;
}

async function getModList(mod_cofig_path, ...paths) {
    let mods = paths?.flatMap(p => fs.readdirSync(p)
        .map(f => path.join(p, f)))
        .filter(fi => fs.lstatSync(fi).isDirectory());

    if (mods.length == 0) {
        return [
            {
                "name": "No mods found",
                "mod_id": "",
                "description": "Please configure your settings manually.",
                "enabled": "0",
                "is_game_mode": "1",
                "request_no_api_restrictions": "0",
                "workshop_item_id": "0",
                "settings_fold_open": "0",
                "mod_path": pathlike
            }
        ];
    } else {
        mods = mods.map(parseModDirectory);
        let mods_enabled_json = await getEnabledMods(mod_cofig_path);
        for (let index in mods) {
            let val = mods_enabled_json[mods[index].mod_id];
            mods[index]["enabled"] = val.enabled;
            mods[index]["settings_fold_open"] = val.settings_fold_open;
        }
        return mods;
    }
}

function parseModDirectory(pathlike) {
    // detect if mod_id.txt is present
    let obj = {
        "name": "mod.xml not found for this mod",
        "mod_id": "",
        "description": "",
        "enabled": "0",
        "is_game_mode": "0",
        "request_no_api_restrictions": "0",
        "workshop_item_id": "0",
        "settings_fold_open": "0",
        "mod_path": pathlike
    };

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

function modToXml(mod) {
    return `<Mod enabled="${mod.enabled ? "1" : "0"}" name="${mod.mod_id}" settings_fold_open="${mod.settings_fold_open}" workshop_item_id="${mod.workshop_item_id}"></Mod>`
}

function modListToXml(mod_list) {
    let doc = ""
    for (let mod of mod_list) {
        doc += `\t${modToXml(mod)}\n`;
    }
    return `<Mods>\n${doc}</Mods>`;
}

function saveUIModList(mod_config_path, mod_list) {
    logger.info(`saving to ${mod_config_path}`);
    let xml_string = modListToXml(mod_list)
    fs.writeFileSync(mod_config_path, xml_string, { encoding: 'utf-8' });
}

module.exports = {
    "getEnabledMods": getEnabledMods,
    "getModList": getModList,
    "saveUIModList": saveUIModList
}