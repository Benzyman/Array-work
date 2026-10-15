# Stage 1 — Plan: approach, design, architecture

## 1. Recommended approach (confirmed)

**WordPress + WooCommerce on GoDaddy, with a custom VERRY RARRE theme.**

- **Why WordPress + WooCommerce:** both are free and open source, and you own all the code and data. You add products from a dashboard without coding, and it runs on ordinary GoDaddy hosting. WooCommerce already handles sizes/colours (*variations*), stock, carts, checkout, orders and emails.
- **Why a custom theme instead of a ready-made one:** a template looks like a template. This theme is written from scratch for VERRY RARRE. It's lightweight (no page builder) and fully editable in VS Code.
- **Payments:** the official **Paystack for WooCommerce** plugin (Stage 5). Paystack takes cards, bank transfer and USSD in Naira. Your secret keys go in the plugin settings in the dashboard, **never in the theme code**.

### GoDaddy hosting: what to choose
| Option | Verdict |
|---|---|
| **Managed WordPress — eCommerce plan** (name varies; it's the WordPress plan that says "WooCommerce") | ✅ **Recommended.** WordPress pre-installed, automatic backups, SSL (HTTPS) included, WooCommerce-ready. |
| cPanel "Web Hosting" (Economy/Deluxe) | ⚠️ Works, but you handle more setup, backups and SSL yourself. |
| GoDaddy **Website Builder / Online Store** | ❌ Not WordPress. You can't upload this theme or edit the code. |

Before paying, check the plan lets you **upload themes and plugins** (the Managed WordPress *Basic* tier on some accounts restricts plugins).

**Terms:**
- **Hosting:** a computer that keeps your site online 24/7.
- **Domain:** your address, e.g. `verryrarre.com`.
- **SSL/HTTPS:** the padlock; it encrypts checkout data.
- **Plugin:** an add-on for WordPress.
- **Theme:** the design layer.

## 2. Design direction

**"Armour for the everyday."** Built from the graphics already on your pieces: the plate-carrier tee, the gothic VRRE wordmark and the LIVE THE TRUTH hoodie.

| Element | Choice | Why |
|---|---|---|
| Palette | Black `#0a0a0a`, white, bone `#f2f1ed`, photo grey `#f6f6f6` | Clean but hard. Lets the prints do the talking |
| Accent (one only) | Periwinkle `#7e9ce5`, sampled from the hoodie print | Used for sale tags, active filters and hover states. Changeable in the Customizer |
| Headlines | **Archivo**, extra-wide, weight 900, uppercase | Loud, poster-like hierarchy |
| Labels/prices meta | **Space Mono** | Utilitarian "spec sheet" feel, matches the tactical vest |
| Logo | Gothic **VRRE** wordmark, taken from your tee artwork | Temporary until you send the official logo file |
| Motion | Scrolling ticker, image swap on hover, gentle fade-ups | Subtle. Switched off for people who set "reduce motion" |
| Layout | Mobile-first; 2 products per row on phones, 3 on tablets, 4 on desktop | Most Nigerian shoppers will be on phones |

REBEL8 was used only as a reference for *how* a graphic streetwear store presents product. No logo, artwork, layout or text was copied.

## 3. Architecture

```
Customer's phone ──► GoDaddy (HTTPS) ──► WordPress
                                          ├── Verry Rarre theme   (look & layout — this repo)
                                          ├── WooCommerce         (products, stock, cart, orders)
                                          ├── Paystack plugin     (payments)
                                          └── Database            (products, orders, customers)
```

Rules that keep it maintainable:
1. **Look vs. data are separate.** The theme never stores products or prices.
2. **No WooCommerce template copies.** All shop changes use hooks in `inc/woocommerce.php`, so WooCommerce updates don't break the design.
3. **No secrets in code.** API keys live in plugin settings only.
4. **Everything day-to-day is in the dashboard.** Banners, hero, contact details, menus and products need no code.

## 4. Roadmap

| Stage | Deliverable | Status |
|---|---|---|
| 1 | Plan, design, folders | ✅ This document |
| 2 | Homepage + navigation | ✅ Built (hero, new arrivals, collections, lookbook, best sellers, story, newsletter, footer, mobile menu, WhatsApp) |
| 3 | Shop, collections, product layouts | ✅ First version built (grid, filters, sorting, sold-out labels, size/colour buttons, size guide, related products) |
| 4 | WooCommerce setup + your products | ⏳ Needs your prices, sizes and stock (see `catalogue/catalogue.md`) |
| 5 | Cart, checkout, Paystack, delivery fees | ⏳ Needs a Paystack account + your delivery zones/prices |
| 6 | Testing + GoDaddy launch + backups | ⏳ |

## 5. What was tested

Testing was done on a local WordPress 6.5 copy (PHP 8.3):
- Every PHP file passes a syntax check.
- The homepage, standard pages, Contact, Collections, search and 404 render with no PHP warnings.
- Newsletter signup saves emails, rejects invalid addresses, ignores duplicates and blocks the spam honeypot.
- The Customizer registers all 74 settings without errors.
- The mobile menu, search, filters and size-guide pop-up work with no JavaScript errors.
- Phone (390px), tablet (768px) and desktop (1440px) widths have no sideways scrolling.

**Not yet tested:** WooCommerce itself couldn't be downloaded in the build environment, so the shop, product, cart and checkout screens are proven only in `preview/index.html` (built with the same CSS and WooCommerce's HTML structure). They get a full live test once WooCommerce is installed (Stage 4).
