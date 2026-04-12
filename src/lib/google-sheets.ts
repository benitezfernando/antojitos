import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Verify environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function getGoogleSheet(sheetIndexOrTitle: number | string = 0) {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SPREADSHEET_ID) {
    throw new Error('Google Sheets credentials are not fully configured in environment variables.');
  }

  // Initialize Auth
  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Google Private Keys use \n for newlines, which need to be parsed correctly from .env strings
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
  
  // Load document properties and worksheets
  await doc.loadInfo(); 
  
  // Return specific sheet
  const sheet = typeof sheetIndexOrTitle === 'number' 
    ? doc.sheetsByIndex[sheetIndexOrTitle] 
    : doc.sheetsByTitle[sheetIndexOrTitle];
    
  if (!sheet) {
      throw new Error(`Sheet ${sheetIndexOrTitle} not found in the document.`);
  }

  return { doc, sheet };
}
