import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { doc } = await getGoogleSheet();
    const sheets = doc.sheetsByIndex.map(s => s.title);
    return NextResponse.json({ 
      success: true, 
      title: doc.title, 
      sheetCount: doc.sheetCount,
      sheets
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
