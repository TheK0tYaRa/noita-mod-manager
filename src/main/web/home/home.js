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
    window.modManager.sendMods(modTableToJson());
});

function populateTableWithMods(mods) {
    let modTable = document.getElementById("mod-table");
    mods.forEach(m => {
        let element = modRow(m);
        modTable.appendChild(element);
    });
}

function modRow({ id, external_name, name, description, settings_fold_open, workshop_item_id, enabled, cannot_be_disabled }) {
    let row = document.createElement("tr");
    row.setAttribute("modid", id);

    let cellId = document.createElement("td");
    let cellImg = document.createElement("img");
    cellImg.src = "./resources/move.svg";
    cellId.appendChild(cellImg);
    row.appendChild(cellId);

    let cellName = document.createElement("td");
    cellName.innerText = external_name;
    row.appendChild(cellName);
    // 
    let cellDescription = document.createElement("td");
    cellDescription.innerText = sanitizeDescriptionForHtml(description);
    row.appendChild(cellDescription);
    // click to enable/disable
    let cellEnabled = document.createElement("td");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabled;
    cellEnabled.appendChild(checkbox);
    cellEnabled.disabled = cannot_be_disabled;
    row.appendChild(cellEnabled);
    // these are needed when the row gets deserialized
    row.appendChild(generateHiddenCell(name));
    row.appendChild(generateHiddenCell(settings_fold_open));
    row.appendChild(generateHiddenCell(workshop_item_id));

    return row;
}

function sanitizeDescriptionForHtml(description) {
    if (typeof (description) === "string") {
        return description.replace("\n", "<br/>");
    }
    return description;
}

function generateHiddenCell(value) {
    let td = document.createElement("td");
    td.hidden = true;
    td.innerText = value;
    return td;
}

function clearTable() {
    let modTable = document.getElementById("mod-table");
    while (modTable.firstChild) modTable.removeChild(modTable.firstChild);
}

async function populateTable() {
    clearTable();
    const mods = await window.modManager.getXmlMods();
    populateTableWithMods(mods);
    addEmptyRow();
}

function addEmptyRow() {
    let modTable = document.getElementById("mod-table");
    let row = document.createElement("tr");
    row.id = "empty-mod";
    modTable.appendChild(row);
}

function modRowToJson(tr) {
    const cells = tr.getElementsByTagName("td");
    return {
        "enabled": cells[3].getElementsByTagName("input")[0].checked,
        "name": cells[4].innerText,
        "settings_fold_open": cells[5].innerText,
        "workshop_item_id": cells[6].innerText,
    };
}

function modTableToJson() {
    const modTable = document.getElementById("mod-table");
    return Array.from(modTable.getElementsByTagName("tr")).filter(r => r.getAttribute("id") !== "empty-mod").map(modRowToJson);
}

function sendMods() {
    const mods = modTableToJson();
    window.modManager.sendMods(mods)
}

populateTable();