/**
 * @param QUnit
 * @param valueview
 * @license GNU GPL v2+
 * @author Katie Filbert < aude.wiki@gmail.com >
 */
 ( function( QUnit, valueview ) {
	'use strict';

	const testExpert = valueview.tests.testExpert;

	QUnit.module( 'jquery.valueview.experts.UnDeserializableValue' );

	testExpert( {
		expertConstructor: valueview.experts.UnDeserializableValue
	} );

}( QUnit, jQuery.valueview ) );
