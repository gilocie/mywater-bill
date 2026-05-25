(function () {
  const SDK_STYLE_ID = 'brandpay-sdk-styles';

  const injectStyles = () => {
    if (document.getElementById(SDK_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SDK_STYLE_ID;
    style.textContent = `
      .brandpay-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(1, 4, 9, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: 'Inter', -apple-system, sans-serif;
        color: #e6edf3;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .brandpay-overlay.active {
        opacity: 1;
      }
      .brandpay-modal {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 16px;
        padding: 24px;
        width: 100%;
        max-width: 380px;
        position: relative;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        transform: translateY(20px);
        transition: transform 0.3s ease;
        box-sizing: border-box;
      }
      .brandpay-overlay.active .brandpay-modal {
        transform: translateY(0);
      }
      .brandpay-close {
        position: absolute;
        top: 16px; right: 16px;
        background: transparent;
        border: none;
        color: #8b949e;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.2s;
      }
      .brandpay-close:hover {
        color: #ff7b72;
      }
      .brandpay-title {
        font-size: 18px;
        font-weight: 800;
        margin: 0 0 6px 0;
        background: linear-gradient(135deg, #58a6ff, #bc8cff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .brandpay-subtitle {
        font-size: 13px;
        color: #8b949e;
        margin: 0 0 20px 0;
      }
      .brandpay-summary {
        background: #0d1117;
        border: 1px solid #21262d;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .brandpay-summary-label {
        color: #8b949e;
        font-size: 13px;
      }
      .brandpay-summary-amount {
        font-size: 18px;
        font-weight: 800;
        color: #56d364;
      }
      .brandpay-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
        font-size: 11px;
        color: #8b949e;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .brandpay-providers {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      .brandpay-provider-btn {
        flex: 1;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px;
        color: #e6edf3;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .brandpay-provider-btn:hover {
        border-color: #8b949e;
      }
      .brandpay-provider-btn.selected {
        background: rgba(88, 166, 255, 0.1);
        border-color: #58a6ff;
        color: #58a6ff;
      }
      .brandpay-phone-wrapper {
        display: flex;
        margin-bottom: 20px;
      }
      .brandpay-phone-prefix {
        background: #21262d;
        border: 1px solid #30363d;
        border-right: none;
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        color: #8b949e;
        font-weight: 600;
        display: flex;
        align-items: center;
      }
      .brandpay-phone-input {
        flex: 1;
        background: #0d1117;
        border: 1px solid #30363d;
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        padding: 10px 12px;
        color: #e6edf3;
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .brandpay-phone-input:focus {
        border-color: #58a6ff;
      }
      .brandpay-btn-pay {
        width: 100%;
        background: #238636;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, opacity 0.2s;
      }
      .brandpay-btn-pay:hover:not(:disabled) {
        background: #2ea043;
      }
      .brandpay-btn-pay:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .brandpay-error {
        background: rgba(218, 54, 51, 0.1);
        border: 1px solid rgba(218, 54, 51, 0.2);
        color: #ff7b72;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 12px;
        display: none;
      }
      
      /* Progress State Styles */
      .brandpay-loading-state, .brandpay-success-state, .brandpay-failed-state {
        display: none;
        text-align: center;
        padding: 20px 0;
      }
      .brandpay-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #21262d;
        border-top-color: #58a6ff;
        border-radius: 50%;
        animation: brandpay-spin 0.8s linear infinite;
        margin: 0 auto 16px auto;
      }
      .brandpay-icon-success {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(35, 134, 54, 0.15);
        color: #56d364;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto 16px auto;
        border: 2px solid rgba(35, 134, 54, 0.4);
      }
      .brandpay-icon-failed {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(218, 54, 51, 0.15);
        color: #ff7b72;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto 16px auto;
        border: 2px solid rgba(218, 54, 51, 0.4);
      }
      @keyframes brandpay-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  };

  class BrandPayCheckout {
    constructor() {
      this.checkoutUrl = window.location.origin; // default fallback
      injectStyles();
    }

    init({ checkoutUrl }) {
      this.checkoutUrl = checkoutUrl.replace(/\/$/, '');
    }

    async openCheckout({ amount, currency = 'MWK', title = '', productName = '', metadata = [], customerPhone = '', preselectedProvider = '', onSuccess, onFailure, onCancel }) {
      // 1. Fetch country providers configuration
      let providers = [];
      let prefix = '265';
      try {
        const res = await fetch(`${this.checkoutUrl}/api/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getConfig', country: 'MWI' })
        });
        const configData = await res.json();
        if (configData && configData.providers) {
          providers = configData.providers;
          prefix = configData.prefix || '265';
          currency = configData.currency || currency;
        }
      } catch (err) {
        console.error('BrandPay SDK failed to load payment providers config:', err);
      }

      if (providers.length === 0) {
        // Fallbacks if backend doesn't return list (e.g. key missing)
        providers = [
          { provider: 'AIRTEL_MWI', displayName: 'Airtel Money' },
          { provider: 'TNM_MWI', displayName: 'TNM Mpamba' }
        ];
      }

      // 2. Build Overlay and Modal Elements
      const overlay = document.createElement('div');
      overlay.className = 'brandpay-overlay';
      
      const modal = document.createElement('div');
      modal.className = 'brandpay-modal';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'brandpay-close';
      closeBtn.innerHTML = '&times;';
      
      // Main Form Container
      const formContainer = document.createElement('div');
      formContainer.className = 'brandpay-form-container';

      // Title & Subtitle
      const titleEl = document.createElement('h3');
      titleEl.className = 'brandpay-title';
      titleEl.textContent = 'Pay with Mobile Money';
      
      const subtitle = document.createElement('p');
      subtitle.className = 'brandpay-subtitle';
      subtitle.textContent = 'Choose your operator and enter phone number.';

      // Price Summary
      const summary = document.createElement('div');
      summary.className = 'brandpay-summary';
      const sumLabel = document.createElement('span');
      sumLabel.className = 'brandpay-summary-label';
      sumLabel.textContent = title || productName || 'Total Amount';

      const sumValWrapper = document.createElement('div');
      sumValWrapper.style.display = 'flex';
      sumValWrapper.style.alignItems = 'center';
      sumValWrapper.style.gap = '4px';

      const amountInput = document.createElement('input');
      amountInput.type = 'number';
      amountInput.className = 'brandpay-summary-amount-input';
      amountInput.value = amount;
      amountInput.style.width = '100px';
      amountInput.style.textAlign = 'right';
      amountInput.style.background = 'transparent';
      amountInput.style.border = 'none';
      amountInput.style.borderBottom = '1px dashed rgba(86, 211, 100, 0.4)';
      amountInput.style.fontSize = '18px';
      amountInput.style.fontWeight = '800';
      amountInput.style.color = '#56d364';
      amountInput.style.outline = 'none';
      amountInput.style.padding = '0 2px';
      amountInput.style.fontFamily = 'inherit';

      // Remove default spin buttons from input
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .brandpay-summary-amount-input::-webkit-outer-spin-button,
        .brandpay-summary-amount-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .brandpay-summary-amount-input {
          -moz-appearance: textfield;
        }
        .brandpay-summary-amount-input:focus {
          border-bottom-color: #56d364 !important;
        }
      `;
      document.head.appendChild(styleEl);

      const adjustWidth = () => {
        const valueLength = amountInput.value.length || 1;
        amountInput.style.width = `${Math.max(60, valueLength * 11)}px`;
      };
      amountInput.addEventListener('input', adjustWidth);
      adjustWidth();

      const sumCurrency = document.createElement('span');
      sumCurrency.style.fontSize = '18px';
      sumCurrency.style.fontWeight = '800';
      sumCurrency.style.color = '#56d364';
      sumCurrency.textContent = currency;

      sumValWrapper.appendChild(amountInput);
      sumValWrapper.appendChild(sumCurrency);

      summary.appendChild(sumLabel);
      summary.appendChild(sumValWrapper);
 

      // Error banner
      const errBanner = document.createElement('div');
      errBanner.className = 'brandpay-error';

      // Operator selection
      const providerLabel = document.createElement('label');
      providerLabel.className = 'brandpay-label';
      providerLabel.textContent = 'Select Operator';
      
      const providersContainer = document.createElement('div');
      providersContainer.className = 'brandpay-providers';

      let selectedProvider = '';
      providers.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'brandpay-provider-btn';
        btn.innerHTML = `<span>📱</span><span>${p.displayName}</span>`;
        
        // Match preselected provider
        const matchesPreselected = preselectedProvider && (
          p.provider.toLowerCase().includes(preselectedProvider.toLowerCase()) || 
          p.displayName.toLowerCase().includes(preselectedProvider.toLowerCase())
        );

        if (matchesPreselected) {
          btn.classList.add('selected');
          selectedProvider = p.provider;
        }

        // If preselected is passed, disable selecting other options
        if (preselectedProvider && !matchesPreselected) {
          btn.disabled = true;
          btn.style.opacity = '0.35';
          btn.style.cursor = 'not-allowed';
        }

        btn.addEventListener('click', () => {
          if (preselectedProvider) return; // Prevent changing if preselected
          document.querySelectorAll('.brandpay-provider-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedProvider = p.provider;
          btnPay.disabled = !selectedProvider || !phoneInput.value.trim();

          const lowerName = p.displayName.toLowerCase();
          const lowerProv = p.provider.toLowerCase();
          if (lowerName.includes('airtel') || lowerProv.includes('airtel')) {
            phoneInput.placeholder = '099XXXXXXXX';
          } else if (lowerName.includes('tnm') || lowerProv.includes('tnm')) {
            phoneInput.placeholder = '088XXXXXXXX';
          } else {
            phoneInput.placeholder = '88XXXXXXXX / 99XXXXXXXX';
          }
        });
        providersContainer.appendChild(btn);
      });

      // Phone Input
      const phoneLabel = document.createElement('label');
      phoneLabel.className = 'brandpay-label';
      phoneLabel.textContent = 'Mobile Money Phone Number';
      
      const phoneWrapper = document.createElement('div');
      phoneWrapper.className = 'brandpay-phone-wrapper';
      const prefixEl = document.createElement('div');
      prefixEl.className = 'brandpay-phone-prefix';
      prefixEl.textContent = `+${prefix}`;
      const phoneInput = document.createElement('input');
      phoneInput.type = 'tel';
      phoneInput.className = 'brandpay-phone-input';
      phoneInput.placeholder = '88XXXXXXXX / 99XXXXXXXX';
      phoneInput.value = customerPhone.replace(new RegExp(`^\\+?${prefix}`), ''); // Strip prefix if prefilled

      // Set correct placeholder based on selected operator initially
      if (selectedProvider) {
        const lowerProv = selectedProvider.toLowerCase();
        if (lowerProv.includes('airtel')) {
          phoneInput.placeholder = '099XXXXXXXX';
        } else if (lowerProv.includes('tnm')) {
          phoneInput.placeholder = '088XXXXXXXX';
        }
      }

      phoneInput.addEventListener('input', () => {
        btnPay.disabled = !selectedProvider || !phoneInput.value.trim();
      });

      phoneWrapper.appendChild(prefixEl);
      phoneWrapper.appendChild(phoneInput);

      // Submit Button and Back Button Footer
      const footerButtons = document.createElement('div');
      footerButtons.style.display = 'flex';
      footerButtons.style.gap = '8px';
      footerButtons.style.marginTop = '16px';

      const btnBack = document.createElement('button');
      btnBack.type = 'button';
      btnBack.className = 'brandpay-btn-pay';
      btnBack.style.background = '#21262d';
      btnBack.style.border = '1px solid #30363d';
      btnBack.style.color = '#e6edf3';
      btnBack.style.flex = '1';
      btnBack.textContent = 'Back';
      
      btnBack.addEventListener('click', () => {
        dismiss();
        if (onCancel) onCancel();
      });

      const btnPay = document.createElement('button');
      btnPay.className = 'brandpay-btn-pay';
      btnPay.textContent = 'Pay Now';
      btnPay.style.flex = '2';
      btnPay.disabled = !selectedProvider || !phoneInput.value.trim();

      footerButtons.appendChild(btnBack);
      footerButtons.appendChild(btnPay);

      // Append form fields
      formContainer.appendChild(titleEl);
      formContainer.appendChild(subtitle);
      formContainer.appendChild(errBanner);
      formContainer.appendChild(summary);
      formContainer.appendChild(providerLabel);
      formContainer.appendChild(providersContainer);
      formContainer.appendChild(phoneLabel);
      formContainer.appendChild(phoneWrapper);
      formContainer.appendChild(footerButtons);

      // --- Progress, Success, Failed States ---
      const loadingState = document.createElement('div');
      loadingState.className = 'brandpay-loading-state';
      loadingState.innerHTML = `
        <div class="brandpay-spinner"></div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">Initiating Payment</h3>
        <p style="color: #8b949e; font-size: 13px; margin: 0;">Check your mobile phone for the PIN prompt...</p>
      `;

      const successState = document.createElement('div');
      successState.className = 'brandpay-success-state';
      successState.innerHTML = `
        <div class="brandpay-icon-success">✓</div>
        <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #56d364;">Payment Completed</h3>
        <p style="color: #8b949e; font-size: 13px; margin: 0 0 20px 0;">Your transaction has been processed successfully.</p>
        <div style="display: flex; gap: 8px;">
          <button class="brandpay-btn-pay brandpay-btn-receipt" style="flex: 1; background: #238636; color: #ffffff;">View Receipt</button>
          <button class="brandpay-btn-pay brandpay-btn-close" style="flex: 1; background: #21262d; border: 1px solid #30363d; color: #e6edf3;">Close</button>
        </div>
      `;

      const failedState = document.createElement('div');
      failedState.className = 'brandpay-failed-state';
      failedState.innerHTML = `
        <div class="brandpay-icon-failed">&times;</div>
        <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #ff7b72;">Payment Failed</h3>
        <p class="brandpay-failed-msg" style="color: #8b949e; font-size: 13px; margin: 0 0 20px 0;">The transaction was rejected or timed out.</p>
        <button class="brandpay-btn-pay" style="background: #21262d; border: 1px solid #30363d; color: #e6edf3;">Close</button>
      `;

      const receiptState = document.createElement('div');
      receiptState.className = 'brandpay-receipt-state';
      receiptState.style.display = 'none';
      receiptState.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #30363d; padding-bottom: 15px;">
          <h4 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #58a6ff;">Malawi Water Board</h4>
          <h3 style="margin: 5px 0 0 0; font-size: 16px; font-weight: 800; text-transform: uppercase; color: #ffffff;">Payment Receipt</h3>
          <span style="font-size: 9px; font-family: monospace; color: #8b949e;" class="receipt-no">MWB-TX-29837498</span>
        </div>
        
        <div style="margin-bottom: 25px; text-align: left;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
            <span style="color: #8b949e;">Utility Service</span>
            <span style="font-weight: 600; color: #ffffff;" class="receipt-product">Water Bill Settlement</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
            <span style="color: #8b949e;">Account/Phone</span>
            <span style="font-weight: 600; color: #ffffff; font-family: monospace;" class="receipt-phone">+265 991972336</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
            <span style="color: #8b949e;">Operator</span>
            <span style="font-weight: 600; color: #ffffff;" class="receipt-operator">Airtel Money</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
            <span style="color: #8b949e;">Date & Time</span>
            <span style="font-weight: 600; color: #ffffff;" class="receipt-date">23 May 2026, 16:45</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
            <span style="color: #8b949e;">Status</span>
            <span style="font-weight: 700; color: #56d364; text-transform: uppercase;">Paid ✓</span>
          </div>
        </div>
        
        <div style="background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; text-align: left;">
          <span style="color: #8b949e; font-size: 11px; font-weight: 600; text-transform: uppercase;">Amount Paid</span>
          <span style="font-size: 20px; font-weight: 900; color: #56d364;" class="receipt-amount">MK 5,000</span>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button class="brandpay-btn-pay receipt-print-btn" style="flex: 1; background: #21262d; border: 1px solid #30363d; color: #e6edf3;">Print</button>
          <button class="brandpay-btn-pay receipt-close-btn" style="flex: 1; background: #238636;">Done</button>
        </div>
      `;

      const receiptProduct = receiptState.querySelector('.receipt-product');
      const receiptPhone = receiptState.querySelector('.receipt-phone');
      const receiptOperator = receiptState.querySelector('.receipt-operator');
      const receiptDate = receiptState.querySelector('.receipt-date');
      const receiptAmount = receiptState.querySelector('.receipt-amount');
      const receiptNo = receiptState.querySelector('.receipt-no');

      modal.appendChild(closeBtn);
      modal.appendChild(formContainer);
      modal.appendChild(loadingState);
      modal.appendChild(successState);
      modal.appendChild(failedState);
      modal.appendChild(receiptState);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Animation trigger
      setTimeout(() => overlay.classList.add('active'), 10);

      // Close handlers
      const dismiss = () => {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
      };

      closeBtn.addEventListener('click', () => {
        dismiss();
        if (onCancel) onCancel();
      });

      successState.querySelector('.brandpay-btn-close').addEventListener('click', dismiss);
      successState.querySelector('.brandpay-btn-receipt').addEventListener('click', () => {
        successState.style.display = 'none';
        receiptState.style.display = 'block';
      });

      receiptState.querySelector('.receipt-close-btn').addEventListener('click', dismiss);
      receiptState.querySelector('.receipt-print-btn').addEventListener('click', () => {
        window.print();
      });

      failedState.querySelector('button').addEventListener('click', dismiss);

      // 3. Initiate payment click event
      btnPay.addEventListener('click', async () => {
        errBanner.style.display = 'none';
        btnPay.disabled = true;
        btnPay.textContent = 'Connecting...';

        // Switch to progress loading state immediately
        formContainer.style.display = 'none';
        loadingState.style.display = 'block';

        const activeAmount = Number(amountInput.value) || amount;

        const payload = {
          amount: activeAmount.toString(),
          currency: currency,
          country: 'MWI',
          correspondent: selectedProvider,
          customerPhone: phoneInput.value.trim(),
          statementDescription: (metadata && metadata.statementDescription) || 'BrandPay SDK Checkout',
          metadata: metadata.fields || []
        };

        try {
          const res = await fetch(`${this.checkoutUrl}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            // Keep in loading state and poll for payment completion
            const depositId = data.depositId;
            let pollAttempts = 0;
            let simTimeout = null;

            // Trigger Sandbox simulated success after 5 seconds
            simTimeout = setTimeout(async () => {
              try {
                await fetch(`${this.checkoutUrl}/api/pawapay/status/${depositId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'simulate_success' })
                });
              } catch (e) {}
            }, 5000);

            const poller = setInterval(async () => {
              pollAttempts++;
              try {
                const statusRes = await fetch(`${this.checkoutUrl}/api/pawapay/status/${depositId}`);
                const statusData = await statusRes.json();
                
                if (statusData.status === 'COMPLETED' || statusData.status === 'SUCCESSFUL') {
                  clearInterval(poller);
                  clearTimeout(simTimeout);

                  // Update receipt details dynamically
                  const actualAmount = Number(amountInput.value) || amount;
                  if (receiptAmount) receiptAmount.textContent = `MK ${actualAmount.toLocaleString()}`;
                  if (receiptPhone) receiptPhone.textContent = `+${prefix} ${phoneInput.value.trim()}`;
                  if (receiptProduct) receiptProduct.textContent = title || productName || 'Wallet Deposit';
                  if (receiptOperator) receiptOperator.textContent = selectedProvider.includes('AIRTEL') ? 'Airtel Money' : 'TNM Mpamba';
                  if (receiptDate) receiptDate.textContent = new Date().toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });
                  if (receiptNo) receiptNo.textContent = `MWB-TX-${Math.random().toString(36).toUpperCase().slice(-8)}`;

                  loadingState.style.display = 'none';
                  successState.style.display = 'block';
                  if (onSuccess) onSuccess({
                    ...(statusData.deposit || statusData || {}),
                    amount: actualAmount
                  });
                } else if (statusData.status === 'FAILED') {
                  clearInterval(poller);
                  clearTimeout(simTimeout);
                  loadingState.style.display = 'none';
                  failedState.querySelector('.brandpay-failed-msg').textContent = 'The transaction was rejected or timed out.';
                  failedState.style.display = 'block';
                  if (onFailure) onFailure(statusData.error || 'Payment failed');
                }
              } catch (e) {
                // Ignore network errors during poll
              }

              // Timeout after 3 minutes (60 poll cycles of 3s)
              if (pollAttempts > 60) {
                clearInterval(poller);
                clearTimeout(simTimeout);
                loadingState.style.display = 'none';
                failedState.querySelector('.brandpay-failed-msg').textContent = 'Transaction verification timed out.';
                failedState.style.display = 'block';
                if (onFailure) onFailure('Transaction verification timed out');
              }
            }, 3000);

          } else {
            // Revert state back to the input form
            loadingState.style.display = 'none';
            formContainer.style.display = 'block';
            errBanner.textContent = data.error || 'Payment initiation failed';
            errBanner.style.display = 'block';
            btnPay.disabled = false;
            btnPay.textContent = 'Pay Now';
          }
        } catch (err) {
          // Revert state back to the input form
          loadingState.style.display = 'none';
          formContainer.style.display = 'block';
          errBanner.textContent = err.message || 'Connection error. Please try again.';
          errBanner.style.display = 'block';
          btnPay.disabled = false;
          btnPay.textContent = 'Pay Now';
        }
      });
    }
  }

  // Assign to global namespace
  window.BrandPay = new BrandPayCheckout();
})();
