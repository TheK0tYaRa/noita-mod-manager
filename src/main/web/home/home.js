document.getElementById("toggle-dark-mode").addEventListener("click", async () => {
    await window.darkMode.toggle();
});

document.getElementById("reset-to-system").addEventListener("click", async () => {
    await window.darkMode.system();
});

document.getElementById("reset-mod-table").addEventListener("click", () => {
    clearTable();
    populateTable();
});

document.getElementById("send-mod-table").addEventListener("click", () => {
    let mods = modTableToJson();
    window.modManager.sendMods(mods);
});

function populateTableWithMods(mods) {
    let mod_table = document.getElementById("mod-table");
    mods.forEach(m => {
        let element = modRow(m);
        mod_table.appendChild(element);
    });
}

function modRow({ name, mod_id, description, enabled, is_game_mode, request_no_api_restrictions, settings_fold_open, workshop_item_id, mod_path }) {
    let row = document.createElement("tr");
    row.setAttribute("modid", mod_id);
    row.setAttribute("request_no_api_restrictions", request_no_api_restrictions)
    row.setAttribute("workshop_item_id", workshop_item_id)
    row.setAttribute("settings_fold_open", settings_fold_open)
    row.setAttribute("mod_path", mod_path)

    let cell_id = document.createElement("td");
    let cell_img = document.createElement("img");
    cell_img.src = "./resources/move.svg";
    cell_id.appendChild(cell_img);
    row.appendChild(cell_id);

    let cell_name = document.createElement("td");
    cell_name.innerText = name;
    row.appendChild(cell_name);

    let cell_description = document.createElement("td");
    cell_description.innerText = sanitizeDescriptionForHtml(description);
    row.appendChild(cell_description);
    // click to enable/disable
    let cell_enabled = document.createElement("td");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled === "1";
    checkbox.disabled = is_game_mode === "1";
    cell_enabled.appendChild(checkbox);
    row.appendChild(cell_enabled);

    return row;
}

function sanitizeDescriptionForHtml(description) {
    if (typeof (description) === "string") {
        return description.replace("\n", "<br/>");
    }
    return description;
}

function clearTable() {
    let mod_table = document.getElementById("mod-table");
    while (mod_table.firstChild) mod_table.removeChild(mod_table.firstChild);
}

async function populateTable() {
    clearTable();
    const mods = await window.modManager.getXmlMods();
    populateTableWithMods(mods);
    addEmptyRow();
}

function addEmptyRow() {
    let mod_table = document.getElementById("mod-table");
    let row = document.createElement("tr");
    row.id = "empty-mod";
    mod_table.appendChild(row);
}

function modRowToJson(tr) {
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

function modTableToJson() {
    const mod_table = document.getElementById("mod-table");
    return Array.from(mod_table.getElementsByTagName("tr")).filter(r => r.getAttribute("id") !== "empty-mod").map(modRowToJson);
}

function sendMods() {
    const mods = modTableToJson();
    window.modManager.sendMods(mods)
}

populateTable();