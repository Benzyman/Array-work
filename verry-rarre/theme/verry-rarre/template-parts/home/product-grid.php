<?php
/**
 * Renders a WooCommerce product grid from a shortcode, with friendly
 * messages when WooCommerce is missing or there are no products yet.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_shortcode = $args['shortcode'] ?? '';

if ( ! class_exists( 'WooCommerce' ) ) {
	if ( current_user_can( 'manage_options' ) ) {
		echo '<p class="vr-admin-hint">' . esc_html__( 'Install and activate WooCommerce to show products here. (Only admins see this message.)', 'verry-rarre' ) . '</p>';
	}
	return;
}

$vr_html = do_shortcode( $vr_shortcode );

if ( false === strpos( $vr_html, 'class="products' ) ) {
	if ( current_user_can( 'manage_options' ) ) {
		echo '<p class="vr-admin-hint">' . esc_html__( 'No products yet. Add some in Products > Add New. (Only admins see this message.)', 'verry-rarre' ) . '</p>';
	}
	return;
}

echo $vr_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce output.
