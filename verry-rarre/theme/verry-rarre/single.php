<?php
/**
 * Single blog post.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'vr-container vr-page' ); ?>>
		<header class="vr-page__head">
			<p class="vr-eyebrow"><?php echo esc_html( get_the_date() ); ?></p>
			<h1 class="vr-page__title"><?php the_title(); ?></h1>
		</header>
		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="vr-page__hero"><?php the_post_thumbnail( 'vr-wide' ); ?></figure>
		<?php endif; ?>
		<div class="vr-page__content vr-prose">
			<?php the_content(); ?>
		</div>
	</article>
	<?php
endwhile;

get_footer();
