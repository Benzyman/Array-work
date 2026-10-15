<?php
/**
 * Shared section heading with an optional "View all" link.
 * Used as: get_template_part( 'template-parts/home/section-head', null, array( 'title' => '', 'link' => '', 'index' => '01' ) ).
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_args = wp_parse_args(
	$args ?? array(),
	array(
		'title'     => '',
		'link'      => '',
		'link_text' => __( 'View all', 'verry-rarre' ),
		'index'     => '',
		'id'        => '',
	)
);
?>
<div class="vr-section-head">
	<h2 class="vr-section-head__title" <?php echo $vr_args['id'] ? 'id="' . esc_attr( $vr_args['id'] ) . '"' : ''; ?>>
		<?php if ( $vr_args['index'] ) : ?>
			<span class="vr-section-head__index"><?php echo esc_html( $vr_args['index'] ); ?></span>
		<?php endif; ?>
		<?php echo esc_html( $vr_args['title'] ); ?>
	</h2>
	<?php if ( $vr_args['link'] ) : ?>
		<a class="vr-link vr-link--arrow" href="<?php echo esc_url( $vr_args['link'] ); ?>">
			<?php echo esc_html( $vr_args['link_text'] ); ?>
			<?php echo vr_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</a>
	<?php endif; ?>
</div>
