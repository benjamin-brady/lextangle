// Lightweight cross-component share action store.
// GameBoard registers a handler when it mounts; the layout navbar reads
// `shareAction.handler` to decide whether to render a mobile share icon.

let handler = $state<(() => void) | null>(null);

export const shareAction = {
	get handler() {
		return handler;
	},
	register(fn: () => void) {
		handler = fn;
	},
	clear() {
		handler = null;
	}
};
