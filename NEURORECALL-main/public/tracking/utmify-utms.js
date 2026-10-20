(function () {
  var source = 'https://cdn.utmify.com.br/scripts/utms/latest.js';
  if (document.getElementById('neurorecall-utmify-utms') ||
      Array.prototype.some.call(document.scripts, function (script) {
        return script.src.split('?')[0] === source;
      })) return;
  var script = document.createElement('script');
  script.id = 'neurorecall-utmify-utms';
  script.src = source;
  script.async = true;
  script.defer = true;
  script.setAttribute('data-utmify-prevent-xcod-sck', '');
  script.setAttribute('data-utmify-prevent-subids', '');
  (document.head || document.documentElement).appendChild(script);
})();
