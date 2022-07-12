const fs = require('fs/promises');
const convert = require('xml-js');
const logger = require('electron-log');

function modItem(id, rowObj) {
    return {
        "id": id,
        "enabled": rowObj["enabled"],
        "name": rowObj["name"],
        "settings_fold_open": rowObj["settings_fold_open"],
        "workshop_item_id": rowObj["workshop_item_id"],
    };
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

function parseMods(data) {
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

async function loadMods(noita_mod_config_path) {
    const data = await fs.readFile(noita_mod_config_path, { encoding: 'utf8' });
    logger.log(data)
    mods = parseMods(data)
    if (mods.length == 0) {
        return [{
            "type": "element", "name": "Mod", "attributes":
                { "enabled": "0", "name": "No Mods Found", "settings_fold_open": "0", "workshop_item_id": "0" }
        }];
    } else {
        return mods;
    }
    // mods show up in two known locations (for now)
    // ${Noita}/mods/${name}
    // ${Noita}/../../workshop/content/881100/${workshop_item_id}
}

module.exports = {
    "modItem": modItem,
    "loadMods": loadMods
}