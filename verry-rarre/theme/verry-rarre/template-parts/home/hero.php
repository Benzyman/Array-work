<?php
/**
 * Homepage hero: big campaign image, heading and Shop Now button.
 * Edit in Appearance > Customize > Verry Rarre Theme > Homepage: hero.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_hero' ) ) {
	return;
}
?>
<section class="vr-hero" aria-labelledby="vr-hero-title">
	<div class="vr-hero__text">
		<?php if ( vr_mod( 'vr_hero_eyebrow' ) ) : ?>
			<p class="vr-eyebrow"><?php echo esc_html( vr_mod( 'vr_hero_eyebrow' ) ); ?></p>
		<?php endif; ?>
		<h1 class="vr-hero__title" id="vr-hero-title"><?php echo esc_html( vr_mod( 'vr_hero_title' ) ); ?></h1>
		<?php if ( vr_mod( 'vr_hero_text' ) ) : ?>
			<p class="vr-hero__lead"><?php echo esc_html( vr_mod( 'vr_hero_text' ) ); ?></p>
		<?php endif; ?>
		<a class="vr-btn vr-btn--light vr-btn--lg" href="<?php echo esc_url( vr_link_or_shop( 'vr_hero_button_url' ) ); ?>">
			<?php echo esc_html( vr_mod( 'vr_hero_button_text' ) ); ?>
			<?php echo vr_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</a>
	</div>
	<div class="vr-hero__media">
		<img src="<?php echo esc_url( vr_mod( 'vr_hero_image' ) ); ?>" alt="" fetchpriority="high" decoding="async">
	</div>
</section>
