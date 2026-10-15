<?php
/**
 * Brand story.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_story' ) ) {
	return;
}
$vr_about = vr_page_url( 'about' );
?>
<section class="vr-story" aria-labelledby="vr-story-title" data-reveal>
	<div class="vr-container vr-story__grid">
		<?php if ( vr_mod( 'vr_story_image' ) ) : ?>
			<figure class="vr-story__media">
				<img src="<?php echo esc_url( vr_mod( 'vr_story_image' ) ); ?>" alt="" loading="lazy" decoding="async">
			</figure>
		<?php endif; ?>
		<div class="vr-story__text">
			<p class="vr-eyebrow">05 — <?php esc_html_e( 'The brand', 'verry-rarre' ); ?></p>
			<h2 class="vr-story__title" id="vr-story-title"><?php echo esc_html( vr_mod( 'vr_story_title' ) ); ?></h2>
			<div class="vr-story__body"><?php echo vr_paragraphs( vr_mod( 'vr_story_text' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
			<?php if ( $vr_about ) : ?>
				<a class="vr-link vr-link--arrow" href="<?php echo esc_url( $vr_about ); ?>"><?php esc_html_e( 'Our story', 'verry-rarre' ); ?> <?php echo vr_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
			<?php endif; ?>
		</div>
	</div>
</section>
