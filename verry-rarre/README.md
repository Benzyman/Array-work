# VERRY RARRE — online store

The source code for the VERRY RARRE streetwear store: a custom WordPress theme built for WooCommerce, prices in Nigerian Naira (₦), Paystack-ready, hosted on GoDaddy.

> **See the design now:** open `preview/index.html` in any browser. It's a clickable preview (Home → Shop → Product) that uses your real photos. Prices, sizes and stock in it are placeholders.

---

## How the pieces fit together (plain English)

| Piece | What it is | Who changes it |
|---|---|---|
| **WordPress** | The website engine, installed on GoDaddy. Holds your pages and settings. | Updated from the dashboard |
| **WooCommerce** | A free WordPress plugin (add-on) that adds products, cart, checkout and orders. | You, from the dashboard: **Products > Add New** |
| **Paystack plugin** | Official add-on that takes Naira card/bank/USSD payments. | Configured in the dashboard (Stage 5) |
| **Verry Rarre theme** (this folder) | Controls how everything **looks**. | You or a developer, in VS Code |

The theme only handles appearance. Products, prices, stock and orders live in WooCommerce, so redesigning the site never touches your store data.

---

## Folder map

```
verry-rarre/
├── README.md                 ← you are here
├── docs/
│   └── 01-plan.md            ← Stage 1: approach, design, hosting, roadmap
├── catalogue/
│   ├── catalogue.md          ← product list + the info still needed from you
│   ├── images/               ← product photos, squared & web-optimised for upload
│   └── originals/            ← your untouched original photos
├── preview/
│   └── index.html            ← clickable design preview (open in a browser)
└── theme/
    └── verry-rarre/          ← THE WORDPRESS THEME (zip this folder to install)
        ├── style.css         ← theme name/version (WordPress reads this)
        ├── functions.php     ← loads the files in /inc
        ├── screenshot.png    ← thumbnail shown in Appearance > Themes
        ├── header.php        ← announcement bar, logo, menu, search, cart icon
        ├── footer.php        ← footer columns, socials, WhatsApp button
        ├── front-page.php    ← homepage: lists the sections in order
        ├── page.php          ← normal pages (About, policies, Cart, Checkout…)
        ├── page-collections.php ← used automatically for the page with slug "collections"
        ├── page-contact.php  ← used automatically for the page with slug "contact"
        ├── index.php / single.php / 404.php ← blog, search results, "not found"
        ├── template-parts/
        │   ├── home/         ← one file per homepage section (hero, new arrivals…)
        │   ├── collection-tiles.php
        │   └── size-guide.php ← default size-guide text
        ├── inc/
        │   ├── customizer.php    ← every setting in Appearance > Customize + defaults
        │   ├── template-tags.php ← helpers: logo, icons, WhatsApp link, fallback menus
        │   ├── setup.php         ← fonts, CSS/JS loading, menus, image sizes
        │   ├── woocommerce.php   ← shop grid, filters, product page, cart icon
        │   ├── newsletter.php    ← signup form → Dashboard > Subscribers (+ CSV export)
        │   ├── seo.php           ← Google/social preview tags (auto-off if Yoast/Rank Math installed)
        │   └── starter-setup.php ← one-click: create starter pages + Naira settings
        └── assets/
            ├── css/main.css  ← colours, fonts, header, homepage, footer
            ├── css/shop.css  ← product grid, product page, cart, checkout
            ├── js/main.js    ← menu, search, filters, size guide, scroll effects
            ├── js/product.js ← turns Size/Colour drop-downs into buttons
            └── images/       ← default logo + default homepage images
```

---

## Change things WITHOUT code (WordPress dashboard)

Go to **Appearance > Customize > Verry Rarre Theme**:

| I want to change… | Where |
|---|---|
| Announcement bar text/link | Announcement bar |
| Hero image, heading, button | Homepage: hero |
| Show/hide homepage sections, headings, how many products | Homepage sections |
| Lookbook images, brand story | Homepage: editorial & story |
| WhatsApp number, email, Instagram/TikTok/X | Contact, WhatsApp & social |
| Accent colour, footer logo, footer tagline | Brand colour & footer |
| Shipping note on product pages | Shop & product pages |
| Header logo | Site Identity > Logo |
| Menu links | Appearance > Menus (locations: Main menu, Footer: Shop, Footer: Help) |

**Size guide:** create a page with the slug `size-guide` and put your size table in it. It then appears in the product-page pop-up automatically.

**Collections:** the homepage collections and the Collections page come from **Products > Categories**. Give each category an image.

---

## Change things WITH code (VS Code)

Open the `theme/verry-rarre` folder in VS Code.

| I want to change… | File | What to edit |
|---|---|---|
| Colours | `assets/css/main.css` | The `:root { … }` block at the top: `--vr-black`, `--vr-bone`, `--vr-card`… |
| Fonts | `inc/setup.php` → `vr_fonts_url()` and `main.css` → `--vr-font` | Swap the Google Fonts link and the font name |
| Button style | `main.css` → `.vr-btn` | Padding, border, colours |
| Product cards | `shop.css` → section 2 | Grid columns, image ratio, title size |
| Product grid columns | `shop.css` → `.woocommerce ul.products` | `repeat(4, …)` = 4 per row on desktop |
| Homepage section order | `front-page.php` | Move the `get_template_part(...)` lines |
| A homepage section's layout | `template-parts/home/<section>.php` + its CSS in `main.css` section 5 |
| Header / menu layout | `header.php` + `main.css` section 4 |
| Footer | `footer.php` + `main.css` section 7 |
| Mobile layouts | Rules in `@media (min-width: …)` blocks. Styles are mobile-first: base rules are for phones, `min-width` blocks add tablet/desktop changes |
| Product page extras (size guide, WhatsApp, shipping box) | `inc/woocommerce.php` section 5 |

### Uploading your code changes
1. Change the `Version:` number in `style.css` (e.g. 1.0.0 → 1.0.1) so browsers load the new files.
2. Zip the `verry-rarre` folder.
3. WordPress: **Appearance > Themes > Add New > Upload Theme**, choose the zip, then **Replace current with uploaded**.

### Updates without losing your customisations
- **WordPress, WooCommerce and plugin updates never touch this theme.** Update them freely from **Dashboard > Updates** (after a backup).
- Never edit WooCommerce's own files. This theme changes WooCommerce only through *hooks* (official attachment points) in `inc/woocommerce.php`, with **no copied WooCommerce template files**, so WooCommerce updates won't break the design.
- Keep this folder in Git/GitHub. That's your master copy: edit here, then upload.

---

## Install on a WordPress site (summary — full GoDaddy guide comes in Stage 6)
1. Install WooCommerce: **Plugins > Add New > "WooCommerce" > Install > Activate**.
2. Zip `theme/verry-rarre`, then go to **Appearance > Themes > Add New > Upload Theme** and activate it.
3. Click **Run starter setup** in the blue notice. It creates the About, Contact and Collections pages, plus draft Shipping & Returns and Terms pages, and switches the store to ₦.
4. **Appearance > Customize > Verry Rarre Theme > Contact** — add your WhatsApp number.
5. Add products (see `catalogue/catalogue.md`).

## Requirements
WordPress 6.4+, PHP 8.0+, WooCommerce 8+. Fonts: Archivo + Space Mono (Google Fonts).
