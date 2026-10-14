/**
 * Shared Playwright Mock Helper with Credentialed CORS Support
 */
const mockApiResponse = async (page, urlPattern, responseData, status = 200) => {
  await page.route(urlPattern, async (route) => {
    const req = route.request();
    const origin = req.headers()['origin'] || 'http://127.0.0.1:5173';

    if (req.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || '*',
        },
      });
      return;
    }

    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify(responseData),
    });
  });
};

module.exports = { mockApiResponse };
