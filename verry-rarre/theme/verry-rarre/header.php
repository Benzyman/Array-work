<?php
/**
 * Site header: announcement bar, logo, menu, search, account and cart.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_has_wc = class_exists( 'WooCommerce' );
?>
<!doctype html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#0a0a0a">
	<script>document.documentElement.className = document.documentElement.className.replace( 'no-js', 'js' );</script>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'verry-rarre' ); ?></a>

<?php
if ( vr_mod( 'vr_announcement_enabled' ) && vr_mod( 'vr_announcement_text' ) ) :
	$vr_announce_link = vr_mod( 'vr_announcement_link' );
	$vr_announce_text = vr_mod( 'vr_announcement_text' );
	?>
	<div class="vr-announce" role="region" aria-label="<?php esc_attr_e( 'Announcement', 'verry-rarre' ); ?>">
		<?php if ( $vr_announce_link ) : ?><a href="<?php echo esc_url( $vr_announce_link ); ?>" class="vr-announce__link"><?php endif; ?>
		<span class="screen-reader-text"><?php echo esc_html( $vr_announce_text ); ?></span>
		<span class="vr-announce__track" aria-hidden="true">
			<?php for ( $vr_i = 0; $vr_i < 6; $vr_i++ ) : ?>
				<span class="vr-announce__item"><?php echo esc_html( $vr_announce_text ); ?></span>
			<?php endfor; ?>
		</span>
		<?php if ( $vr_announce_link ) : ?></a><?php endif; ?>
	</div>
<?php endif; ?>

<header class="vr-header" data-header>
	<div class="vr-header__inner">
		<div class="vr-header__left">
			<button type="button" class="vr-icon-btn vr-header__burger" aria-expanded="false" aria-controls="vr-drawer" data-drawer-open>
				<?php echo vr_icon( 'menu' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'verry-rarre' ); ?></span>
			</button>
			<nav class="vr-nav" aria-label="<?php esc_attr_e( 'Main', 'verry-rarre' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => 'vr-nav__list',
						'depth'          => 1,
						'fallback_cb'    => 'vr_fallback_menu',
					)
				);
				?>
			</nav>
		</div>

		<a class="vr-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php vr_the_logo(); ?>
		</a>

		<div class="vr-header__right">
			<button type="button" class="vr-icon-btn" aria-expanded="false" aria-controls="vr-search" data-search-toggle>
				<?php echo vr_icon( 'search' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="screen-reader-text"><?php esc_html_e( 'Search', 'verry-rarre' ); ?></span>
			</button>
			<?php if ( $vr_has_wc ) : ?>
				<a class="vr-icon-btn vr-header__account" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>">
					<?php echo vr_icon( 'user' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span class="screen-reader-text"><?php esc_html_e( 'Account', 'verry-rarre' ); ?></span>
				</a>
				<?php echo vr_cart_link_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php endif; ?>
		</div>
	</div>

	<div class="vr-search" id="vr-search" hidden>
		<form role="search" method="get" class="vr-search__form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label for="vr-search-input" class="screen-reader-text"><?php esc_html_e( 'Search products', 'verry-rarre' ); ?></label>
			<input id="vr-search-input" type="search" name="s" placeholder="<?php esc_attr_e( 'Search the store…', 'verry-rarre' ); ?>" value="<?php echo esc_attr( get_search_query() ); ?>">
			<?php if ( $vr_has_wc ) : ?>
				<input type="hidden" name="post_type" value="product">
			<?php endif; ?>
			<button type="submit" class="vr-btn"><?php esc_html_e( 'Search', 'verry-rarre' ); ?></button>
		</form>
	</div>
</header>

<div class="vr-drawer" id="vr-drawer" hidden data-drawer>
	<div class="vr-drawer__backdrop" data-drawer-close></div>
	<div class="vr-drawer__panel" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Menu', 'verry-rarre' ); ?>">
		<div class="vr-drawer__head">
			<span class="vr-mono"><?php esc_html_e( 'Menu', 'verry-rarre' ); ?></span>
			<button type="button" class="vr-icon-btn" data-drawer-close>
				<?php echo vr_icon( 'close' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span class="screen-reader-text"><?php esc_html_e( 'Close menu', 'verry-rarre' ); ?></span>
			</button>
		</div>
		<nav aria-label="<?php esc_attr_e( 'Mobile', 'verry-rarre' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'vr-drawer__list',
					'depth'          => 2,
					'fallback_cb'    => 'vr_fallback_menu',
				)
			);
			?>
		</nav>
		<div class="vr-drawer__foot">
			<?php foreach ( vr_social_links() as $vr_link ) : ?>
				<a class="vr-icon-btn" href="<?php echo esc_url( $vr_link['url'] ); ?>" target="_blank" rel="noopener">
					<?php echo vr_icon( $vr_link['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span class="screen-reader-text"><?php echo esc_html( $vr_link['label'] ); ?></span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</div>

<main id="content" class="vr-main">
