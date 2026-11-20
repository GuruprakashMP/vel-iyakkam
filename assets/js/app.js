/* Vel Iyakkam: reads the Google Sheet and fills the page.
   Everything is calculated here, so the sheet only needs plain rows.
   The page never shows what each person gave. */
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
        iO = col(L, /spent|செலவு/), iN = col(L, /detail|note|விவர/);
    if (iI < 0 || iO < 0) throw new Error('Accounts columns not found');
    return t.rows.map(function (r) {
      var x = { date: toDate(pick(r, iD)), code: toStr(pick(r, iC)).toUpperCase(),
                in: toNum(pick(r, iI)), out: toNum(pick(r, iO)), details: toStr(pick(r, iN)) };
      /* A row with a date and details but no code and no amounts = a Sashti whose
         spending amount is not known yet ("to be updated"). */
      x.pending = !!x.date && !x.in && !x.out && !x.code && !!x.details;
      return x;
    }).filter(function (x) { return x.in > 0 || x.out > 0 || x.pending; });
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
  function parseHelp(t) {
    var L = t.labels;
    var iD = col(L, /date|தேதி/), iS = col(L, /student|மாணவ/),
        iW = col(L, /given|what|பொருள்/), iN = col(L, /note|குறிப்பு/);
    if (iD < 0 || iS < 0) throw new Error('Help columns not found');
    var list = t.rows.map(function (r) {
      return { date: toDate(pick(r, iD)), students: toNum(pick(r, iS)),
               given: toStr(pick(r, iW)), note: toStr(pick(r, iN)) };
    }).filter(function (h) { return h.date && h.students > 0; });
    if (!list.length) throw new Error('no help rows');
    return list;
  }
  function fromSnapshot(s) {
    return {
      ledger: s.ledger.map(function (x) {
        return { date: toDate(x.date), code: x.code || '', in: x.in || 0, out: x.out || 0,
                 details: x.details || '', pending: !!x.pending };
      }),
      members: s.members.map(function (m) {
        return { code: m.code, name: m.name, joined: toDate(m.joined), photo: m.photo || '' };
      }),
      help: (s.help || []).map(function (h) {
        return { date: toDate(h.date), students: h.students, given: h.given || '', note: h.note || '' };
      }),
      asOf: toDate(s.asOf)
    };
  }

  /* ---------- the arithmetic ----------
     Rows are read in sheet order. A spending row closes a Sashti; the
     donations after it belong to the next one. */
  /* Once one Sashti's spending is "to be updated", every balance after it is
     unknown too, so those show as null ("புதுப்பிக்கப்படும்"). */
  function compute(ledger) {
    var bal = 0, cycles = [], prevSpend = false, unknown = false, firstPending = null;
    function fresh(opening) { return { opening: opening, in: 0, out: 0, date: null, gifts: [], spends: [] }; }
    var cur = fresh(0);
    ledger.forEach(function (r) {
      if (r.in > 0 && prevSpend) {
        cur.closing = unknown ? null : bal; cycles.push(cur);
        cur = fresh(unknown ? null : bal);
        prevSpend = false;
      }
      if (r.in > 0) { cur.in += r.in; cur.gifts.push(r); }
      if (r.out > 0 || r.pending) {
        cur.spends.push(r);
        if (r.pending) { cur.pending = true; unknown = true; if (!firstPending) firstPending = r.date; }
        else cur.out += r.out;
        if (!cur.date) cur.date = r.date;   // a Sashti's date = its first spending row
        prevSpend = true;
      }
      bal += r.in - r.out;
    });
    if (prevSpend) { cur.closing = unknown ? null : bal; cycles.push(cur); cur = fresh(unknown ? null : bal); }
    cur.closing = unknown ? null : bal;
    cycles.forEach(function (c) { if (c.pending) c.out = null; });
    var lastKnown = null;
    cycles.forEach(function (c) { if (c.closing != null) lastKnown = c.date; });
    return { cycles: cycles, open: cur, firstPending: firstPending, lastKnown: lastKnown };
  }
  var TBU = '<span class="pend">புதுப்பிக்கப்படும்</span>';
  function money(v) { return v == null ? TBU : rupees(v); }

  /* ---------- names and photos ---------- */

  function niceName(n) {
    n = n.replace(/\s+/g, ' ').trim();
    if (n === n.toUpperCase()) {                 // ALL CAPS -> Title Case
      n = n.toLowerCase().replace(/(^|[\s.])([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); });
    }
    n = n.replace(/(^|\s)([a-z])(?=\s|$|\.)/g, function (_, a, b) { return a + b.toUpperCase(); }); // lone initials
    var m = /^((?:[A-Z]\.\s*|[A-Z]\s+)+)(.+)$/.exec(n);      // "T. Kannan" -> "Kannan T"
    if (m && /[a-z]/.test(m[2])) n = m[2].trim() + ' ' + m[1].replace(/[.\s]+/g, ' ').trim();
    return n;
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
    return C.photoFolder + m.code + C.photoExt + '?v=' + (C.photoVersion || 1);
  }

  /* ---------- rendering ---------- */

  function renderStats(help, shownMembers) {
    var kits = help.reduce(function (s, h) { return s + h.students; }, 0);
    $('sSashti').textContent = help.length;
    $('sKits').textContent = kits;
    $('sMem').textContent = shownMembers.length;
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

  function renderHelp(help) {
    var rows = [];
    for (var i = help.length - 1; i >= 0; i--) {
      var h = help[i];
      rows.push('<li><div class="no">' + (i + 1) + '</div>' +
        '<div class="when">' + longDate(h.date) + (h.note ? '<span class="tag">' + esc(h.note) + '</span>' : '') + '</div>' +
        '<div class="kids">' + h.students + '<small>' + (h.students > 1 ? 'மாணவர்கள்' : 'மாணவர்') + '</small></div>' +
        '<div class="what">' + esc(h.given || 'கல்விப் பொருள்கள்') + '</div></li>');
    }
    $('helpList').innerHTML = rows.join('');
  }

  function giverName(code, members) {
    if (!code) return '';
    if (!C.showNamesInAccounts) return code;
    for (var i = 0; i < members.length; i++) if (members[i].code === code) return code + ' · ' + niceName(members[i].name);
    return code;
  }

  /* Accounts page: one card per Sashti; open it to see who gave and what was spent. */
  function renderAccounts(R, members) {
    function card(c, n, isOpen) {
      var title = isOpen ? 'தற்போது' : n + 'வது சஷ்டி';
      var sub = isOpen ? 'கடைசி சஷ்டிக்குப் பின் வந்தது' : dmy(c.date);
      var gifts = c.gifts.map(function (r) {
        var who = r.code ? esc(giverName(r.code, members)) : esc(r.details || 'நன்கொடை');
        return '<div class="line"><span class="d">' + dmy(r.date) + '</span><span class="who">' + who +
          '</span><span class="a">' + rupees(r.in) + '</span></div>';
      }).join('');
      var spends = c.spends.map(function (r) {
        return '<div class="line"><span class="d">' + dmy(r.date) + '</span><span class="who">' +
          esc(r.pending ? 'கல்விப் பொருள்கள்' : (r.details || 'சஷ்டி செலவு')) + '</span><span class="a">' +
          (r.pending ? TBU : rupees(r.out)) + '</span></div>';
      }).join('');
      return '<details class="cyc' + (c.pending ? ' pending' : '') + '">' +
        '<summary><span class="no">' + (isOpen ? '•' : n) + '</span>' +
        '<span class="t"><b>' + title + '</b><span>' + sub + '</span></span>' +
        '<span class="fig"><div><small>வரவு</small><b class="in">' + rupees(c.in) + '</b></div>' +
        (isOpen ? '' : '<div><small>செலவு</small><b class="out">' + money(c.out) + '</b></div>') +
        (c.closing == null ? '' : '<div><small>இருப்பு</small><b>' + money(c.closing) + '</b></div>') + '</span>' +
        '<span class="chev"><span class="o">விவரம் பார்க்க ▾</span><span class="c">மூடு ▴</span></span></summary>' +
        '<div class="cyc-body">' +
        '<div class="bal"><span>முன் இருப்பு</span><span>' + money(c.opening) + '</span></div>' +
        '<h4>வேல் நிதி வழங்கியோர் (' + c.gifts.length + ')</h4>' + (gifts || '<p class="muted small">இல்லை</p>') +
        (isOpen ? '' : '<h4>செலவு</h4>' + spends) +
        '<div class="bal"><span>' + (isOpen ? 'தற்போதைய இருப்பு' : 'மீதி இருப்பு') + '</span><span>' + money(c.closing) + '</span></div>' +
        '</div></details>';
    }
    var html = [];
    if (R.open.in > 0) html.push(card(R.open, 0, true));
    for (var i = R.cycles.length - 1; i >= 0; i--) html.push(card(R.cycles[i], i + 1, false));
    $('accList').innerHTML = html.join('');
    $('accNote').textContent = (C.showNamesInAccounts ? '' : 'வழங்கியோர் உறுப்பினர் குறியீட்டால் குறிக்கப்படுகின்றனர். ') +
      (R.firstPending ? dmy(R.firstPending) + ' முதல் உள்ள சஷ்டிகளின் செலவுத் தொகை புதுப்பிக்கப்பட உள்ளது.' : '');
    var btn = $('toggleAll'), all = false;
    btn.addEventListener('click', function () {
      all = !all;
      Array.prototype.forEach.call(document.querySelectorAll('.cyc'), function (d) { d.open = all; });
      btn.textContent = all ? 'அனைத்தையும் மூடு' : 'அனைத்தையும் திற';
    });
  }

  function visibleMembers(members) {
    var hide = (C.hideMembers || []).map(function (c) { return c.toUpperCase(); });
    return members.filter(function (m) { return hide.indexOf(m.code) < 0; })
      .map(function (m) { return { m: m, n: niceName(m.name) }; })
      .sort(function (a, b) { return a.n.localeCompare(b.n, 'en', { sensitivity: 'base' }); });
  }
  function renderPeople(members) {
    var shown = visibleMembers(members);
    var box = $('people');
    box.innerHTML = shown.map(function (x) {
      var m = x.m, n = x.n;
      var j = m.joined ? TA_MONTHS[m.joined.getMonth()] + ' ' + m.joined.getFullYear() : '';
      return '<figure class="person"><div class="ph"><span>' + esc(initials(n)) + '</span>' +
        '<img src="' + esc(photoUrl(m)) + '" alt="' + esc(n) + '" loading="lazy"></div>' +
        '<figcaption><b>' + esc(n) + '</b>' +
        (C.showCodesOnMembers ? '<span>' + esc(m.code) + '</span>' : '') +
        (j ? '<span>' + j + ' முதல்</span>' : '') + '</figcaption></figure>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('img'), function (img) {
      img.addEventListener('error', function () { img.remove(); });
      img.addEventListener('load', function () { img.classList.add('ok'); });
    });
    fitNames(box);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitNames(box); });
    if (!fitNames.bound) {
      fitNames.bound = true;
      var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { fitNames(box); }, 150); });
    }
    return shown;
  }

  /* Keep every name on one line: shrink the text of a long name until it fits its card. */
  function fitNames(box) {
    Array.prototype.forEach.call(box.querySelectorAll('.person figcaption b'), function (el) {
      el.style.fontSize = '';
      var size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 0.5 && size > 10) {
        size -= 0.5;
        el.style.fontSize = size + 'px';
      }
    });
  }

  function setLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('.js-join'), function (a) { a.href = C.joinForm; a.target = '_blank'; a.rel = 'noopener'; });
    Array.prototype.forEach.call(document.querySelectorAll('.js-wa'), function (a) {
      if (C.whatsapp) { a.href = C.whatsapp; a.target = '_blank'; a.rel = 'noopener'; } else a.hidden = true;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.js-mail'), function (a) { a.href = 'mailto:' + C.email; a.textContent = C.email; });
  }

  /* ---------- start ---------- */

  var page = document.body.getAttribute('data-page') || 'home';
  setLinks();
  if (page === 'home') renderSashti();
  if (page === 'contact') return;

  var snap = fetch('data/snapshot.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(fromSnapshot);
  var live = 0, wanted = 0;
  function tab(name, parse, key) {
    wanted++;
    return loadTab(name).then(function (t) { var x = parse(t); live++; return x; })
      .catch(function (e) { console.warn(name + ':', e.message); return snap.then(function (s) { return s[key]; }); });
  }
  function sourceNote() {
    if (!wanted || !$('source')) return;
    if (live === wanted) {
      $('source').textContent = 'எல்லா விவரங்களும் Google Sheet-இலிருந்து நேரடியாக வருகின்றன.';
      return;
    }
    snap.then(function (s) {
      $('source').textContent = 'சில விவரங்கள் ' + dmy(s.asOf) + ' அன்று சேமித்த பதிவிலிருந்து காட்டப்படுகின்றன.';
      if (!live) {
        var n = $('notice');
        n.textContent = 'நேரடி Google Sheet இணைப்பு கிடைக்கவில்லை. ' + dmy(s.asOf) + ' அன்று சேமித்த பதிவு காட்டப்படுகிறது.';
        n.hidden = false;
      }
    });
  }

  var jobs = page === 'accounts'
    ? [tab(C.accountsTab, parseLedger, 'ledger'), C.showNamesInAccounts ? tab(C.membersTab, parseMembers, 'members') : Promise.resolve([])]
    : page === 'members'
    ? [tab(C.membersTab, parseMembers, 'members')]
    : [tab(C.membersTab, parseMembers, 'members'), tab(C.helpTab, parseHelp, 'help')];

  Promise.all(jobs).then(function (res) {
    if (page === 'accounts') {
      renderAccounts(compute(res[0]), res[1]);
    } else if (page === 'members') {
      renderPeople(res[0]);
    } else {
      renderStats(res[1], visibleMembers(res[0]));
      renderHelp(res[1]);
    }
    sourceNote();
  }).catch(function (e) {
    var n = $('notice');
    n.textContent = 'விவரங்களைப் படிக்க முடியவில்லை. பின்னர் மீண்டும் முயலவும்.';
    n.hidden = false;
    console.error(e);
  });
})();
