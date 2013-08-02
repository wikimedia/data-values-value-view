/**
 * Input extender widget
 *
 * The input extender extends an input element with additional contents displayed underneath the.
 * @licence GNU GPL v2+
 * @author H. Snater < mediawiki@snater.com >
 * @author Daniel Werner < daniel.werner@wikimedia.de >
 *
 * @option {jQuery[]} [content] Default/"fixed" extender contents that always should be visible as
 *         long as the extension itself is visible.
 *         Default value: []
 *
 * @option {Function} [initCallback] Function triggered before the extension is being shown for
 *         the first time. This may be used to init some widgets that need to be visible on
 *         initialization for measuring dimension according to their container's styles.
 *         Context of the callback is the widget, first parameter is the extension's DOM in a jQuery
 *         container.
 *
 * @option {boolean} [hideWhenInputEmpty] Whether all of the input extender's contents shall be
 *         hidden when the associated input element is empty.
 *         Default value: true
 *
 * @event animationstep: While the input extender's extension is being animated, this event is
 *        triggered on each animation step. The event forwards the parameters received from the
 *        animation's "step" callback. However, when the animation is finished, the event is
 *        triggered without the second and third parameter.
 *        (1) {jQuery.Event}
 *        (2) {number|undefined} [now]
 *        (3) {jQuery.Tween|undefined} [tween]
 *
 * @event aftertoggle: Triggered after showExtension or hideExtension has been called. At this point
 *        extension() will already return the extension's node but the extension might still not
 *        be visible for the user since the animation has just been started.
 *        (1) {jQuery.Event}
 *
 * @dependency jQuery.Widget
 * @dependency jQuery.eachchange
 */
( function( $ ) {
	'use strict';

	/**
	 * Caches whether the widget is used in a rtl context. This, however, depends on using an "rtl"
	 * class on the document body like it is done in MediaWiki.
	 * @type {boolean}
	 */
	var isRtl = $( 'body' ).hasClass( 'rtl' );

	/**
	 * Collection for keeping track which input extender widgets have their extension shown at the
	 * moment.
	 * @type {jQuery.ui.inputextender}
	 */
	var inputExtendersWithVisibleExtension = ( function() {
		var inputExtenders = [];
		return {
			add: function( inputExtenderInstance ) {
				var index = $.inArray( inputExtenderInstance, inputExtenders );
				if( index < 0 ) {
					inputExtenders.push( inputExtenderInstance );
				}
			},
			remove: function( inputExtenderInstance ) {
				var index = $.inArray( inputExtenderInstance, inputExtenders );
				if( index > -1 ) {
					inputExtenders.splice( index, 1 );
				}
			},
			get: function() {
				// Make sure this is up to date and they are really visible.
				return $.grep( inputExtenders, function( inputExtenderInstance ) {
					return inputExtenderInstance.extensionIsVisible();
				} );
			}
		};
	}() );

	$.widget( 'ui.inputextender', {
		/**
		 * Additional options
		 * @type {Object}
		 */
		options: {
			content: [],
			initCallback: null,
			hideWhenInputEmpty: true,
			position: {
				my: ( isRtl ) ? 'right top' : 'left top',
				at: ( isRtl ) ? 'right bottom' : 'left bottom',
				collision: 'none',
				offset: '-4 2'
			}
		},

		/**
		 * The input extension's node. Will be null until the extension is required for the first
		 * time.
		 *
		 * @private Use extension() instead. extension() will return null if the $extension is not
		 *          being used. $extension might be destroyed in that case in future versions, so
		 *          do not rely on it being set all of the time after its first initialization.
		 * @type {jQuery|null}
		 */
		$extension: null,

		/**
		 * Whether the input extender is in its extended state right now.
		 * @type {boolean}
		 */
		_isExtended: false,

		/**
		 * Caches the timeout when the actual input extender animation should kick in.
		 * @type {Object}
		 */
		_animationTimeout: null,

		/**
		 * Caches the element's offset to determine whether the input extension has to be
		 * repositioned on draw() calls.
		 * @type {Object}
		 */
		_offset: null,

		/**
		 * @see jQuery.Widget._create
		 */
		_create: function() {
			var self = this;

			this.element.addClass( this.widgetBaseClass + '-input' );

			// TODO: focus per mouse and tab should be treated differently. Focus by tab should
			//  leave enough time to tab again, by mouse the extension can be shown immediately.
			this.element
			.on( 'focus.' + this.widgetName, function( event ) {
				if( !self.options.hideWhenInputEmpty || self.element.val() !== '' ) {
					clearTimeout( self._animationTimeout );
					self._animationTimeout = setTimeout( function() {
						self.showExtension();
					}, 250 );
				}
			} )
			.on( 'blur.' + this.widgetName, function( event ) {
				clearTimeout( self._animationTimeout );
				self._animationTimeout = setTimeout( function() {
					self.hideExtension();
				}, 250 );
			} )
			.on( 'keydown.' + this.widgetName, function( event ) {
				if( event.keyCode === $.ui.keyCode.ESCAPE ) {
					self.hideExtension();
				}
				else if(
					self.extensionIsVisible()
					&& event.keyCode === $.ui.keyCode.TAB && !event.shiftKey
				) {
					event.preventDefault();
					// When tabbing out of the input element, focus the first focusable element
					// within the extension.
					var $focusable = self.$extension.find( ':focusable' );
					if( $focusable.length ) {
						$focusable.first().focus();
						clearTimeout( self._animationTimeout );
					}
				}
			} );

			if( this.options.hideWhenInputEmpty ) {
				this.element.eachchange( function( event, oldValue ) {
					if( self.element.val() === '' ) {
						self.hideExtension();
					} else if ( oldValue === '' ) {
						self.showExtension();
					}
				} );
			}

			$( 'html' )
			.off( '.' + this.widgetName )
			// Blurring by clicking away from the widget (one handler is sufficient):
			.on( 'click.' + this.widgetName, function( event ) {
				// Loop through all widgets and hide content when having clicked out of it:
				$( ':' + self.widgetBaseClass ).each( function( i, widgetNode ) {
					var widget = $( widgetNode ).data( self.widgetName ),
						$target = $( event.target );

					// Hide the extension neither it nor the corresponding input element is
					// clicked:
					if( !$target.closest( widget.element.add( widget.$extension ) ).length ) {
						widget.hideExtension();
					}

				} );
			} );

			if( this.element.is( ':focus' ) ) {
				this.showExtension();
			} else {
				this.draw();
			}
		},

		/**
		 * @see jQuery.Widget.destroy
		 */
		destroy: function() {
			if( this.extensionIsActive() ) {
				// Hide extension the official way, make sure events getting triggered.
				this.hideExtension();
			}

			if( this.$extension ) {
				// Stop any ongoing extension hiding animation immediately, jump to its end.
				this.$extension.stop( false, true );
				this.$extension.remove();
				this.$extension = null;
			}

			$.Widget.prototype.destroy.call( this );
		},

		/**
		 * Shows the extension.
		 *
		 * @param {Function} [callback] Invoked as soon as the contents are visible.
		 */
		showExtension: function( callback ) {
			if( !this._isExtended ) {
				this._isExtended = true;
				this.draw( callback );
				this._trigger( 'aftertoggle' );
			}
		},

		/**
		 * Hides the extension.
		 *
		 * @param {Function} [callback] Invoked as soon as the contents are hidden.
		 */
		hideExtension: function( callback ) {
			if( this._isExtended ) {
				this._isExtended = false;
				this.draw( callback );
				this._trigger( 'aftertoggle' );
			}
		},

		/**
		 * Returns the input extension's node or null in case the extension is currently not in its
		 * visible state.
		 *
		 * @return {jQuery|null}
		 */
		extension: function() {
			return this.extensionIsVisible() ? this.$extension : null;
		},

		/**
		 * Returns whether the extension is currently active.
		 *
		 * @return {boolean}
		 */
		extensionIsActive: function() {
			return this._isExtended;
		},

		/**
		 * Returns whether the extension is currently visible. Will still return true after
		 * hideExtension() got called until the hide animation will be completed.
		 *
		 * @return {boolean}
		 */
		extensionIsVisible: function() {
			if( !this.$extension ) {
				return false;
			}
			return this.$extension.is( ':visible' );
		},

		/**
		 * Draws the widget.
		 *
		 * @param {Function} [callback] For private usage only.
		 * TODO: Get rid of "callback", introduce some sort of "animationstart" event instead,
		 *  offering an object allowing to register callback that will be given into the animation's
		 *  options. show/hideExtension can then do a .one() event registration for that one and
		 *  register their callback there.
		 */
		draw: function( /* private: */ callback ) {
			this.element[ this._isExtended ? 'addClass' : 'removeClass' ](
				this.widgetBaseClass + '-extended' );

			this._drawExtension( callback );
		},

		_drawExtension: function( callback ) {
			var extensionIsVisible = this.extensionIsVisible(),
				$extension = this.$extension;

			if( !extensionIsVisible && !this._isExtended ) {
				// Extension not displayed and not supposed to be displayed.
				return;
			}

			if( !$extension ) {
				this.$extension = $extension = this._buildExtension();
				$extension.appendTo( $( 'body' ) );

				if( $.isFunction( this.options.initCallback ) ) {
					$extension.show();
					this.options.initCallback.call( this, $extension );
					$extension.hide();
				}
			}

			// Element needs to be visible to use jquery.ui.position.
			if( !extensionIsVisible ) {
				$extension.show();
				this._reposition();
				$extension.hide();
			} else {
				this._reposition();
			}

			if( extensionIsVisible !== this._isExtended ) {
				// Represent actual expansion status:
				if( this._isExtended ) {
					this._drawExtensionExpansion( callback );
				} else {
					this._drawExtensionRemoval( callback );
				}
			}
		},

		_drawExtensionExpansion: function( callback ) {
			var self = this;

			// When blurring the browser viewport and an re-focusing, Chrome is firing the "focus"
			// event twice. jQuery fadeIn sets the opacity to 0 for the first fadeIn but does not
			// pick up the value when triggering fadeIn the second time.
			if( this.$extension.css( 'opacity' ) === '0' ) {
				this.$extension.css( 'opacity', '1' );
			}

			this.$extension.stop( true ).fadeIn( {
				duration: 150,
				step: function( now, tween ) {
					self._trigger( 'animationstep', null, [ now, tween ] );
				},
				complete: function() {
					if( $.isFunction( callback ) ) {
						callback();
					}
					self._trigger( 'animationstep' );
				}
			} );
			inputExtendersWithVisibleExtension.add( this );
		},

		_drawExtensionRemoval: function( callback ) {
			var self = this;

			this.$extension.stop( true ).fadeOut( {
				duration: 150,
				step: function( now, tween ) {
					self._trigger( 'animationstep', null, [ now, tween ] );
				},
				complete: function() {
					inputExtendersWithVisibleExtension.remove( this );
					if( $.isFunction( callback ) ) {
						callback();
					}
					self._trigger( 'animationstep' );
				}
			} );
		},

		/**
		 * Repositions the extension.
		 */
		_reposition: function() {
			var offset = this.element.offset();

			if(
				this._offset
				&& offset.top === this._offset.top && offset.left === this._offset.left
			) {
				return; // Position has not changed.
			}

			// TODO: Repositioning is not optimal in RTL context when hitting the toggler in the
			//  extension to hide additional input. This seems to be caused by a width
			//  miscalculation which can be debugged with "console.log( this.$extension.width() )".
			this.$extension.position( $.extend( {
				of: this.element
			}, this.options.position ) );

			this._offset = offset;
		},

		_buildExtension: function() {
			var self = this;
			var $closeButton = this._buildExtensionCloseButton();
			var $extension = $( '<div/>', {
				'class': this.widgetBaseClass + '-extension ui-widget-content'
			} );

			$closeButton.append( this.options.content );

			$extension
			.append( $closeButton )
			.on( 'click.' + this.widgetName, function( event ) {
				if( !$( event.target ).closest( $closeButton ).length ) {
					clearTimeout( self._animationTimeout );
					self.showExtension();
				}
			} )
			// TODO: move this out of here, toggler is not even used/known to this widget:
			.on( 'toggleranimationstep.' + this.widgetName, function( event, now, tween ) {
				self._reposition();
				self._trigger( 'animationstep', null, [ now, tween ] );
			} )
			.on( 'keydown.' + this.widgetName, function( event ) {
				// Take care of tabbing out of the extension again:
				if( event.keyCode === $.ui.keyCode.TAB ) {
					var $focusable = self.$extension.find( ':focusable' );

					if( $focusable.first().is( event.target ) && event.shiftKey ) {
						event.preventDefault();
						// Tab back to the input element:
						self.element.focus();
					}
					else if( $focusable.last().is( event.target ) && !event.shiftKey ) {
						event.preventDefault();
						// Tabbing forward out of the extension: Focus the next focusable element
						// after the input element.
						$focusable = $( ':focusable' );
						$focusable.each( function( i, node ) {
							if( self.element.is( node ) ) {
								self.hideExtension();
								$focusable[ ( i + 1 >= $focusable.length ) ? 0 : i + 1 ].focus();
							}
						} );
					}
				}
			} );
			return $extension;
		},

		_buildExtensionCloseButton: function() {
			var self = this,
				$closeButton = $( '<div/>' ),
				$closeIcon = $( '<div/>' ).addClass( 'ui-icon ui-icon-close' );

			$closeButton.addClass( this.widgetBaseClass + '-extension-close ui-state-default' );

			$closeButton.on( 'mouseover.' + this.widgetName, function( event ) {
				$( this ).addClass( 'ui-state-hover' );
			} )
			.on( 'mouseout.' + this.widgetName, function( event ) {
				$( this ).removeClass( 'ui-state-hover' );
			} )
			.on( 'click.' + this.widgetName, function( event ) {
				self.hideExtension();
			} )
			.append( $closeIcon );

			return $closeButton;
		}
	} );

	/**
	 * Returns all the widget instances with currently visible extensions.
	 *
	 * @return {jQuery.ui.inputextender[]}
	 */
	$.ui.inputextender.getInstancesWithVisibleExtensions = function() {
		return inputExtendersWithVisibleExtension.get();
	};

	/**
	 * Will redraw all currently visible extensions of all input extender instances.
	 * This is useful when changing the DOM, making sure that extensions are still next to their
	 * input boxes in case position of the input boxes has changed.
	 */
	$.ui.inputextender.redrawVisibleExtensions = function() {
		$.each( $.ui.inputextender.getInstancesWithVisibleExtensions(), function( i, instance ) {
			instance.draw();
		} );
	};

} )( jQuery );
