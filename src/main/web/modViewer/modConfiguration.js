(function () {
    const renameButton = document.getElementById("rename-preset-button");
    const renameInput = document.getElementById("rename-preset");
    renameInput.style.display = "none";

    // support for renaming
    renameButton.addEventListener("click", e => {
        renameInput.style.display = "block";
        renameButton.style.display = "none";
    });

    renameInput.addEventListener("keydown", async e => {
        const presetName = e.target.value.trim();
        if (e.key === "Enter" && presetName === "" || e.key === "Escape") {
            renameInput.style.display = "none";
            renameButton.style.display = "block";
        } else if (e.key === "Enter") {
            renameInput.style.display = "none";
            renameButton.style.display = "block";
            // verify preset name is valid
            const previousName = await window.modManager.getCurrentPreset();
            const knownPresets = await window.modManager.getPresets();
            if (!isValidPresetName(knownPresets, presetName, presetName)) {
                return;
            }
            // update files and known presets
            savePreset(modTableToJson(), presetName);
            deletePreset(previousName);
            // update presets
            document.getElementsByName("preset-selector").forEach(presetSelector => {
                while (presetSelector.firstChild) {
                    presetSelector.removeChild(presetSelector.firstChild);
                }
                initializePresetSelector(presets, currentPresetName, presetSelector);
            });
        }
    });

    // support for deleting preset
    document.getElementById("delete-preset").addEventListener("click", async e => {
        const currentPreset = await window.modManager.getCurrentPreset();
        await window.modManager.deletePreset(currentPreset);
    });

    // support for duplicating a new preset
    const duplicateButton = document.getElementById("duplicate-preset-button");
    const duplicateInput = document.getElementById("duplicate-preset");
    duplicateInput.style.display = "none";

    duplicateButton.addEventListener("click", e => {
        duplicateInput.style.display = "block";
        duplicateButton.style.display = "none";
    });

    duplicateInput.addEventListener("keydown", async e => {
        const presetName = e.target.value.trim();
        if (e.key === "Enter" && presetName === "" || e.key === "Escape") {
            duplicateInput.style.display = "none";
            duplicateButton.style.display = "block";
        } else if (e.key === "Enter") {
            duplicateInput.style.display = "none";
            duplicateButton.style.display = "block";
            // verify preset name is valid
            const knownPresets = await window.modManager.getPresets();
            if (!isValidPresetName(knownPresets, "", presetName)) {
                return;
            }
            savePreset(modTableToJson(), presetName);
        }
    });
})();

function isValidPresetName(knownPresets, previousName, newName) {
    if (previousName === newName) {
        return false;
    } else if (knownPresets.map(p => p.toLowerCase()).includes(newName.toLowerCase())) {
        window.logger.info(`Attempt to overwrite existing preset. Cancelling: ${newName}`);
        return false;
    }
    return true;
}