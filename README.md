# ValueView

ValueView introduces the <code>jQuery.valueview</code> widget which may be used to display and edit data values (DataValue objects defined in the DataValues library and supported via the DataValuesJavaScript package). The valueview widget and its resources may be extended to support custom custom data value implementations.

## Components

### jQuery.valueview (jQuery.valueview.valueview)

<code>jQuery.valueview.valueview</code> may be used to display and edit data values. It can be instantiated via the widget's bridge <code>jQuery.valueview</code>.

### jQuery.valueview.Expert

Experts are widgets that deal with data values. An expert may provide the functionality to display and/or edit a specific data value type or data values suitable for a certain data type. <code>jQuery.valueview.Expert</code> is the base constructor for such experts.

### jQuery.valueview.BifidExpert

<code>jQuery.valueview.BifidExpert</code> is an abstract definition of an expert whose responsibilities are shared by two experts - one expert for edit and one for view mode.

### jQuery.valueview.ExpertFactory

Experts are managed by <code>jQuery.valueview.ExpertFactory</code> instance which provides its experts to <code>jQuery.valueview</code>.

### jQuery.valueview.ViewState

<code>jQuery.valueview.ViewState</code> links experts and <code>jQuery.valueview</code> in form of a facade that allows experts to observe certain aspects of <code>jQuery.valueview</code>.

## Usage

When using <code>jQuery.valueview</code> for handling a data value of some sort, a <code>jQuery.valueview.ExpertFactory</code> with knowledge about an expert dedicated to the used data value type is required and can be set up as follows:

```javascript
var dv = dataValues;
var vv = jQuery.valueview;
var experts = new vv.ExpertFactory();

var stringValue = new dv.StringValue( 'foo' );

// Consider this a data value using the "string" data value type internally:
var urlDataType = dataTypes.getDataType( 'url' );

experts.registerDataValueExpert( vv.experts.StringValue, dv.StringValue.TYPE );

console.log(
  experts.getExpert( stringValue.getType() ) === experts.getExpert( urlDataType.getDataValueType(), urlDataType.getId() )
);
// true because "url" data type's data value type is "string"; The string expert will be used as fallback.

experts.registerDataTypeExpert( vv.experts.UrlType, urlDataType.getId() );

console.log(
  experts.getExpert( stringValue.getType() ) === experts.getExpert( urlDataType.getDataValueType(), urlDataType.getId() )
);
// false because we now have a dedicated expert registered for the "url" data type.
```

The <code>jQuery.valueview.ExpertFactory</code> can now be injected into a new <code>jQuery.valueview</code> which will then be able to present string data values.

```javascript
var $subject = $( '<div/>' ).appendTo( $( 'body' ).empty() );

// In addition to the expert factory, value parser and value formatter factories need to be provided. The feature the same mechanisms than the expert factory. For this example, we just initialize them with the string parser/formatter as default parser/formatter.
var parsers = new valueParsers.ValueParserFactory( valueParsers.StringParser );
var formatters = new valueParsers.ValueFormatterFactory( valueFormatters.StringFormatter );

$subject.valueview( {
  expertProvider: experts,
  valueParserProvider: parsers,
  valueFormatterProvider: formatters,
  value: new dv.StringValue( 'text' )
} );

var valueView = $subject.data( 'valueview' );
```

Having created a <code>jQuery.valueview</code> displaying *text*, <code>valueView.\<memberFn\></code>
will now allow invoking member functions. For example:
* Emptying the view: <code>valueView.value( null );</code>
* Allowing the user to edit the value: <code>valueView.startEditing();</code>
* Stopping the user from editing the value: <code>valueView.stopEditing();</code>
* Returning the current value: <code>valueView.value();</code>

Setting the view to a data value it cannot handle because of lacking a suitable expert will result in a proper error notification being displayed. Calling <code>.value()</code> will still return the value but the user can neither see nor edit the value.

## Running as MediaWiki extension

<code>mediaWiki.ext.valueView</code> may be used to initialize ValueView as MediaWiki extension. Loading <code>mediaWiki.ext.valueView</code> will initialize and fill a <code>jQuery.valueview.ExpertFactory</code> which is issued to <code>jQuery.valueview</code> as default expert provider. Consequently, no custom experts for basic data values and data types need to be registered and <code>jQuery.valueview</code> may be used without passing a custom <code>jQuery.ExpertFactory</code>.

## Release notes

### 0.3 (dev)

#### Enhancements

* Removed dependency on the DataTypes library.
* ExpertFactory may be initialized with a default expert now.

#### Breaking changes

* Changed ExpertFactory mechanisms to comply with ValueFormatterFactory and ValueParserFactory:
 * Removed generic registerExpert() method. registerDataTypeExpert() and registerDataValueExpert() should be used to register experts.
 * Removed additional unused and obsolete functions:
  * getCoveredDataValueTypes()
  * getCoveredDataTypes()
  * hasExpertFor()
  * newExpert()
* Removed CommonsMediaType and UrlType expert registrations from mw.ext.valueView.js since these are supposed to be registered in Wikibase where the corresponding data types are instantiated.
* Replaced jQuery.valueview.valueview's "on" option with "dataTypeId" and "dataValueType" options.

### 0.2.1 (2014-01-30)

#### Enhancements

* Adapted changes of data-values/javascript version 0.3.
* Renamed jQuery.valueview.preview to jQuery.ui.preview

### 0.2 (2014-01-29)

#### Refactorings

* Renamed $.valueview.MessageProvider to util.MessageProvider
* Renamed $.inputAutoExpand to $.inputautoexpand
* Renamed $.nativeEventHandler to $.NativeEventHandler
* Moved $.valueview.MockViewState to $.valueview.tests.MockViewState
* Corrected several MediaWiki resource loader module names (and some file names):
 * $.fn.focusAt -> $.focusAt
 * $.valueview.experts.commonsmediatype -> $.valueview.experts.CommonsMediaType
 * $.valueview.experts.emptyvalue -> $.valueview.experts.EmptyValue
 * $.valueview.experts.globecoordinateinput -> $.valueview.experts.GlobeCoordinateInput
 * $.valueview.experts.globecoordinatevalue -> $.valueview.experts.GlobeCoordinateValue
 * $.valueview.experts.mock -> $.valueview.experts.Mock
 * $.valueview.experts.quantitytype -> $.valueview.experts.QuantityType
 * $.valueview.experts.staticdom -> $.valueview.experts.StaticDom
 * $.valueview.experts.stringvalue -> $.valueview.experts.StringValue
 * $.valueview.experts.timeinput -> $.valueview.experts.TimeInput
 * $.valueview.experts.timevalue -> $.valueview.experts.TimeValue
 * $.valueview.experts.unsupportedvalue -> $.valueview.experts.UnsupportedValue
 * $.valueview.experts.urltype -> $.valueview.experts.UrlType
* Added $.valueview.experts.SuggestedStringValue as a separate resource loader module
* $.valueview.experts.CommonsMediaType does not format on its own, but relies on value formatters.

#### Enhancements

* #6 Added util.Notifier

### 0.1 (2013-12-23)

Initial release.