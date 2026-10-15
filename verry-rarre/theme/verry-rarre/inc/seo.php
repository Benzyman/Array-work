<?php
/**
 * Basic SEO and social sharing tags (Google, WhatsApp, Instagram link previews).
 *
 * If you later install Yoast SEO or Rank Math, this file switches itself
 * off so the tags are not printed twice.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * Is a dedicated SEO plugin active?
 *
 * @return bool
 */
function vr_seo_plugin_active() {
	return defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) || defined( 'SEOPRESS_VERSION' );
}

/**
 * Print meta description + Open Graph tags.
 */
function vr_seo_tags() {
	if ( vr_seo_plugin_active() ) {
		return;
	}

	$title       = wp_get_document_title();
	$description = get_bloginfo( 'description' );
	$image       = vr_mod( 'vr_hero_image' );
	$url         = home_url( add_query_arg( array() ) );
	$type        = 'website';

	if ( is_singular() ) {
		$post = get_queried_object();
		$url  = get_permalink( $post );
		if ( has_excerpt( $post ) ) {
			$description = get_the_excerpt( $post );
		} elseif ( ! empty( $post->post_content ) ) {
			$description = $post->post_content;
		}
		if ( has_post_thumbnail( $post ) ) {
			$image = get_the_post_thumbnail_url( $post, 'large' );
		}
		if ( function_exists( 'is_product' ) && is_product() ) {
			$type = 'product';
		}
	} elseif ( is_tax() || is_category() ) {
		$term        = get_queried_object();
		$description = term_description( $term ) ? term_description( $term ) : $description;
		$url         = get_term_link( $term );
		$thumb_id    = get_term_meta( $term->term_id, 'thumbnail_id', true );
		if ( $thumb_id ) {
			$image = wp_get_attachment_image_url( $thumb_id, 'large' );
		}
	}

	$description = wp_trim_words( wp_strip_all_tags( strip_shortcodes( (string) $description ) ), 30, '…' );

	echo "\n";
	if ( $description ) {
		echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
	}
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $type ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
	if ( $url && ! is_wp_error( $url ) ) {
		echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	}
	if ( $image ) {
		echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";
	}
	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
}
add_action( 'wp_head', 'vr_seo_tags', 5 );
