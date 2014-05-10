/**
 * @licence GNU GPL v2+
 * @author Adrian Lang < adrian.lang@wikimedia.de >
 */

( function( $, ExpertExtender, testExpertExtenderExtension, sinon, QUnit, CompletenessTest ) {
	'use strict';

	QUnit.module( 'jquery.valueview.ExpertExtender.LanguageSelector' );

	if( QUnit.urlParams.completenesstest ) {
		new CompletenessTest( ExpertExtender.LanguageSelector.prototype, function( cur, tester, path ) {
			return false;
		} );
	}

	testExpertExtenderExtension.constructor(
		ExpertExtender.LanguageSelector,
		new ExpertExtender.LanguageSelector( new util.MessageProvider(), function() { } )
	);
	testExpertExtenderExtension.destroy(
		ExpertExtender.LanguageSelector,
		new ExpertExtender.LanguageSelector( new util.MessageProvider(), function() { } )
	);
	testExpertExtenderExtension.init(
		new ExpertExtender.LanguageSelector( new util.MessageProvider(), function() { } )
	);

	QUnit.test( 'value changes if upstream value changes', function( assert ) {
		var upstreamValue = 'en';
		var languageSelector = new ExpertExtender.LanguageSelector( new util.MessageProvider( {
			messageGetter: function( key ) {
				return arguments.length > 1 ? Array.prototype.slice.call( arguments, 1 ).join( ' ' ) : key;
			}
		} ), function() {
			return upstreamValue;
		} );
		var $extender = $( '<div />' );

		languageSelector.init( $extender );
		languageSelector.draw();

		assert.equal( languageSelector.getValue(), 'en' );

		upstreamValue = 'de';
		languageSelector.draw();
		assert.equal( languageSelector.getValue(), 'de' );
	} );

} )(
	jQuery,
	jQuery.valueview.ExpertExtender,
	jQuery.valueview.tests.testExpertExtenderExtension,
	sinon,
	QUnit,
	CompletenessTest
);