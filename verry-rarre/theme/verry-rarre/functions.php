<?php
/**
 * Verry Rarre theme bootstrap.
 *
 * This file only loads the other files in /inc. Each one has a single job,
 * so you always know where to look:
 *
 *   inc/customizer.php     Settings you can change in Appearance > Customize.
 *   inc/template-tags.php  Small helpers used by the templates (logo, links, icons).
 *   inc/setup.php          Theme features, menus, fonts, CSS and JS files.
 *   inc/woocommerce.php    How the shop, product pages and cart look and behave.
 *   inc/newsletter.php     Newsletter signup form handler and "Subscribers" list.
 *   inc/seo.php            Basic search/social sharing tags (skipped if an SEO plugin is active).
 *   inc/starter-setup.php  One-click button that creates starter pages and menus.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

define( 'VR_VERSION', '1.0.0' );
define( 'VR_DIR', get_template_directory() );
define( 'VR_URI', get_template_directory_uri() );

require VR_DIR . '/inc/customizer.php';
require VR_DIR . '/inc/template-tags.php';
require VR_DIR . '/inc/setup.php';
require VR_DIR . '/inc/newsletter.php';
require VR_DIR . '/inc/seo.php';
require VR_DIR . '/inc/starter-setup.php';

if ( class_exists( 'WooCommerce' ) ) {
	require VR_DIR . '/inc/woocommerce.php';
}
