// Moodaily widget embed script.
// Drop into any host page:  <script src="https://YOUR-MOODAILY-HOST/embed.js"></script>
//
// The widget is loaded as a full-screen iframe; CSS clip-path keeps only the bubble area
// interactive while idle, so the rest of the host page remains clickable. The widget itself
// uses postMessage to tell us when to expand the clip (popup open / dragging) or shrink it
// back to just the bubble bounds.
(function () {
  if (window.__moodailyEmbedded) return;
  window.__moodailyEmbedded = true;

  var script = document.currentScript;
  var origin = new URL(script.src, location.href).origin;

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/widget';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('title', 'Moodaily');
  iframe.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'border:0',
    'z-index:2147483647',
    'background:transparent',
    'color-scheme:normal',
    // Initial: clip everything so iframe is inert until widget signals its bounds.
    'clip-path:inset(50% 50% 50% 50%)',
  ].join(';');

  function appendWhenReady() {
    if (document.body) document.body.appendChild(iframe);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(iframe); });
  }
  appendWhenReady();

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'moodaily-widget') return;
    if (e.source !== iframe.contentWindow) return;
    if (e.data.mode === 'expanded') {
      iframe.style.clipPath = 'none';
    } else if (e.data.mode === 'idle' && e.data.bubble) {
      var b = e.data.bubble;
      var w = window.innerWidth, h = window.innerHeight;
      iframe.style.clipPath = 'inset(' + b.y + 'px ' + (w - b.x - b.w) + 'px ' + (h - b.y - b.h) + 'px ' + b.x + 'px)';
    }
  });
})();
