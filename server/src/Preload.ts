const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
	'aether', {
		query: async (query: string, data: any): Promise<any> => {
			const res = await ipcRenderer.invoke('graphql', { query, data });
			if (res.errors && res.data) console.warn(res.errors);
			if (res.data) return res.data;
			throw res.errors;
		}
	}
);
