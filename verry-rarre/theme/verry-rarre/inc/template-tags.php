<?php
/**
 * Small helpers the templates call: links, logo, icons, social links.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * URL of the Shop page (or the homepage if WooCommerce is not active yet).
 *
 * @return string
 */
function vr_shop_url() {
	if ( function_exists( 'wc_get_page_permalink' ) ) {
		return wc_get_page_permalink( 'shop' );
	}
	return home_url( '/' );
}

/**
 * A theme setting that holds a URL, falling back to the Shop page when blank.
 *
 * @param string $key Setting name.
 * @return string
 */
function vr_link_or_shop( $key ) {
	$url = vr_mod( $key );
	return $url ? $url : vr_shop_url();
}

/**
 * WhatsApp chat link (wa.me), or '' when no number is set.
 *
 * @param string $message Optional pre-filled message.
 * @return string
 */
function vr_whatsapp_url( $message = '' ) {
	$number = vr_sanitize_phone_digits( vr_mod( 'vr_whatsapp_number' ) );
	if ( '' === $number ) {
		return '';
	}
	if ( '' === $message ) {
		$message = vr_mod( 'vr_whatsapp_message' );
	}
	return 'https://wa.me/' . $number . ( $message ? '?text=' . rawurlencode( $message ) : '' );
}

/**
 * Permalink of a published page by slug, or ''.
 *
 * @param string $slug Page slug, e.g. 'about'.
 * @return string
 */
function vr_page_url( $slug ) {
	$page = get_page_by_path( $slug );
	return ( $page && 'publish' === $page->post_status ) ? get_permalink( $page ) : '';
}

/**
 * Print the header logo: the logo uploaded in Customize > Site Identity,
 * otherwise the VRRE wordmark that ships with the theme.
 */
function vr_the_logo() {
	if ( has_custom_logo() ) {
		$logo_id = get_theme_mod( 'custom_logo' );
		echo wp_get_attachment_image(
			$logo_id,
			'full',
			false,
			array(
				'class' => 'vr-logo__img',
				'alt'   => get_bloginfo( 'name' ),
			)
		);
		return;
	}
	printf(
		'<img class="vr-logo__img" src="%1$s" alt="%2$s" width="735" height="292">',
		esc_url( VR_URI . '/assets/images/logo-black.png' ),
		esc_attr( get_bloginfo( 'name' ) )
	);
}

/**
 * Inline SVG icon. Icons are decorative, so screen readers skip them;
 * the surrounding link/button carries the accessible label.
 *
 * @param string $name Icon name.
 * @return string SVG markup.
 */
function vr_icon( $name ) {
	$paths = array(
		'menu'      => '<path d="M3 6h18M3 12h18M3 18h18"/>',
		'close'     => '<path d="M5 5l14 14M19 5L5 19"/>',
		'search'    => '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
		'bag'       => '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
		'user'      => '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
		'arrow'     => '<path d="M4 12h16M14 6l6 6-6 6"/>',
		'filter'    => '<path d="M4 6h16M7 12h10M10 18h4"/>',
		'ruler'     => '<path d="M3 15l12-12 6 6-12 12z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
		'instagram' => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>',
		'tiktok'    => '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.8 2.4 4.6 5 5"/>',
		'x'         => '<path d="M4 4l16 16M20 4L4 20"/>',
		'whatsapp'  => '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z"/><path d="M9 9.5c.3 2 2.2 4.2 5 5l1-1.2-1.6-.9-.8.8c-1-.4-2-1.4-2.3-2.4l.8-.8-.8-1.6L9 9.5z"/>',
		'mail'      => '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
		'phone'     => '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return '<svg class="vr-icon vr-icon--' . esc_attr( $name ) . '" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false">' . $paths[ $name ] . '</svg>';
}

/**
 * Social profile links set in the Customizer.
 *
 * @return array<int, array{label:string, url:string, icon:string}>
 */
function vr_social_links() {
	$links = array(
		array( 'label' => 'Instagram', 'url' => vr_mod( 'vr_instagram_url' ), 'icon' => 'instagram' ),
		array( 'label' => 'TikTok', 'url' => vr_mod( 'vr_tiktok_url' ), 'icon' => 'tiktok' ),
		array( 'label' => 'X', 'url' => vr_mod( 'vr_x_url' ), 'icon' => 'x' ),
	);
	$whatsapp = vr_whatsapp_url();
	if ( $whatsapp ) {
		$links[] = array( 'label' => 'WhatsApp', 'url' => $whatsapp, 'icon' => 'whatsapp' );
	}
	return array_values(
		array_filter(
			$links,
			function ( $link ) {
				return ! empty( $link['url'] );
			}
		)
	);
}

/**
 * Menu shown before you build one in Appearance > Menus.
 * Links only to pages that exist.
 *
 * @param array $args wp_nav_menu() arguments.
 */
function vr_fallback_menu( $args = array() ) {
	$items = array( __( 'Shop', 'verry-rarre' ) => vr_shop_url() );
	foreach ( array(
		'collections' => __( 'Collections', 'verry-rarre' ),
		'about'       => __( 'About', 'verry-rarre' ),
		'contact'     => __( 'Contact', 'verry-rarre' ),
	) as $slug => $label ) {
		$url = vr_page_url( $slug );
		if ( $url ) {
			$items[ $label ] = $url;
		}
	}
	$class = ! empty( $args['menu_class'] ) ? $args['menu_class'] : 'menu';
	echo '<ul class="' . esc_attr( $class ) . '">';
	foreach ( $items as $label => $url ) {
		echo '<li class="menu-item"><a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></li>';
	}
	echo '</ul>';
}

/**
 * Footer "Shop" links used until a footer menu is assigned:
 * All products + your product categories.
 */
function vr_fallback_shop_menu() {
	echo '<ul class="vr-footer__links">';
	echo '<li><a href="' . esc_url( vr_shop_url() ) . '">' . esc_html__( 'All products', 'verry-rarre' ) . '</a></li>';
	if ( taxonomy_exists( 'product_cat' ) ) {
		$cats = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => true,
				'parent'     => 0,
				'number'     => 6,
			)
		);
		foreach ( is_wp_error( $cats ) ? array() : $cats as $cat ) {
			echo '<li><a href="' . esc_url( get_term_link( $cat ) ) . '">' . esc_html( $cat->name ) . '</a></li>';
		}
	}
	$collections = vr_page_url( 'collections' );
	if ( $collections ) {
		echo '<li><a href="' . esc_url( $collections ) . '">' . esc_html__( 'Collections', 'verry-rarre' ) . '</a></li>';
	}
	echo '</ul>';
}

/**
 * Footer "Help" links used until a footer menu is assigned.
 */
function vr_fallback_help_menu() {
	$items = array(
		'shipping-returns' => __( 'Shipping & Returns', 'verry-rarre' ),
		'size-guide'       => __( 'Size Guide', 'verry-rarre' ),
		'contact'          => __( 'Contact', 'verry-rarre' ),
		'terms'            => __( 'Terms', 'verry-rarre' ),
	);
	echo '<ul class="vr-footer__links">';
	foreach ( $items as $slug => $label ) {
		$url = vr_page_url( $slug );
		if ( $url ) {
			echo '<li><a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></li>';
		}
	}
	$privacy = get_privacy_policy_url();
	if ( $privacy ) {
		echo '<li><a href="' . esc_url( $privacy ) . '">' . esc_html__( 'Privacy Policy', 'verry-rarre' ) . '</a></li>';
	}
	echo '</ul>';
}

/**
 * Turn a plain-text setting with blank lines into paragraphs.
 *
 * @param string $text Text from a textarea setting.
 * @return string Safe HTML.
 */
function vr_paragraphs( $text ) {
	return wpautop( esc_html( $text ) );
}
