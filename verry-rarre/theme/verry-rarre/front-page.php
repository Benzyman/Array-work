<?php
/**
 * Homepage.
 *
 * Each section lives in its own file in template-parts/home/.
 * To reorder sections, move the lines below up or down.
 * To hide a section, use Appearance > Customize > Verry Rarre Theme > Homepage sections.
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

get_header();

get_template_part( 'template-parts/home/hero' );
get_template_part( 'template-parts/home/new-arrivals' );
get_template_part( 'template-parts/home/collections' );
get_template_part( 'template-parts/home/editorial' );
get_template_part( 'template-parts/home/bestsellers' );
get_template_part( 'template-parts/home/story' );
get_template_part( 'template-parts/home/newsletter' );

get_footer();
