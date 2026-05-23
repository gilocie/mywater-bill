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
    
    // Robust extraction for dynamic credentials
    // Checks top-level, metadata object, and metadata fields array
    let apiKey = body.apiKey;
    let mode = body.mode;

    const metadata = body.metadata || {};

    if (!apiKey) {
      if (typeof metadata === 'object' && !Array.isArray(metadata)) {
        apiKey = metadata.apiKey;
        if (!apiKey && Array.isArray(metadata.fields)) {
          const field = metadata.fields.find((f: any) => f.fieldName === 'apiKey' || f.name === 'apiKey');
          if (field) apiKey = field.fieldValue || field.value;
        }
      } else if (Array.isArray(metadata)) {
        const field = metadata.find((f: any) => f.fieldName === 'apiKey' || f.name === 'apiKey');
        if (field) apiKey = field.fieldValue || field.value;
      }
    }

    if (!mode) {
      if (typeof metadata === 'object' && !Array.isArray(metadata)) {
        mode = metadata.mode;
        if (!mode && Array.isArray(metadata.fields)) {
          const field = metadata.fields.find((f: any) => f.fieldName === 'mode' || f.name === 'mode');
          if (field) mode = field.fieldValue || field.value;
        }
      } else if (Array.isArray(metadata)) {
        const field = metadata.find((f: any) => f.fieldName === 'mode' || f.name === 'mode');
        if (field) mode = field.fieldValue || field.value;
      }
    }
    
    if (body.action === 'getConfig') {
      const config = await getCountryConfig(body.country || 'MWI', apiKey, mode);
      return NextResponse.json(config, { headers: corsHeaders });
    }
    
    const result = await initiateDeposit({ ...body, apiKey, mode });
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}