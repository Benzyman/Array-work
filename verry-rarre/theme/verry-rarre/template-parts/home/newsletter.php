<?php
/**
 * Newsletter signup. Emails are saved under Dashboard > Subscribers.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_newsletter' ) ) {
	return;
}

// phpcs:ignore WordPress.Security.NonceVerification.Recommended
$vr_status = isset( $_GET['vr_subscribed'] ) ? sanitize_key( wp_unslash( $_GET['vr_subscribed'] ) ) : '';
$vr_camo   = vr_mod( 'vr_camo_enabled' ) ? vr_mod( 'vr_camo_art' ) : '';
?>
<section class="vr-newsletter<?php echo $vr_camo ? ' vr-newsletter--camo' : ''; ?>" id="newsletter" aria-labelledby="vr-newsletter-title">
	<?php if ( $vr_camo ) : ?>
		<div class="vr-newsletter__art" aria-hidden="true">
			<img src="<?php echo esc_url( $vr_camo ); ?>" alt="" loading="lazy" decoding="async">
		</div>
	<?php endif; ?>
	<div class="vr-container vr-newsletter__inner">
		<div>
			<h2 class="vr-newsletter__title" id="vr-newsletter-title"><?php echo esc_html( vr_mod( 'vr_newsletter_title' ) ); ?></h2>
			<p class="vr-newsletter__text"><?php echo esc_html( vr_mod( 'vr_newsletter_text' ) ); ?></p>
		</div>
		<form class="vr-newsletter__form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="vr_subscribe">
			<label for="vr-email" class="screen-reader-text"><?php esc_html_e( 'Email address', 'verry-rarre' ); ?></label>
			<input id="vr-email" type="email" name="vr_email" required autocomplete="email" placeholder="<?php esc_attr_e( 'Your email', 'verry-rarre' ); ?>">
			<div class="vr-hp" aria-hidden="true">
				<label for="vr-website">Website</label>
				<input id="vr-website" type="text" name="vr_website" tabindex="-1" autocomplete="off">
			</div>
			<button type="submit" class="vr-btn vr-btn--light"><?php esc_html_e( 'Sign up', 'verry-rarre' ); ?></button>
			<p class="vr-newsletter__status" role="status">
				<?php
				if ( '1' === $vr_status ) {
					esc_html_e( "You're on the list.", 'verry-rarre' );
				} elseif ( 'invalid' === $vr_status ) {
					esc_html_e( 'Please enter a valid email address.', 'verry-rarre' );
				}
				?>
			</p>
		</form>
	</div>
</section>
