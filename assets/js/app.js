/* Vel Iyakkam: reads the Google Sheet and fills the page.
   Everything is calculated here, so the sheet only needs plain rows. */
(function () {
  'use strict';

  var C = window.VI_CONFIG;
  var TA_MONTHS = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை',
                   'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
  var TA_DAYS = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rupees(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dmy(d) { return d ? pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear() : ''; }
  function longDate(d) { return d.getDate() + ' ' + TA_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

  /* ---------- reading values ---------- */

  function toDate(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return v;
    if (typeof v === 'number') {                       // sheet serial number
      var u = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
      return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
    }
    var s = String(v).trim(), m;
    if ((m = /^Date\((\d+),(\d+),(\d+)/.exec(s))) return new Date(+m[1], +m[2], +m[3]);
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/.exec(s))) return new Date(+m[3], +m[2] - 1, +m[1]); // day first
    return null;
  }
  function toNum(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  function toStr(v) { return v == null ? '' : String(v).trim(); }

  /* Google's "gviz" endpoint: works for a sheet shared "anyone with the link". */
  function loadTab(tab) {
    var url = 'https://docs.google.com/spreadsheets/d/' + C.sheetId +
              '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(tab);
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        var a = t.indexOf('{'), b = t.lastIndexOf('}');
        if (a < 0 || b < a) throw new Error('not a sheet response');
        var j = JSON.parse(t.slice(a, b + 1));
        if (j.status === 'error') throw new Error('sheet error');
        var labels = j.table.cols.map(function (c) { return toStr(c.label).toLowerCase(); });
        var rows = j.table.rows.map(function (r) {
          return (r.c || []).map(function (c) { return c ? c.v : null; });
        });
        return { labels: labels, rows: rows };
      });
  }
  function col(labels, re) {
    for (var i = 0; i < labels.length; i++) if (re.test(labels[i])) return i;
    return -1;
  }
  function pick(row, i) { return i < 0 ? null : row[i]; }

  function parseLedger(t) {
    var L = t.labels;
    var iD = col(L, /date|தேதி/), iC = col(L, /code|குறியீடு/), iI = col(L, /receiv|வரவு/),
        iO = col(L, /spent|செலவு/), iN = col(L, /detail|note|விவர/), iR = col(L, /^ref/);
    if (iI < 0 || iO < 0) throw new Error('Accounts columns not found');
    return t.rows.map(function (r) {
      return { date: toDate(pick(r, iD)), code: toStr(pick(r, iC)).toUpperCase(),
               in: toNum(pick(r, iI)), out: toNum(pick(r, iO)),
               details: toStr(pick(r, iN)), ref: toStr(pick(r, iR)) };
    }).filter(function (x) { return x.in > 0 || x.out > 0; });
  }
  function parseMembers(t) {
    var L = t.labels;
    var iC = col(L, /code|குறியீடு/), iN = col(L, /name|பெயர்/),
        iJ = col(L, /join|time|date/), iP = col(L, /photo|படம்/);
    if (iC < 0 || iN < 0) throw new Error('Members columns not found');
    var list = t.rows.map(function (r) {
      return { code: toStr(pick(r, iC)).toUpperCase(), name: toStr(pick(r, iN)),
               joined: toDate(pick(r, iJ)), photo: toStr(pick(r, iP)) };
    }).filter(function (m) { return /^VEL-/i.test(m.code) && m.name; });
    if (!list.length) throw new Error('no members');
    return list;
  }
  function fromSnapshot(s) {
    return {
      ledger: s.ledger.map(function (x) {
        return { date: toDate(x.date), code: x.code || '', in: x.in || 0, out: x.out || 0,
                 details: x.details || '', ref: x.ref || '' };
      }),
      members: s.members.map(function (m) {
        return { code: m.code, name: m.name, joined: toDate(m.joined), photo: m.photo || '' };
      }),
      asOf: toDate(s.asOf)
    };
  }

  /* ---------- the arithmetic ----------
     Rows are read in sheet order. A spending row closes a Sashti; the
     donations after it belong to the next one. */
  function compute(ledger) {
    var bal = 0, tin = 0, tout = 0, cycles = [], prevSpend = false;
    var cur = { opening: 0, in: 0, out: 0, date: null, details: [] };
    ledger.forEach(function (r) {
      if (r.in > 0 && prevSpend) {
        cur.closing = bal; cycles.push(cur);
        cur = { opening: bal, in: 0, out: 0, date: null, details: [] };
        prevSpend = false;
      }
      if (r.in > 0) cur.in += r.in;
      if (r.out > 0) {
        cur.out += r.out; if (!cur.date) cur.date = r.date;   // a Sashti's date = its first spending row
        if (r.details) cur.details.push(r.details);
        prevSpend = true;
      }
      bal += r.in - r.out; tin += r.in; tout += r.out;
      r.balance = bal;
    });
    if (prevSpend) { cur.closing = bal; cycles.push(cur); cur = { opening: bal, in: 0, out: 0, details: [] }; }
    cur.closing = bal;

    var byCode = {};
    ledger.forEach(function (r) {
      if (!(r.in > 0) || !r.code) return;
      var m = byCode[r.code] || (byCode[r.code] = { code: r.code, total: 0, count: 0, last: null });
      m.total += r.in; m.count++;
      if (r.date && (!m.last || r.date > m.last)) m.last = r.date;
    });
    var lastEntry = null;
    ledger.forEach(function (r) { if (r.date && (!lastEntry || r.date > lastEntry)) lastEntry = r.date; });

    return { tin: tin, tout: tout, bal: bal, cycles: cycles, open: cur, byCode: byCode, lastEntry: lastEntry };
  }

  /* ---------- names and photos ---------- */

  function niceName(n) {
    n = n.replace(/\s+/g, ' ').trim();
    if (n === n.toUpperCase()) {                 // ALL CAPS -> Title Case
      n = n.toLowerCase().replace(/(^|[\s.])([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); });
    }
    return n.replace(/(^|\s)([a-z])(?=\s|$|\.)/g, function (_, a, b) { return a + b.toUpperCase(); }); // lone initials
  }
  function initials(n) {
    var w = n.split(/[\s.]+/).filter(Boolean);
    var long = w.filter(function (x) { return x.length > 1; });
    var src = long.length ? long : w;
    return ((src[0] || '?')[0] + (src[1] ? src[1][0] : '')).toUpperCase();
  }
  function photoUrl(m) {
    var p = m.photo, id;
    if (p) {
      id = (/\/d\/([\w-]{20,})/.exec(p) || /[?&]id=([\w-]{20,})/.exec(p) || [])[1];
      return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w400' : p;
    }
    return C.photoFolder + m.code + C.photoExt;
  }

  /* ---------- rendering ---------- */

  function renderStats(R, members) {
    $('sIn').textContent = rupees(R.tin);
    $('sOut').textContent = rupees(R.tout);
    $('sBal').textContent = rupees(R.bal);
    $('sMem').textContent = members.length;
  }

  function renderSashti() {
    if (!window.VIPanchang) return;
    var y = new Date().getFullYear();
    var list = VIPanchang.sashtiDates(y, y + 1, {
      latitude: C.place.latitude, longitude: C.place.longitude, timezoneOffsetHours: 5.5
    });
    var s = VIPanchang.nextSashti(list, new Date());
    if (!s) return;
    var d = new Date(s.year, s.month - 1, s.day);
    var days = Math.round((d - today()) / 864e5);
    $('nsDate').textContent = longDate(d) + ', ' + TA_DAYS[d.getDay()] + (s.isKandaSashti ? ' · கந்த சஷ்டி' : '');
    $('nsPlace').textContent = C.place.nameTa + ' சூரிய உதயத்தின்படி கணக்கிடப்பட்டது';
    $('nsCount').innerHTML = days === 0 ? '<b>இன்று</b>' : days === 1 ? '<b>நாளை</b>'
      : '<b>' + days + '</b><span>நாட்களில்</span>';
  }

  function renderCycles(R) {
    var rows = [];
    if (R.open.in > 0 || !R.cycles.length) {
      rows.push('<tr class="now"><td><b>தற்போது</b><div class="sub">கடைசி சஷ்டிக்குப் பின் வந்தது</div></td>' +
        '<td class="n opt">' + rupees(R.open.opening) + '</td><td class="n in">' + rupees(R.open.in) +
        '</td><td class="n">-</td><td class="n"><b>' + rupees(R.open.closing) + '</b></td></tr>');
    }
    for (var i = R.cycles.length - 1; i >= 0; i--) {
      var c = R.cycles[i];
      var det = c.details.map(function (t) {
        return t.replace(/^\d+(st|nd|rd|th)\s+sashti\s*/i, '').replace(/^\((.*)\)$/, '$1').trim();
      }).filter(Boolean).join('; ');
      rows.push('<tr><td><b>' + (i + 1) + 'வது சஷ்டி</b><div class="sub">' + dmy(c.date) +
        (det ? ' · ' + esc(det) : '') + '</div></td>' +
        '<td class="n opt">' + rupees(c.opening) + '</td><td class="n in">' + rupees(c.in) +
        '</td><td class="n out">' + rupees(c.out) + '</td><td class="n"><b>' + rupees(c.closing) + '</b></td></tr>');
    }
    document.querySelector('#cycleTbl tbody').innerHTML = rows.join('');
  }

  function nameOf(code, members) {
    for (var i = 0; i < members.length; i++) if (members[i].code === code) return niceName(members[i].name);
    return '';
  }
  function codeLabel(code, members) {
    if (!C.showNamesInAccounts) return esc(code);
    var n = nameOf(code, members);
    return esc(code) + (n ? ' <span class="sub-i">' + esc(n) + '</span>' : '');
  }

  function renderMemberTotals(R, members) {
    var list = Object.keys(R.byCode).sort().map(function (k) { return R.byCode[k]; });
    document.querySelector('#memberTbl tbody').innerHTML = list.map(function (m) {
      return '<tr><td>' + codeLabel(m.code, members) + '</td><td class="n">' + rupees(m.total) +
        '</td><td class="n">' + m.count + '</td><td class="n">' + dmy(m.last) + '</td></tr>';
    }).join('');
  }

  function renderLedger(ledger, members, filter) {
    var rows = [];
    for (var i = ledger.length - 1; i >= 0; i--) {
      var r = ledger[i];
      if (filter && r.code !== filter) continue;
      var what = r.out > 0 ? '<b>சஷ்டி செலவு</b>' + (r.details ? '<div class="sub">' + esc(r.details) + '</div>' : '')
               : r.code ? codeLabel(r.code, members) + (r.details ? '<div class="sub">' + esc(r.details) + '</div>' : '')
               : '<b>நன்கொடை</b>' + (r.details ? '<div class="sub">' + esc(r.details) + '</div>' : '');
      rows.push('<tr' + (r.out > 0 ? ' class="spend"' : '') + '><td>' + dmy(r.date) + '</td><td>' + what +
        '</td><td class="n in">' + (r.in ? rupees(r.in) : '') + '</td><td class="n out">' +
        (r.out ? rupees(r.out) : '') + '</td><td class="n opt">' + rupees(r.balance) + '</td></tr>');
    }
    document.querySelector('#ledgerTbl tbody').innerHTML = rows.join('') ||
      '<tr><td colspan="5" class="muted">பதிவு இல்லை</td></tr>';
  }

  function setupFinder(R, ledger, members) {
    var input = $('codeIn'), out = $('codeOut');
    input.addEventListener('input', function () {
      var q = input.value.trim().toUpperCase();
      if (/^\d{1,3}$/.test(q)) q = 'VEL-' + ('00' + q).slice(-3);
      if (!q) { out.textContent = ''; renderLedger(ledger, members); return; }
      var m = R.byCode[q];
      if (!m) { out.textContent = q + ': பதிவு எதுவும் இல்லை.'; renderLedger(ledger, members, q); return; }
      out.innerHTML = '<b>' + esc(q) + '</b>: மொத்தம் <b>' + rupees(m.total) + '</b>, ' + m.count +
        ' தவணைகள், கடைசியாக ' + dmy(m.last) + '. விவரம் கீழே.';
      $('ledgerBox').open = true;
      renderLedger(ledger, members, q);
    });
  }

  function renderPeople(members) {
    var hide = (C.hideMembers || []).map(function (c) { return c.toUpperCase(); });
    var shown = members.filter(function (m) { return hide.indexOf(m.code) < 0; });
    var box = $('people');
    box.innerHTML = shown.map(function (m, i) {
      var n = niceName(m.name);
      var j = m.joined ? TA_MONTHS[m.joined.getMonth()] + ' ' + m.joined.getFullYear() : '';
      return '<figure class="person"><div class="ph"><span>' + esc(initials(n)) + '</span>' +
        '<img data-i="' + i + '" src="' + esc(photoUrl(m)) + '" alt="' + esc(n) + '" loading="lazy"></div>' +
        '<figcaption><b>' + esc(n) + '</b>' +
        (C.showCodesOnMembers ? '<span>' + esc(m.code) + '</span>' : '') +
        (j ? '<span>' + j + ' முதல்</span>' : '') + '</figcaption></figure>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('img'), function (img) {
      img.addEventListener('error', function () { img.remove(); });
      img.addEventListener('load', function () { img.classList.add('ok'); });
    });
    return shown;
  }

  function setLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('.js-join'), function (a) { a.href = C.joinForm; a.target = '_blank'; a.rel = 'noopener'; });
    Array.prototype.forEach.call(document.querySelectorAll('.js-wa'), function (a) {
      if (C.whatsapp) { a.href = C.whatsapp; a.target = '_blank'; a.rel = 'noopener'; } else a.hidden = true;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.js-mail'), function (a) { a.href = 'mailto:' + C.email; a.textContent = C.email; });
  }

  /* ---------- start ---------- */

  setLinks();
  renderSashti();

  var snap = fetch('data/snapshot.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(fromSnapshot);
  var live = { ledger: false, members: false };

  Promise.all([
    loadTab(C.accountsTab).then(function (t) { var x = parseLedger(t); live.ledger = true; return x; })
      .catch(function (e) { console.warn('Accounts:', e.message); return snap.then(function (s) { return s.ledger; }); }),
    loadTab(C.membersTab).then(function (t) { var x = parseMembers(t); live.members = true; return x; })
      .catch(function (e) { console.warn('Members:', e.message); return snap.then(function (s) { return s.members; }); })
  ]).then(function (res) {
    var ledger = res[0], members = res[1];
    var R = compute(ledger);
    var shown = renderPeople(members);
    renderStats(R, shown);
    renderCycles(R);
    renderMemberTotals(R, members);
    renderLedger(ledger, members);
    setupFinder(R, ledger, members);

    var last = R.lastEntry ? 'கடைசிப் பதிவு: ' + dmy(R.lastEntry) + '. ' : '';
    if (live.ledger) {
      $('source').textContent = last + 'கணக்கு Google Sheet-இலிருந்து நேரடியாக வருகிறது. எல்லாத் தொகைகளும் தானாகக் கணக்கிடப்படுகின்றன.';
    } else {
      snap.then(function (s) {
        var n = $('notice');
        n.textContent = 'நேரடி Google Sheet இணைப்பு கிடைக்கவில்லை. ' + dmy(s.asOf) + ' அன்று சேமித்த பதிவு காட்டப்படுகிறது.';
        n.hidden = false;
        $('source').textContent = last + 'சேமித்த பதிவு (' + dmy(s.asOf) + ').';
      });
    }
  }).catch(function (e) {
    var n = $('notice');
    n.textContent = 'கணக்கைப் படிக்க முடியவில்லை. பின்னர் மீண்டும் முயலவும்.';
    n.hidden = false;
    console.error(e);
  });
})();
