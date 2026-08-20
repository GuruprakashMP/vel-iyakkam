/* ==========================================================================
   VEL IYAKKAM — CONFIGURATION
   வேல் இயக்கம் — அமைப்பு கோப்பு
   --------------------------------------------------------------------------
   This is the ONLY file you normally need to edit.
   இந்த கோப்பை மட்டும் நீங்கள் மாற்ற வேண்டும்.

   HOW TO GET THE SHEET LINKS / சீட் இணைப்பு எப்படி பெறுவது:
     1. Open your Google Sheet
     2. File  ->  Share  ->  Publish to web
     3. Choose the TAB name (e.g. "Donations"), format = "Comma-separated values (.csv)"
     4. Click Publish, copy the link, paste it below between the quotes.
   Full step-by-step guide: docs/SETUP-TAMIL.md
   ========================================================================== */

window.VI_CONFIG = {

  /* ---- Organisation details / அமைப்பு விவரங்கள் ---------------------- */
  org: {
    nameTa:    'வேல் இயக்கம்',
    nameEn:    'Vel Iyakkam',
    taglineTa: 'முருகன் திருவடி நிழலில் — கல்வியே செல்வம்',
    taglineEn: 'In the shade of Murugan’s feet — Education is the true wealth',
    foundedYear: 2024,
    contactEmail: 'veliyakkam@gmail.com',
    contactPhone: '',
    whatsapp: '',           // e.g. '919876543210' (country code, no +)
    upiId: '',              // e.g. 'veliyakkam@okaxis'  — shown on the Donate page
    upiPayeeName: 'Vel Iyakkam'
  },

  /* ---- Panchangam / பஞ்சாங்க அமைப்பு --------------------------------
     Sashti date depends on sunrise at your place. Default = Tiruchendur.
     Tiruchendur: 8.4956 / 78.1119   Palani: 10.4500 / 77.5200
     Chennai:    13.0827 / 80.2707   Madurai: 9.9252 / 78.1198          */
  panchang: {
    latitude:  8.4956,
    longitude: 78.1119,
    placeTa: 'திருச்செந்தூர்',
    placeEn: 'Tiruchendur',
    timezoneOffsetHours: 5.5      // IST
  },

  /* ---- Google Sheet links / கூகிள் சீட் இணைப்புகள் -------------------
     Leave '' (empty) to use the sample data in the /data folder.
     காலியாக விட்டால் மாதிரி தரவு காண்பிக்கப்படும்.                     */
  sheets: {
    donors:   '',   // Tab 1: Code, Name(private), JoinedMonth, Active, Notes
    donations:'',   // Tab 2: Code, Month, Amount, PaidDate, Method, Note
    expenses: '',   // Tab 3: Date, Month, Category, Beneficiary, Amount, Description
    stories:  ''    // Tab 4: (Google Form responses) Title, Category, Story, Contributor, Status
  },

  /* ---- Public forms / பொது படிவங்கள் ---------------------------------
     Create with Google Forms, paste the shareable link here.            */
  forms: {
    storySubmit: '',   // "Share a story" form
    helpRequest: '',   // "Apply for help" form
    joinDonor:   ''    // "Become a monthly donor" form
  },

  /* ---- Display options / காட்சி அமைப்புகள் ---------------------------- */
  display: {
    defaultLang: 'ta',          // 'ta' = Tamil, 'en' = English
    currency: '₹',
    showAmountsPublicly: true,  // false = show only who paid, hide amounts
    cacheMinutes: 10,           // how long to remember sheet data in the browser
    sashtiYearsAhead: 3         // how many years of Sashti dates to generate
  }
};
