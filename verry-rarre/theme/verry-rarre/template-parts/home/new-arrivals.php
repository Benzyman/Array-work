<?php
/**
 * Newest products (the most recently published first).
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_arrivals' ) ) {
	return;
}
?>
<section class="vr-section vr-container" aria-labelledby="vr-arrivals-title" data-reveal>
	<?php
	get_template_part(
		'template-parts/home/section-head',
		null,
		array(
			'title' => vr_mod( 'vr_arrivals_title' ),
			'link'  => add_query_arg( 'orderby', 'date', vr_shop_url() ),
			'index' => '01',
			'id'    => 'vr-arrivals-title',
		)
	);
	get_template_part(
		'template-parts/home/product-grid',
		null,
		array( 'shortcode' => sprintf( '[products limit="%d" orderby="date" order="DESC" visibility="visible"]', absint( vr_mod( 'vr_arrivals_count' ) ) ) )
	);
	?>
</section>
