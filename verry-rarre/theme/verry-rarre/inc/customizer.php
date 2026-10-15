<?php
/**
 * Appearance > Customize settings.
 *
 * Everything here can be changed from the WordPress dashboard without code.
 * vr_defaults() holds the starting values; edit them here only if you want
 * different defaults for a fresh install.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default value of every theme setting.
 *
 * @return array<string, mixed>
 */
function vr_defaults() {
	static $defaults = null;
	if ( null !== $defaults ) {
		return $defaults;
	}

	$img = VR_URI . '/assets/images/';

	$defaults = array(
		// Colours.
		'vr_color_accent'          => '#7e9ce5',

		// Announcement bar.
		'vr_announcement_enabled'  => true,
		'vr_announcement_text'     => "New drop out now — Live The Truth zip hoodie  ✦  Verry Rarre, controversy sell's",
		'vr_announcement_link'     => '',

		// Homepage sections on/off.
		'vr_show_hero'             => true,
		'vr_show_arrivals'         => true,
		'vr_show_collections'      => true,
		'vr_show_bestsellers'      => true,
		'vr_show_editorial'        => true,
		'vr_show_story'            => true,
		'vr_show_newsletter'       => true,

		// Hero.
		'vr_hero_image'            => $img . 'hero.jpg',
		'vr_hero_eyebrow'          => 'Drop 001 — Out now',
		'vr_hero_title'            => "Controversy sell's",
		'vr_hero_text'             => 'Graphic streetwear for people who live the truth. Limited runs. No restocks promised.',
		'vr_hero_button_text'      => 'Shop now',
		'vr_hero_button_url'       => '',

		// Product rails.
		'vr_arrivals_title'        => 'New arrivals',
		'vr_arrivals_count'        => 8,
		'vr_collections_title'     => 'Collections',
		'vr_bestsellers_title'     => 'Best sellers',
		'vr_bestsellers_count'     => 4,

		// Editorial.
		'vr_editorial_title'       => 'Live the truth',
		'vr_editorial_text'        => 'Armour for the everyday. Print-heavy pieces built to be noticed.',
		'vr_editorial_image_1'     => $img . 'editorial-1.jpg',
		'vr_editorial_image_2'     => $img . 'editorial-2.jpg',
		'vr_editorial_image_3'     => $img . 'editorial-3.jpg',
		'vr_editorial_link'        => '',
		'vr_editorial_link_text'   => 'View the lookbook',

		// Brand story.
		'vr_story_title'           => 'Verry rare. On purpose.',
		'vr_story_text'            => "VERRY RARRE makes graphic streetwear for the ones who refuse to blend in. Every piece starts as an idea people might argue about — because controversy sell's, and the truth always stands out.\n\nSmall batches. Heavy prints. Made to be worn loud.",
		'vr_story_image'           => $img . 'story.jpg',

		// Newsletter.
		'vr_newsletter_title'      => 'Get the drop first',
		'vr_newsletter_text'       => 'Join the list for early access to new releases and restocks.',

		// Contact and social.
		'vr_whatsapp_number'       => '',
		'vr_whatsapp_message'      => 'Hi VERRY RARRE, I have a question about an order.',
		'vr_whatsapp_float'        => true,
		'vr_contact_email'         => '',
		'vr_contact_phone'         => '',
		'vr_contact_address'       => 'Nigeria',
		'vr_instagram_url'         => 'https://www.instagram.com/verry_rarre/',
		'vr_tiktok_url'            => '',
		'vr_x_url'                 => '',

		// Shop.
		'vr_shipping_returns_text' => "Delivery across Nigeria. Delivery cost and timing are shown at checkout.\nReturns and exchanges: see our Shipping & Returns page for the full policy.",
		'vr_footer_logo'           => $img . 'logo-white.png',
		'vr_footer_text'           => "Graphic streetwear. Verry rarre, controversy sell's.",
	);

	return $defaults;
}

/**
 * Read a theme setting, falling back to its default.
 *
 * @param string $key Setting name, e.g. 'vr_hero_title'.
 * @return mixed
 */
function vr_mod( $key ) {
	$defaults = vr_defaults();
	return get_theme_mod( $key, $defaults[ $key ] ?? '' );
}

/**
 * Sanitize a checkbox value.
 *
 * @param mixed $value Raw value.
 * @return bool
 */
function vr_sanitize_checkbox( $value ) {
	return (bool) $value;
}

/**
 * Keep only digits in a WhatsApp number (wa.me links need e.g. 2348012345678).
 *
 * @param string $value Raw number.
 * @return string
 */
function vr_sanitize_phone_digits( $value ) {
	return preg_replace( '/\D+/', '', (string) $value );
}

/**
 * Register Customizer panels, sections and controls.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function vr_customize_register( $wp_customize ) {
	$d = vr_defaults();

	$wp_customize->add_panel(
		'vr_panel',
		array(
			'title'    => __( 'Verry Rarre Theme', 'verry-rarre' ),
			'priority' => 30,
		)
	);

	$sections = array(
		'vr_brand'        => __( 'Brand colour & footer', 'verry-rarre' ),
		'vr_announcement' => __( 'Announcement bar', 'verry-rarre' ),
		'vr_home'         => __( 'Homepage sections', 'verry-rarre' ),
		'vr_hero'         => __( 'Homepage: hero', 'verry-rarre' ),
		'vr_editorial'    => __( 'Homepage: editorial & story', 'verry-rarre' ),
		'vr_contact'      => __( 'Contact, WhatsApp & social', 'verry-rarre' ),
		'vr_shop'         => __( 'Shop & product pages', 'verry-rarre' ),
	);
	foreach ( $sections as $id => $title ) {
		$wp_customize->add_section( $id, array( 'title' => $title, 'panel' => 'vr_panel' ) );
	}

	// Helper to add one setting + control with sensible sanitizing.
	$add = function ( $id, $section, $label, $type = 'text', $extra = array() ) use ( $wp_customize, $d ) {
		$sanitize = array(
			'text'     => 'sanitize_text_field',
			'textarea' => 'sanitize_textarea_field',
			'url'      => 'esc_url_raw',
			'email'    => 'sanitize_email',
			'checkbox' => 'vr_sanitize_checkbox',
			'number'   => 'absint',
			'image'    => 'esc_url_raw',
			'color'    => 'sanitize_hex_color',
		);
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $d[ $id ] ?? '',
				'sanitize_callback' => $extra['sanitize'] ?? $sanitize[ $type ],
				'transport'         => 'refresh',
			)
		);
		$args = array(
			'label'       => $label,
			'section'     => $section,
			'description' => $extra['description'] ?? '',
		);
		if ( 'image' === $type ) {
			$wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, $id, $args ) );
		} elseif ( 'color' === $type ) {
			$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, $id, $args ) );
		} else {
			$args['type'] = $type;
			if ( 'number' === $type ) {
				$args['input_attrs'] = array( 'min' => 1, 'max' => 24 );
			}
			$wp_customize->add_control( $id, $args );
		}
	};

	// Brand.
	$add( 'vr_color_accent', 'vr_brand', __( 'Accent colour', 'verry-rarre' ), 'color', array( 'description' => __( 'Used sparingly: sale prices, highlights, focus outlines.', 'verry-rarre' ) ) );
	$add( 'vr_footer_logo', 'vr_brand', __( 'Footer logo (light version for the black footer)', 'verry-rarre' ), 'image' );
	$add( 'vr_footer_text', 'vr_brand', __( 'Footer tagline', 'verry-rarre' ), 'textarea' );

	// Announcement.
	$add( 'vr_announcement_enabled', 'vr_announcement', __( 'Show announcement bar', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_announcement_text', 'vr_announcement', __( 'Message', 'verry-rarre' ), 'text' );
	$add( 'vr_announcement_link', 'vr_announcement', __( 'Link (optional)', 'verry-rarre' ), 'url' );

	// Section toggles + rail settings.
	$add( 'vr_show_hero', 'vr_home', __( 'Show hero', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_show_arrivals', 'vr_home', __( 'Show new arrivals', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_arrivals_title', 'vr_home', __( 'New arrivals heading', 'verry-rarre' ) );
	$add( 'vr_arrivals_count', 'vr_home', __( 'How many new arrivals', 'verry-rarre' ), 'number' );
	$add( 'vr_show_collections', 'vr_home', __( 'Show collections', 'verry-rarre' ), 'checkbox', array( 'description' => __( 'Shows your product categories that have an image.', 'verry-rarre' ) ) );
	$add( 'vr_collections_title', 'vr_home', __( 'Collections heading', 'verry-rarre' ) );
	$add( 'vr_show_bestsellers', 'vr_home', __( 'Show best sellers', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_bestsellers_title', 'vr_home', __( 'Best sellers heading', 'verry-rarre' ) );
	$add( 'vr_bestsellers_count', 'vr_home', __( 'How many best sellers', 'verry-rarre' ), 'number' );
	$add( 'vr_show_editorial', 'vr_home', __( 'Show editorial images', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_show_story', 'vr_home', __( 'Show brand story', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_show_newsletter', 'vr_home', __( 'Show newsletter signup', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_newsletter_title', 'vr_home', __( 'Newsletter heading', 'verry-rarre' ) );
	$add( 'vr_newsletter_text', 'vr_home', __( 'Newsletter text', 'verry-rarre' ), 'textarea' );

	// Hero.
	$add( 'vr_hero_image', 'vr_hero', __( 'Hero image', 'verry-rarre' ), 'image', array( 'description' => __( 'Best size: at least 1600px wide.', 'verry-rarre' ) ) );
	$add( 'vr_hero_eyebrow', 'vr_hero', __( 'Small label above the heading', 'verry-rarre' ) );
	$add( 'vr_hero_title', 'vr_hero', __( 'Heading', 'verry-rarre' ) );
	$add( 'vr_hero_text', 'vr_hero', __( 'Text', 'verry-rarre' ), 'textarea' );
	$add( 'vr_hero_button_text', 'vr_hero', __( 'Button text', 'verry-rarre' ) );
	$add( 'vr_hero_button_url', 'vr_hero', __( 'Button link (blank = Shop page)', 'verry-rarre' ), 'url' );

	// Editorial + story.
	$add( 'vr_editorial_title', 'vr_editorial', __( 'Editorial heading', 'verry-rarre' ) );
	$add( 'vr_editorial_text', 'vr_editorial', __( 'Editorial text', 'verry-rarre' ), 'textarea' );
	$add( 'vr_editorial_image_1', 'vr_editorial', __( 'Editorial image 1 (large)', 'verry-rarre' ), 'image' );
	$add( 'vr_editorial_image_2', 'vr_editorial', __( 'Editorial image 2', 'verry-rarre' ), 'image' );
	$add( 'vr_editorial_image_3', 'vr_editorial', __( 'Editorial image 3', 'verry-rarre' ), 'image' );
	$add( 'vr_editorial_link', 'vr_editorial', __( 'Editorial link (blank = Shop page)', 'verry-rarre' ), 'url' );
	$add( 'vr_editorial_link_text', 'vr_editorial', __( 'Editorial link text', 'verry-rarre' ) );
	$add( 'vr_story_title', 'vr_editorial', __( 'Brand story heading', 'verry-rarre' ) );
	$add( 'vr_story_text', 'vr_editorial', __( 'Brand story text', 'verry-rarre' ), 'textarea' );
	$add( 'vr_story_image', 'vr_editorial', __( 'Brand story image', 'verry-rarre' ), 'image' );

	// Contact.
	$add( 'vr_whatsapp_number', 'vr_contact', __( 'WhatsApp number', 'verry-rarre' ), 'text', array( 'sanitize' => 'vr_sanitize_phone_digits', 'description' => __( 'Country code + number, digits only. Example: 2348012345678', 'verry-rarre' ) ) );
	$add( 'vr_whatsapp_message', 'vr_contact', __( 'Pre-filled WhatsApp message', 'verry-rarre' ) );
	$add( 'vr_whatsapp_float', 'vr_contact', __( 'Show floating WhatsApp button', 'verry-rarre' ), 'checkbox' );
	$add( 'vr_contact_email', 'vr_contact', __( 'Contact email', 'verry-rarre' ), 'email' );
	$add( 'vr_contact_phone', 'vr_contact', __( 'Phone number (as displayed)', 'verry-rarre' ) );
	$add( 'vr_contact_address', 'vr_contact', __( 'Location', 'verry-rarre' ) );
	$add( 'vr_instagram_url', 'vr_contact', __( 'Instagram link', 'verry-rarre' ), 'url' );
	$add( 'vr_tiktok_url', 'vr_contact', __( 'TikTok link', 'verry-rarre' ), 'url' );
	$add( 'vr_x_url', 'vr_contact', __( 'X (Twitter) link', 'verry-rarre' ), 'url' );

	// Shop.
	$add( 'vr_shipping_returns_text', 'vr_shop', __( 'Shipping & returns note on product pages', 'verry-rarre' ), 'textarea', array( 'description' => __( 'For the size guide, create a page with the slug "size-guide" — its content replaces the default size chart.', 'verry-rarre' ) ) );
}
add_action( 'customize_register', 'vr_customize_register' );
