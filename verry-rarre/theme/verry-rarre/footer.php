<?php
/**
 * Site footer: brand, shop links, help links, contact, socials.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_email    = vr_mod( 'vr_contact_email' );
$vr_phone    = vr_mod( 'vr_contact_phone' );
$vr_whatsapp = vr_whatsapp_url();
?>
</main>

<footer class="vr-footer">
	<div class="vr-container vr-footer__grid">
		<div class="vr-footer__brand">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="vr-footer__logo">
				<img src="<?php echo esc_url( vr_mod( 'vr_footer_logo' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" width="735" height="292" loading="lazy">
			</a>
			<p class="vr-footer__tagline"><?php echo esc_html( vr_mod( 'vr_footer_text' ) ); ?></p>
			<div class="vr-footer__social">
				<?php foreach ( vr_social_links() as $vr_link ) : ?>
					<a class="vr-icon-btn" href="<?php echo esc_url( $vr_link['url'] ); ?>" target="_blank" rel="noopener">
						<?php echo vr_icon( $vr_link['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span class="screen-reader-text"><?php echo esc_html( $vr_link['label'] ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>

		<div class="vr-footer__col">
			<h2 class="vr-footer__heading"><?php esc_html_e( 'Shop', 'verry-rarre' ); ?></h2>
			<?php
			if ( has_nav_menu( 'footer-shop' ) ) {
				wp_nav_menu(
					array(
						'theme_location' => 'footer-shop',
						'container'      => false,
						'menu_class'     => 'vr-footer__links',
						'depth'          => 1,
					)
				);
			} else {
				vr_fallback_shop_menu();
			}
			?>
		</div>

		<div class="vr-footer__col">
			<h2 class="vr-footer__heading"><?php esc_html_e( 'Help', 'verry-rarre' ); ?></h2>
			<?php
			if ( has_nav_menu( 'footer-help' ) ) {
				wp_nav_menu(
					array(
						'theme_location' => 'footer-help',
						'container'      => false,
						'menu_class'     => 'vr-footer__links',
						'depth'          => 1,
					)
				);
			} else {
				vr_fallback_help_menu();
			}
			?>
		</div>

		<div class="vr-footer__col">
			<h2 class="vr-footer__heading"><?php esc_html_e( 'Contact', 'verry-rarre' ); ?></h2>
			<ul class="vr-footer__links">
				<?php if ( $vr_whatsapp ) : ?>
					<li><a href="<?php echo esc_url( $vr_whatsapp ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'WhatsApp us', 'verry-rarre' ); ?></a></li>
				<?php endif; ?>
				<?php if ( $vr_email ) : ?>
					<li><a href="<?php echo esc_url( 'mailto:' . $vr_email ); ?>"><?php echo esc_html( $vr_email ); ?></a></li>
				<?php endif; ?>
				<?php if ( $vr_phone ) : ?>
					<li><a href="<?php echo esc_url( 'tel:' . preg_replace( '/[^\d+]/', '', $vr_phone ) ); ?>"><?php echo esc_html( $vr_phone ); ?></a></li>
				<?php endif; ?>
				<?php if ( vr_mod( 'vr_contact_address' ) ) : ?>
					<li><?php echo esc_html( vr_mod( 'vr_contact_address' ) ); ?></li>
				<?php endif; ?>
			</ul>
		</div>
	</div>

	<div class="vr-container vr-footer__bottom">
		<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
		<span><?php esc_html_e( 'Prices in Nigerian Naira (₦) · Secure checkout', 'verry-rarre' ); ?></span>
	</div>
	<div class="vr-footer__giant" aria-hidden="true">VERRY RARRE</div>
</footer>

<?php if ( $vr_whatsapp && vr_mod( 'vr_whatsapp_float' ) ) : ?>
	<a class="vr-whatsapp-float" href="<?php echo esc_url( $vr_whatsapp ); ?>" target="_blank" rel="noopener">
		<?php echo vr_icon( 'whatsapp' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span class="screen-reader-text"><?php esc_html_e( 'Chat with us on WhatsApp', 'verry-rarre' ); ?></span>
	</a>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
