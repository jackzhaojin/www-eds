// Functionality that needs the visitor's consent (consent-check.js loads this file only then).
//
// Google Analytics 4, the same property and the same gtag calls as the GitHub Pages site
// (decision 9). It is loaded here, in the delayed phase, instead of first in <head>.
const GA_ID = 'G-ZVENE6BXTJ';

window.dataLayer = window.dataLayer || [];
// gtag reads an Arguments object, not an array, so this can't use rest parameters.
function gtag() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', GA_ID);

const script = document.createElement('script');
script.async = true;
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
document.head.append(script);
