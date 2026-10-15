<?php
/**
 * Standard page (About, policies, Cart, Checkout, My Account…).
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	$vr_is_store_page = function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() );
	?>
	<article <?php post_class( 'vr-container vr-page' . ( $vr_is_store_page ? ' vr-page--store' : '' ) ); ?>>
		<header class="vr-page__head">
			<h1 class="vr-page__title"><?php the_title(); ?></h1>
		</header>
		<div class="vr-page__content vr-prose">
			<?php the_content(); ?>
		</div>
	</article>
	<?php
endwhile;

get_footer();
