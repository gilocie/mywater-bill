
import { NextResponse } from 'next/server';
import { initiateDeposit, getCountryConfig } from '@/lib/pawapay';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.action === 'getConfig') {
      const config = await getCountryConfig(body.country || 'MWI');
      return NextResponse.json(config, { headers: corsHeaders });
    }
    
    const result = await initiateDeposit(body);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
