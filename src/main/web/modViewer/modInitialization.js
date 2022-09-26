'use strict';

let loadedMods;
// mod handling
(async function () {
    let presets = await window.modManager.getPresets();
    let currentPresetName = await window.modManager.getCurrentPreset();
    loadedMods = await window.modManager.getMods();

    // initialize mod table
    populateTableMods(loadedMods);
    window.logger.info(`${loadedMods.length} mods loaded.`);

    // initialize presets
    populatePresetOptions(presets, currentPresetName);

    // search by title and description, case insensitivite
    document.getElementById("search-mods").addEventListener("input", (e) => {
        populateTableMods(loadedMods.filter(mod => {
            let value = e.target.value.toLowerCase();
            let modName = mod.name.toLowerCase();
            let modDescription = mod.description.toLowerCase();
            return modName.includes(value) || modDescription.includes(value);
        }));
    });

    // save
    document.getElementById("save-mod-table").addEventListener("click", () => window.modManager.savePreset(modTableToJson()));

    // reload current settings
    document.getElementById("reset-mod-table").addEventListener("click", async () => {
        await window.modManager.loadPreset(currentPresetName).then(async () => {
            loadedMods = await window.modManager.getMods();
            populateTableMods(loadedMods);
            window.logger.info("table reloaded");
        }).catch(err => window.logger.error(err));
    });

    document.getElementById("load-selector").addEventListener("change", async e => {
        currentPresetName = e.target.value;
        await onPresetChange(currentPresetName).catch(err => window.logger.error(err));
    });

    // register electron callbacks
    window.registerCallback.reloadModTable(populateTableMods);
    window.registerCallback.reloadPresets(populatePresetOptions);

    // enable/disable all
    document.getElementById("set-all-presets").addEventListener("change", e => {
        let checked = e.target.checked;
        Array.from(document.querySelectorAll("tbody>tr>td:last-child>input")).forEach(input => {
            if (!input.disabled) {
                input.checked = checked;
                input.dispatchEvent(new Event('change'));
            }
        });
    });

    document.getElementById("mod-table").addEventListener("draggableTable:dragend", e => {
        let mods = modTableToJson();
        // find the first and second index swapped
        let bools = Array(loadedMods.length).fill().map((_i, j) => j).map(i => loadedMods[i].mod_id === mods[i].mod_id);
        let firstIndex = bools.indexOf(false);
        let secondIndex = bools.lastIndexOf(false);

        if (firstIndex === -1) {
            // no changes
            return;
        } else if (secondIndex - firstIndex == 1 || loadedMods[firstIndex + 1].mod_id === mods[firstIndex].mod_id) {
            // 1-mod movement or mod moved down
            let movedMod = loadedMods.splice(firstIndex, 1)[0];
            loadedMods.splice(secondIndex, 0, movedMod);
        } else {
            // moved mod up
            let movedMod = loadedMods.splice(secondIndex, 1)[0];
            loadedMods.splice(firstIndex, 0, movedMod);
        }
        // update mod_config.xml
        window.modManager.save(loadedMods);
    });
})();

function initializePresetSelector(presets, currentPresetName, loadSelector) {
}

function populateTableMods(mods) {
    // clear table
    let modTable = document.getElementById("mod-table");
    while (modTable.firstChild) modTable.removeChild(modTable.firstChild);
    // repopulate
    mods.forEach(m => {
        let element = modRowToHtml(m);
        modTable.appendChild(element);
    });
    // cap off with an empty row
    let row = document.createElement("tr");
    row.id = "empty-mod";
    modTable.appendChild(row);

    // update mod array whenever it is toggled
    let objRef = {};
    mods.forEach(mod => objRef[mod.mod_id] = mod);
    Array.from(document.querySelectorAll("tr>td:last-child>input")).forEach(input => {
        let modid = input.parentElement.parentElement.getAttribute("modid");
        input.addEventListener("change", e => {
            objRef[modid].enabled = e.target.checked ? "1" : "0";
        });
    });
}

function modRowToHtml({ name, mod_id, description, enabled, is_game_mode, request_no_api_restrictions, settings_fold_open, workshop_item_id, mod_path }) {
    // row
    let row = document.createElement("tr");
    // attributes that don't need to be shown
    row.setAttribute("modid", mod_id);
    row.setAttribute("request_no_api_restrictions", request_no_api_restrictions)
    row.setAttribute("workshop_item_id", workshop_item_id)
    row.setAttribute("settings_fold_open", settings_fold_open)
    row.setAttribute("mod_path", mod_path)

    // slider image
    let cellId = document.createElement("td");
    let cellImg = document.createElement("img");
    cellImg.src = "./resources/move.svg";
    cellId.appendChild(cellImg);
    row.appendChild(cellId);

    // User-friendly name
    let cellName = document.createElement("td");
    cellName.innerText = name;
    row.appendChild(cellName);

    // mod description
    let cellDescription = document.createElement("td");
    cellDescription.innerHTML = sanitizeDescriptionForHtml(description);
    row.appendChild(cellDescription);

    // checkbox to enable/disable the mod
    let cellEnabled = document.createElement("td");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled === "1";
    checkbox.disabled = is_game_mode === "1"; // game modes cannot be enabled from the mod menu

    cellEnabled.appendChild(checkbox);
    row.appendChild(cellEnabled);

    return row;
}

function modRowHtmlToJson(tr) {
    const cells = tr.getElementsByTagName("td");
    return {
        "name": cells[1].innerText,
        "mod_id": tr.getAttribute("modid"),
        "enabled": cells[3].getElementsByTagName("input")[0].checked,
        "settings_fold_open": tr.getAttribute("settings_fold_open"),
        "workshop_item_id": tr.getAttribute("workshop_item_id"),
        "request_no_api_restrictions": tr.getAttribute("request_no_api_restrictions")
    };
}

function sanitizeDescriptionForHtml(description) {
    if (typeof (description) === "string") {
        return description.trim().replace(/\n/g, "<br />").replace(/\\n/g, "<br />");
    }
    return description;
}

function modTableToJson() {
    const modTable = document.getElementById("mod-table");
    return Array.from(modTable.getElementsByTagName("tr")).filter(r => r.getAttribute("id") !== "empty-mod").map(modRowHtmlToJson);
}

async function onPresetChange(preset) {
    return await window.modManager.loadPreset(preset).then(async _ok => {
        return await window.modManager.getMods();
    }).catch(err => {
        window.logger.error(err);
        return [];
    });
}

async function savePreset(mods, presetName) {
    window.modManager.savePresetAs(presetName, mods);
    document.getElementsByName("preset-loader").forEach(select => {
        select.childNodes.forEach(node => {
            node.selected = false;
        });
        const option = document.createElement("option");
        option.value = presetName;
        option.innerText = preset;
        option.selected = true;
        select.appendChild(option);
    });
}

function deletePreset(presetName) {
    window.modManager.deletePreset(presetName);
    const select = document.getElementById("preset-loader");
    select.childNodes.forEach(node => {
        node.selected = false;
        if (node.value === presetName) {
            select.removeChild(node);
        }
    });
    select.options[0].selected = true;
}

async function populatePresetOptions(presets, currentPreset) {
    console.log("presets refreshed")
    document.getElementsByName("preset-selector").forEach(presetSelector => {
        while (presetSelector.firstChild) {
            presetSelector.removeChild(presetSelector.firstChild);
        }

        presets.forEach(preset => {
            let option = document.createElement("option");
            option.value = preset;
            option.innerText = preset;
            option.selected = preset === currentPreset;
            presetSelector.appendChild(option);
        });
    });
}
