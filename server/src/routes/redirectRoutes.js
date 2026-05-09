const express = require('express');

const router = express.Router();

// Optional: redirect old public portfolio by userId to new identity by username if possible.
// Since current data model does not store canonical username, this is intentionally minimal.
router.get('/public/portfolio/:userId', (req, res) => {
  // Keep backward compatibility: front-end identity can still fetch /portfolio/:id.
  // No-op redirect.
  res.redirect(`/portfolio/${req.params.userId}`);
});

module.exports = router;

