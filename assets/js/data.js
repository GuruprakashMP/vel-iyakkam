/* ==========================================================================
   VEL IYAKKAM — Data layer
   Reads published Google Sheet CSVs. If a sheet link is not filled in yet,
   falls back to the sample CSV in /data so the page still works.
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.VI_CONFIG;

  /* ---------- CSV parser (handles quotes, commas and newlines in cells) --- */
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var rows = [], row = [], cell = '', q = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }

    // drop fully empty rows
    rows = rows.filter(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); });
    if (!rows.length) return [];

    var keys = rows[0].map(function (h) {
      return String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    });
    return rows.slice(1).map(function (r) {
      var o = {};
      keys.forEach(function (k, j) { if (k) o[k] = String(r[j] == null ? '' : r[j]).trim(); });
      return o;
    });
  }

  /* ---------- Small helpers ---------------------------------------------- */
  function num(v) {
    if (v == null) return 0;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  // Accepts 2026-08, 08/2026, Aug 2026, 2026-08-15, 15/08/2026 -> '2026-08'
  function toMonthKey(v) {
    if (!v) return '';
    var s = String(v).trim();
    var m = s.match(/^(\d{4})[-/](\d{1,2})/);
    if (m) return m[1] + '-' + String(m[2]).padStart(2, '0');
    m = s.match(/^(\d{1,2})[-/](\d{4})$/);
    if (m) return m[2] + '-' + String(m[1]).padStart(2, '0');
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);          // dd/mm/yyyy
    if (m) return m[3] + '-' + String(m[2]).padStart(2, '0');
    var d = new Date(s);
    if (!isNaN(d)) return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return s;
  }
  function toISODate(v) {
    if (!v) return '';
    var s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);        // dd/mm/yyyy
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    var d = new Date(s);
    if (!isNaN(d)) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
             '-' + String(d.getDate()).padStart(2, '0');
    }
    return s;
  }
  function isPaid(v) {
    var s = String(v || '').trim().toLowerCase();
    if (!s) return true;                              // blank status = paid
    return /^(paid|yes|y|done|ok|received|1|true|செலுத்த|முடிந்த|வந்த)/.test(s);
  }

  /* ---------- Fetch with cache ------------------------------------------- */
  var CACHE_MS = (CFG.display.cacheMinutes || 10) * 60 * 1000;

  function cacheGet(key) {
    try {
      var raw = sessionStorage.getItem('vi-cache-' + key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (Date.now() - o.t > CACHE_MS) return null;
      return o.v;
    } catch (e) { return null; }
  }
  function cacheSet(key, val) {
    try { sessionStorage.setItem('vi-cache-' + key, JSON.stringify({ t: Date.now(), v: val })); }
    catch (e) { /* storage full or blocked — not fatal */ }
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.text();
    });
  }

  /* Loads one logical sheet. Returns { rows, isSample } */
  function loadSheet(name) {
    var cached = cacheGet(name);
    if (cached) return Promise.resolve(cached);

    var url = (CFG.sheets && CFG.sheets[name]) ? String(CFG.sheets[name]).trim() : '';
    var live = !!url;
    var target = live ? url : 'data/' + name + '.sample.csv';

    return fetchText(target)
      .then(function (txt) {
        // A wrong / unpublished sheet link returns an HTML error page, not CSV
        if (/^\s*<(!doctype|html)/i.test(txt)) throw new Error('not-csv');
        var out = { rows: parseCSV(txt), isSample: !live };
        cacheSet(name, out);
        return out;
      })
      .catch(function (err) {
        if (!live) { console.warn('[vi] sample data missing for', name, err); return { rows: [], isSample: true, error: true }; }
        console.warn('[vi] live sheet failed for', name, '- falling back to sample.', err);
        return fetchText('data/' + name + '.sample.csv')
          .then(function (txt) { return { rows: parseCSV(txt), isSample: true, liveFailed: true }; })
          .catch(function () { return { rows: [], isSample: true, error: true }; });
      });
  }

  /* ---------- Typed loaders ---------------------------------------------- */
  function loadDonations() {
    return loadSheet('donations').then(function (res) {
      res.items = res.rows.map(function (r) {
        return {
          code:   (r.code || r.donorcode || r.id || '').toUpperCase(),
          month:  toMonthKey(r.month || r.paiddate || r.date),
          amount: num(r.amount || r.rupees || r.sum),
          date:   toISODate(r.paiddate || r.date || ''),
          method: r.method || r.mode || '',
          note:   r.note || r.remarks || '',
          paid:   isPaid(r.status || r.paid)
        };
      }).filter(function (d) { return d.code && d.month; });
      return res;
    });
  }

  function loadExpenses() {
    return loadSheet('expenses').then(function (res) {
      res.items = res.rows.map(function (r) {
        var date = toISODate(r.date || '');
        return {
          date: date,
          month: toMonthKey(r.month || date),
          category: r.category || r.type || '',
          beneficiary: r.beneficiary || r.student || r.code || '',
          amount: num(r.amount || r.rupees),
          desc: r.description || r.desc || r.details || r.note || ''
        };
      }).filter(function (e) { return e.amount > 0 || e.desc; });
      return res;
    });
  }

  function loadDonors() {
    return loadSheet('donors').then(function (res) {
      res.items = res.rows.map(function (r) {
        return {
          code: (r.code || r.donorcode || '').toUpperCase(),
          joined: toMonthKey(r.joinedmonth || r.joined || r.since || ''),
          active: !/^(no|n|0|false|inactive)/i.test(String(r.active || 'yes').trim()),
          notes: r.notes || ''
        };
      }).filter(function (d) { return d.code; });
      return res;
    });
  }

  function loadStories() {
    return loadSheet('stories').then(function (res) {
      res.items = res.rows.map(function (r, i) {
        return {
          id: 's' + i,
          title: r.title || r.storytitle || r.tamiltitle || '',
          category: r.category || r.type || '',
          body: r.story || r.body || r.content || r.text || '',
          moral: r.moral || r.lesson || '',
          contributor: r.contributor || r.sharedby || r.name || '',
          status: String(r.status || 'published').trim().toLowerCase()
        };
      }).filter(function (s) {
        return s.title && s.body && s.status !== 'draft' && s.status !== 'rejected' && s.status !== 'pending';
      });
      return res;
    });
  }

  /* ---------- Aggregations ------------------------------------------------ */
  function summarise(donations, expenses) {
    var months = {};
    function slot(m) {
      if (!months[m]) months[m] = { month: m, in: 0, out: 0, donors: {}, pending: 0 };
      return months[m];
    }
    donations.forEach(function (d) {
      var s = slot(d.month);
      if (d.paid) { s.in += d.amount; s.donors[d.code] = 1; }
      else s.pending += d.amount;
    });
    expenses.forEach(function (e) { slot(e.month).out += e.amount; });

    var list = Object.keys(months).sort().map(function (m) {
      var s = months[m];
      return { month: m, in: s.in, out: s.out, pending: s.pending, donorCount: Object.keys(s.donors).length };
    });

    var run = 0;
    list.forEach(function (s) { run += s.in - s.out; s.balance = run; });

    var totalIn = list.reduce(function (a, s) { return a + s.in; }, 0);
    var totalOut = list.reduce(function (a, s) { return a + s.out; }, 0);
    var codes = {};
    donations.forEach(function (d) { if (d.paid) codes[d.code] = 1; });
    var people = {};
    expenses.forEach(function (e) { if (e.beneficiary) people[e.beneficiary] = 1; });

    return {
      months: list,
      totalIn: totalIn,
      totalOut: totalOut,
      balance: totalIn - totalOut,
      donorCount: Object.keys(codes).length,
      beneficiaryCount: Object.keys(people).length,
      monthCount: list.length
    };
  }

  window.VIData = {
    parseCSV: parseCSV,
    loadDonations: loadDonations,
    loadExpenses: loadExpenses,
    loadDonors: loadDonors,
    loadStories: loadStories,
    summarise: summarise,
    toMonthKey: toMonthKey,
    num: num
  };
})();
