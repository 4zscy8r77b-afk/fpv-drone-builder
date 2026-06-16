# Deployment checklist

## Render

1. Push this project to GitHub.
2. Create or reconnect the Render Web Service.
3. Render should detect `render.yaml`.
4. Set `SITE_URL` to the final HTTPS origin.
5. Set `ALLOWED_ORIGINS` to the same origin. Add additional origins separated by commas only when required.
6. Deploy and verify `/api/health`, `/sitemap.xml`, `/privacy.html` and `/support.html`.

## Domain

Point `buildyourownfpv.com` to the Render service using Render's current custom-domain instructions. Enable HTTPS before registering the service worker publicly.

## Production data warning

The current JSON build store is suitable for a prototype, not durable production storage. A Render restart or redeploy can remove filesystem data depending on the service configuration. Move builds to PostgreSQL before inviting users to depend on saved data.

## Minimum launch checks

- `npm ci`
- `npm run check`
- Test Auto build for every mission.
- Test mobile widths at 390px and 430px.
- Verify WebGL fallback behavior on iOS Safari.
- Replace or approve every external product image.
- Configure the support mailbox.
