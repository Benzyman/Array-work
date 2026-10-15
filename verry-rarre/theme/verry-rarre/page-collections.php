<?php
/**
 * Collections page. WordPress uses this file automatically for the page
 * whose slug is "collections". It lists every product category.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();

$vr_cats = taxonomy_exists( 'product_cat' ) ? get_terms(
	array(
		'taxonomy'   => 'product_cat',
		'hide_empty' => true,
		'orderby'    => 'menu_order',
		'exclude'    => array( (int) get_option( 'default_product_cat' ) ),
	)
) : array();
?>
<div class="vr-container vr-page vr-page--wide">
	<header class="vr-page__head">
		<h1 class="vr-page__title"><?php the_title(); ?></h1>
		<?php
		while ( have_posts() ) :
			the_post();
			if ( get_the_content() ) {
				echo '<div class="vr-prose">';
				the_content();
				echo '</div>';
			}
		endwhile;
		?>
	</header>
	<?php
	if ( $vr_cats && ! is_wp_error( $vr_cats ) ) {
		get_template_part( 'template-parts/collection-tiles', null, array( 'terms' => $vr_cats ) );
	} else {
		echo '<p>' . esc_html__( 'Collections are coming soon.', 'verry-rarre' ) . '</p>';
	}
	?>
</div>
<?php
get_footer();
