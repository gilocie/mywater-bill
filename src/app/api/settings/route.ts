
import { NextResponse } from 'next/server';
import { getSystemSettings, saveSystemSettings } from '@/lib/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const settings = getSystemSettings();
    return NextResponse.json(settings, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create an update object containing only the fields provided in the body
    const updates: any = {};
    const fields = [
      'pawapayKey', 'pawapayMode', 'portalUrl', 'waterRate', 'companyName',
      'companyDescription', 'logo', 'logoBgColor', 'defaultAvatar',
      'primaryColor', 'secondaryColor', 'backgroundColor', 'landingBgImage',
      'landingTitle', 'vatRate', 'waterRateRanges', 'appLevel', 'country',
      'regionName', 'districtName', 'receiptCompanyName'
    ];

    fields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    const updatedSettings = saveSystemSettings(updates);

    return NextResponse.json(updatedSettings, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500, headers: corsHeaders });
  }
}
