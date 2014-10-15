jquery.rwdCarousel
==================

A responsive carousel jquery plugin.

<p>This plugin creates a carousel UI from an unordered list of content, nested within a mask and a parent wrapper which contains the mask and generated pagination buttons.</p>
<p>It supports responsive designs, and integration with <a href="http://labs.rampinteractive.co.uk/touchSwipe/demos/">touchSwipe</a> for swipe gestures.</p>
<h2>HTML Setup</h2>
    <div class="carousel">
        <div class="mask">
            <ul>
                <li>Item</li>
                <li>Item</li>
                <li>Item</li>
            </ul>
        </div>
    </div>

<h2>CSS Setup</h2>
<p>The plugin will apply default CSS to the <code>.carousel</code>, <code>.mask</code>, <code>.carousel ul</code>, as well as pagination button elements, but you will need to ensure the width/height dimensions of each list item use the same aspect ratio. This aspect ratio can be passed into the plugin as an option, or else the plugin will use the current width/height of the mask no instantiation to determine the aspect ratio.</p>
<p>To that end, its up to you to set the width/height of the carousel, the mask, and the list items on initial page load so there isn't a layout jump.</p>
    .carousel,
    .mask,
    .carousel > ul {
        width: [value];
        height: [value];
    }
    .carousel > ul > li {
        width: [ul width divided by iPerPage];
        height: [value];
    }
<p>Also, while rwdCarousel supports CSS transitions, if you choose to use them, you will need to specify them in your CSS as the plugin will only update the "left" property of the list and will not apply CSS transition styles. For example...</p>
    .carousel > ul.animate {
        -webkit-transition: left 0.5s ease-in-out;
        -moz-transition: left 0.5s ease-in-out;
        -ms-transition: left 0.5s ease-in-out;
        -o-transition: left 0.5s ease-in-out;
        transition: left 0.5s ease-in-out;
    }

<h2>Options</h2>
    animateSpeed: 500, // milliseconds used for animation
    autoRotateSpeed: 0,	// milliseconds used for autorotation
    aspectRatio: null, // aspect ratio to maintain responsiveness of carousel
    cssTransitions: false, // use css transitions
    easing: 'swing', // default easing for animation
    endlessPaging: true, // carousel endlessly paginates
    fnPaginateBegin: null, // a callback that fires before a pagination animation begins
    fnPaginateEnd: null, // a callback that fires when a pagination animation ends
    itemsPerPage: 1, // number of items seen within the mask at a time
    loadIndex: 0, // if we want to load the carousel to a specific index other than '0'
    manualResize: false, // if set to true, resize method must be manually called
    numToPaginate: 1, // number of items to paginate
    swipeEvents: false,	// carousel supports a swipe event
    useThumbnails: true	// include thumbnails to navigate to click a particular slide/slidegroup
    
<h2>Usage</h2>
    // initialize
    $('.carousel').rwdCarousel(opts);
    
    // update carousel to a specific list item index
    $('.carousel').rwdCarousel('updateToIndex', itemIndex);
    
    // manually resize the carousel
    $('.carousel').rwdCarousel('resize');
    
    // update the options of an existing carousel
    // also takes in an optional list item index to move to
    $('.carousel').rwdCarousel('updateOptions', opts, index);
    
    // start auto rotation, passing in a new value for milliseconds
    $('.carousel').rwdCarousel('startAutoRotate', ms);
    
    // stop auto rotation
    $('.carousel').rwdCarousel('stopAutoRotate', ms);
