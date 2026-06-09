
This pack gives you a scalable system for REAL FPV component images.

What it does:
- components.json stores all FPV parts
- each part has imageUrl + officialUrl
- image-fetcher.js automatically downloads product images
  from official product pages

How to use:

1. Put components.json in your project root
2. Put image-fetcher.js in your project root
3. Create folder:
   assets/products

4. Install:
npm install axios cheerio sharp fs-extra

5. Run:
node image-fetcher.js

The script will:
- open official product pages
- find product image automatically
- download image
- save locally into assets/products

This is the scalable production approach.
