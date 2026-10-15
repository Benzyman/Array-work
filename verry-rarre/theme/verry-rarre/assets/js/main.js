/**
 * VERRY RARRE — site interactions (no jQuery needed).
 *
 * 1. Mobile menu drawer
 * 2. Search panel
 * 3. Header shadow on scroll
 * 4. Shop filter panel
 * 5. Dialogs (size guide)
 * 6. Fade-in sections on scroll
 */
( function () {
	'use strict';

	var body = document.body;

	/* 1. Mobile menu drawer ------------------------------------------------ */
	var drawer = document.querySelector( '[data-drawer]' );
	var drawerOpeners = document.querySelectorAll( '[data-drawer-open]' );
	var lastFocus = null;

	function openDrawer() {
		if ( ! drawer ) {
			return;
		}
		lastFocus = document.activeElement;
		drawer.hidden = false;
		body.classList.add( 'vr-lock' );
		drawerOpeners.forEach( function ( b ) { b.setAttribute( 'aria-expanded', 'true' ); } );
		var first = drawer.querySelector( 'a, button' );
		if ( first ) {
			first.focus();
		}
	}

	function closeDrawer() {
		if ( ! drawer || drawer.hidden ) {
			return;
		}
		drawer.hidden = true;
		body.classList.remove( 'vr-lock' );
		drawerOpeners.forEach( function ( b ) { b.setAttribute( 'aria-expanded', 'false' ); } );
		if ( lastFocus ) {
			lastFocus.focus();
		}
	}

	drawerOpeners.forEach( function ( b ) { b.addEventListener( 'click', openDrawer ); } );
	document.querySelectorAll( '[data-drawer-close]' ).forEach( function ( el ) {
		el.addEventListener( 'click', closeDrawer );
	} );

	/* 2. Search panel ------------------------------------------------------ */
	var searchToggle = document.querySelector( '[data-search-toggle]' );
	var searchPanel = document.getElementById( 'vr-search' );

	if ( searchToggle && searchPanel ) {
		searchToggle.addEventListener( 'click', function () {
			var open = searchPanel.hidden;
			searchPanel.hidden = ! open;
			searchToggle.setAttribute( 'aria-expanded', String( open ) );
			if ( open ) {
				searchPanel.querySelector( 'input[type="search"]' ).focus();
			}
		} );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( 'Escape' !== e.key ) {
			return;
		}
		closeDrawer();
		if ( searchPanel && ! searchPanel.hidden ) {
			searchPanel.hidden = true;
			searchToggle.setAttribute( 'aria-expanded', 'false' );
			searchToggle.focus();
		}
	} );

	/* 3. Header shadow on scroll ------------------------------------------ */
	var header = document.querySelector( '[data-header]' );
	if ( header ) {
		var onScroll = function () {
			header.classList.toggle( 'is-scrolled', window.scrollY > 8 );
		};
		window.addEventListener( 'scroll', onScroll, { passive: true } );
		onScroll();
	}

	/* 4. Shop filter panel ------------------------------------------------ */
	var filterToggle = document.querySelector( '[data-filter-toggle]' );
	var filters = document.querySelector( '[data-filters]' );

	if ( filterToggle && filters ) {
		filterToggle.addEventListener( 'click', function () {
			var open = filters.hidden;
			filters.hidden = ! open;
			filterToggle.setAttribute( 'aria-expanded', String( open ) );
		} );

		// Leave empty fields out of the URL for tidier links.
		filters.addEventListener( 'submit', function () {
			filters.querySelectorAll( 'input, select' ).forEach( function ( field ) {
				if ( ( 'number' === field.type || 'SELECT' === field.tagName ) && '' === field.value ) {
					field.disabled = true;
				}
			} );
		} );
	}

	/* 5. Dialogs (size guide) --------------------------------------------- */
	document.querySelectorAll( '[data-dialog-open]' ).forEach( function ( btn ) {
		var dialog = document.getElementById( btn.getAttribute( 'data-dialog-open' ) );
		if ( ! dialog || 'function' !== typeof dialog.showModal ) {
			return;
		}
		btn.addEventListener( 'click', function () {
			dialog.showModal();
		} );
		dialog.addEventListener( 'click', function ( e ) {
			// Click on the dark backdrop closes the dialog.
			if ( e.target === dialog || e.target.closest( '[data-dialog-close]' ) ) {
				dialog.close();
			}
		} );
	} );

	/* 6. Fade-in sections on scroll --------------------------------------- */
	var revealEls = document.querySelectorAll( '[data-reveal]' );
	if ( 'IntersectionObserver' in window ) {
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting ) {
					entry.target.classList.add( 'is-visible' );
					io.unobserve( entry.target );
				}
			} );
		}, { rootMargin: '0px 0px -10% 0px' } );
		revealEls.forEach( function ( el ) { io.observe( el ); } );
	} else {
		revealEls.forEach( function ( el ) { el.classList.add( 'is-visible' ); } );
	}
}() );
