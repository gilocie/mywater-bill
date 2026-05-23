import { v4 as uuidv4 } from 'uuid';

const getHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

const getBaseUrl = (mode?: string) => {
  const isLive = mode === 'live';
  return isLive ? 'https://api.pawapay.io' : 'https://api.sandbox.pawapay.io';
};

export async function getCountryConfig(countryCode = 'MWI', apiKey?: string, mode?: string) {
  if (!apiKey) throw new Error('API Key missing for config request.');
  
  const baseUrl = getBaseUrl(mode);
  
  const response = await fetch(`${baseUrl}/v2/active-conf?country=${countryCode}&operationType=DEPOSIT`, {
    method: 'GET',
    headers: getHeaders(apiKey)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.errorMessage || 'Failed to fetch pawaPay configuration from server.');
  }

  const data = await response.json();
  const countryData = data.countries.find((c: any) => c.country === countryCode);

  if (countryData) {
    return {
      prefix: countryData.prefix,
      flag: countryData.flag,
      currency: countryData.providers[0]?.currencies[0]?.currency || 'MWK',
      providers: countryData.providers.map((p: any) => {
        const depositInfo = p.currencies[0]?.operationTypes?.DEPOSIT;
        return {
          provider: p.provider,
          displayName: p.displayName,
          logo: p.logo,
          status: depositInfo?.status || 'CLOSED',
          minAmount: parseFloat(depositInfo?.minAmount) || 0,
          maxAmount: parseFloat(depositInfo?.maxAmount) || Infinity,
          decimalsInAmount: parseInt(depositInfo?.decimalsInAmount, 10) || 0
        };
      })
    };
  }
  return null;
}

export async function initiateDeposit(payload: any) {
  const apiKey = payload.apiKey;
  if (!apiKey) throw new Error('API Key missing for deposit request.');
  
  const baseUrl = getBaseUrl(payload.mode);
  const depositId = uuidv4().toUpperCase();
  
  let phone = (payload.customerPhone || '').replace(/^0+/, '');
  const prefix = '265';
  if (!phone.startsWith(prefix) && (payload.country === 'MWI' || !payload.country)) {
    phone = `${prefix}${phone}`;
  }

  const requestBody = {
    depositId,
    amount: payload.amount.toString(),
    currency: payload.currency || 'MWK',
    payer: {
      type: "MMO",
      accountDetails: {
        phoneNumber: phone,
        provider: payload.correspondent
      }
    },
    customerMessage: (payload.title || payload.statementDescription || 'Utility Payment').substring(0, 22),
    metadata: payload.metadata || []
  };

  const response = await fetch(`${baseUrl}/v2/deposits`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify(requestBody)
  });

  const responseData = await response.json();

  if (!response.ok || responseData.status === 'REJECTED') {
    const errorMsg = responseData.failureReason?.failureMessage || responseData.errorMessage || "Payment initialization rejected by gateway.";
    return { success: false, message: errorMsg };
  }

  return { success: true, depositId, status: responseData.status };
}

export async function checkDepositStatus(depositId: string, apiKey?: string, mode?: string) {
  if (!apiKey) throw new Error('API Key missing for status check.');
  
  const baseUrl = getBaseUrl(mode);
  
  const response = await fetch(`${baseUrl}/v2/deposits/${depositId}`, {
    method: 'GET',
    headers: getHeaders(apiKey)
  });
  if (response.ok) {
    const statusData = await response.json();
    return statusData; 
  }
  return null;
}
