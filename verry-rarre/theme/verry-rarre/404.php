<?php
/**
 * Page not found.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<section class="vr-container vr-404">
	<p class="vr-404__code" aria-hidden="true">404</p>
	<h1 class="vr-page__title"><?php esc_html_e( 'Too rare to find.', 'verry-rarre' ); ?></h1>
	<p><?php esc_html_e( 'This page does not exist or has sold out for good.', 'verry-rarre' ); ?></p>
	<a class="vr-btn" href="<?php echo esc_url( vr_shop_url() ); ?>"><?php esc_html_e( 'Back to the shop', 'verry-rarre' ); ?></a>
</section>
<?php
get_footer();
