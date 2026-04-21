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
		turnstile?: {
			render: (
				el: HTMLElement | string,
				options: {
					sitekey: string;
					callback?: (token: string) => void;
					'error-callback'?: () => void;
					'expired-callback'?: () => void;
					theme?: 'light' | 'dark' | 'auto';
					size?: 'normal' | 'flexible' | 'compact' | 'invisible';
					action?: string;
				}
			) => string;
			reset: (id?: string) => void;
			remove: (id?: string) => void;
		};
		onTurnstileLoad?: () => void;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				TURNSTILE_SECRET_KEY?: string;
				IP_HASH_SALT?: string;
			};
			cf?: {
				country?: string;
				[key: string]: unknown;
			};
		}
	}
}

export {};
