Upload/replace this file in GitHub root:
- server.js

Then:
1. Commit changes.
2. Render will redeploy automatically.
3. If not: Render → Manual Deploy → Deploy latest commit.

What changed:
- Official links now point to specific product pages when possible, not just manufacturer homepages.
- Component schema still supports imageUrl for each part.
- For copyright/reliability reasons, images are kept as stable placeholders until we upload local allowed product images.
- Best next step: create /assets/products/ and upload product images manually, then set imageUrl to local paths.
