const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('darkMode', {
	toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
	system: () => ipcRenderer.invoke('dark-mode:system'),
});

contextBridge.exposeInMainWorld('modManager', {
	getXmlMods: () => ipcRenderer.invoke('mod-manager:get-xml-mods'),
	sendMods: (mods) => ipcRenderer.send('mod-manager:save-ui-mods', mods),
});
