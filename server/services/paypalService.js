const https = require('https');

const getPaypalBaseUrl = () => {
  const environment = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
  return environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

const request = (method, path, { headers = {}, body } = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      getPaypalBaseUrl() + path,
      {
        method,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
        }
      },
      (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          let parsedBody = responseBody;

          try {
            parsedBody = responseBody ? JSON.parse(responseBody) : {};
          } catch (error) {
            parsedBody = responseBody;
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedBody);
            return;
          }

          const message = parsedBody?.message || parsedBody?.error_description || 'PayPal request failed';
          const error = new Error(message);
          error.statusCode = res.statusCode;
          error.details = parsedBody;
          reject(error);
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

const getAccessToken = async () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();

  const response = await request('POST', '/v1/oauth2/token', {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body
  });

  return response.access_token;
};

const createOrder = async ({ amount, currency, referenceId, description, mentorPayPalInfo, platformFeeAmount }) => {
  const accessToken = await getAccessToken();
  const value = Number(amount).toFixed(2);

  let purchase_units = [
    {
      reference_id: referenceId,
      description,
      amount: {
        currency_code: currency,
        value
      }
    }
  ];

  if (mentorPayPalInfo && mentorPayPalInfo.merchantId && platformFeeAmount !== undefined) {
    purchase_units = [
      {
        reference_id: referenceId,
        description,
        amount: {
          currency_code: currency,
          value
        },
        payee: {
          merchant_id: mentorPayPalInfo.merchantId
        },
        payment_instruction: {
          disbursement_mode: "INSTANT",
          platform_fees: [
            {
              amount: {
                currency_code: currency,
                value: Number(platformFeeAmount).toFixed(2)
              }
            }
          ]
        }
      }
    ];
  }

  const body = JSON.stringify({
    intent: 'CAPTURE',
    purchase_units,
    application_context: {
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING'
    }
  });

  const response = await request('POST', '/v2/checkout/orders', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body
  });

  const approvalLink = Array.isArray(response.links)
    ? response.links.find((link) => link.rel === 'approve')?.href || null
    : null;

  return {
    orderId: response.id,
    status: response.status,
    approvalLink,
    raw: response
  };
};

const captureOrder = async (orderId) => {
  const accessToken = await getAccessToken();

  const response = await request('POST', `/v2/checkout/orders/${orderId}/capture`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  const capture = response?.purchase_units?.[0]?.payments?.captures?.[0] || null;

  return {
    orderId: response.id,
    status: response.status,
    payer: response.payer || null,
    capture,
    raw: response
  };
};

const getPayPalOnboardingUrl = async (trackingId, redirectUri) => {
  const accessToken = await getAccessToken();

  const body = JSON.stringify({
      tracking_id: trackingId,
      operations: [
        {
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: {
              integration_method: 'PAYPAL',
              integration_type: 'THIRD_PARTY',
              third_party_details: {
                features: ['PAYMENT', 'REFUND']
              }
            }
          }
        }
      ],
      products: ['PPCP'],
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true
        }
      ],
      partner_config_override: {
        return_url: redirectUri
      }
    })

console.log(
  JSON.stringify(body, null, 2)
);

  const response = await request('POST', '/v2/customer/partner-referrals', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body
  });

  const actionUrl = response.links?.find((link) => link.rel === 'action_url')?.href || null;
  return actionUrl;
};

// const getMerchantIntegrationStatus = async ({ merchantIdInPayPal, trackingId } = {}) => {
//   const accessToken = await getAccessToken();
//   const partnerId = process.env.PAYPAL_PARTNER_ID;

//   if (!partnerId) {
//     throw new Error('PAYPAL_PARTNER_ID is not configured');
//   }

//   try {
//     let url = `/v1/customer/partners/${partnerId}/merchant-integrations`;
//     if (merchantIdInPayPal) {
//       url += `/${merchantIdInPayPal}`;
//     } else if (trackingId) {
//       url += `?tracking_id=${trackingId}`;
//     } else {
//       throw new Error('Must provide either merchantIdInPayPal or trackingId');
//     }

//     const response = await request('GET', url, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         'Content-Type': 'application/json',
//         Accept: 'application/json'
//       }
//     });

//     console.log(
//   'RAW PAYPAL MERCHANT RESPONSE:',
//   JSON.stringify(response, null, 2)
// );

//     if (trackingId) {
//       return {
//         merchantId: response.merchant_id,
//         active: response.payments_receivable && response.primary_email_confirmed,
//         paymentsGranted: response.payments_receivable || false,
//         emailConfirmed: response.primary_email_confirmed || false
//       };
//     } else {
//       return {
//         merchantId: merchantIdInPayPal,
//         active: response.signup_status === 'ACTIVE' && response.primary_email_confirmed,
//         paymentsGranted: response.permissions?.some(p => p.name === 'EXPRESS_CHECKOUT' || p.name === 'DIRECT_PAYMENT') || false,
//         emailConfirmed: response.primary_email_confirmed || false
//       };
//     }
//   } catch (error) {
//     console.error('Error fetching merchant integration status:', error);
//     return null;
//   }
// };


const getMerchantIntegrationStatus = async ({
  merchantIdInPayPal,
  trackingId
} = {}) => {
  const accessToken = await getAccessToken();
  const partnerId = process.env.PAYPAL_PARTNER_ID;

  if (!partnerId) {
    throw new Error('PAYPAL_PARTNER_ID is not configured');
  }

  try {
    /*
    ==================================================
    STEP 1
    If only trackingId is provided,
    first resolve it to merchant_id.
    ==================================================
    */
    if (trackingId && !merchantIdInPayPal) {
      const lookupResponse = await request(
        'GET',
        `/v1/customer/partners/${partnerId}/merchant-integrations?tracking_id=${trackingId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      );

      console.log(
        'PAYPAL TRACKING LOOKUP:',
        JSON.stringify(lookupResponse, null, 2)
      );

      if (!lookupResponse?.merchant_id) {
        return null;
      }

      /*
      Recursively fetch FULL merchant details
      */
      return await getMerchantIntegrationStatus({
        merchantIdInPayPal: lookupResponse.merchant_id
      });
    }

    /*
    ==================================================
    STEP 2
    Fetch FULL merchant integration details
    ==================================================
    */
    if (!merchantIdInPayPal) {
      throw new Error(
        'Must provide merchantIdInPayPal or trackingId'
      );
    }

    const response = await request(
      'GET',
      `/v1/customer/partners/${partnerId}/merchant-integrations/${merchantIdInPayPal}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );

    console.log(
      'PAYPAL MERCHANT DETAILS:',
      JSON.stringify(response, null, 2)
    );

    /*
    ==================================================
    STEP 3
    Determine if onboarding is active
    ==================================================
    */

    const paymentsReceivable =
      response?.payments_receivable === true;

    const emailConfirmed =
      response?.primary_email_confirmed === true;

    const hasActiveCapability =
      response?.capabilities?.some(
        capability => capability.status === 'ACTIVE'
      ) ?? false;

    const hasSubscribedProduct =
      response?.products?.some(
        product =>
          product.vetting_status === 'SUBSCRIBED' ||
          product.status === 'ACTIVE'
      ) ?? false;

    const active =
      paymentsReceivable &&
      emailConfirmed &&
      (hasActiveCapability || hasSubscribedProduct);

    return {
      merchantId: response.merchant_id,
      active,
      paymentsGranted: paymentsReceivable,
      emailConfirmed,
      capabilities: response.capabilities || [],
      products: response.products || [],
      raw: response
    };
  } catch (error) {
    console.error(
      'Error fetching merchant integration status:',
      error.response?.data || error
    );

    return null;
  }
};


const verifyWebhookSignature = async (headers, body, webhookId) => {
  const accessToken = await getAccessToken();
  const verifyBody = JSON.stringify({
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: body
  });

  const response = await request('POST', '/v1/notifications/verify-webhook-signature', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: verifyBody
  });

  return response.verification_status === 'SUCCESS';
};

module.exports = {
  getPaypalBaseUrl,
  getAccessToken,
  createOrder,
  captureOrder,
  getPayPalOnboardingUrl,
  getMerchantIntegrationStatus,
  verifyWebhookSignature
};