# VERRY RARRE — product catalogue

| # | Product | Category | Colours | Price | Sizes |
|---|---|---|---|---|---|
| 1 | Live The Truth Zip Hoodie | Hoodies | Black | **₦40,000** | S, M, L, XL, XXL |
| 2 | Plate Carrier Tee | T-Shirts | Black | **₦25,000** | S, M, L, XL, XXL |
| 3 | Controversy Sell's Portrait Tee | T-Shirts | White | **₦25,000** | S, M, L, XL, XXL |
| 4 | Warning Tee | T-Shirts | Black | **₦25,000** | S, M, L, XL, XXL |
| 5 | VRRE Gothic Logo Tee (chest logo only) | T-Shirts | Black, White | **₦18,000** | S, M, L, XL, XXL |

All of this is already filled in `products-import.csv`, ready for WooCommerce to import.

**Still open (❓):**
- **Stock per size.** The CSV's `Stock` column is empty, so every size imports as "in stock" with no count. Put a number in a size's `Stock` cell before importing and WooCommerce will count it down with each order and show "Sold out" at 0.
- **Photo files** for the Warning Tee (front and back) and the white Logo Tee. They came through as chat images only.
- **Fabric.** "100% cotton, heat-press" comes from your current site for the Warning Tee. Is it the same for every tee? I'll add it to all the descriptions if so.

## Images
`images/` holds your photos, squared and resized for the web. The garments weren't altered. Untouched originals are in `originals/`.

| Product | Main photo | Extra views |
|---|---|---|
| Hoodie | `live-the-truth-zip-hoodie-black-front.jpg` | `…-black-back.jpg`, `…-black-front-and-back.jpg` |
| Plate Carrier Tee | `plate-carrier-tee-black-front.jpg` | — |
| Portrait Tee | `controversy-portrait-tee-white-front.jpg` | — |
| Warning Tee | ❓ file needed | ❓ back view |
| Logo Tee | `vrre-logo-tee-black-front.jpg` | ❓ white version |

The **camo VRRE** artwork isn't a product. It's used as a design graphic: behind the newsletter signup, and as the fill of the giant footer wordmark. You can swap it in **Appearance > Customize > Verry Rarre Theme > Brand colour & footer**.

---

## Import all products at once (≈10 minutes)

1. **Products > Attributes.** Create **Size** and **Colour** (do this once). It makes the shop filters work properly.
2. **Media > Add New.** Upload every photo from `catalogue/images/`. Keep the file names as they are: the import finds the photos by name.
3. **Optional:** open `products-import.csv` in Excel or Google Sheets, fill the `Stock` column on the size rows, and save it as CSV.
4. **Products > All Products > Import.** Choose `products-import.csv` and click **Continue**. Leave the column matching as it is, then click **Run the importer**.
5. Check one product. If a photo is missing, open the product and set it under **Product image** / **Product gallery** on the right.
6. Add the Warning Tee and white Logo Tee photos by hand once you have them: **Products > edit product > Product image**.

**What the CSV rows mean:**
- A `variable` row is the product itself.
- Each `variation` row is one size/colour combination with its own price and stock.
- SKUs (stock codes) follow the pattern `VR-LOGO-TEE-WHT-M` = logo tee, white, medium.

## Adding a single product later (no spreadsheet)
1. **Products > Add New.** Enter the name, then put a short summary in **Product short description**.
2. **Product data → Variable product.**
3. **Attributes tab** → add **Size** (and **Colour**) → tick **Used for variations** → **Save attributes**.
4. **Variations tab** → **Generate variations** → for each one, enter **Regular price** (₦), tick **Manage stock?** and enter the quantity.
5. Right column: tick a category, then set the **Product image** and **Product gallery** (the first gallery photo shows when shoppers hover over the product).
6. **Publish.**

**Sale price:** open the variation and fill **Sale price**. The theme then shows the old price crossed out next to a highlighted sale price, with a "Sale" tag.
