import { NextResponse } from 'next/server';
import { checkDepositStatus } from '@/lib/pawapay';
import { getSystemSettings } from '@/lib/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: Promise<{ depositId: string }> }) {
  try {
    const { depositId } = await params;
    
    // Check local simulation state first
    const simulatedStatuses = (globalThis as any).pawapaySimulatedStatuses;
    if (simulatedStatuses && simulatedStatuses.get(depositId) === 'COMPLETED') {
      return NextResponse.json({
        status: 'COMPLETED',
        deposit: {
          depositId,
          status: 'COMPLETED',
          payer: {
            accountDetails: {
              phoneNumber: '265991972336'
            }
          }
        }
      }, { headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    let apiKey = searchParams.get('apiKey') || undefined;
    let mode = searchParams.get('mode') || undefined;

    // Retrieve from global key cache if not passed in query params
    if (!apiKey && (globalThis as any).pawapayKeys) {
      const cached = (globalThis as any).pawapayKeys.get(depositId);
      if (cached) {
        apiKey = cached.apiKey;
        mode = mode || cached.mode;
      }
    }

    const settings = getSystemSettings();

    // Fallback to settings and env
    apiKey = apiKey || settings.pawapayKey || process.env.PAWAPAY_API_KEY || undefined;
    mode = mode || settings.pawapayMode || process.env.PAWAPAY_MODE || undefined;

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

export async function POST(request: Request, { params }: { params: Promise<{ depositId: string }> }) {
  try {
    const { depositId } = await params;
    const body = await request.json();
    
    if (body.action === 'simulate_success') {
      if (!(globalThis as any).pawapaySimulatedStatuses) {
        (globalThis as any).pawapaySimulatedStatuses = new Map();
      }
      (globalThis as any).pawapaySimulatedStatuses.set(depositId, 'COMPLETED');
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Simulation request failed' }, { status: 500, headers: corsHeaders });
  }
}