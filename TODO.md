# Mavi Linking — Master Upgrade Prompt (Antigravity)

## Phase 1 (Approved)
1. Implement public profile aggregation + route: `GET /api/public/u/:username` (and optionally `GET /u/:username` frontend routing).
2. Extend existing public portfolio controller to support username lookup + include richer profile fields (bio/skills/badges/AI insights if available).
3. Add QR system:
   - Install/use `qrcode` in backend
   - Create utility + caching
   - Add route `GET /api/public/qr/:username` returning QR image (data URL) and `GET` download endpoint.
4. Add SEO/OpenGraph metadata support:
   - Endpoint `GET /api/public/meta/:username` returning title/description/image.
5. Frontend UI:
   - Add page/component for `/u/:username` identity view using existing visual style (glass cards).
   - Add QR modal with download/share.
   - Add SEO/OpenGraph via meta fetch (client-side) and/or Next/Vite static integration as best fit.

### Progress
- [x] Step 1
- [x] Step 2
- [x] Step 3
- [x] Step 4
- [x] Step 5


## Next (Not started yet)
6. Upgrade AI insight pipeline (repository categorization, architecture quality, maturity scoring).
7. Upgrade Developer DNA evolution timeline.
8. Upgrade ranking (historical + filters).
9. Extend growth tracking with prediction cards.
10. Recruiter dashboard APIs + UI.
11. College/professor mode.
12. Compatibility engine.
13. GitHub verification.
14. Resume/report upgrades.
15. UI/UX premium polish + reusable hooks.

