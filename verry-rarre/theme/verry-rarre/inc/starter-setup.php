<?php
/**
 * One-click starter setup.
 *
 * After you activate the theme, a notice at the top of the dashboard offers
 * to create the starter pages and set Naira store defaults. Nothing happens
 * until you click the button, and existing pages are never overwritten.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * Starter pages: slug => [title, status, content].
 * Policy pages are created as drafts so nothing goes live before you
 * fill in your real delivery times and return rules.
 *
 * @return array
 */
function vr_starter_pages() {
	return array(
		'about'            => array(
			__( 'About', 'verry-rarre' ),
			'publish',
			"<!-- wp:paragraph -->\n<p>VERRY RARRE is graphic streetwear for the ones who refuse to blend in. Every piece starts as an idea people might argue about — because controversy sell's, and the truth always stands out.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Small batches. Heavy prints. Made to be worn loud. Live the truth.</p>\n<!-- /wp:paragraph -->",
		),
		'contact'          => array(
			__( 'Contact', 'verry-rarre' ),
			'publish',
			"<!-- wp:paragraph -->\n<p>Questions about sizing, an order or a drop? The fastest way to reach us is WhatsApp. We usually reply within one working day.</p>\n<!-- /wp:paragraph -->",
		),
		'collections'      => array(
			__( 'Collections', 'verry-rarre' ),
			'publish',
			'',
		),
		'shipping-returns' => array(
			__( 'Shipping & Returns', 'verry-rarre' ),
			'draft',
			"<!-- wp:heading -->\n<h2>Delivery</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>[EDIT ME] We deliver across Nigeria. Orders are processed within [X] working days. Lagos deliveries usually arrive in [X] days; other states in [X] days. Delivery cost is shown at checkout.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2>Returns &amp; exchanges</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>[EDIT ME] Contact us within [X] days of delivery for an exchange. Items must be unworn, unwashed and with tags attached. Sale items are [final sale / exchangeable].</p>\n<!-- /wp:paragraph -->",
		),
		'terms'            => array(
			__( 'Terms & Conditions', 'verry-rarre' ),
			'draft',
			"<!-- wp:paragraph -->\n<p>[EDIT ME] Add your terms of sale here: pricing in Nigerian Naira, payment by card/bank transfer through Paystack, order cancellation, delivery and returns. Have a professional review this page before publishing.</p>\n<!-- /wp:paragraph -->",
		),
	);
}

/**
 * Show the setup notice to administrators until it is done or dismissed.
 */
function vr_starter_notice() {
	if ( get_option( 'vr_starter_done' ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$run     = wp_nonce_url( admin_url( 'admin-post.php?action=vr_starter_setup' ), 'vr_starter_setup' );
	$dismiss = wp_nonce_url( admin_url( 'admin-post.php?action=vr_starter_setup&dismiss=1' ), 'vr_starter_setup' );
	?>
	<div class="notice notice-info">
		<p><strong><?php esc_html_e( 'Verry Rarre theme: finish setup', 'verry-rarre' ); ?></strong></p>
		<p><?php esc_html_e( 'Creates About, Contact and Collections pages, plus draft Shipping & Returns and Terms pages for you to complete. If WooCommerce is active it also sets the currency to Nigerian Naira (₦) with no decimals and sorts the shop by newest first. Existing pages are not changed.', 'verry-rarre' ); ?></p>
		<p>
			<a class="button button-primary" href="<?php echo esc_url( $run ); ?>"><?php esc_html_e( 'Run starter setup', 'verry-rarre' ); ?></a>
			<a class="button" href="<?php echo esc_url( $dismiss ); ?>"><?php esc_html_e( 'No thanks', 'verry-rarre' ); ?></a>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'vr_starter_notice' );

/**
 * Run (or dismiss) the starter setup.
 */
function vr_run_starter_setup() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'verry-rarre' ) );
	}
	check_admin_referer( 'vr_starter_setup' );

	if ( empty( $_GET['dismiss'] ) ) {
		foreach ( vr_starter_pages() as $slug => $page ) {
			if ( get_page_by_path( $slug ) ) {
				continue;
			}
			wp_insert_post(
				array(
					'post_type'    => 'page',
					'post_name'    => $slug,
					'post_title'   => $page[0],
					'post_status'  => $page[1],
					'post_content' => $page[2],
				)
			);
		}

		if ( class_exists( 'WooCommerce' ) ) {
			update_option( 'woocommerce_currency', 'NGN' );
			update_option( 'woocommerce_price_num_decimals', '0' );
			update_option( 'woocommerce_price_thousand_sep', ',' );
			update_option( 'woocommerce_price_decimal_sep', '.' );
			update_option( 'woocommerce_currency_pos', 'left' );
			update_option( 'woocommerce_default_catalog_orderby', 'date' );
		}
	}

	update_option( 'vr_starter_done', 1 );
	wp_safe_redirect( admin_url( 'edit.php?post_type=page' ) );
	exit;
}
add_action( 'admin_post_vr_starter_setup', 'vr_run_starter_setup' );
