<?php
/**
 * Newsletter signup.
 *
 * Emails from the homepage form are saved under Dashboard > Subscribers,
 * where you can also download them as a CSV file (for Mailchimp, Brevo,
 * Klaviyo, etc.). No extra plugin or paid service is needed to start.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

/**
 * Private "Subscribers" list in the dashboard.
 */
function vr_register_subscribers() {
	register_post_type(
		'vr_subscriber',
		array(
			'labels'          => array(
				'name'          => __( 'Subscribers', 'verry-rarre' ),
				'singular_name' => __( 'Subscriber', 'verry-rarre' ),
				'menu_name'     => __( 'Subscribers', 'verry-rarre' ),
				'all_items'     => __( 'All subscribers', 'verry-rarre' ),
				'search_items'  => __( 'Search subscribers', 'verry-rarre' ),
				'not_found'     => __( 'No subscribers yet.', 'verry-rarre' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-email-alt',
			'menu_position'   => 58,
			'supports'        => array( 'title' ),
			'capability_type' => 'post',
			'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			'map_meta_cap'    => true,
		)
	);
}
add_action( 'init', 'vr_register_subscribers' );

/**
 * Handle the signup form.
 *
 * There is no nonce on purpose: pages are often cached by the host, which
 * would make nonces expire and block real signups. A hidden "honeypot"
 * field stops most spam bots instead.
 */
function vr_handle_subscribe() {
	// phpcs:disable WordPress.Security.NonceVerification.Missing
	$back  = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$back  = remove_query_arg( 'vr_subscribed', $back );
	$email = isset( $_POST['vr_email'] ) ? sanitize_email( wp_unslash( $_POST['vr_email'] ) ) : '';
	$trap  = isset( $_POST['vr_website'] ) ? sanitize_text_field( wp_unslash( $_POST['vr_website'] ) ) : '';
	// phpcs:enable

	if ( '' !== $trap ) {
		wp_safe_redirect( add_query_arg( 'vr_subscribed', '1', $back ) . '#newsletter' );
		exit;
	}
	if ( ! is_email( $email ) ) {
		wp_safe_redirect( add_query_arg( 'vr_subscribed', 'invalid', $back ) . '#newsletter' );
		exit;
	}

	$exists = get_posts(
		array(
			'post_type'      => 'vr_subscriber',
			'post_status'    => 'any',
			'title'          => $email,
			'fields'         => 'ids',
			'posts_per_page' => 1,
		)
	);
	if ( ! $exists ) {
		wp_insert_post(
			array(
				'post_type'   => 'vr_subscriber',
				'post_status' => 'publish',
				'post_title'  => $email,
			)
		);
	}

	wp_safe_redirect( add_query_arg( 'vr_subscribed', '1', $back ) . '#newsletter' );
	exit;
}
add_action( 'admin_post_nopriv_vr_subscribe', 'vr_handle_subscribe' );
add_action( 'admin_post_vr_subscribe', 'vr_handle_subscribe' );

/**
 * "Download CSV" button above the Subscribers list.
 *
 * @param array $views List table views.
 * @return array
 */
function vr_subscribers_export_link( $views ) {
	$url                 = wp_nonce_url( admin_url( 'admin-post.php?action=vr_export_subscribers' ), 'vr_export_subscribers' );
	$views['vr_export'] = '<a href="' . esc_url( $url ) . '"><strong>' . esc_html__( 'Download CSV', 'verry-rarre' ) . '</strong></a>';
	return $views;
}
add_filter( 'views_edit-vr_subscriber', 'vr_subscribers_export_link' );

/**
 * Send the subscribers CSV file.
 */
function vr_export_subscribers() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'verry-rarre' ) );
	}
	check_admin_referer( 'vr_export_subscribers' );

	$ids = get_posts(
		array(
			'post_type'      => 'vr_subscriber',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'orderby'        => 'date',
			'order'          => 'ASC',
		)
	);

	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=verry-rarre-subscribers-' . gmdate( 'Y-m-d' ) . '.csv' );
	$out = fopen( 'php://output', 'w' );
	fputcsv( $out, array( 'email', 'subscribed_at' ) );
	foreach ( $ids as $id ) {
		fputcsv( $out, array( get_the_title( $id ), get_the_date( 'Y-m-d H:i', $id ) ) );
	}
	fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
	exit;
}
add_action( 'admin_post_vr_export_subscribers', 'vr_export_subscribers' );
