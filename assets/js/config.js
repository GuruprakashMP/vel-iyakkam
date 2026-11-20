/* Vel Iyakkam: settings. This is the only file you normally edit.
   வேல் இயக்கம்: அமைப்புகள். பொதுவாக இந்தக் கோப்பை மட்டும் மாற்றினால் போதும். */

window.VI_CONFIG = {

  /* The "Vel Fund" Google Sheet. It must be shared as
     "Anyone with the link: Viewer" for the website to read it. */
  sheetId: '1A_5LgRckHjXQWd3BLtg4RZyJxWyOEnxjpnSCbTig47Y',
  accountsTab: 'Accounts',   // Date | Member Code | Received ₹ | Spent ₹ | Details | ...
  membersTab:  'Members',    // Code | Name | Joined (filled automatically from the form sheet)

  joinForm: 'https://docs.google.com/forms/d/1Wjd5mt58Vyq9wMWr-Pat8vwaAEnH10_1HFQTDCFBn28/viewform',
  whatsapp: 'https://chat.whatsapp.com/JsAr0Xwnhv6FZPOWJ9via0',
  email:    'veliyakkam@gmail.com',

  /* Member photos: put them in the photos/ folder named by code,
     e.g. photos/VEL-001.jpg. No photo = the member's initials are shown. */
  photoFolder: 'photos/',
  photoExt: '.jpg',

  /* Codes to leave off the members wall, e.g. ['VEL-014'].
     Their payments still count in the accounts. */
  hideMembers: [],

  /* Privacy. Accounts list payments by code only, so nobody is compared
     by amount. Set to true to print names next to amounts. */
  showNamesInAccounts: false,
  showCodesOnMembers: false,

  /* Sashti dates are calculated for sunrise at this place. */
  place: { latitude: 8.4956, longitude: 78.1119, nameTa: 'திருச்செந்தூர்' }
};
