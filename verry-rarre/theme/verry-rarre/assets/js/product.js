/**
 * VERRY RARRE — product page size/colour buttons.
 *
 * WooCommerce shows variation choices (Size, Colour…) as drop-down menus.
 * This turns each drop-down into a row of buttons. The original drop-down
 * stays in the page (hidden) and is still what WooCommerce reads, so
 * prices, stock and "Add to cart" keep working exactly as normal.
 * Uses jQuery because WooCommerce's variation form is built on it.
 */
( function ( $ ) {
	'use strict';

	function buildSwatches( $form ) {
		$form.find( '.variations select' ).each( function () {
			var $select = $( this );
			if ( $select.data( 'vrSwatches' ) ) {
				return;
			}
			$select.data( 'vrSwatches', true );

			var label = $form.find( 'label[for="' + this.id + '"]' ).text() || $select.attr( 'name' );
			var $group = $( '<div class="vr-swatches" role="group"></div>' ).attr( 'aria-label', label );

			$select.find( 'option' ).each( function () {
				if ( ! this.value ) {
					return; // Skip "Choose an option".
				}
				$( '<button type="button" class="vr-swatch"></button>' )
					.text( $( this ).text() )
					.attr( 'data-value', this.value )
					.attr( 'aria-pressed', 'false' )
					.appendTo( $group );
			} );

			$group.on( 'click', '.vr-swatch', function () {
				var value = $( this ).attr( 'data-value' );
				// Clicking the selected button again clears it.
				$select.val( $select.val() === value ? '' : value ).trigger( 'change' );
			} );

			$select.closest( 'td' ).addClass( 'has-swatches' );
			$select.after( $group );
		} );

		syncSwatches( $form );
	}

	// Mirror the drop-downs: selected value + options WooCommerce has disabled.
	function syncSwatches( $form ) {
		$form.find( '.variations select' ).each( function () {
			var $select = $( this );
			var current = $select.val();
			var $group = $select.siblings( '.vr-swatches' );

			$group.find( '.vr-swatch' ).each( function () {
				var $btn = $( this );
				var value = $btn.attr( 'data-value' );
				var $option = $select.find( 'option' ).filter( function () {
					return this.value === value;
				} );
				var available = $option.length && ! $option.prop( 'disabled' ) && ! $option.hasClass( 'disabled' );

				$btn.attr( 'aria-pressed', String( value === current ) );
				$btn.prop( 'disabled', ! available );
			} );
		} );
	}

	$( function () {
		$( '.variations_form' ).each( function () {
			var $form = $( this );
			buildSwatches( $form );
			$form.on( 'woocommerce_update_variation_values reset_data change', function () {
				syncSwatches( $form );
			} );
		} );
	} );
}( jQuery ) );
