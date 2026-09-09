document.addEventListener('DOMContentLoaded', () => {
  const ipDisplay = document.getElementById('ipDisplay');
  const errorMsg = document.getElementById('errorMessage');
  const refreshBtn = document.getElementById('refreshBtn');
  const mapLink = document.getElementById('mapLink');

  // Elements for details
  const fields = {
    country: document.getElementById('country'),
    region: document.getElementById('region'),
    city: document.getElementById('city'),
    postal: document.getElementById('postal'),
    coordinates: document.getElementById('coordinates'),
    timezone: document.getElementById('timezone'),
    isp: document.getElementById('isp'),
    org: document.getElementById('org'),
    as: document.getElementById('as'),
  };

  // Fetch IP data from our API
  async function fetchIPData() {
    try {
      ipDisplay.textContent = 'Loading...';
      errorMsg.textContent = '';

      const response = await fetch('/api/ip');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch IP details');
      }

      const data = await response.json();

      // Populate IP
      ipDisplay.textContent = data.ip;

      // Populate details
      fields.country.textContent = `${data.country} (${data.countryCode})`;
      fields.region.textContent = data.region || '-';
      fields.city.textContent = data.city || '-';
      fields.postal.textContent = data.postal || '-';
      fields.coordinates.textContent = `${data.latitude}, ${data.longitude}`;
      fields.timezone.textContent = data.timezone || '-';
      fields.isp.textContent = data.isp || '-';
      fields.org.textContent = data.org || '-';
      fields.as.textContent = data.as || '-';

      // Update map link
      if (data.latitude && data.longitude) {
        mapLink.href = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
        mapLink.style.display = 'inline-block';
      } else {
        mapLink.style.display = 'none';
      }
    } catch (error) {
      ipDisplay.textContent = 'Error';
      errorMsg.textContent = error.message || 'Something went wrong. Please refresh.';
      console.error(error);
    }
  }

  // Refresh on button click
  refreshBtn.addEventListener('click', fetchIPData);

  // Initial fetch
  fetchIPData();
});
