/* ==========================================================================
   VEL IYAKKAM — Panchangam engine / பஞ்சாங்கக் கணிப்பு
   --------------------------------------------------------------------------
   Calculates Sashti (Shukla Shashti — the 6th lunar day of the waxing moon)
   for any range of years, with no data file and no internet.

   Method
     * Sun's apparent longitude  — Meeus, "Astronomical Algorithms", ch. 25
     * Moon's longitude          — Meeus, ch. 47 (full 60-term ΣL series)
     * Tithi  = floor( ((moonLong - sunLong) mod 360) / 12 )
               Shukla Shashti  =  tithi index 5  (elongation 60° … 72°)
     * Sunrise — the standard sunrise equation (NOAA), for your lat/long
     * The Sashti DAY is the civil date whose sunrise falls inside the
       Shashti tithi. This is the Tamil convention.
     * Tamil month  = sidereal solar sign (Lahiri ayanamsa).
       Sashti in Aippasi  =  Kanda Sashti / Soorasamharam.

   Accuracy: better than about one minute — far more than enough to pick
   the right calendar date. For a major vratam still cross-check your
   local panchangam once.
   ========================================================================== */

(function (global) {
  'use strict';

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var J2000 = 2451545.0;

  function sin(d){ return Math.sin(d * D2R); }
  function cos(d){ return Math.cos(d * D2R); }
  function norm360(x){ x = x % 360; return x < 0 ? x + 360 : x; }

  /* ---- Julian Day from a UTC calendar moment ---------------------------- */
  function toJD(y, m, d, hours) {
    hours = hours || 0;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
           d + B - 1524.5 + hours / 24;
  }

  /* ---- Julian Day back to a UTC calendar moment -------------------------- */
  function fromJD(jd) {
    var z = Math.floor(jd + 0.5), f = jd + 0.5 - z, A = z;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      A = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var B = A + 1524, C = Math.floor((B - 122.1) / 365.25),
        D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
    var day = B - D - Math.floor(30.6001 * E) + f;
    var month = E < 14 ? E - 1 : E - 13;
    var year = month > 2 ? C - 4716 : C - 4715;
    var di = Math.floor(day), frac = day - di, h = frac * 24;
    return { year: year, month: month, day: di,
             hour: Math.floor(h), minute: Math.floor((h - Math.floor(h)) * 60) };
  }

  /* ======================================================================
     SUN — apparent geometric longitude (Meeus ch. 25)
     ====================================================================== */
  function sunLongitude(jd) {
    var T = (jd - J2000) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M  = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
           + (0.019993 - 0.000101 * T) * sin(2 * M)
           + 0.000289 * sin(3 * M);
    var trueLong = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    return norm360(trueLong - 0.00569 - 0.00478 * sin(omega));
  }

  /* ======================================================================
     MOON — longitude (Meeus ch. 47, full main series)
     Columns: D, M, M', F, coefficient of ΣL (units 1e-6 degree)
     ====================================================================== */
  var ML = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
    [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
    [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
    [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
    [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
    [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
    [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
    [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],
    [1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],
    [0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]
  ];

  function moonLongitude(jd) {
    var T = (jd - J2000) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    var D  = 297.8501921 + 445267.1114034  * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    var M  = 357.5291092 + 35999.0502909   * T - 0.0001536 * T2 + T3 / 24490000;
    var Mp = 134.9633964 + 477198.8675055  * T + 0.0087414 * T2 + T3 / 69699  - T4 / 14712000;
    var F  =  93.2720950 + 483202.0175233  * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

    var A1 = 119.75 + 131.849 * T;
    var A2 =  53.09 + 479264.290 * T;
    var E  = 1 - 0.002516 * T - 0.0000074 * T2;

    Lp = norm360(Lp); D = norm360(D); M = norm360(M); Mp = norm360(Mp); F = norm360(F);

    var sum = 0;
    for (var i = 0; i < ML.length; i++) {
      var t = ML[i];
      var arg = t[0] * D + t[1] * M + t[2] * Mp + t[3] * F;
      var coef = t[4];
      var am = Math.abs(t[1]);
      if (am === 1) coef *= E; else if (am === 2) coef *= E * E;
      sum += coef * sin(arg);
    }
    sum += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);

    return norm360(Lp + sum / 1000000);
  }

  /* ---- Elongation & tithi ------------------------------------------------ */
  function elongation(jd){ return norm360(moonLongitude(jd) - sunLongitude(jd)); }
  function tithiIndex(jd){ return Math.floor(elongation(jd) / 12); }   // 0..29

  /* ======================================================================
     SUNRISE — sunrise equation, returns Julian Day (UT) of sunrise
     ====================================================================== */
  function sunriseJD(year, month, day, lat, lon) {
    var jdMid = toJD(year, month, day, 0);              // 00:00 UT, ends in .5
    var n = Math.round(jdMid + 0.5 - J2000);            // integer days since J2000 noon
    var Jstar = n + 0.0009 - lon / 360;

    var M = norm360(357.5291 + 0.98560028 * Jstar);
    var C = 1.9148 * sin(M) + 0.0200 * sin(2 * M) + 0.0003 * sin(3 * M);
    var lambda = norm360(M + C + 180 + 102.9372);
    var Jtransit = J2000 + Jstar + 0.0053 * sin(M) - 0.0069 * sin(2 * lambda);

    var sinDec = sin(lambda) * sin(23.4397);
    var cosDec = Math.sqrt(1 - sinDec * sinDec);
    var cosOmega = (sin(-0.833) - sin(lat) * sinDec) / (cos(lat) * cosDec);

    if (cosOmega > 1)  return null;   // polar night  — never relevant in India
    if (cosOmega < -1) return null;   // midnight sun
    var omega = Math.acos(cosOmega) * R2D;
    return Jtransit - omega / 360;
  }

  /* ======================================================================
     TAMIL MONTH — sidereal solar sign (Lahiri ayanamsa)
     0 = Chithirai … 6 = Aippasi … 11 = Panguni
     ====================================================================== */
  function ayanamsa(jd){ return 23.8567 + 0.0139694 * ((jd - J2000) / 365.25); }
  function tamilMonthIndex(jd) {
    return Math.floor(norm360(sunLongitude(jd) - ayanamsa(jd)) / 30);
  }

  /* ======================================================================
     Find every moment the Moon–Sun elongation crosses `target` degrees
     ====================================================================== */
  function findCrossings(jdStart, jdEnd, target) {
    var out = [], step = 1.0;
    function g(jd){ return ((elongation(jd) - target + 180) % 360 + 360) % 360 - 180; }

    var prev = g(jdStart), prevJd = jdStart;
    for (var jd = jdStart + step; jd <= jdEnd; jd += step) {
      var cur = g(jd);
      if (prev < 0 && cur >= 0) {
        var lo = prevJd, hi = jd;
        for (var i = 0; i < 40; i++) {              // bisect to ~1 second
          var mid = (lo + hi) / 2;
          if (g(mid) < 0) lo = mid; else hi = mid;
        }
        out.push((lo + hi) / 2);
      }
      prev = cur; prevJd = jd;
    }
    return out;
  }

  /* ======================================================================
     PUBLIC — list of Sashti days between two years (inclusive)
     ====================================================================== */
  function sashtiDates(fromYear, toYear, opts) {
    opts = opts || {};
    var lat = opts.latitude  != null ? opts.latitude  : 13.0827;
    var lon = opts.longitude != null ? opts.longitude : 80.2707;
    var tz  = opts.timezoneOffsetHours != null ? opts.timezoneOffsetHours : 5.5;

    var jdStart = toJD(fromYear, 1, 1, 0) - 2;
    var jdEnd   = toJD(toYear, 12, 31, 0) + 2;

    var starts = findCrossings(jdStart, jdEnd, 60);   // Shashti begins
    var results = [];

    var HALF_HOUR = 0.5 / 24;

    for (var i = 0; i < starts.length; i++) {
      var t0 = starts[i];
      // Shashti ends when elongation reaches 72° — about one tithi later
      var ends = findCrossings(t0, t0 + 2, 72);
      var t1 = ends.length ? ends[0] : t0 + 1;

      // Which local civil date has its sunrise inside [t0, t1)?
      var localDay = fromJD(t0 + tz / 24);
      var chosen = null, twoSunrises = false, borderline = false, chosenSunrise = null;

      for (var off = -1; off <= 1; off++) {
        var d = new Date(Date.UTC(localDay.year, localDay.month - 1, localDay.day + off));
        var sr = sunriseJD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), lat, lon);
        if (sr == null) continue;

        // The tithi starting or ending within half an hour of sunrise means
        // different panchangams may well pick the other day.
        if (Math.abs(sr - t0) < HALF_HOUR || Math.abs(sr - t1) < HALF_HOUR) borderline = true;

        if (sr >= t0 && sr < t1) {
          if (chosen === null) { chosen = d; chosenSunrise = sr; }
          else twoSunrises = true;
        }
      }

      // Tithi kshaya: Shashti began and ended between two sunrises.
      // Convention — observe on the day that contains the tithi.
      if (chosen === null) {
        chosen = new Date(Date.UTC(localDay.year, localDay.month - 1, localDay.day));
        chosenSunrise = sunriseJD(chosen.getUTCFullYear(), chosen.getUTCMonth() + 1,
                                  chosen.getUTCDate(), lat, lon);
        borderline = true;
      }

      var y = chosen.getUTCFullYear();
      if (y < fromYear || y > toYear) continue;

      // Tamil (solar) month, read at the sunrise of the observed day
      var tm = tamilMonthIndex(chosenSunrise || t0);

      // Kanda Sashti is fixed by the LUNAR month, not the solar one: it is the
      // Shashti of the lunar month whose new moon fell with the Sun in Thulam
      // (Libra) — i.e. the Aippasi amavasai. Find that new moon.
      var newMoon = findCrossings(t0 - 8, t0, 0);
      var nm = newMoon.length ? newMoon[newMoon.length - 1] : t0 - 5;
      var isKanda = tamilMonthIndex(nm) === 6;

      results.push({
        date: chosen,                       // UTC-midnight Date = the local civil date
        year: y,
        month: chosen.getUTCMonth() + 1,
        day: chosen.getUTCDate(),
        weekday: chosen.getUTCDay(),
        tamilMonth: tm,                     // 0 = Chithirai
        isKandaSashti: isKanda,
        startJD: t0,
        endJD: t1,
        start: fromJD(t0 + tz / 24),        // local start moment of the tithi
        end: fromJD(t1 + tz / 24),
        sunrise: chosenSunrise ? fromJD(chosenSunrise + tz / 24) : null,
        spansTwoDays: twoSunrises,
        borderline: borderline              // worth double-checking a panchangam
      });
    }

    // Guard against a duplicate date from a rare boundary case
    var seen = {}, clean = [];
    for (var k = 0; k < results.length; k++) {
      var key = results[k].year + '-' + results[k].month + '-' + results[k].day;
      if (!seen[key]) { seen[key] = 1; clean.push(results[k]); }
    }
    clean.sort(function (a, b) { return a.date - b.date; });
    return clean;
  }

  /* ---- Next Sashti on or after a given date ------------------------------ */
  function nextSashti(list, fromDate) {
    var d = fromDate || new Date();
    var cmp = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    for (var i = 0; i < list.length; i++) {
      if (list[i].date.getTime() >= cmp) return list[i];
    }
    return null;
  }

  /* ---- Build a .ics calendar file so people can subscribe ---------------- */
  function toICS(list, titleTa, titleEn) {
    function pad(n){ return n < 10 ? '0' + n : '' + n; }
    var L = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//Vel Iyakkam//Sashti Calendar//TA',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + (titleEn || 'Sashti Days')
    ];
    list.forEach(function (s, i) {
      var d = s.date;
      var ymd = d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
      var nx = new Date(d.getTime() + 86400000);
      var ymd2 = nx.getUTCFullYear() + pad(nx.getUTCMonth() + 1) + pad(nx.getUTCDate());
      var name = s.isKandaSashti ? 'கந்த சஷ்டி / Kanda Sashti'
                                 : (titleTa || 'சஷ்டி') + ' / ' + (titleEn || 'Sashti');
      L.push('BEGIN:VEVENT');
      L.push('UID:sashti-' + ymd + '-' + i + '@veliyakkam');
      L.push('DTSTAMP:' + ymd + 'T000000Z');
      L.push('DTSTART;VALUE=DATE:' + ymd);
      L.push('DTEND;VALUE=DATE:' + ymd2);
      L.push('SUMMARY:' + name);
      L.push('DESCRIPTION:Vel Iyakkam — veliyakkam');
      L.push('TRANSP:TRANSPARENT');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }

  global.VIPanchang = {
    sashtiDates: sashtiDates,
    nextSashti: nextSashti,
    toICS: toICS,
    // exposed for testing / curiosity
    sunLongitude: sunLongitude,
    moonLongitude: moonLongitude,
    tithiIndex: tithiIndex,
    elongation: elongation,
    sunriseJD: sunriseJD,
    tamilMonthIndex: tamilMonthIndex,
    toJD: toJD,
    fromJD: fromJD
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.VIPanchang;

})(typeof window !== 'undefined' ? window : globalThis);
