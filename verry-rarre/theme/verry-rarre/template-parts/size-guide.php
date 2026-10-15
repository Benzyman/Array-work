<?php
/**
 * Default size guide, shown until you create a page with the slug "size-guide".
 *
 * @package VerryRarre
 */

defined( 'ABSPATH' ) || exit;

$vr_whatsapp = vr_whatsapp_url( __( 'Hi VERRY RARRE, can you help me with sizing?', 'verry-rarre' ) );
?>
<h3><?php esc_html_e( 'How to measure', 'verry-rarre' ); ?></h3>
<ul>
	<li><strong><?php esc_html_e( 'Chest:', 'verry-rarre' ); ?></strong> <?php esc_html_e( 'lay a T-shirt that fits you flat and measure straight across, armpit to armpit.', 'verry-rarre' ); ?></li>
	<li><strong><?php esc_html_e( 'Length:', 'verry-rarre' ); ?></strong> <?php esc_html_e( 'measure from the highest point of the shoulder down to the hem.', 'verry-rarre' ); ?></li>
</ul>
<p><?php esc_html_e( 'Compare your numbers with the measurements in the product description.', 'verry-rarre' ); ?></p>
<?php if ( $vr_whatsapp ) : ?>
	<p><a class="vr-link" href="<?php echo esc_url( $vr_whatsapp ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Not sure? Ask us on WhatsApp', 'verry-rarre' ); ?></a></p>
<?php endif; ?>
<?php if ( current_user_can( 'edit_pages' ) ) : ?>
	<p class="vr-admin-hint"><?php esc_html_e( 'Admins only: add your real size chart by creating a page with the slug "size-guide". Its content will replace this text.', 'verry-rarre' ); ?></p>
<?php endif; ?>
