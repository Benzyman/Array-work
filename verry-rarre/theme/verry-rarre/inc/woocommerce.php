<?php
/**
 * WooCommerce: how the shop, product pages, cart and checkout look and behave.
 *
 * Only loaded when WooCommerce is active. It changes the store through
 * WooCommerce "hooks" (official attachment points) instead of copying
 * WooCommerce template files. That way WooCommerce updates keep working
 * and you rarely need to touch this file.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/* -------------------------------------------------------------------------
 * 1. Theme support + assets
 * ---------------------------------------------------------------------- */

/**
 * Declare WooCommerce support and turn on the product gallery features.
 */
function vr_wc_setup() {
	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 800,
			'single_image_width'    => 1200,
			'product_grid'          => array(
				'default_rows'    => 4,
				'min_rows'        => 1,
				'default_columns' => 4,
				'min_columns'     => 2,
				'max_columns'     => 4,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}
add_action( 'after_setup_theme', 'vr_wc_setup' );

/**
 * Shop CSS/JS. Runs after WooCommerce's own styles so ours win.
 */
function vr_wc_assets() {
	wp_enqueue_style( 'vr-shop', VR_URI . '/assets/css/shop.css', array( 'vr-main' ), VR_VERSION );

	// Keeps the header cart count up to date after "Add to cart".
	if ( wp_script_is( 'wc-cart-fragments', 'registered' ) ) {
		wp_enqueue_script( 'wc-cart-fragments' );
	}

	if ( is_product() ) {
		wp_enqueue_script( 'vr-product', VR_URI . '/assets/js/product.js', array( 'jquery' ), VR_VERSION, true );
	}
}
add_action( 'wp_enqueue_scripts', 'vr_wc_assets', 20 );

/* -------------------------------------------------------------------------
 * 2. Rearranging WooCommerce output (hooks)
 * ---------------------------------------------------------------------- */

/**
 * Swap WooCommerce's default page wrappers, sidebar and product card parts
 * for the theme's own. Runs on 'init', after WooCommerce has added its hooks.
 */
function vr_wc_template_hooks() {
	// Page wrapper + no sidebar.
	remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
	remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
	remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
	add_action( 'woocommerce_before_main_content', 'vr_wc_wrapper_open', 10 );
	add_action( 'woocommerce_after_main_content', 'vr_wc_wrapper_close', 10 );

	// Product cards: image box with badges + hover image, category label, no button.
	remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart', 10 );
	add_action( 'woocommerce_before_shop_loop_item_title', 'vr_card_media_open', 5 );
	add_action( 'woocommerce_before_shop_loop_item_title', 'vr_card_soldout_badge', 11 );
	add_action( 'woocommerce_before_shop_loop_item_title', 'vr_card_alt_image', 12 );
	add_action( 'woocommerce_before_shop_loop_item_title', 'vr_card_media_close', 20 );
	add_action( 'woocommerce_shop_loop_item_title', 'vr_card_category', 5 );

	// Shop toolbar: result count | filter button | sort, then the filter panel.
	add_action( 'woocommerce_before_shop_loop', 'vr_toolbar_open', 15 );
	add_action( 'woocommerce_before_shop_loop', 'vr_filter_toggle', 25 );
	add_action( 'woocommerce_before_shop_loop', 'vr_toolbar_close', 35 );
	add_action( 'woocommerce_before_shop_loop', 'vr_filter_panel', 40 );
	add_action( 'woocommerce_no_products_found', 'vr_no_results_clear_filters', 20 );

	// Product page extras: size guide + WhatsApp, then shipping & returns.
	add_action( 'woocommerce_single_product_summary', 'vr_product_actions', 35 );
	add_action( 'woocommerce_single_product_summary', 'vr_product_shipping_returns', 45 );

	// Order confirmation: WhatsApp help line.
	add_action( 'woocommerce_thankyou', 'vr_thankyou_whatsapp', 5 );
}
add_action( 'init', 'vr_wc_template_hooks' );

/** Open the shop page wrapper. */
function vr_wc_wrapper_open() {
	echo '<div class="vr-container vr-shop-wrap">';
}

/** Close the shop page wrapper. */
function vr_wc_wrapper_close() {
	echo '</div>';
}

/**
 * Breadcrumb styling.
 *
 * @param array $defaults Breadcrumb settings.
 * @return array
 */
function vr_wc_breadcrumb_defaults( $defaults ) {
	$defaults['delimiter']   = '<span class="vr-breadcrumb__sep" aria-hidden="true">/</span>';
	$defaults['wrap_before'] = '<nav class="woocommerce-breadcrumb vr-breadcrumb" aria-label="' . esc_attr__( 'Breadcrumb', 'verry-rarre' ) . '">';
	$defaults['wrap_after']  = '</nav>';
	return $defaults;
}
add_filter( 'woocommerce_breadcrumb_defaults', 'vr_wc_breadcrumb_defaults' );

/* -------------------------------------------------------------------------
 * 3. Product cards
 * ---------------------------------------------------------------------- */

/** Start the square image box on a product card. */
function vr_card_media_open() {
	echo '<div class="vr-card__media">';
}

/** End the image box. */
function vr_card_media_close() {
	echo '</div>';
}

/** "Sold out" label on cards when nothing is in stock. */
function vr_card_soldout_badge() {
	global $product;
	if ( $product && ! $product->is_in_stock() ) {
		echo '<span class="vr-badge vr-badge--soldout">' . esc_html__( 'Sold out', 'verry-rarre' ) . '</span>';
	}
}

/** Second photo (first gallery image) shown when hovering a card. */
function vr_card_alt_image() {
	global $product;
	if ( ! $product ) {
		return;
	}
	$gallery = $product->get_gallery_image_ids();
	if ( $gallery ) {
		echo wp_get_attachment_image(
			$gallery[0],
			'woocommerce_thumbnail',
			false,
			array(
				'class'   => 'vr-card__alt',
				'alt'     => '',
				'loading' => 'lazy',
			)
		);
	}
}

/** Small category label above the product name. */
function vr_card_category() {
	global $product;
	if ( ! $product ) {
		return;
	}
	$terms = get_the_terms( $product->get_id(), 'product_cat' );
	if ( $terms && ! is_wp_error( $terms ) ) {
		echo '<span class="vr-card__cat">' . esc_html( $terms[0]->name ) . '</span>';
	}
}

/**
 * Shorter "Sale" badge text.
 *
 * @return string
 */
function vr_sale_flash() {
	return '<span class="onsale">' . esc_html__( 'Sale', 'verry-rarre' ) . '</span>';
}
add_filter( 'woocommerce_sale_flash', 'vr_sale_flash' );

/* -------------------------------------------------------------------------
 * 4. Shop toolbar, sorting and filters
 * ---------------------------------------------------------------------- */

/**
 * True on the Shop page and category/tag/attribute archives.
 *
 * @return bool
 */
function vr_is_catalog() {
	return is_shop() || is_product_taxonomy();
}

/**
 * Friendlier sort labels; drops "average rating".
 *
 * @param array $options Sorting options.
 * @return array
 */
function vr_catalog_orderby( $options ) {
	$labels = array(
		'date'       => __( 'Newest', 'verry-rarre' ),
		'popularity' => __( 'Popular', 'verry-rarre' ),
		'price'      => __( 'Price: low to high', 'verry-rarre' ),
		'price-desc' => __( 'Price: high to low', 'verry-rarre' ),
		'menu_order' => __( 'Featured', 'verry-rarre' ),
	);
	$sorted = array();
	foreach ( $labels as $key => $label ) {
		if ( isset( $options[ $key ] ) ) {
			$sorted[ $key ] = $label;
		}
	}
	return $sorted;
}
add_filter( 'woocommerce_catalog_orderby', 'vr_catalog_orderby' );

/**
 * Filter names the theme understands, besides filter_{attribute}.
 *
 * @return string[]
 */
function vr_filter_keys() {
	return array( 'product_cat', 'min_price', 'max_price', 'stock' );
}

/**
 * Tidy the filter form's query string before WordPress reads it:
 *  - removes empty fields (an empty max_price would hide every product),
 *  - joins ticked boxes (filter_size[]=s&filter_size[]=m) into the
 *    "filter_size=s,m" format WooCommerce expects.
 */
function vr_normalize_filter_query() {
	if ( is_admin() || empty( $_GET ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	foreach ( $_GET as $key => $value ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$is_ours = in_array( $key, vr_filter_keys(), true ) || 0 === strpos( $key, 'filter_' );
		if ( ! $is_ours ) {
			continue;
		}
		if ( is_array( $value ) ) {
			$value       = implode( ',', array_filter( array_map( 'sanitize_title', wp_unslash( $value ) ) ) );
			$_GET[ $key ] = $value;
		}
		if ( '' === $value ) {
			unset( $_GET[ $key ] );
		}
	}
}
add_action( 'init', 'vr_normalize_filter_query', 1 );

/**
 * "In stock only" filter.
 *
 * @param WP_Query $q The product query.
 */
function vr_stock_filter_query( $q ) {
	if ( isset( $_GET['stock'] ) && 'instock' === $_GET['stock'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$meta_query   = (array) $q->get( 'meta_query' );
		$meta_query[] = array(
			'key'   => '_stock_status',
			'value' => 'instock',
		);
		$q->set( 'meta_query', $meta_query );
	}
}
add_action( 'woocommerce_product_query', 'vr_stock_filter_query' );

/**
 * How many filters are active (shown on the Filter button).
 *
 * @return int
 */
function vr_active_filter_count() {
	$count = 0;
	foreach ( array_keys( $_GET ) as $key ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 0 === strpos( $key, 'filter_' ) || in_array( $key, array( 'min_price', 'max_price', 'stock' ), true ) ) {
			++$count;
		}
	}
	if ( is_product_category() ) {
		++$count;
	}
	return $count;
}

/** Start the toolbar row. */
function vr_toolbar_open() {
	if ( vr_is_catalog() ) {
		echo '<div class="vr-toolbar">';
	}
}

/** End the toolbar row. */
function vr_toolbar_close() {
	if ( vr_is_catalog() ) {
		echo '</div>';
	}
}

/** The "Filter" button. */
function vr_filter_toggle() {
	if ( ! vr_is_catalog() ) {
		return;
	}
	$active = vr_active_filter_count();
	printf(
		'<button type="button" class="vr-btn vr-btn--ghost vr-filter-toggle" aria-expanded="%1$s" aria-controls="vr-filters" data-filter-toggle>%2$s<span>%3$s</span>%4$s</button>',
		$active ? 'true' : 'false',
		vr_icon( 'filter' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		esc_html__( 'Filter', 'verry-rarre' ),
		$active ? ' <span class="vr-filter-toggle__count">' . absint( $active ) . '</span>' : ''
	);
}

/**
 * The filter panel: category, every product attribute (Size, Colour…),
 * price range and availability. Uses WooCommerce's own URL filters, so
 * it works without plugins and without JavaScript.
 */
function vr_filter_panel() {
	if ( ! vr_is_catalog() ) {
		return;
	}
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$current_cat = is_product_category() ? get_queried_object()->slug : ( isset( $_GET['product_cat'] ) ? sanitize_title( wp_unslash( $_GET['product_cat'] ) ) : '' );
	$min_price   = isset( $_GET['min_price'] ) ? absint( $_GET['min_price'] ) : '';
	$max_price   = isset( $_GET['max_price'] ) ? absint( $_GET['max_price'] ) : '';
	$in_stock    = isset( $_GET['stock'] ) && 'instock' === $_GET['stock'];
	$orderby     = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
	$is_open     = vr_active_filter_count() > 0;

	$categories = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
		)
	);
	?>
	<form class="vr-filters" id="vr-filters" action="<?php echo esc_url( vr_shop_url() ); ?>" method="get" <?php echo $is_open ? '' : 'hidden'; ?> data-filters>
		<div class="vr-filters__grid">
			<?php if ( $categories && ! is_wp_error( $categories ) ) : ?>
				<fieldset class="vr-filters__group">
					<legend><?php esc_html_e( 'Category', 'verry-rarre' ); ?></legend>
					<select name="product_cat" aria-label="<?php esc_attr_e( 'Category', 'verry-rarre' ); ?>">
						<option value=""><?php esc_html_e( 'All products', 'verry-rarre' ); ?></option>
						<?php foreach ( $categories as $cat ) : ?>
							<option value="<?php echo esc_attr( $cat->slug ); ?>" <?php selected( $current_cat, $cat->slug ); ?>><?php echo esc_html( $cat->name ); ?></option>
						<?php endforeach; ?>
					</select>
				</fieldset>
			<?php endif; ?>

			<?php
			foreach ( wc_get_attribute_taxonomies() as $attribute ) :
				$taxonomy = wc_attribute_taxonomy_name( $attribute->attribute_name );
				if ( ! taxonomy_exists( $taxonomy ) ) {
					continue;
				}
				$terms = get_terms(
					array(
						'taxonomy'   => $taxonomy,
						'hide_empty' => true,
					)
				);
				if ( ! $terms || is_wp_error( $terms ) ) {
					continue;
				}
				$param   = 'filter_' . $attribute->attribute_name;
				$chosen  = isset( $_GET[ $param ] ) ? array_map( 'sanitize_title', explode( ',', wp_unslash( $_GET[ $param ] ) ) ) : array();
				?>
				<fieldset class="vr-filters__group">
					<legend><?php echo esc_html( $attribute->attribute_label ); ?></legend>
					<input type="hidden" name="query_type_<?php echo esc_attr( $attribute->attribute_name ); ?>" value="or">
					<div class="vr-chips">
						<?php foreach ( $terms as $term ) : ?>
							<label class="vr-chip">
								<input type="checkbox" name="<?php echo esc_attr( $param ); ?>[]" value="<?php echo esc_attr( $term->slug ); ?>" <?php checked( in_array( $term->slug, $chosen, true ) ); ?>>
								<span><?php echo esc_html( $term->name ); ?></span>
							</label>
						<?php endforeach; ?>
					</div>
				</fieldset>
			<?php endforeach; ?>

			<fieldset class="vr-filters__group">
				<legend><?php esc_html_e( 'Price (₦)', 'verry-rarre' ); ?></legend>
				<div class="vr-price-range">
					<label><span class="screen-reader-text"><?php esc_html_e( 'Minimum price', 'verry-rarre' ); ?></span>
						<input type="number" name="min_price" min="0" step="500" inputmode="numeric" placeholder="<?php esc_attr_e( 'Min', 'verry-rarre' ); ?>" value="<?php echo esc_attr( $min_price ); ?>"></label>
					<span aria-hidden="true">–</span>
					<label><span class="screen-reader-text"><?php esc_html_e( 'Maximum price', 'verry-rarre' ); ?></span>
						<input type="number" name="max_price" min="0" step="500" inputmode="numeric" placeholder="<?php esc_attr_e( 'Max', 'verry-rarre' ); ?>" value="<?php echo esc_attr( $max_price ); ?>"></label>
				</div>
			</fieldset>

			<fieldset class="vr-filters__group">
				<legend><?php esc_html_e( 'Availability', 'verry-rarre' ); ?></legend>
				<label class="vr-chip">
					<input type="checkbox" name="stock" value="instock" <?php checked( $in_stock ); ?>>
					<span><?php esc_html_e( 'In stock only', 'verry-rarre' ); ?></span>
				</label>
			</fieldset>
		</div>

		<?php if ( $orderby ) : ?>
			<input type="hidden" name="orderby" value="<?php echo esc_attr( $orderby ); ?>">
		<?php endif; ?>

		<div class="vr-filters__actions">
			<button type="submit" class="vr-btn"><?php esc_html_e( 'Apply filters', 'verry-rarre' ); ?></button>
			<a class="vr-link" href="<?php echo esc_url( vr_shop_url() ); ?>"><?php esc_html_e( 'Clear all', 'verry-rarre' ); ?></a>
		</div>
	</form>
	<?php
	// phpcs:enable
}

/** On "no products found", offer a way out of the filters. */
function vr_no_results_clear_filters() {
	if ( vr_active_filter_count() > 0 ) {
		echo '<p class="vr-no-results"><a class="vr-btn" href="' . esc_url( vr_shop_url() ) . '">' . esc_html__( 'Clear filters', 'verry-rarre' ) . '</a></p>';
	}
}

/* -------------------------------------------------------------------------
 * 5. Product page
 * ---------------------------------------------------------------------- */

/**
 * Size guide content: the "size-guide" page if you created one,
 * otherwise the default in template-parts/size-guide.php.
 *
 * @return string HTML.
 */
function vr_size_guide_html() {
	$page = get_page_by_path( 'size-guide' );
	if ( $page && 'publish' === $page->post_status && '' !== trim( $page->post_content ) ) {
		return apply_filters( 'the_content', $page->post_content ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
	}
	ob_start();
	get_template_part( 'template-parts/size-guide' );
	return ob_get_clean();
}

/** Size guide button + dialog, and "Ask on WhatsApp". */
function vr_product_actions() {
	global $product;
	$whatsapp = $product ? vr_whatsapp_url(
		/* translators: 1: product name, 2: product link */
		sprintf( __( 'Hi VERRY RARRE, I have a question about %1$s: %2$s', 'verry-rarre' ), $product->get_name(), get_permalink( $product->get_id() ) )
	) : '';
	?>
	<div class="vr-product-actions">
		<button type="button" class="vr-link vr-link--icon" data-dialog-open="vr-size-guide">
			<?php echo vr_icon( 'ruler' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php esc_html_e( 'Size guide', 'verry-rarre' ); ?>
		</button>
		<?php if ( $whatsapp ) : ?>
			<a class="vr-link vr-link--icon" href="<?php echo esc_url( $whatsapp ); ?>" target="_blank" rel="noopener">
				<?php echo vr_icon( 'whatsapp' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php esc_html_e( 'Ask on WhatsApp', 'verry-rarre' ); ?>
			</a>
		<?php endif; ?>
	</div>

	<dialog class="vr-dialog" id="vr-size-guide" aria-labelledby="vr-size-guide-title">
		<div class="vr-dialog__head">
			<h2 id="vr-size-guide-title" class="vr-dialog__title"><?php esc_html_e( 'Size guide', 'verry-rarre' ); ?></h2>
			<button type="button" class="vr-icon-btn" data-dialog-close aria-label="<?php esc_attr_e( 'Close size guide', 'verry-rarre' ); ?>"><?php echo vr_icon( 'close' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></button>
		</div>
		<div class="vr-dialog__body vr-prose">
			<?php echo vr_size_guide_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- page content / theme template. ?>
		</div>
	</dialog>
	<?php
}

/** Shipping & returns note under the add-to-cart area. */
function vr_product_shipping_returns() {
	$text = vr_mod( 'vr_shipping_returns_text' );
	if ( '' === trim( $text ) ) {
		return;
	}
	$policy = vr_page_url( 'shipping-returns' );
	?>
	<details class="vr-accordion">
		<summary><?php esc_html_e( 'Shipping & returns', 'verry-rarre' ); ?></summary>
		<div class="vr-accordion__body">
			<?php echo vr_paragraphs( $text ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php if ( $policy ) : ?>
				<p><a class="vr-link" href="<?php echo esc_url( $policy ); ?>"><?php esc_html_e( 'Read the full policy', 'verry-rarre' ); ?></a></p>
			<?php endif; ?>
		</div>
	</details>
	<?php
}

/**
 * Show 4 related products in one row.
 *
 * @param array $args Related products settings.
 * @return array
 */
function vr_related_products_args( $args ) {
	$args['posts_per_page'] = 4;
	$args['columns']        = 4;
	return $args;
}
add_filter( 'woocommerce_output_related_products_args', 'vr_related_products_args' );

/* -------------------------------------------------------------------------
 * 6. Header cart + order confirmation
 * ---------------------------------------------------------------------- */

/**
 * Header cart link with item count.
 *
 * @return string HTML.
 */
function vr_cart_link_html() {
	$count = ( WC()->cart ) ? WC()->cart->get_cart_contents_count() : 0;
	return sprintf(
		'<a class="vr-icon-btn vr-cart-link" href="%1$s">%2$s<span class="screen-reader-text">%3$s</span><span class="vr-cart-count%4$s" aria-hidden="true">%5$s</span></a>',
		esc_url( wc_get_cart_url() ),
		vr_icon( 'bag' ),
		/* translators: %d: number of items in the cart */
		esc_html( sprintf( _n( 'Cart, %d item', 'Cart, %d items', $count, 'verry-rarre' ), $count ) ),
		$count ? '' : ' is-empty',
		absint( $count )
	);
}

/**
 * Refresh the header cart link after an item is added (no page reload).
 *
 * @param array $fragments HTML fragments keyed by CSS selector.
 * @return array
 */
function vr_cart_fragment( $fragments ) {
	$fragments['a.vr-cart-link'] = vr_cart_link_html();
	return $fragments;
}
add_filter( 'woocommerce_add_to_cart_fragments', 'vr_cart_fragment' );

/**
 * WhatsApp help line on the order confirmation page.
 *
 * @param int $order_id Order number.
 */
function vr_thankyou_whatsapp( $order_id ) {
	if ( ! $order_id ) {
		return;
	}
	/* translators: %s: order number */
	$url = vr_whatsapp_url( sprintf( __( 'Hi VERRY RARRE, I have a question about order #%s.', 'verry-rarre' ), $order_id ) );
	if ( ! $url ) {
		return;
	}
	echo '<p class="vr-thankyou-help">' . esc_html__( 'Questions about your order?', 'verry-rarre' ) . ' <a class="vr-link" href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . esc_html__( 'Message us on WhatsApp', 'verry-rarre' ) . '</a></p>';
}
