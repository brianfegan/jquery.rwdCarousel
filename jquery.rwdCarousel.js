/**
 * jquery.rwdCarousel.js
 * @author brianfegan@gmail.com
 */
/*global window, document, jQuery */
(function ($) {
	
	var oDefaults = {
			animateSpeed	: 500,		// milliseconds used for animation
			autoRotateSpeed	: 0,		// milliseconds used for autorotation
			aspectRatio		: null,		// aspect ratio to maintain responsiveness of carousel
			cssTransitions	: false,	// use css transitions
			easing			: 'swing',	// default jQuery easing for animation
			endlessPaging	: true,		// carousel is infinite in either direction
			fnPaginateBegin	: null,		// a callback that fires before a pagination animation begins
			fnPaginateEnd	: null,		// a callback that fires when a pagination animation ends
			itemsPerPage	: 1,		// number of items seen within the mask at a time
			loadIndex		: 0,		// if we want to initialize the carousel to an index other than '0'
			manualResize	: false,	// if set to true, resize method must be manually called
			numToPaginate	: 1,		// number of items to paginate per paginate event
			swipeEvents		: false,	// carousel supports a swipe event from touchswipe plugin
			useThumbnails	: true		// include thumbnails to navigate to click a particular item/page
		},
		methods = {}, // contains publicly accessibly methods
		
		/* Plugin Private methods */
		
		/**
		 * @name $.fn.rwdCarousel-updateCarouselComplete
		 * @function
		 * @description This function gets called after the carousel position has been moved 
		 * either by an animation or by a direct resetting of the left position.
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iDirection Indicates the direction we just updated to.
		 */
		updateCarouselComplete = function (oCarousel, iDirection) {
			
			// if carousel uses css transitions 
			if (oCarousel.cssTransitions) {
				oCarousel.$list.off(oCarousel.TRANSITION_END_STR).removeClass('animate');
			}
		
			// remove the items that are no longer visible
			if (iDirection < 0) {
				oCarousel.$list.children().filter(':gt('+(oCarousel.itemsPerPage-1)+')').remove();
			} else {
				oCarousel.$list.children().filter(':lt('+(oCarousel.numToPaginate)+')').remove();
			}
			
			// reset $activeItems
			oCarousel.$activeItems = oCarousel.$list.children();
			
			// reset css properties
			oCarousel.$list.css('left',0);
			
			// update the new iCurrStartIndex and iCurrPageIndex values
			oCarousel.iCurrStartIndex	= oCarousel.$activeItems.first().data('list-index');
			oCarousel.iCurrPageIndex	= Math.floor(oCarousel.iCurrStartIndex / oCarousel.numToPaginate);
			
			// check and see if we need to enable or disable the pagination buttons
			if ( ! oCarousel.endlessPaging ) { 
				
				// disbable or enable the previous button
				if ( oCarousel.iCurrStartIndex !== 0 ) {
					oCarousel.$btnPrevious.removeClass('disabled');
				} else {
					oCarousel.$btnPrevious.addClass('disabled');
				}
				
				// disbable or enable the next button
				if ( (oCarousel.iCurrStartIndex + oCarousel.itemsPerPage) < oCarousel.iNumItems ) {
					oCarousel.$btnNext.removeClass('disabled');
				} else {
					oCarousel.$btnNext.addClass('disabled');
				}
				
			}
			
			// highlight the current thumbnail anchor
			if (oCarousel.useThumbnails) {
				oCarousel.$thumbnailAnchors.removeClass('active').eq(oCarousel.iCurrPageIndex).addClass('active');
			}
			
			// if there is a callback function, execute it here
			if (typeof oCarousel.fnPaginateEnd === 'function') {
				oCarousel.fnPaginateEnd(oCarousel);
			}
			
			// we are done animating
			oCarousel.bAnimating = false;
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-doSlideAnimation
		 * @function
		 * @description Handles the logic if the animation should be done as a slide.
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iDirection Indicates the direction we just updated to.
		 * @param {array} aTempItems The items we are appending or prepending to the carousel before the animation starts.
		 */
		doSlideAnimation = function (oCarousel, iDirection, aTempItems) {
			
			var iNewLeft;
			
			// for when the direction to update is to the left
			// add the new items BEFORE the existing items
			// reset the left to account for the new items
			// iNewLeft is set to animate to the beginning of $activeItems
			if (iDirection < 0) {
				oCarousel.$activeItems.first().before(aTempItems);
				oCarousel.$list.css('left',(oCarousel.iAnimationLength * -1)+'px');
				iNewLeft = 0;
			}
			
			// for when the direction to update is to the right
			// add the new items AFTER the existing items
			// iNewLeft is set to animate to the end of $activeItems
			else {
				oCarousel.$activeItems.last().after(aTempItems);
				iNewLeft = -(oCarousel.iAnimationLength);
			}
			
			// set opts once
			var opts = {left:iNewLeft};
			
			// if there is a callback function, execute it here
			if (typeof oCarousel.fnPaginateBegin === 'function') {
				oCarousel.fnPaginateBegin(oCarousel, iDirection);
			}
			
			// if this carousel should animate to iNewLeft
			if (oCarousel.animateSpeed) {
				
				// if carousel uses css transitions to animate
				if (oCarousel.cssTransitions) {
					if (oCarousel.$list.css('left') === iNewLeft) {
						updateCarouselComplete(oCarousel, iDirection);
					} else {
						oCarousel.$list.off(oCarousel.TRANSITION_END_STR).on(oCarousel.TRANSITION_END_STR, function(){
							updateCarouselComplete(oCarousel, iDirection);
						}).addClass('animate').css(opts);
					}
				}
				
				// else, fallback to jquery
				else {
					oCarousel.$list.animate(opts, oCarousel.animateSpeed, oCarousel.easing, function () {
						updateCarouselComplete(oCarousel, iDirection);
					});
				}
				
			}
			
			// else, move it instantly to iNewLeft
			else {
				oCarousel.$list.css(opts);
				updateCarouselComplete(oCarousel, iDirection);
			}
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-getAdjustedIndex
		 * @function
		 * @description Takes in an index and checks to see if its valid. If not, it returns the adjusted index
		 * or returns false if the carousel should stop at this limit.
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iDirection Indicates the direction we just updated to.
		 * @param {integer} i The index we are checking against oCarousel.$originalItems.
		 * @return {integer} The valid or invalid index from an oCarousel.$originalItems element.
		 */
		getAdjustedIndex = function (oCarousel, iDirection, i) {
		
			// this is a valid index so return it
			if ( i > -1 && oCarousel.$originalItems.eq(i).length ) {
				return i;
			}
			
			// invalid. if we are paging without limits, get the adjusted index
			else if (oCarousel.endlessPaging) {
				return ((iDirection < 0) ? (i + oCarousel.iNumItems) : (i - oCarousel.iNumItems));
			}
			
			// invalid and we have fixed limits, so return -1
			else {
				return -1;
			}
				
		},
		
		/**
		 * @name $.fn.rwdCarousel-getNewListItems
		 * @function
		 * @description Gets the new list items that will be added to the carousel for the current carousel update
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iDirection Indicates the direction we just updated to.
		 * @param {integer} iNewStartIndex This is the first index of the next or previous items we are adding.
		 * @return {array} An array of html list item elements
		 */
		getNewListItems = function (oCarousel, iDirection, iNewStartIndex) {
			
			var	aTempItems = [],
				iAdjustedIndex,
				i,
				limit;
			
			// we are paginating forward
			if (iDirection > 0) {
				
				// the limit is the index we are starting from PLUS the number of items we are paginating at a time
				limit = iNewStartIndex + oCarousel.numToPaginate;
				
				// loop forward
				for (i=iNewStartIndex; i<limit; i++) {
					
					// get the adjusted index
					iAdjustedIndex = getAdjustedIndex(oCarousel, iDirection, i);
					
					// if its -1, do not retrieve any more items. else, add it to aTempItems
					if (iAdjustedIndex === -1) {
						break;
					} else {
						$.merge(aTempItems, oCarousel.$originalItems.eq(iAdjustedIndex).clone(true, true).data('list-index', iAdjustedIndex));
					}
					
				}
				
				return aTempItems;
				
			}
			
			// we are paginating backward
			else {
				
				// the limit is the index we are starting from MINUS the number of items we are paginating at a time
				limit = iNewStartIndex - oCarousel.numToPaginate;
				
				// loop backward
				for (i=iNewStartIndex; i>limit; i--) {
					
					// get the adjusted index
					iAdjustedIndex = getAdjustedIndex(oCarousel, iDirection, i);
					
					// if its -1, do not retrieve any more items. else, add it to aTempItems
					if (iAdjustedIndex === -1) {
						break;
					} else {
						$.merge(aTempItems, oCarousel.$originalItems.eq(iAdjustedIndex).clone(true, true).data('list-index', iAdjustedIndex));
					}
					
				}
				
				return aTempItems.reverse();
				
			}
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-updateCarousel
		 * @function
		 * @description This method kicks off a single instance of the carousel animation
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iDirection Indicates the direction we just updated to.
		 * @param {integer} iUpdateToIndex An override that can be used to update to a specific index in the list.
		 */
		updateCarousel = function (oCarousel, iDirection, iUpdateToIndex) {
			
			var iNewStartIndex,
				aTempItems;
			
			// We are changing stuff, so prevent any further triggers
			oCarousel.bAnimating = true;
			
			// if a specific index was passed in to get next
			if (iUpdateToIndex !== undefined) {
				iNewStartIndex = iUpdateToIndex;
			}
			
			// get the index of the next or previous item we would want to add to $tempItems
			else {
				iNewStartIndex = (iDirection > 0) ? (oCarousel.iCurrStartIndex + oCarousel.itemsPerPage) : (oCarousel.iCurrStartIndex - 1);
			}
			
			// get an array of the new list items we will add to oCarousel.$activeList
			aTempItems = getNewListItems(oCarousel, iDirection, iNewStartIndex);
			
			// do the animation type for this carousel
			doSlideAnimation(oCarousel, iDirection, aTempItems);
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-clickBtnPaginate
		 * @function
		 * @description Event handler for when a user clicks a pagination button.
		 */
		clickBtnPaginate = function () {
			
			var $anchor		= $(this),
				oCarousel	= $anchor.parents('.carousel').first().data('carousel');
			
			if ( !$anchor.hasClass('disabled') && !oCarousel.bAnimating ) {
				if (oCarousel.oRotateInterval !== undefined) stopAutoRotate(oCarousel);
				updateCarousel(oCarousel, (($anchor.hasClass('btnPrevious')) ? -1 : 1)); // args=oCarousel, iDirection
			}
			
			return false;
		},
		
		/**
		 * @name $.fn.rwdCarousel-clickThumbnailAnchor
		 * @function
		 * @description Event handler for when a user clicks on a thumbnail anchor.
		 */
		clickThumbnailAnchor = function () {
			
			var $anchor			= $(this),
				oCarousel		= $anchor.parents('.carousel').first().data('carousel'),
				iUpdateToIndex	= oCarousel.$thumbnailAnchors.index($anchor) * oCarousel.itemsPerPage;
			
			// update the carousel to the slide/page that starts with this index
			updateToIndex(oCarousel, iUpdateToIndex);
			
			return false;
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-swipeCarousel
		 * @function
		 * @description Callback for a swipe event
		 * @param {object} e
		 * @param {string} dir The direction of the swipe
		 */
		swipeCarousel = function(e, dir, dist) {
			if ( (dir === 'left') || (dir === 'right') ) {
				var oCarousel	= $(this).data('carousel');
				if ( !oCarousel.bAnimating ) {
					var dir = (dir === 'left') ? 1 : -1;
					if ((dir === -1 && !oCarousel.$btnPrevious.hasClass('disabled')) || (dir === 1 && !oCarousel.$btnNext.hasClass('disabled'))) {
						if (oCarousel.oRotateInterval !== undefined) stopAutoRotate(oCarousel);
						updateCarousel(oCarousel, dir); // args=oCarousel, iDirection
					}
				}
			}
		},
		
		/**
		 * @name $.fn.rwdCarousel-setupThumbnails
		 * @function
		 * @description If oCarousel.useThumbnails is true, this function gets called to add the thumbnails
		 * markup to the carousel and set up the click handlers
		 * @param {object} oCarousel The carousel we are working with.
		 */
		setupThumbnails = function (oCarousel) {
			
			var i;
			
			// create the div that will hold the thumbnail anchors
			oCarousel.$thumbnails = $('<div />').attr('class','thumbnails').css({
				'position'		: 'absolute',
				'list-style'	: 'none'
			});
			
			// loop through oCarousel.iNumPages to create the anchors
			// each anchor has a separate class for easy custom styling
			for (i=0; i<oCarousel.iNumPages; i++) {
				$('<a class="tab'+ (i+1) + '" />').attr('href','#').html('<span>'+(i+1)+'</span>').appendTo(oCarousel.$thumbnails);
			}
			
			// save the anchors in a jQuery object
			oCarousel.$thumbnailAnchors = oCarousel.$thumbnails.children();
			
			// set up the click handler for the anchors and initial selected style 
			//oCarousel.$thumbnailAnchors.click(clickThumbnailAnchor).eq(oCarousel.iCurrPageIndex).addClass('active');
			oCarousel.$thumbnailAnchors.click(function(){ return false; }).eq(oCarousel.iCurrPageIndex).addClass('active');
			
			// append the thumbnails to the carousel
			oCarousel.$thumbnails.appendTo(oCarousel.$carousel);
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-updateToIndex
		 * @function
		 * @description Takes in a specific index and updates the carousel to that index.
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} iUpdateToIndex The start index of the next carousel items added.
		 */
		updateToIndex = function(oCarousel, iUpdateToIndex) {
			
			var iDirection;
			
			// if we have an oCarousel, a valid index and the carousel is not currently animating
			if ( oCarousel && !isNaN(parseInt(iUpdateToIndex, 10)) && !oCarousel.bAnimating ) {
				
				// clear the oRotateInterval if it exists
				if (oCarousel.oRotateInterval !== undefined) {
					stopAutoRotate(oCarousel);
				}
					
				// if we are animating forward
				if (iUpdateToIndex > oCarousel.iCurrStartIndex) {
					iDirection = 1;
				}
				
				// if we are animating back, readjust iUpdateToIndex to account for itemsPerPage 
				else if (iUpdateToIndex < oCarousel.iCurrStartIndex) {
					iDirection = -1;
					iUpdateToIndex = iUpdateToIndex + oCarousel.itemsPerPage - 1; 
				}
				
				// else we are already on this page/slide, do nothing
				else {
					return;
				}
				
				// update the carousel
				updateCarousel(oCarousel, iDirection, iUpdateToIndex);
				
			}
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-stopAutoRotate
		 * @function
		 * @description A method to move stop the carousel autorotate.
		 * @param {object} oCarousel The carousel we are working with.
		 */
		stopAutoRotate = function (oCarousel) {
			if (oCarousel) {
				oCarousel.oRotateInterval = window.clearInterval(oCarousel.oRotateInterval);
			}
		},
		
		/**
		 * @name $.fn.rwdCarousel-startAutoRotate
		 * @function
		 * @description Start or restart the carousel autorotate
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {integer} autoRotateSpeed	The interval we use to start or restart the rotate
		 */
		startAutoRotate = function (oCarousel, autoRotateSpeed) {
			
			// if we're auto-rotating
			if (oCarousel && (autoRotateSpeed > 0 || oCarousel.autoRotateSpeed > 0)) {
				
				// reset the carousel autoRotateSpeed property in case its come in from the public method
				if (autoRotateSpeed > 0) {
					oCarousel.autoRotateSpeed = autoRotateSpeed;
				}
				
				// make sure we are not setting this if its already set
				stopAutoRotate(oCarousel);
				
				// set the new interval function
				oCarousel.oRotateInterval = window.setInterval(function () {
					if ( ! oCarousel.endlessPaging && ( oCarousel.$activeItems.last().data('list-index') === (oCarousel.iNumItems-1) ) ) {
						updateCarousel(oCarousel, 1, 0); // args=oCarousel, iDirection, iUpdateToIndex
					} else {
						updateCarousel(oCarousel, 1); // args=oCarousel, iDirection
					}
				}, (oCarousel.autoRotateSpeed + oCarousel.animateSpeed));
				
			}
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-resize
		 * @function
		 * @description Resizes the dimensions of the carousel and its list items.
		 * @param {object} oCarousel The carousel we are working with.
		 */
		resize = function(oCarousel) {
			
			//oCarousel.iCarouselWidth	= oCarousel.$carousel.width();
			oCarousel.iCarouselWidth	= oCarousel.$mask.width();
			oCarousel.iItemWidth		= oCarousel.iCarouselWidth / oCarousel.itemsPerPage;
			oCarousel.iItemHeight		= oCarousel.iItemWidth * oCarousel.aspectRatio;
			oCarousel.iAnimationLength	= oCarousel.iItemWidth * oCarousel.numToPaginate;
			
			// resize list
			oCarousel.$list.css({
				width: (oCarousel.iItemWidth * oCarousel.itemsPerPage * 2) + 'px',
			});
			
			// resize the activeItems AND the $originalItems
			oCarousel.$activeItems.add(oCarousel.$originalItems).css({
				width: oCarousel.iItemWidth+'px',
				height: (oCarousel.iItemWidth / oCarousel.aspectRatio)+'px'
			});
			
			// call resize again if this is our first page load to make sure
			// vertical scroll bar is taken into account if its just been added to the browser
			if (!oCarousel.$carousel.hasClass('initialized')) {
				oCarousel.$carousel.addClass('initialized');
				resize(oCarousel);
			}
			
		},
		
		/**
		 * @name $.fn.rwdCarousel-resetCarouselProps
		 * @function
		 * @description Set carousel properties based on options that may change over the life of the carousel.
		 * @param {object} oCarousel The carousel we are working with.
		 * @param {number} index The starting index for the reset.
		 */
		resetCarouselProps = function(oCarousel, index) {
			
			// add an index to keep track of each item
			oCarousel.$originalItems.each(function(i){
				$(this).data('list-index', i);
			});
			
			// how many pages are there?
			oCarousel.iNumPages	= Math.ceil(oCarousel.iNumItems / oCarousel.numToPaginate);
			
			// this list does not need to have a carousel
			if (oCarousel.iNumItems <= oCarousel.itemsPerPage) {
				return;
			}
			
			// set remaining necessary properties
			oCarousel.bAnimating		= false;
			oCarousel.iCurrStartIndex	= index;
			oCarousel.iCurrPageIndex	= Math.floor(oCarousel.iCurrStartIndex / oCarousel.numToPaginate);
			
			// remove original items and replace with active items which are only the currently visible items
			if (index > 0) {
				oCarousel.$activeItems = oCarousel.$originalItems.clone(true, true).filter(':gt('+(index-1)+')');
				oCarousel.$activeItems = oCarousel.$activeItems.filter(':lt('+(oCarousel.itemsPerPage)+')');
			} else {
				oCarousel.$activeItems = oCarousel.$originalItems.clone(true, true).filter(':lt('+(oCarousel.itemsPerPage)+')');
			}
			
			// add extra items if we are at the end of the carousel and there are items missing
			if (oCarousel.endlessPaging) {
				var diff = oCarousel.itemsPerPage - oCarousel.$activeItems.length;
				if (diff !== 0) {
					oCarousel.$activeItems = oCarousel.$activeItems.add(oCarousel.$originalItems.clone(true, true).filter(':lt('+diff+')'));
				}
			}
			
			// append $activeItems in place of $originalItems
			oCarousel.$list.empty().append(oCarousel.$activeItems);
			
			// if settings include adding thumbnails to load up a particular page group...
			// thumbnails can only be used if this carousel is using fixed limits OR...
			// the total number of items is a multiple of the amount of items per page
			if (oCarousel.$thumbnails) oCarousel.$thumbnails.remove();
			if (oCarousel.useThumbnails && ( oCarousel.endlessPaging === false || (oCarousel.iNumItems % oCarousel.itemsPerPage) === 0 ) ) {
				setupThumbnails(oCarousel);
			} else {
				oCarousel.useThumbnails = false;
			}
			
			// if we're auto-rotating
			if (oCarousel.autoRotateSpeed > 0) {
				startAutoRotate(oCarousel, oCarousel.autoRotateSpeed);
			}
			
			// save this object for later use
			//oCarousel.$carousel.data('carousel', oCarousel);
			
		};
	
	/**
	 * @name $.fn.rwdCarousel.init
	 * @function
	 * @description A publicly accessible initialize method that gets called on an element or series of elements.
	 * @param {object} oOptions Options that can be used to override plugin default settings.
	 * @return {object} The jQuery object passed into the plugin.
	 */
	methods.init = function (oOptions) {
		
		// Loop through the jQuery objects passed in
		this.each(function () {
			
			var $carousel	= $(this),
				oCarousel	= $carousel.data('carousel');
			
			// only do this if we have not initialized the plugin on this element yet
			if ( ! oCarousel ) {
							
				// Set up carousel object for each individual carousel targeted
				// Extend the defaults and options into this carousel instance
				oCarousel = {};
				$.extend(oCarousel, oDefaults, oOptions || {});
				
				oCarousel.$carousel			= $carousel;
				oCarousel.$mask				= oCarousel.$carousel.find('.mask');
				oCarousel.$list				= oCarousel.$mask.children();
				oCarousel.$originalItems	= oCarousel.$list.children();
				oCarousel.iNumItems			= oCarousel.$originalItems.length;
				
				if (oCarousel.cssTransitions) {
					oCarousel.TRANSITION_END_STR = 'webkitTransitionEnd transitionend oTransitionEnd';
				}
				
				// make sure necessary css is set
				if (oCarousel.$carousel.css('position') !== 'absolute') {
					oCarousel.$carousel.css('position', 'relative');
				}
				oCarousel.$mask.css({
					position: 'relative',
					overflow: 'hidden'
				});
				oCarousel.$list.css({
					'position'		: 'relative',
					'list-style'	: 'none',
					'margin'		: 0,
					'padding'		: 0,
					'left'			: 0
				});
				oCarousel.$originalItems.css('float', 'left');
				
				// was an aspect ratio passed in?
				if (oCarousel.aspectRatio === null) {
					oCarousel.aspectRatio = oCarousel.$mask.width() / oCarousel.$mask.height();
				}
				
				// set up swipe event if supported
				if (oCarousel.swipeEvents) {
					oCarousel.$carousel.swipe({
						allowPageScroll: 'vertical',
						fallbackToMouseEvents: false,
						swipe: swipeCarousel
					});
				}
				
				// add previous and next buttons
				oCarousel.$btnPrevious	= $('<a />').attr({'class':'btnPrevious btnPaginate disabled', 'href':'#'}).css('position','absolute').appendTo(oCarousel.$carousel);
				oCarousel.$btnNext		= $('<a />').attr({'class':'btnNext btnPaginate', 'href':'#'}).css('position','absolute').appendTo(oCarousel.$carousel);
				
				// if we are using endless pagination, enable the btnPrevious link on init
				if (oCarousel.endlessPaging) {
					oCarousel.$btnPrevious.removeClass('disabled');
				}
				
				// attach event to btnPaginate click
				$('.btnPaginate', oCarousel.$carousel).click(clickBtnPaginate);
				
				// set the remaining carousel properties
				resetCarouselProps(oCarousel, oCarousel.loadIndex);
				
				// resize carousel using current width and aspect ratio
				resize(oCarousel);
				
				// set up resize event if instance is not set to use manual resizing
				if (oCarousel.manualResize === false) {
					$(window).on('resize', function(){
						resize(oCarousel);
					});
				}
				
				// save this object for later use
				$carousel.data('carousel', oCarousel);
				
			}
			
		});
		
		return this;
			
	};
	
	/**
	 * @name $.fn.rwdCarousel.updateToIndex
	 * @function
	 * @description A publicly accessible method to move the carousel to a specific index.
	 * @param {integer} iUpdateToIndex The index we are updating the carousel to.
	 * @return {object} The jQuery object passed into the plugin.
	 */
	methods.updateToIndex = function (iUpdateToIndex) {
		updateToIndex(this.data('carousel'), iUpdateToIndex);
		return this;
	};
	
	/**
	 * @name $.fn.rwdCarousel.resize
	 * @function
	 * @description A publicly accessible method to force the carousel to resize.
	 * @return {object} The jQuery object passed into the plugin.
	 */
	methods.resize = function () {
		resize(this.data('carousel'));
		return this;
	};
	
	/**
	 * @name $.fn.rwdCarousel.updateOptions
	 * @function
	 * @description A publicly accessible method that allows for updating options on an existing carousel.
	 * @param {object} opts Updated carousel options.
	 * @param {integer} iUpdateToIndex The index we are currently on in case itemsPerPage is changing.
	 */
	methods.updateOptions = function (opts, iUpdateToIndex) {
		var oCarousel = this.data('carousel');
		$.extend(oCarousel, opts);
		this.data('carousel', oCarousel);
		resetCarouselProps(oCarousel, iUpdateToIndex);
		resize(oCarousel);
		return this;
	};
	
	/**
	 * @name $.fn.rwdCarousel.resize
	 * @function
	 * @description A publicly accessible method to move start or restart the carousel autorotate.
	 * @param {integer} autoRotateSpeed	The interval we use to start or restart the rotate.
	 * @return {object} The jQuery object passed into the plugin.
	 */
	methods.startAutoRotate = function (autoRotateSpeed) {
		startAutoRotate(this.data('carousel'), autoRotateSpeed);
		return this;
	};
	
	/**
	 * @name $.fn.rwdCarousel.stopAutoRotate
	 * @function
	 * @description A publicly accessible method to move stop the carousel autorotate.
	 * @return {object} The jQuery object passed into the plugin.
	 */
	methods.stopAutoRotate = function () {
		stopAutoRotate(this.data('carousel'));
		return this;
	};
		
	/**
	 * @name $.fn.rwdCarousel
	 * @function
	 * @description Set up the jQuery plugin and chaining
	 * @param {mixed} method Either the public method we want to call, an options object, or a param needed for the method being called.
	 */
	$.fn.rwdCarousel = function (method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		}		
	};
	
}(jQuery));
