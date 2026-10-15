<?php
/**
 * Featured collections = your top-level product categories.
 * Give a category an image in Products > Categories to make it look its best.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

if ( ! vr_mod( 'vr_show_collections' ) || ! taxonomy_exists( 'product_cat' ) ) {
	return;
}

$vr_cats = get_terms(
	array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'parent'     => 0,
		'number'     => 4,
		'orderby'    => 'menu_order',
		'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
	)
);

if ( ! $vr_cats || is_wp_error( $vr_cats ) ) {
	return;
}
?>
<section class="vr-section vr-container" aria-labelledby="vr-collections-title" data-reveal>
	<?php
	get_template_part(
		'template-parts/home/section-head',
		null,
		array(
			'title' => vr_mod( 'vr_collections_title' ),
			'link'  => vr_page_url( 'collections' ),
			'index' => '02',
			'id'    => 'vr-collections-title',
		)
	);
	get_template_part( 'template-parts/collection-tiles', null, array( 'terms' => $vr_cats ) );
	?>
</section>
