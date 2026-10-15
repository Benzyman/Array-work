<?php
/**
 * Contact page. Used automatically for the page whose slug is "contact".
 * Contact details come from Appearance > Customize > Verry Rarre Theme >
 * Contact, WhatsApp & social.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();

$vr_whatsapp = vr_whatsapp_url();
$vr_email    = vr_mod( 'vr_contact_email' );
$vr_phone    = vr_mod( 'vr_contact_phone' );
$vr_insta    = vr_mod( 'vr_instagram_url' );
?>
<div class="vr-container vr-page">
	<header class="vr-page__head">
		<h1 class="vr-page__title"><?php the_title(); ?></h1>
	</header>
	<div class="vr-page__content vr-prose">
		<?php
		while ( have_posts() ) :
			the_post();
			the_content();
		endwhile;
		?>
	</div>

	<ul class="vr-contact-cards" role="list">
		<?php if ( $vr_whatsapp ) : ?>
			<li><a class="vr-contact-card vr-contact-card--primary" href="<?php echo esc_url( $vr_whatsapp ); ?>" target="_blank" rel="noopener">
				<?php echo vr_icon( 'whatsapp' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="vr-contact-card__label"><?php esc_html_e( 'WhatsApp', 'verry-rarre' ); ?></span>
				<span class="vr-contact-card__value"><?php esc_html_e( 'Chat with us', 'verry-rarre' ); ?></span>
			</a></li>
		<?php endif; ?>
		<?php if ( $vr_email ) : ?>
			<li><a class="vr-contact-card" href="<?php echo esc_url( 'mailto:' . $vr_email ); ?>">
				<?php echo vr_icon( 'mail' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="vr-contact-card__label"><?php esc_html_e( 'Email', 'verry-rarre' ); ?></span>
				<span class="vr-contact-card__value"><?php echo esc_html( $vr_email ); ?></span>
			</a></li>
		<?php endif; ?>
		<?php if ( $vr_phone ) : ?>
			<li><a class="vr-contact-card" href="<?php echo esc_url( 'tel:' . preg_replace( '/[^\d+]/', '', $vr_phone ) ); ?>">
				<?php echo vr_icon( 'phone' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="vr-contact-card__label"><?php esc_html_e( 'Phone', 'verry-rarre' ); ?></span>
				<span class="vr-contact-card__value"><?php echo esc_html( $vr_phone ); ?></span>
			</a></li>
		<?php endif; ?>
		<?php if ( $vr_insta ) : ?>
			<li><a class="vr-contact-card" href="<?php echo esc_url( $vr_insta ); ?>" target="_blank" rel="noopener">
				<?php echo vr_icon( 'instagram' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="vr-contact-card__label"><?php esc_html_e( 'Instagram', 'verry-rarre' ); ?></span>
				<span class="vr-contact-card__value"><?php echo esc_html( '@' . trim( (string) wp_parse_url( $vr_insta, PHP_URL_PATH ), '/' ) ); ?></span>
			</a></li>
		<?php endif; ?>
	</ul>
</div>
<?php
get_footer();
