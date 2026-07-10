const axios = require("axios");

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * Reverse geocode: coordinates -> human-readable address.
 * This is the ONLY Google Maps usage in the app - no map rendering,
 * just the Geocoding API endpoint.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} formatted address, or "" if lookup fails
 */
const reverseGeocode = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set - skipping reverse geocode");
    return "";
  }

  try {
    const response = await axios.get(GEOCODE_URL, {
      params: {
        latlng: `${lat},${lng}`,
        key: apiKey,
      },
      timeout: 5000,
    });

    const { data } = response;

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    console.warn(`Geocoding API returned status: ${data.status}`);
    return "";
  } catch (error) {
    console.error(`Reverse geocoding failed: ${error.message}`);
    return ""; // Never let a geocoding failure break the actual safety feature
  }
};

/**
 * Forward geocode: address -> coordinates.
 * Useful if a user types their address instead of sharing GPS location.
 * @param {string} address
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
const forwardGeocode = async (address) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set - skipping forward geocode");
    return null;
  }

  try {
    const response = await axios.get(GEOCODE_URL, {
      params: { address, key: apiKey },
      timeout: 5000,
    });

    const { data } = response;
    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error(`Forward geocoding failed: ${error.message}`);
    return null;
  }
};

module.exports = { reverseGeocode, forwardGeocode };
