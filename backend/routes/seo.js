const express = require('express');
const router = express.Router();

// POST /api/seo/indexnow
// Allows notifying search engines (IndexNow) when pages are updated or created
router.post('/indexnow', async (req, res, next) => {
  try {
    const { host, urlList, key } = req.body || {};
    if (!urlList || !Array.isArray(urlList) || urlList.length === 0) {
      return res.status(400).json({ error: 'urlList array is required' });
    }

    const hostName = host || req.hostname || 'wealthpulse.app';
    const apiKey = key || process.env.INDEXNOW_KEY || 'wealthpulse-indexnow-key-2026';

    const payload = {
      host: hostName,
      key: apiKey,
      keyLocation: `https://${hostName}/${apiKey}.txt`,
      urlList: urlList,
    };

    // In production, send request to IndexNow endpoint
    console.log('[SEO] IndexNow URLs submitted:', payload.urlList);

    return res.json({
      success: true,
      message: 'IndexNow URL submission received',
      submittedCount: payload.urlList.length,
      payload,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
