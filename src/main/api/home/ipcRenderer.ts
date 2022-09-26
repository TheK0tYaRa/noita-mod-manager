import { contextBridge, ipcRenderer } from 'electron';
import logger from 'electron-log';
import { Mod } from "./index";

contextBridge.exposeInMainWorld('logger', {
	// various logger levels
	info: (...params: any[]) => logger.info("[ipcRenderer][INFO]", ...params),
	error: (...params: any[]) => logger.error("[ipcRenderer][ERROR]", ...params),
});

contextBridge.exposeInMainWorld('darkMode', {
	// toggle between light and dark mode
	toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
	// return to the system state
	system: () => ipcRenderer.invoke('dark-mode:system'),
});

contextBridge.exposeInMainWorld('modManager', {
	// remove a preset and the file it represents
	deletePreset: async (presetName: string) => ipcRenderer.send('mod-manager:delete-preset', presetName),
	// get all mods from the current mod_config.xml with additional details
	getMods: async () => ipcRenderer.invoke('mod-manager:get-mods'),
	// get the current preset name
	getCurrentPreset: async () => ipcRenderer.invoke('mod-manager:get-current-preset'),
	// get all preset names
	getPresets: async () => ipcRenderer.invoke('mod-manager:get-preset-names'),
	// load a known preset onto mod_config.xml. On completion, ipcMain emits `mod-manager:preset-is-loaded`
	loadPreset: async (presetName: string) => ipcRenderer.send('mod-manager:load-preset', presetName),
	// save the current state to mod_config.xml
	save: async (mods: Mod[]) => ipcRenderer.send('mod-manager:save-mods', mods),
	// save the current state to mod_config.xml and the current preset
	savePreset: async (mods: Mod[]) => ipcRenderer.send('mod-manager:save-preset', mods),
	// save the current state to mod_config.xml and a new preset
	savePresetAs: async (presetName: string, mods: Mod[]) => ipcRenderer.send('mod-manager:new-preset', presetName, mods),
});

let callbacks: object = {};
contextBridge.exposeInMainWorld('registerCallback', {
	reloadModTable: (callback: Function) => callbacks["presetLoaded"] = callback,
	reloadPresets: (callback: Function) => callbacks["presetsUpdated"] = callback,
});

ipcRenderer.on("mod-manager:preset-is-loaded", (_event, mods) => callbacks["presetLoaded"](mods));
ipcRenderer.on("mod-manager:presets-updated", (_event, presets, currentPreset) => {
	logger.info(`presetUpdated called: ${presets}, ${currentPreset}`)
	callbacks["presetsUpdated"](presets, currentPreset);
});
