import './std-js/deprefixer.js';
import './std-js/shims.js';
import './gallery.js';
import {$, ready, registerServiceWorker} from './std-js/functions.js';
import {alert} from './std-js/asyncDialog.js';
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
		$('[itemtype="http://schema.org/Product"][itemscope]').each(async product => {
			const methodData = [{
				supportedMethods: 'basic-card',
				data: {
					supportedNetworks: ['visa', 'mastercard','discover',],
					supportedTypes: ['credit', 'debit']
				}
			}];

			const options = {
				requestPayerName: true,
				requestPayerEmail: true,
				requestPayerPhone: true,
				requestShipping: true,
			};

			$('[data-click="buy"]', product).click(async event => {
				try {
					const product = event.target.closest('[itemtype="http://schema.org/Product"]');
					const label = product.querySelector('[itemprop="name"]').textContent;
					const value = product.querySelector('[itemprop="price"]').textContent;
					const currency = 'USD';
					const details = {
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
					};
					const paymentRequest = new PaymentRequest(methodData, details, options);
					if (await paymentRequest.canMakePayment()) {
						const paymentResponse = await paymentRequest.show();
						paymentResponse.complete('success');
					} else {
						const dialog = document.createElement('dialog');
						const container  = document.createElement('div');
						const close = document.createElement('button');
						dialog.classList.add('font-main', 'clearfix');
						container.textContent = 'Unable to complete transaction due to no supported method.';
						close.textContent = 'Ok';
						close.classList.add('float-right');
						close.addEventListener('click', () => {
							dialog.close();
							dialog.remove();
						});
						dialog.append(container, close);
						document.body.append(dialog);
						dialog.showModal();
						throw new Error('Cannot make payment.');
					}
				} catch (error) {
					console.error(error);
				}
			}).then($btns => $btns.unhide());
		});
	} else {
		$('[data-click="buy"]').click(() => {
			alert('Your browser does not support the Payment Request API. A polyfill is currently being created using form autocomplete.');
		}).then($btns => $btns.unhide());
	}
});
