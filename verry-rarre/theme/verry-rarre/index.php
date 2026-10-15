<?php
/**
 * Fallback template: blog posts, search results and archives.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<div class="vr-container vr-page">
	<header class="vr-page__head">
		<h1 class="vr-page__title">
			<?php
			if ( is_search() ) {
				/* translators: %s: search term */
				printf( esc_html__( 'Results for “%s”', 'verry-rarre' ), esc_html( get_search_query() ) );
			} elseif ( is_archive() ) {
				echo wp_kses_post( get_the_archive_title() );
			} elseif ( is_home() && ! is_front_page() ) {
				single_post_title();
			} else {
				esc_html_e( 'Journal', 'verry-rarre' );
			}
			?>
		</h1>
	</header>

	<?php if ( have_posts() ) : ?>
		<div class="vr-posts">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'vr-post-card' ); ?>>
					<?php if ( has_post_thumbnail() ) : ?>
						<a href="<?php the_permalink(); ?>" class="vr-post-card__media" tabindex="-1" aria-hidden="true"><?php the_post_thumbnail( 'vr-tile' ); ?></a>
					<?php endif; ?>
					<h2 class="vr-post-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="vr-post-card__excerpt"><?php the_excerpt(); ?></div>
				</article>
			<?php endwhile; ?>
		</div>
		<?php the_posts_pagination(); ?>
	<?php else : ?>
		<p><?php esc_html_e( 'Nothing found.', 'verry-rarre' ); ?></p>
		<p><a class="vr-btn" href="<?php echo esc_url( vr_shop_url() ); ?>"><?php esc_html_e( 'Go to the shop', 'verry-rarre' ); ?></a></p>
	<?php endif; ?>
</div>
<?php
get_footer();
