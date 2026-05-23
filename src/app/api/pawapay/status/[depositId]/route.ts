import { NextResponse } from 'next/server';
import { checkDepositStatus } from '@/lib/pawapay';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: Promise<{ depositId: string }> }) {
  try {
    const { depositId } = await params;
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey') || undefined;
    const mode = searchParams.get('mode') || undefined;

    const statusArray = await checkDepositStatus(depositId, apiKey, mode);
    
    if (statusArray && statusArray.length > 0) {
      const paymentInfo = statusArray[0];
      return NextResponse.json({
        status: paymentInfo.status, 
        deposit: paymentInfo
      }, { headers: corsHeaders });
    }
    
    return NextResponse.json({ status: 'PENDING' }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch transaction status' }, { status: 500, headers: corsHeaders });
  }
}