// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		dataLayer: unknown[];
		gtag?: (
			command: 'js' | 'config' | 'event',
			target: string | Date,
			params?: Record<string, unknown>
		) => void;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
