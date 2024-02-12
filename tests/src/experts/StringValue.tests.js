/**
 * @param QUnit
 * @param valueview
 * @license GNU GPL v2+
 * @author Daniel Werner < daniel.a.r.werner@gmail.com >
 */
( function( QUnit, valueview ) {
	'use strict';

	const testExpert = valueview.tests.testExpert;

	QUnit.module( 'jquery.valueview.experts.StringValue' );

	testExpert( {
		expertConstructor: valueview.experts.StringValue
	} );

}( QUnit, jQuery.valueview ) );
