import { NextResponse } from 'next/server';
import { initiateDeposit, getCountryConfig } from '@/lib/pawapay';
import { getSystemSettings } from '@/lib/settings';

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
    
    const metadataFields = Array.isArray(body.metadata) 
      ? body.metadata 
      : (body.metadata?.fields || []);

    const settings = getSystemSettings();
    let apiKey = body.apiKey || settings.pawapayKey || process.env.PAWAPAY_API_KEY;
    
    if (!apiKey) {
      const field = metadataFields.find((f: any) => f.fieldName === 'apiKey');
      if (field) apiKey = field.fieldValue;
    }

    const mode = body.mode || 
                 metadataFields.find((f: any) => f.fieldName === 'mode')?.fieldValue || 
                 settings.pawapayMode ||
                 process.env.PAWAPAY_MODE || 
                 'sandbox';

    if (!apiKey) {
      return NextResponse.json({ 
        error: "PAWAPAY_API_KEY is not configured. Please add it in System Settings or .env file." 
      }, { status: 400, headers: corsHeaders });
    }

    if (body.action === 'getConfig') {
      const config = await getCountryConfig(body.country || 'MWI', apiKey, mode);
      return NextResponse.json(config, { headers: corsHeaders });
    }
    
    // Clean and transform metadata into an array of single key-value objects as required by PawaPay V2 API
    const v2Metadata: Array<Record<string, string>> = [];
    if (Array.isArray(body.metadata)) {
      body.metadata.forEach((f: any) => {
        if (f && f.fieldName && f.fieldValue && !['apiKey', 'mode'].includes(f.fieldName)) {
          v2Metadata.push({ [f.fieldName]: String(f.fieldValue) });
        }
      });
    } else if (body.metadata && typeof body.metadata === 'object') {
      const fields = body.metadata.fields || [];
      if (Array.isArray(fields)) {
        fields.forEach((f: any) => {
          if (f && f.fieldName && f.fieldValue && !['apiKey', 'mode'].includes(f.fieldName)) {
            v2Metadata.push({ [f.fieldName]: String(f.fieldValue) });
          }
        });
      } else {
        Object.entries(body.metadata).forEach(([key, val]) => {
          if (!['apiKey', 'mode', 'fields', 'statementDescription'].includes(key)) {
            v2Metadata.push({ [key]: String(val) });
          }
        });
      }
    }

    if (v2Metadata.length === 0) {
      v2Metadata.push({ 'systemName': 'MyWaterBill' });
    }

    const result = await initiateDeposit({ 
      ...body, 
      apiKey, 
      mode,
      metadata: v2Metadata 
    });

    if (result.success && result.depositId) {
      if (!(globalThis as any).pawapayKeys) {
        (globalThis as any).pawapayKeys = new Map();
      }
      (globalThis as any).pawapayKeys.set(result.depositId, { apiKey, mode });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
