// Lightweight cross-component navbar action stores.
// Components register handlers when they mount; the layout/sheet reads
// them to decide what mobile menu items to show.

let shareHandler = $state<(() => void) | null>(null);
let howToPlayHandler = $state<(() => void) | null>(null);

export const shareAction = {
	get handler() {
		return shareHandler;
	},
	register(fn: () => void) {
		shareHandler = fn;
	},
	clear() {
		shareHandler = null;
	}
};

export const howToPlayAction = {
	get handler() {
		return howToPlayHandler;
	},
	register(fn: () => void) {
		howToPlayHandler = fn;
	},
	clear() {
		howToPlayHandler = null;
	}
};
