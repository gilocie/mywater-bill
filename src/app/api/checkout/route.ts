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
    
    // Extract credentials from top-level or metadata (fallback)
    const apiKey = body.apiKey || process.env.PAWAPAY_API_KEY;
    const mode = body.mode || process.env.PAWAPAY_MODE || 'sandbox';

    if (!apiKey) {
      return NextResponse.json({ 
        error: "PAWAPAY_API_KEY is not configured. Please add it in System Settings or .env file." 
      }, { status: 400, headers: corsHeaders });
    }

    if (body.action === 'getConfig') {
      const config = await getCountryConfig(body.country || 'MWI', apiKey, mode);
      return NextResponse.json(config, { headers: corsHeaders });
    }
    
    // Clean metadata to avoid length errors
    const cleanMetadata = (body.metadata?.fields || []).filter((f: any) => 
      !['apiKey', 'mode'].includes(f.fieldName)
    );

    const result = await initiateDeposit({ 
      ...body, 
      apiKey, 
      mode,
      metadata: cleanMetadata 
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
