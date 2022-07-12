// document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
//     const isDarkMode = await window.darkMode.toggle();
//     document.getElementById('theme-source').innerHTML = isDarkMode ? 'Dark' : 'Light';
// });

// document.getElementById('reset-to-system').addEventListener('click', async () => {
//     await window.darkMode.system();
//     document.getElementById('theme-source').innerHTML = 'System';
// });

document.getElementById('reset-mod-table').addEventListener('click', async () => {
    clearTable();
    populateTable();
});

function clearTable() {
    let modTable = document.getElementById('mod-table');
    while (modTable.firstChild) modTable.removeChild(modTable.firstChild);
}

async function populateTable() {
    let mods = await window.modManager.reload();
    console.log(mods);
    populateTableWithMods(mods);
}

function populateTableWithMods(mods) {
    if (!(mods instanceof Array) || mods.length == 0) {
        document.getElementsByTagName("body")[0].innerHTML = mods
    } else {
        let modTable = document.getElementById("mod-table");
        mods.forEach(m => {
            let element = modRow(m);
            modTable.appendChild(element);
        });
    }
}

function modRow({ id, name, settings_fold_open, enabled }) {
    let row = document.createElement("tr");

    let cellId = document.createElement("td");
    cellId.innerText = id;
    row.appendChild(cellId);

    let cellName = document.createElement("td");
    cellName.innerText = name;
    row.appendChild(cellName);
    
    let cellSettingsFold = document.createElement("td");
    cellSettingsFold.innerText = settings_fold_open;
    row.appendChild(cellSettingsFold);

    let cellEnabled = document.createElement("td");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox"
    checkbox.checked = !!enabled;
    cellEnabled.appendChild(checkbox);
    row.appendChild(cellEnabled);

    return row;
}