<?php
/**
 * Grid of collection (product category) tiles.
 * Used on the homepage and on the Collections page.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_terms = $args['terms'] ?? array();
if ( ! $vr_terms ) {
	return;
}
?>
<ul class="vr-tiles vr-tiles--<?php echo absint( min( count( $vr_terms ), 4 ) ); ?>" role="list">
	<?php
	foreach ( $vr_terms as $vr_term ) :
		$vr_thumb = (int) get_term_meta( $vr_term->term_id, 'thumbnail_id', true );
		?>
		<li class="vr-tile">
			<a class="vr-tile__link" href="<?php echo esc_url( get_term_link( $vr_term ) ); ?>">
				<span class="vr-tile__media">
					<?php
					if ( $vr_thumb ) {
						echo wp_get_attachment_image( $vr_thumb, 'vr-tile', false, array( 'loading' => 'lazy', 'alt' => '' ) );
					} else {
						echo '<span class="vr-tile__placeholder" aria-hidden="true">' . esc_html( $vr_term->name ) . '</span>';
					}
					?>
				</span>
				<span class="vr-tile__label">
					<span class="vr-tile__name"><?php echo esc_html( $vr_term->name ); ?></span>
					<span class="vr-tile__count">
						<?php
						/* translators: %d: number of products */
						echo esc_html( sprintf( _n( '%d piece', '%d pieces', $vr_term->count, 'verry-rarre' ), $vr_term->count ) );
						?>
					</span>
				</span>
			</a>
		</li>
	<?php endforeach; ?>
</ul>
