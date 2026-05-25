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
    
    // Validate inputs
    const updatedSettings = saveSystemSettings({
      pawapayKey: body.pawapayKey !== undefined ? String(body.pawapayKey) : undefined,
      pawapayMode: body.pawapayMode !== undefined ? String(body.pawapayMode) : undefined,
      portalUrl: body.portalUrl !== undefined ? String(body.portalUrl) : undefined,
      waterRate: body.waterRate !== undefined ? parseFloat(body.waterRate) : undefined,
      companyName: body.companyName !== undefined ? String(body.companyName) : undefined,
      logo: body.logo !== undefined ? String(body.logo) : undefined,
      primaryColor: body.primaryColor !== undefined ? String(body.primaryColor) : undefined,
      secondaryColor: body.secondaryColor !== undefined ? String(body.secondaryColor) : undefined,
      backgroundColor: body.backgroundColor !== undefined ? String(body.backgroundColor) : undefined,
      landingBgImage: body.landingBgImage !== undefined ? String(body.landingBgImage) : undefined,
      vatRate: body.vatRate !== undefined ? parseFloat(body.vatRate) : undefined,
      waterRateRanges: body.waterRateRanges !== undefined ? body.waterRateRanges : undefined,
    });

    return NextResponse.json(updatedSettings, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500, headers: corsHeaders });
  }
}
