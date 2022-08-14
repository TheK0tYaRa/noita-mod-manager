const logger = require('electron-log');
const fs = require('fs/promises');
const convert = require('xml-js');
const path = require('path');

function modItem(id, rowObj) {
    return {
        "id": id,
        "name": rowObj["name"],
        "enabled": rowObj["enabled"] === "1",
        "settings_fold_open": rowObj["settings_fold_open"],
        "workshop_item_id": rowObj["workshop_item_id"],
    };
}

function parseModConfig(data) {
    var json = convert.xml2js(data);
    json = json["elements"][0]["elements"];
    i = 0;
    A = []
    for (var o in json) {
        i++;
        A.push(modItem(i, json[o]["attributes"]));
    }
    logger.log(`Found ${A.length} mods`);
    return A;
}

function parseModXml(data) {
    var json = convert.xml2js(data);
    return json["elements"][0]["attributes"];
}

async function getModList(noitaModConfigPath, workshopPath, defaultNoitaModPath) {
    const data = await fs.readFile(noitaModConfigPath, { encoding: 'utf-8' });
    let mods = parseModConfig(data)
    if (mods.length == 0) {
        return [
            { "enabled": false, "name": "No Mods Found", "description": "TODO: Please update Settings manually", "settings_fold_open": "0", "workshop_item_id": "0" }
        ];
    } else {
        return await mergeModListDefinitions(mods, workshopPath, defaultNoitaModPath);
    }
    // mods show up in two known locations (for now)
    // ${Noita}/mods/${name}
    // ${Noita}/../../workshop/content/881100/${workshop_item_id}
}

function modToXml(mod) {
    return `<Mod enabled="${mod.enabled ? "1" : "0"}" name="${mod.name}" settings_fold_open="${mod.settings_fold_open}" workshop_item_id="${mod.workshop_item_id}"></Mod>`
}

function modListToXml(modList) {
    let doc = ""
    for (let mod of modList) {
        doc += `\t${modToXml(mod)}\n`;
    }
    return `<Mods>\n${doc}</Mods>`;
}

async function saveUIModList(noitaModConfigPath, modList) {
    try {
        logger.info(`saving to ${noitaModConfigPath}`);
        let xmlString = modListToXml(modList)
        await fs.writeFile(noitaModConfigPath, xmlString, { encoding: 'utf-8' });
    } catch (err) {
        logger.error(err);
    }
}

function printObject(obj) {
    if (obj instanceof Object && !(obj instanceof Array)) {
        for (var o in obj) {
            logger.log(`"${o}" : {`);
            printObject(obj[o]);
            logger.log(`},`);
        }
    } else if (obj instanceof Array) {
        logger.log(`[`);
        for (var o of obj) {
            printObject(o);
        }
        logger.log(`],`);
    } else {
        logger.log(`"${obj}",`);
    }
}

async function mergeModListDefinitions(simpleModList, workshopPath, defaultNoitaModPath) {
    for (var index in simpleModList) {
        var mod = simpleModList[index];
        // search in noita native mod path
        try {
            if (mod.workshop_item_id === "0") {
                var modPath = path.join(defaultNoitaModPath, mod.name, "mod.xml");
                var json = parseModXml(await fs.readFile(modPath, { encoding: 'utf-8' }));
                simpleModList[index]["external_name"] = json["name"];
                simpleModList[index]["description"] = json["description"];
                if (json["is_game_mode"] !== undefined) {
                    simpleModList[index]["can_be_enabled"] = json["is_game_mode"] !== "0";
                }
            } else {
                // search in workshop
                var modPath = path.join(workshopPath, mod.workshop_item_id, "mod.xml");
                var json = parseModXml(await fs.readFile(modPath, { encoding: 'utf-8' }));
                simpleModList[index]["external_name"] = json["name"];
                simpleModList[index]["description"] = json["description"];
            }
        } catch (err) {
            logger.error(`error while checking mod: ${mod}`);
            logger.error(err);
        }
    }
    return simpleModList;
}

module.exports = {
    "getModList": getModList,
    "saveUIModList": saveUIModList
}