const axios = require('axios');

// Helper to extract client IP from Vercel headers
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0];
  return req.connection.remoteAddress || '127.0.0.1';
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS for local development and cross-origin consumers.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const clientIp = getClientIp(req);

  try {
    // Fetch geolocation from ip-api.com (free, no key)
    const response = await axios.get(
      `http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
    );
    const data = response.data;

    if (data.status === 'fail') {
      throw new Error(data.message || 'IP lookup failed');
    }

    const details = {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      postal: data.zip,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
    };

    // Send to Telegram if tokens are provided. Notification failure must not
    // make an otherwise successful IP lookup fail for the visitor.
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const message = 
`🔹 IP LookUp Report 🔹
─────────────────
IP Address  : ${details.ip}
Country     : ${details.country} (${details.countryCode})
Region      : ${details.region}
City        : ${details.city}
Postal Code : ${details.postal}
Coordinates : ${details.latitude}, ${details.longitude}
Timezone    : ${details.timezone}
ISP         : ${details.isp}
Organization: ${details.org}
AS Number   : ${details.as}
─────────────────
Generated at: ${new Date().toLocaleString()}`;

      try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: chatId,
          text: message,
        }, { timeout: 8000 });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError.message);
      }
    }

    res.status(200).json(details);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Unable to fetch IP details. Please try again later.' });
  }
};
