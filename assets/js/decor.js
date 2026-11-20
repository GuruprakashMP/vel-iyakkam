/* Vel Iyakkam: decorations for the top banner, drawn as SVG (no image files).
   Hanging brass lamps, the hills (குன்றுதோறாடல்) with a hill temple,
   and the Vel carrying the rooster flag (சேவற்கொடி) with peacock feathers.
   Everything here is decorative and hidden from screen readers. */
(function () {
  'use strict';

  var BRASS = '<linearGradient id="g-brass" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FBE3A1"/><stop offset=".45" stop-color="#E0A413"/><stop offset="1" stop-color="#8A5A12"/></linearGradient>' +
    '<radialGradient id="g-flame" cx=".5" cy=".75" r=".6">' +
      '<stop offset="0" stop-color="#FFFBE6"/><stop offset=".35" stop-color="#FFD54A"/><stop offset=".8" stop-color="#FF8A1F"/><stop offset="1" stop-color="#E2471B"/></radialGradient>' +
    '<radialGradient id="g-glow"><stop offset="0" stop-color="#FFC857" stop-opacity=".55"/><stop offset="1" stop-color="#FFC857" stop-opacity="0"/></radialGradient>';

  /* One shared <defs> block so every SVG can use the same gradients. */
  function defs() {
    if (document.getElementById('vi-defs')) return;
    var d = document.createElement('div');
    d.innerHTML = '<svg id="vi-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + BRASS + '</defs></svg>';
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }

  function flame(x, y) {
    return '<path class="flame" d="M' + x + ' ' + (y - 13) + ' C' + (x - 4.5) + ' ' + (y - 5) + ' ' + (x - 3.5) + ' ' + y + ' ' + x + ' ' + y +
      ' C' + (x + 3.5) + ' ' + y + ' ' + (x + 4.5) + ' ' + (y - 5) + ' ' + x + ' ' + (y - 13) + 'Z" fill="url(#g-flame)"/>';
  }

  /* A hanging lamp (தொங்கு விளக்கு): chain, finial, three chains, bowl with three wicks. */
  function lamp(chain) {
    var y = chain, h = chain + 66;
    var link = 'stroke="#D9A93C" stroke-width="2" stroke-linecap="round" stroke-dasharray="2.6 3"';
    return '<svg viewBox="0 0 60 ' + h + '" width="60" height="' + h + '">' +
      '<circle cx="30" cy="' + (y + 30) + '" r="30" fill="url(#g-glow)" class="glow"/>' +
      '<line x1="30" y1="0" x2="30" y2="' + y + '" ' + link + '/>' +
      '<circle cx="30" cy="' + (y + 2) + '" r="3.2" fill="url(#g-brass)"/>' +
      '<path d="M30 ' + (y + 4) + ' l6 8 h-12z" fill="url(#g-brass)"/>' +
      '<line x1="30" y1="' + (y + 12) + '" x2="12" y2="' + (y + 36) + '" ' + link + '/>' +
      '<line x1="30" y1="' + (y + 12) + '" x2="48" y2="' + (y + 36) + '" ' + link + '/>' +
      '<path d="M9 ' + (y + 36) + ' Q30 ' + (y + 66) + ' 51 ' + (y + 36) + 'Z" fill="url(#g-brass)"/>' +
      '<ellipse cx="30" cy="' + (y + 36) + '" rx="21" ry="4.5" fill="#B07A16"/>' +
      '<ellipse cx="30" cy="' + (y + 35.2) + '" rx="17" ry="2.6" fill="#5B3A0A"/>' +
      '<path d="M30 ' + (y + 50) + ' q4 6 0 12 q-4 -6 0 -12z" fill="url(#g-brass)"/>' +
      flame(12, y + 34) + flame(30, y + 32) + flame(48, y + 34) +
      '</svg>';
  }

  function lamps(box) {
    /* left %, chain length, extra class */
    var spots = box.classList.contains('few')
      ? [[5, 14, ''], [95, 14, ''], [20, 60, 'wide'], [80, 60, 'wide']]
      : [[3, 120, 'wide'], [9.5, 70, 'wide'], [30, 18, 'mid'], [70, 18, 'mid'], [90.5, 70, 'wide'], [97, 120, 'wide']];
    box.innerHTML = spots.map(function (s, i) {
      return '<div class="lamp ' + s[2] + '" style="left:' + s[0] + '%;animation-delay:-' + (i * 1.3) + 's">' + lamp(s[1]) + '</div>';
    }).join('');
  }

  /* Hills along the bottom, with a small hill temple on the right. */
  function hills(box) {
    box.innerHTML = '<svg viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">' +
      '<path d="M0 150 V96 C110 70 210 78 320 92 C430 106 520 66 650 74 C780 82 860 104 980 92 C1100 80 1180 52 1290 58 C1360 62 1410 76 1440 84 V150Z" fill="#5E1208" opacity=".55"/>' +
      '<path d="M0 150 V118 C140 100 260 112 380 120 C520 128 640 112 760 116 C900 120 1010 112 1110 96 C1180 84 1230 52 1290 50 C1350 50 1390 84 1440 100 V150Z" fill="#3A0A05" opacity=".85"/>' +
      /* temple on the hilltop */
      '<g fill="#2A0703" transform="translate(1268 14)">' +
        '<rect x="0" y="22" width="44" height="16"/><path d="M4 22 L40 22 L36 12 L8 12Z"/><path d="M10 12 L34 12 L31 4 L13 4Z"/>' +
        '<circle cx="22" cy="2" r="2.6" fill="#F2BE45"/><rect x="18" y="28" width="8" height="10" fill="#F2BE45" opacity=".6"/>' +
        '<line x1="38" y1="12" x2="38" y2="-6" stroke="#2A0703" stroke-width="1.6"/><path d="M38 -6 l9 3 l-9 3z" fill="#E2471B"/>' +
      '</g></svg>';
  }

  /* Rooster for the flag, drawn in a 100 x 100 box. */
  var ROOSTER =
    '<g fill="#F7D774">' +
      '<path d="M38 58 C22 50 14 30 22 12 C24 30 32 42 44 48Z"/>' +
      '<path d="M36 62 C16 60 6 44 8 26 C14 42 26 52 42 54Z"/>' +
      '<path d="M38 66 C20 70 8 60 4 46 C14 58 28 62 42 60Z"/>' +
      '<path d="M36 60 C36 46 52 40 64 44 C70 36 66 28 66 22 C66 14 74 10 80 14 C84 17 84 22 82 26 L89 28 L82 31 C84 40 80 52 72 62 C64 72 46 74 36 60Z"/>' +
      '<path d="M46 54 C52 46 62 46 66 52 C60 54 54 58 48 62Z" fill="#C98A0E"/>' +
      '<path d="M52 70 L50 86 M61 70 L63 86 M45 86 L55 86 M58 86 L68 86" stroke="#F7D774" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
    '</g>' +
    '<path d="M70 13 C70 7 74 6 75 10 C76 5 80 5 80 10 C82 7 86 9 83 13Z" fill="#FF6A3D"/>' +
    '<path d="M80 31 C82 37 77 38 77 32Z" fill="#FF6A3D"/>' +
    '<circle cx="77" cy="18" r="1.7" fill="#7A1206"/>';

  /* A peacock feather, 40 wide x 170 tall, eye at the top. */
  function feather() {
    var barbs = '';
    for (var y = 44; y <= 160; y += 5) {
      var w = 15 * (1 - (y - 44) / 130);
      barbs += '<path d="M20 ' + y + ' q' + (-w) + ' -6 ' + (-w - 2) + ' -14 M20 ' + y + ' q' + w + ' -6 ' + (w + 2) + ' -14" />';
    }
    return '<g stroke="#3F9A6A" stroke-width="1" fill="none" opacity=".8">' + barbs + '</g>' +
      '<path d="M20 170 C20 130 20 90 20 40" stroke="#D9B45A" stroke-width="1.8" fill="none"/>' +
      '<ellipse cx="20" cy="30" rx="15" ry="21" fill="#2E7D4F"/>' +
      '<ellipse cx="20" cy="31" rx="11.5" ry="16.5" fill="#D9B45A"/>' +
      '<ellipse cx="20" cy="32" rx="8.5" ry="12.5" fill="#1F8FA3"/>' +
      '<ellipse cx="20" cy="34" rx="5" ry="7.5" fill="#1B2A6B"/>';
  }

  /* The Vel with holy-ash marks, carrying the rooster flag, peacock feathers crossed at its foot. */
  function velFlag(box) {
    box.innerHTML = '<svg viewBox="0 0 220 430" width="100%">' +
      '<g transform="translate(70 262) rotate(-24) translate(-20 0)">' + feather() + '</g>' +
      '<g transform="translate(150 262) rotate(24) translate(-20 0)">' + feather() + '</g>' +
      '<rect x="104" y="128" width="12" height="292" rx="6" fill="url(#g-brass)"/>' +
      '<rect x="101" y="300" width="18" height="7" rx="3" fill="#B07A16"/><rect x="101" y="160" width="18" height="6" rx="3" fill="#B07A16"/>' +
      '<g class="flag">' +
        '<path d="M116 168 C140 156 172 180 210 166 L210 252 C172 266 140 242 116 254Z" fill="#C9300F"/>' +
        '<path d="M116 168 C140 156 172 180 210 166 L210 176 C172 190 140 166 116 178Z" fill="#E2591B" opacity=".7"/>' +
        '<g transform="translate(130 176) scale(.68)">' + ROOSTER + '</g>' +
      '</g>' +
      '<ellipse cx="110" cy="132" rx="17" ry="6" fill="url(#g-brass)"/>' +
      '<path d="M110 8 C140 56 150 96 124 126 L110 136 L96 126 C70 96 80 56 110 8Z" fill="url(#g-brass)"/>' +
      '<path d="M110 22 L110 126" stroke="#B07A16" stroke-width="1.6"/>' +
      '<g stroke="#FFFDF5" stroke-width="3.2" stroke-linecap="round"><line x1="97" y1="84" x2="123" y2="84"/><line x1="96" y1="92" x2="124" y2="92"/><line x1="97" y1="100" x2="123" y2="100"/></g>' +
      '<circle cx="110" cy="92" r="3.6" fill="#D7261E"/>' +
      '</svg>';
  }

  function run() {
    defs();
    Array.prototype.forEach.call(document.querySelectorAll('[data-decor="lamps"]'), lamps);
    Array.prototype.forEach.call(document.querySelectorAll('[data-decor="hills"]'), hills);
    Array.prototype.forEach.call(document.querySelectorAll('[data-decor="vel"]'), velFlag);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
