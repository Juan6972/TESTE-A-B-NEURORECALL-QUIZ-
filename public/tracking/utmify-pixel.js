(function () {
  var source = 'https://cdn.utmify.com.br/scripts/pixel/pixel.js';
  var pixelId = '6ad77a259755b48053b5e033';
  if (window.pixelId && window.pixelId !== pixelId) {
    console.error('NeuroRecall: a different UTMify pixel is already configured.');
    return;
  }
  window.pixelId = pixelId;
  if (document.getElementById('neurorecall-utmify-pixel') ||
      Array.prototype.some.call(document.scripts, function (script) {
        return script.src.split('?')[0] === source;
      })) return;
  var script = document.createElement('script');
  script.id = 'neurorecall-utmify-pixel';
  script.src = source;
  script.async = true;
  script.defer = true;
  (document.head || document.documentElement).appendChild(script);
})();
