module.exports = ( function( $, vv ) {
	'use strict';

	var PARENT = vv.Expert;

	/**
	 * `Valueview` expert for adding `MultilineTextValue` data value support to `valueview` widget.
	 * @class jQuery.valueview.experts.MultilineTextValue
	 * @extends jQuery.valueview.Expert
	 */
	vv.experts.MultilineTextValue = vv.expert( 'MultilineTextValue', PARENT, function() {
		PARENT.apply( this, arguments );
		this.$input = $( '<div>' ).attr( 'dir', 'ltr' );
	}, {
		/**
		 * The nodes of the input element. The input element will be used to display the value
		 * during edit mode.
		 * @property {jQuery}
		 * @protected
		 * @readonly
		 */
		$input: null,
		minRows: 1,
		maxRows: 10,

		/**
		 * @inheritdoc
		 */
		init: function() {
			var notifier = this._viewNotifier;

			mw.loader.using('ext.codeEditor.ace').then(() => {
				var widget = this,
					basePath = mw.config.get('wgExtensionAssetsPath', '');

				this.$input
					// .addClass('oo-ui-element-hidden')
					.addClass(this.uiBaseClass + '-input')
					.addClass('ve-ui-mwAceEditorWidget')
					.appendTo(this.$viewPort);

				if (basePath.slice(0, 2) === '//') {
					// ACE uses web workers, which have importScripts, which don't like relative links.
					basePath = window.location.protocol + basePath;
				}
				ace.config.set( 'basePath', basePath + '/CodeEditor/modules/ace' );

				this.editor = ace.edit(this.$input[0]);
				this.editor.setOptions({
					minLines: this.minRows || 1,
					maxLines: this.maxRows || 5,
					tabSize: 4,
					useSoftTabs: true,
				});

				this.editor.getSession().on('change', () => notifier.notify('change'));
				// this.editor.renderer.on( 'resize', this.onEditorResize.bind( this ) );
				this.setEditorValue(this.viewState().getTextValue());
				this.editor.resize();

				PARENT.prototype.init.call(this);
			});

			// Do not stop editing when the user hits ENTER or ESC.  CTRL+ENTER still works.
			this.$input.on( 'keydown', function( event ) {
				if ( ( event.keyCode === $.ui.keyCode.ENTER && !event.ctrlKey )
				|| event.keyCode === $.ui.keyCode.ESCAPE ) {
					event.stopPropagation();
				}
			} );
		},

		setEditorValue: function ( value ) {
			var selectionState;
			if ( value !== this.editor.getValue() ) {
				selectionState = this.editor.session.selection.toJSON();
				this.editor.setValue( value );
				this.editor.session.selection.fromJSON( selectionState );
			}
			return this;
		},

		/**
		 * @inheritdoc
		 */
		destroy: function() {
			if ( this.$input ) {
				this.$input.off( 'eachchange' );
				this.$input = null;
			}

			PARENT.prototype.destroy.call( this ); // empties viewport
		},

		/**
		 * @inheritdoc
		 * @return {string}
		 */
		rawValue: function() {
			return this.editor.getValue();
		},

		/**
		 * @inheritdoc
		 */
		draw: function() {
			// Resize textarea to fit the value (which might be empty):
			this._resizeInput();

			// disable/enable input box
			this.$input.prop( 'disabled', this.viewState().isDisabled() );

			PARENT.prototype.draw.call( this );

			return $.Deferred().resolve().promise();
		},

		/**
		 * Will resize the input box to fit its current content.
		 * @protected
		 */
		_resizeInput: function() {
			this.$input.inputautoexpand( {
				expandWidth: false, // TODO: make this optional on valueview level
				expandHeight: true,
				suppressNewLine: false // TODO: make this optional/leave it to parser options
			} );
		},

		/**
		 * @inheritdoc
		 */
		focus: function() {
			// Move text cursor to the end of the textarea:
			this.$input.focusAt( 'end' );
		},

		/**
		 * @inheritdoc
		 */
		blur: function() {
			this.$input.blur();
		}
	} );

	return vv.experts.MultilineTextValue;

}( jQuery, jQuery.valueview ) );
