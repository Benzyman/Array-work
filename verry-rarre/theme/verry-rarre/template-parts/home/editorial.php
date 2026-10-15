<?php
/**
 * Editorial / campaign images block.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_editorial' ) ) {
	return;
}

$vr_images = array_filter(
	array(
		vr_mod( 'vr_editorial_image_1' ),
		vr_mod( 'vr_editorial_image_2' ),
		vr_mod( 'vr_editorial_image_3' ),
	)
);
if ( ! $vr_images ) {
	return;
}
?>
<section class="vr-editorial" aria-labelledby="vr-editorial-title" data-reveal>
	<div class="vr-container vr-editorial__grid">
		<div class="vr-editorial__intro">
			<p class="vr-eyebrow">03 — <?php esc_html_e( 'Lookbook', 'verry-rarre' ); ?></p>
			<h2 class="vr-editorial__title" id="vr-editorial-title"><?php echo esc_html( vr_mod( 'vr_editorial_title' ) ); ?></h2>
			<p class="vr-editorial__text"><?php echo esc_html( vr_mod( 'vr_editorial_text' ) ); ?></p>
			<a class="vr-btn vr-btn--light" href="<?php echo esc_url( vr_link_or_shop( 'vr_editorial_link' ) ); ?>">
				<?php echo esc_html( vr_mod( 'vr_editorial_link_text' ) ); ?>
				<?php echo vr_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</a>
		</div>
		<?php foreach ( array_values( $vr_images ) as $vr_i => $vr_src ) : ?>
			<figure class="vr-editorial__img vr-editorial__img--<?php echo absint( $vr_i + 1 ); ?>">
				<img src="<?php echo esc_url( $vr_src ); ?>" alt="" loading="lazy" decoding="async">
			</figure>
		<?php endforeach; ?>
	</div>
	<div class="vr-marquee" aria-hidden="true">
		<span class="vr-marquee__track">
			<?php for ( $vr_i = 0; $vr_i < 4; $vr_i++ ) : ?>
				<span>VERRY RARRE ✦ CONTROVERSY SELL'S ✦ LIVE THE TRUTH ✦ </span>
			<?php endfor; ?>
		</span>
	</div>
</section>
