import './std-js/deprefixer.js';
import './std-js/shims.js';
import './gallery.js';
import {$, wait, ready, registerServiceWorker} from './std-js/functions.js';
import * as Mutations from './std-js/mutations.js';
import {supportsAsClasses} from './std-js/supports.js';
import webShareApi from './std-js/webShareApi.js';
import {
	facebook,
	twitter,
	googlePlus,
	linkedIn,
	reddit,
	gmail,
	email,
} from './std-js/share-config.js';

function hashChangeHandler(event) {
	if (event.oldURL) {
		const oldURL = new URL(event.oldURL);
		if (location.pathname === oldURL.pathname && oldURL.hash.startsWith('#')) {
			const oldTarget = document.getElementById(oldURL.hash.substr(1));
			if (oldTarget instanceof Element && oldTarget.tagName === 'DIALOG') {
				oldTarget.close();
			}
		}
	}

	if (event.newURL) {
		if (location.hash.length !== 0) {
			const target = document.querySelector('dialog:target');
			if (target instanceof Element) {
				target.showModal();
			}
		}
	}
}

webShareApi(facebook, twitter, googlePlus, linkedIn, reddit, gmail, email);

ready().then(async () => {
	window.addEventListener('hashchange', hashChangeHandler);

	if (location.hash.length !== 0) {
		const target = document.querySelector('dialog:target');
		if (target instanceof Element) {
			target.showModal();
		}
	}

	const $doc = $(document.documentElement);
	$('[data-service-worker]').each(el => registerServiceWorker(el.dataset.serviceWorker));

	if (Navigator.prototype.hasOwnProperty('share')) {
		$('[data-share]').attr({hidden: false});
	}

	$doc.replaceClass('no-js', 'js');
	$doc.toggleClass('offline', ! navigator.onLine);
	$doc.watch(Mutations.events, Mutations.options, Mutations.filter);
	$doc.keypress(event => event.key === 'Escape' && $('dialog[open]').close());
	Mutations.init();

	$('[data-open]').click(event => {
		event.preventDefault();
		const url = new URL(event.target.dataset.open, location.origin);
		window.open(url);
	});

	$('dialog').on('close', event => {
		const target = document.querySelector(':target');
		if (event.target === target) {
			if (history.length !== 1) {
				history.back();
			} else {
				location.hash = '';
			}
		}
	});

	supportsAsClasses(...document.documentElement.dataset.supportTest.split(',').map(test => test.trim()));

	if (document.head.dataset.hasOwnProperty('jekyllData')) {
		console.log(JSON.parse(decodeURIComponent(document.head.dataset.jekyllData)));
	}

	if (window.PaymentRequest instanceof Function) {
		$('[itemtype="http://schema.org/Product"][itemscope] [data-click="buy"]').click(async event => {
			const product = event.target.closest('[itemtype="http://schema.org/Product"]');
			const label = product.querySelector('[itemprop="name"]').textContent;
			const value = product.querySelector('[itemprop="price"]').textContent;
			const currency = 'USD';
			const paymentRequest = new PaymentRequest([{
				supportedMethods: 'basic-card',
				data: {
					supportedNetworks: ['visa', 'mastercard', 'amex', 'jcb',
						'diners', 'discover', 'mir', 'unionpay'],
					supportedTypes: ['credit', 'debit']
				}
			}], {
				total: {
					label: 'Total Cost',
					amount: {currency, value}
				},
				displayItems: [{
					label,
					amount: {currency, value}
				}],
				shippingOptions: [{
					id: 'standard',
					label: 'Standard shipping',
					amount: {
						currency: 'USD',
						value: '0.00'
					},
					selected: true
				}]
			}, {
				requestPayerName: true,
				requestPayerEmail: true,
				requestPayerPhone: true,
				requestShipping: true,
			});

			if (await paymentRequest.canMakePayment()) {
				try {
					const paymentResponse = await paymentRequest.show();
					paymentResponse.complete('success');
				} catch (error) {
					paymentRequest.complete('fail');
					console.error(error);
				}
			} else {
				alert('Transaction cannot be completed');
			}
		});
	} else {
		$('[itemtype="http://schema.org/Product"][itemscope] [data-click="buy"]').remove();
	}

	$('header .animation-paused, body > .animation-paused').each(async (el, n) => {
		await wait(n * 200);
		el.classList.remove('animation-paused');
	});

	if ('IntersectionObserver' in window) {
		$('main .animation-paused').intersect((entries, observer) => {
			entries.filter(entry => entry.isIntersecting).forEach(async (entry, n) => {
				observer.unobserve(entry.target);
				await wait(n * 200);
				entry.target.classList.remove('animation-paused');

			});
		}, {rootMargin: '50%'});
	} else {
		await $('main .animation-paused').each(async (el, n) => {
			await wait(n * 200);
			el.classList.remove('animation-paused');
		});
	}
});
