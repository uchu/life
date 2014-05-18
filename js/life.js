/*
	Game of Life by Pavel Burylichev
	pavel.burylichev@gmail.com
*/

$( function () {
	var Life = {
		init: function () {
			this.space = [];
			this.width = Math.pow( 2, 64 );
			this.height = Math.pow( 2, 64 );
			this.cellSize = 5;
			this.interval = 100;
			this.timer = undefined;
			this.$canvas = $('#life_canvas');
			this.ctx = this.$canvas[0].getContext('2d');
			this.mouseDown = false;
			this.$run = $('#life_run');
			this.$stop = $('#life_stop');
			this.$clear = $('#life_clear');
			this.$save = $('#life_save');
			this.$delete = $('#delete_preset');
			this.$presetName = $('#preset_name'); 
			this.$presets = $('#life_presets');
			this.presets = {
				Default: '49:40,49:39,49:38,50:38,51:39,49:49,49:50,49:51,48:51,47:50,55:45,56:45,57:45,42:45,41:45,40:45,57:46,56:47,40:44,41:43'
			};
			this.emptyColor = '#F5F5FF';
			this.liveColor = '#FFCC99';
			this.playing = false;
			
			this.$canvas
				.on('mousemove click', _.bind( this.cellClicked, this ) )
				[0].onselectstart = function () {
					 return false;
				};
				
			$( document )
				.on('mousedown', _.bind( function () {
					this.mouseDown = true;
				}, this ) )
				.on('mouseup', _.bind( function () {
					this.mouseDown = false;
				}, this ) )
				.on('selectstart', function () {
					 return false;
				});
			
			this.$run
				.on('click', _.bind( function () {
					this.stop();
					this.playing = true;
					this.timer = setInterval( _.bind( this.tick, this ), this.interval );
				}, this ) );
				
			this.$stop
				.on('click', _.bind( this.stop, this ) );
				
			this.$clear
				.on('click', _.bind( function () {
					this.stop()
					this.space = [];
					this.draw();
				}, this ) );
				
			this.$save
				.on('click', _.bind( this.savePreset, this ) );
				
			this.$delete
				.on('click', _.bind( this.deletePreset, this ) );
			
			this.$presets
				.on('change', _.bind( function () {
					this.loadPreset( this.$presets.val() );
				}, this ) );
			
			if ( this.supportsLS && localStorage.getItem('life') &&  localStorage.getItem('life') != '{}' ) {
				this.presets = JSON.parse( localStorage.getItem('life') );
			}
			
			_.each ( this.presets, _.bind( function ( value, n, i ) {
				var 
					$option = $('<option />');
				
				$option
					.text( n )
					.val( n );
					
				this.$presets.append( $option );
			}, this ) );
			
			if ( this.$presets.find('option').length ) {
				this.loadPreset( this.$presets.find('option:first').val() );
			} else {
				this.draw();
			}
		},
		draw: function () {
			this.ctx.fillStyle = this.emptyColor;
			for ( var x = 0; x < 100; x ++ ) {
				for ( var y = 0; y < 100; y ++ ) {
					this.ctx.fillStyle = _.contains( this.space, x + ':' + y ) ? this.liveColor : this.emptyColor;
					this.drawCell( x, y );
				}
			}
		},
		drawCell: function ( x, y ) {
			this.ctx.fillRect( x * ( this.cellSize + 1 ) , y * ( this.cellSize + 1 ), this.cellSize, this.cellSize);
		},
		tick: function () {
			var 
				list = this.space,
				toRemove = [],
				toMake = [],
				neighboursCache = [],
				countNeighbours = function ( x, y ) {
					if ( neighboursCache[ x + ':' + y ] ) return neighboursCache[ x + ':' + y ];
					var _neighbours = 0;
					for ( var ix = -1 ; ix < 2; ix ++ ) {
						for ( var iy = -1 ; iy < 2; iy ++ ) {
							if ( ix != 0 || iy != 0 ) {
								if ( _.contains( list, ( x + ix ) + ':' + ( y + iy ) ) ) {
									_neighbours ++;
								}
							}
						}
					}
					neighboursCache[ x + ':' + y ] = _neighbours;
					return _neighbours;
				};

			for ( var i = 0; i < list.length; i ++ ) {
				var
					xy = list[i].split(':'),
					x = parseInt( xy[0] ),
					y = parseInt( xy[1] ),
					neighbours = countNeighbours( x, y);
				
				if ( neighbours == 1 || neighbours == 2 ) {
					for ( var ix = -1 ; ix < 2; ix ++ ) {
						for ( var iy = -1 ; iy < 2; iy ++ ) {
							if ( ix != 0 || iy != 0 ) {
								if ( ! _.contains( list, ( x + ix ) + ':' + ( y + iy ) ) ) {
									if ( countNeighbours( x + ix, y + iy ) == 3 ) {
										toMake.push( ( x + ix ) + ':' + ( y + iy ) );
									}
								}
							}
						}
					}
				}
				
				if ( neighbours < 2 || neighbours > 3 ) {
					toRemove.push( x + ':' + y );
				}
			}
			
			toMake = _.uniq( toMake );
			toRemove = _.uniq( toRemove );

			for ( var i = 0; i < toMake.length; i ++ ) {	
				var xy = toMake[i].split(':');
				this.space.push( toMake[i] );
				this.ctx.fillStyle = this.liveColor;
				this.drawCell( xy[0], xy[1] );
			}

			for ( var i = 0; i < toRemove.length; i ++ ) {
				var xy = toRemove[i].split(':');	
				this.space.splice( _.indexOf( this.space, toRemove[i] ), 1 );
				this.ctx.fillStyle = this.emptyColor;
				this.drawCell( xy[0], xy[1] );
			}
		},
		cellClicked: function ( e ) {
			if ( !this.mouseDown && e.type != 'click' || this.playing ) return;
			var 
				x = Math.floor( ( e.pageX - (this.cellSize) / 2 - this.$canvas.offset().left ) / ( this.cellSize + 1 ) ),
				y = Math.floor( ( e.pageY - (this.cellSize) / 2 - this.$canvas.offset().top ) / ( this.cellSize + 1 ) ),
				xy = x + ':' + y,
				i = _.indexOf( this.space, xy );
				
			if ( e.shiftKey ) {
				this.space.splice( i, 1 );
				this.ctx.fillStyle = this.emptyColor;
			} else {
				if ( !_.contains( this.space, xy ) ) {
					this.space.push( xy );
					this.ctx.fillStyle = this.liveColor;
				}
			}
			this.drawCell( x, y );
		},
		savePreset: function () {
			if ( ! this.$presetName.val() ) return;
			this.stop();
			
			var $option = $('<option />')
				.text( this.$presetName.val() )
				.val( this.$presetName.val() );
				
			this.$presets.append( $option );
			this.presets[ this.$presetName.val() ] = this.space.join()
			this.supportsLS && localStorage.setItem( 'life', JSON.stringify( this.presets ) );
			this.$presetName.val('');
		},
		loadPreset: function ( n ) {
			this.stop();
			this.space = this.presets[ n ].split(',');
			this.draw();
		},
		deletePreset: function () {
			this.stop();
			var $preset = this.$presets.find('option:selected');
			delete this.presets[ $preset.val() ];
			this.supportsLS && localStorage.setItem( 'life', JSON.stringify ( this.presets ) );
			$preset.remove();
			this.space = [];
			this.draw();
		},
		stop: function () {
			this.playing = false;
			clearInterval( this.timer );
		},
		supportsLS: ( function () {
			try {
				return 'localStorage' in window && window['localStorage'] !== null;
			} catch (e) {
				return false;
			}
		})()
	}
	
	Life.init();
} );