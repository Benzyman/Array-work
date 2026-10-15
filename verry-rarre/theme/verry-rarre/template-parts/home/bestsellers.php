<?php
/**
 * Best-selling products (by number of orders).
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_bestsellers' ) ) {
	return;
}
?>
<section class="vr-section vr-container" aria-labelledby="vr-bestsellers-title" data-reveal>
	<?php
	get_template_part(
		'template-parts/home/section-head',
		null,
		array(
			'title' => vr_mod( 'vr_bestsellers_title' ),
			'link'  => add_query_arg( 'orderby', 'popularity', vr_shop_url() ),
			'index' => '04',
			'id'    => 'vr-bestsellers-title',
		)
	);
	get_template_part(
		'template-parts/home/product-grid',
		null,
		array( 'shortcode' => sprintf( '[products limit="%d" best_selling="true" visibility="visible"]', absint( vr_mod( 'vr_bestsellers_count' ) ) ) )
	);
	?>
</section>
