export function trackPageView(url: URL, measurementId: string) {
	if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !measurementId) {
		return;
	}

	window.gtag('event', 'page_view', {
		page_title: document.title,
		page_location: url.href,
		page_path: `${url.pathname}${url.search}`,
		send_to: measurementId
	});
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
	if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
		return;
	}

	window.gtag('event', name, params);
}