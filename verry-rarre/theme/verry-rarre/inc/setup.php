<?php
/**
 * Theme features, menus, fonts, CSS and JavaScript.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * Tell WordPress what this theme supports.
 */
function vr_setup() {
	load_theme_textdomain( 'verry-rarre', VR_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 120,
			'width'       => 300,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	register_nav_menus(
		array(
			'primary'     => __( 'Main menu (header)', 'verry-rarre' ),
			'footer-shop' => __( 'Footer: Shop links', 'verry-rarre' ),
			'footer-help' => __( 'Footer: Help links', 'verry-rarre' ),
		)
	);

	add_image_size( 'vr-wide', 2000, 1250, false );
	add_image_size( 'vr-tile', 900, 1125, true );
}
add_action( 'after_setup_theme', 'vr_setup' );

/**
 * Fonts: Archivo (bold display + body) and Space Mono (small labels).
 *
 * @return string Google Fonts stylesheet URL.
 */
function vr_fonts_url() {
	return 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Space+Mono:wght@400;700&display=swap';
}

/**
 * Load CSS and JS.
 */
function vr_enqueue_assets() {
	$ver = VR_VERSION;

	wp_enqueue_style( 'vr-fonts', vr_fonts_url(), array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
	wp_enqueue_style( 'vr-main', VR_URI . '/assets/css/main.css', array(), $ver );

	// The accent colour picked in the Customizer.
	$accent = sanitize_hex_color( vr_mod( 'vr_color_accent' ) );
	if ( $accent ) {
		wp_add_inline_style( 'vr-main', ':root{--vr-accent:' . $accent . ';}' );
	}

	wp_enqueue_script(
		'vr-main',
		VR_URI . '/assets/js/main.js',
		array(),
		$ver,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);
}
add_action( 'wp_enqueue_scripts', 'vr_enqueue_assets' );

/**
 * Connect to the font server early so text appears faster.
 *
 * @param array  $urls          URLs to print for resource hints.
 * @param string $relation_type The relation type.
 * @return array
 */
function vr_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'vr_resource_hints', 10, 2 );

/**
 * Add a class to <body> so CSS can tell when the page has a full-bleed hero.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function vr_body_classes( $classes ) {
	if ( is_front_page() && vr_mod( 'vr_show_hero' ) ) {
		$classes[] = 'has-hero';
	}
	return $classes;
}
add_filter( 'body_class', 'vr_body_classes' );

/**
 * Shorter excerpts for listing pages.
 *
 * @return int
 */
function vr_excerpt_length() {
	return 28;
}
add_filter( 'excerpt_length', 'vr_excerpt_length' );
