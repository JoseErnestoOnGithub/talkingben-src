(function () {

	console.log("MRAID object loading...");

	var mraid = window.mraid = {};

	/***************************************************************************
	 * VERSION
	 **************************************************************************/

	var VERSION = "2.0";

	/***************************************************************************
	 * Supported methods:
		- Event
			o addEventListener
			o removeEventListener
			o fireErrorEvent
			o fireReadyEvent
			o fireSizeChangeEvent
			o fireStateChangeEvent
			o fireViewableChangeEvent
		- Getters
			o getCurrentPosition
			o getDefaultPosition
			o getExpandProperties
			o getMaxSize
			o getOrientationProperties
			o getPlacementType
			o getResizeProperties
			o getScreenSize
			o getState
			o getVersion
			o isViewable
		- Setters
			o setExpandProperties
			o setOrientationProperties
			o setResizeProperties
			o setCurrentPosition
			o setDefaultPosition
			o setExpandSize
			o setMaxSize
			o setPlacementType
			o setScreenSize
			o setSupports
		- UI actions
			o open
			o close
			o useCustomClose
			o expand
			o resize
		- Native support features
			o storePicture
			o supports
			o playVideo
			o createCalendarEvent

	 **************************************************************************/

	/***************************************************************************
	 * Logging utils
	 **************************************************************************/

	 mraid.LogLevelEnum = {
		"DEBUG"   				: 0,
		"WARNING" 				: 1,
		"ERROR"   				: 2,
		"NONE"    				: 3
	};

	mraid.logLevel = mraid.LogLevelEnum.NONE;
	var log = {};

	log.d = function(msg) {
		if (mraid.logLevel <= mraid.LogLevelEnum.DEBUG) {
			console.log("(D-mraid.js) " + msg);
		}
	};

	log.w = function(msg) {
		if (mraid.logLevel <= mraid.LogLevelEnum.WARNING) {
			console.log("(W-mraid.js) " + msg);
		}
	};

	log.e = function(msg) {
		if (mraid.logLevel <= mraid.LogLevelEnum.ERROR) {
			console.log("(E-mraid.js) " + msg);
		}
	};

	/***************************************************************************
	 * Constants
	 **************************************************************************/

	var STATES = mraid.STATES = {
		"LOADING" 		: "loading",
		"DEFAULT" 				: "default",
		"EXPANDED" 				: "expanded",
		"RESIZED" 				: "resized",
		"HIDDEN" 				: "hidden"
	};

	var PLACEMENT_TYPES = mraid.PLACEMENT_TYPES = {
		"INLINE" 				: "inline",
		"INTERSTITIAL" 			: "interstitial"
	};

	var RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION = mraid.RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION = {
		"TOP_LEFT" 				: "top-left",
		"TOP_CENTER" 			: "top-center",
		"TOP_RIGHT" 			: "top-right",
		"CENTER" 				: "center",
		"BOTTOM_LEFT" 			: "bottom-left",
		"BOTTOM_CENTER"			: "bottom-center",
		"BOTTOM_RIGHT" 			: "bottom-right"
	};

	var ORIENTATION_PROPERTIES_FORCE_ORIENTATION = mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION = {
		"PORTRAIT" 				: "portrait",
		"LANDSCAPE"				: "landscape",
		"NONE" 					: "none"
	};

	var EVENTS = mraid.EVENTS = {
		"ERROR" 				: "error",
		"READY" 				: "ready",
		"SIZECHANGE" 			: "sizeChange",
		"STATECHANGE" 			: "stateChange",
		"VIEWABLECHANGE"		: "viewableChange"
	};

	// var SUPPORTED_FEATURES = mraid.SUPPORTED_FEATURES = {
	// 	"SMS" 					: "sms",
	// 	"TEL" 					: "tel",
	// 	"CALENDAR" 				: "calendar",
	// 	"STOREPICTURE" 			: "storePicture",
	// 	"INLINEVIDEO" 			: "inlineVideo"
	// };

	/***************************************************************************
	 * State
	 **************************************************************************/

	var state 					= STATES.LOADING;
	var placementType 			= PLACEMENT_TYPES.INLINE;
	var supportedFeatures 		= {};
	var isViewable 				= false;
	var isExpandPropertiesSet 	= false;
	var isResizeReady 			= false;

	var supportedNativeFeatureProperties = {
 		sms						: false,
 		tel						: false,
 		calendar 				: false,
 		storePicture 			: false,
 		inlineVideo 			: false
 	};

	var expandProperties = {
		"width" 				: 0,
		"height" 				: 0,
		"useCustomClose" 		: false,
		"isModal" 				: true
	};

	var adjustments 			= {
		"x"						: 0,
		"y"						: 0
	};

	var orientationProperties = {
		"allowOrientationChange": true,
		"forceOrientation" 		: ORIENTATION_PROPERTIES_FORCE_ORIENTATION.NONE
	};

	var resizeProperties = {
		"width" 				: 0,
		"height" 				: 0,
		"customClosePosition" 	: RESIZE_PROPERTIES_CUSTOM_CLOSE_POSITION.TOP_RIGHT,
		"offsetX" 				: 0,
		"offsetY" 				: 0,
		"allowOffscreen" 		: true
	};

	var currentPosition = {
		"x" 					: 0,
		"y" 					: 0,
		"width" 				: 0,
		"height" 				: 0
	};

	var defaultPosition = {
		"x" 					: 0,
		"y" 					: 0,
		"width" 				: 0,
		"height" 				: 0
	};

	var maxSize = {
		"width" 				: 0,
		"height" 				: 0
	};

	var screenSize = {
		"width" 				: 0,
		"height" 				: 0
	};

	var currentOrientation 		= 0;

	var listeners 				= {};

	/***************************************************************************
	 ***************************************************************************
	 **
	 ** METHOD IMPLEMENTATITONS
	 **
	 ***************************************************************************
	 **************************************************************************/


	/***************************************************************************
	 * Event related methods
	 **************************************************************************/

	// API: method called by creative
	mraid.addEventListener = function(event, listener) {
		log.d("mraid.addEventListener " + event + ": " + String(listener));
		if (!event || !listener) {
			mraid.fireErrorEvent("Both event and listener are required.", "addEventListener");
		} else if (!contains(event, EVENTS)) {
			mraid.fireErrorEvent("Unknown MRAID event: " + event, "addEventListener");
		} else {
			var listenersForEvent = listeners[event] = listeners[event] || [];
			// check to make sure that the listener isn't already registered
			for (var i = 0; i < listenersForEvent.length; i++) {
				var str1 = String(listener);
				var str2 = String(listenersForEvent[i]);
				if (listener === listenersForEvent[i] || str1 === str2) {
					log.d("listener " + str1 + " is already registered for event " + event);
					return;
				}
			}
			listenersForEvent.push(listener);
		}
	};

	// API: method called by creative
	mraid.removeEventListener = function(event, listener) {
		log.d("mraid.removeEventListener " + event + " : " + String(listener));
		if (!event) {
			mraid.fireErrorEvent("Event is required.", "removeEventListener");
		} else if (!contains(event, EVENTS)) {
			mraid.fireErrorEvent("Unknown MRAID event: " + event, "removeEventListener");
		} else if (listeners.hasOwnProperty(event)) {
			if (listener) {
				var listenersForEvent = listeners[event];
				// try to find the given listener
				var len = listenersForEvent.length;
				for (var i = 0; i < len; i++) {
					var registeredListener = listenersForEvent[i];
					var str1 = String(listener);
					var str2 = String(registeredListener);
					if (listener === registeredListener || str1 === str2) {
						listenersForEvent.splice(i, 1);
						break;
					}
				}
				if (i === len) {
					log.d("listener " + str1 + " not found for event " + event);
				}
				if (listenersForEvent.length === 0) {
					delete listeners[event];
				}
			} else {
				// no listener to remove was provided, so remove all listeners
				// for given event
				delete listeners[event];
			}
		} else {
			log.d("no listeners registered for event " + event);
		}
	};

	// SDK: method called by native
	mraid.fireErrorEvent = function(message, action) {
		log.d("mraid.fireErrorEvent " + message + " " + action);
		fireEvent(mraid.EVENTS.ERROR, message, action);
	};

	// SDK: method called by native
	mraid.fireReadyEvent = function() {
		log.d("mraid.fireReadyEvent");
		fireEvent(mraid.EVENTS.READY);
	};

	// SDK: method called by native
	mraid.fireSizeChangeEvent = function(width, height) {
		log.d("mraid.fireSizeChangeEvent " + width + "x" + height);
		if (state !== mraid.STATES.LOADING) {
			fireEvent(mraid.EVENTS.SIZECHANGE, width, height);
		}
	};

	// SDK: method called by native
	mraid.fireStateChangeEvent = function(newState) {
	    if (state === mraid.STATES.LOADING) {
	      log.d("mraid.fireStateChangeEvent - Native initialized.");
	    }
		log.d("mraid.fireStateChangeEvent " + newState);
		if (state !== newState) {
			state = newState;
			fireEvent(mraid.EVENTS.STATECHANGE, state);
		}
	};

	// SDK: method called by native
	mraid.fireViewableChangeEvent = function(newIsViewable) {
		log.d("mraid.fireViewableChangeEvent " + newIsViewable);
		if (isViewable !== newIsViewable) {
			isViewable = newIsViewable;
			fireEvent(mraid.EVENTS.VIEWABLECHANGE, isViewable);
		}
	};

	/***************************************************************************
	 * Getter methods
	 **************************************************************************/

	// API: method called by creative
	mraid.getCurrentPosition = function() {
		log.d("mraid.getCurrentPosition");
		return currentPosition;
	};

	// API: method called by creative
	mraid.getDefaultPosition = function() {
		log.d("mraid.getDefaultPosition");
		return defaultPosition;
	};

	// API: method called by creative
	mraid.getExpandProperties = function() {
		log.d("mraid.getExpandProperties");
		return expandProperties;
	};

	// API: method called by creative
	mraid.getMaxSize = function() {
		log.d("mraid.getMaxSize");
		return maxSize;
	};

	// API: method called by creative
	mraid.getOrientationProperties = function() {
		log.d("mraid.getOrientationProperties");
		return orientationProperties;
	};

	// API: method called by creative
	mraid.getPlacementType = function() {
		log.d("mraid.getPlacementType");
		return placementType;
	};

	// API: method called by creative
	mraid.getResizeProperties = function() {
		log.d("mraid.getResizeProperties");
		return resizeProperties;
	};

	// API: method called by creative
	mraid.getScreenSize = function() {
		log.d("mraid.getScreenSize");
		return screenSize;
	};

	// API: method called by creative
	mraid.getState = function() {
		log.d("mraid.getState");
		return state;
	};

	// API: method called by creative
	mraid.getVersion = function() {
		log.d("mraid.getVersion");
		return VERSION;
	};

	// API: method called by creative
	mraid.isViewable = function() {
		log.d("mraid.isViewable");
		return isViewable;
	};

	/***************************************************************************
	 * Setter methods
	 **************************************************************************/

	// API: method called by creative
	mraid.setExpandProperties = function(properties) {
		log.d("mraid.setExpandProperties");

		if (!validate(properties, "setExpandProperties")) {
			log.e("failed validation");
			return;
		}

		var oldUseCustomClose = expandProperties.useCustomClose;

		// expandProperties contains 3 read-write properties: width, height, and useCustomClose;
		// the isModal property is read-only
		var rwProps = [ "width", "height", "useCustomClose" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				expandProperties[propname] = properties[propname];
			}
		}

		// In MRAID v2.0, all expanded ads by definition cover the entire screen,
		// so the only property that the native side has to know about is useCustomClose.
		// (That is, the width and height properties are not needed by the native code.)
		if (expandProperties.useCustomClose !== oldUseCustomClose) {
			callNative("usecustomclose?useCustomClose="	+ expandProperties.useCustomClose);
		}

		isExpandPropertiesSet = true;
	};

	// API: method called by creative
	mraid.setOrientationProperties = function(properties) {
		log.d("mraid.setOrientationProperties");

		if (!validate(properties, "setOrientationProperties")) {
			log.e("failed validation");
			return;
		}

		var newOrientationProperties = {};
		newOrientationProperties.allowOrientationChange = orientationProperties.allowOrientationChange,
		newOrientationProperties.forceOrientation = orientationProperties.forceOrientation;

		// orientationProperties contains 2 read-write properties:
		// allowOrientationChange and forceOrientation
		var rwProps = [ "allowOrientationChange", "forceOrientation" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				newOrientationProperties[propname] = properties[propname];
			}
		}

		// Setting allowOrientationChange to true while setting forceOrientation
		// to either portrait or landscape
		// is considered an error condition.
		if (newOrientationProperties.allowOrientationChange
				&& newOrientationProperties.forceOrientation !== mraid.ORIENTATION_PROPERTIES_FORCE_ORIENTATION.NONE) {
			mraid.fireErrorEvent(
					"allowOrientationChange is true but forceOrientation is "
					+ newOrientationProperties.forceOrientation,
					"setOrientationProperties");
			return;
		}

		orientationProperties.allowOrientationChange = newOrientationProperties.allowOrientationChange;
		orientationProperties.forceOrientation = newOrientationProperties.forceOrientation;

		var params = "allowOrientationChange="
				+ orientationProperties.allowOrientationChange
				+ "&forceOrientation=" + orientationProperties.forceOrientation;

		callNative("setOrientationProperties?" + params);
	};

	// API: method called by creative
	mraid.setResizeProperties = function(properties) {
		log.d("mraid.setResizeProperties");

		isResizeReady = false;

		// resizeProperties contains 6 read-write properties:
		// width, height, offsetX, offsetY, customClosePosition, allowOffscreen

		// The properties object passed into this function must contain width, height, offsetX, offsetY.
		// The remaining two properties are optional.
		var requiredProps = [ "width", "height", "offsetX", "offsetY" ];
		for (var i = 0; i < requiredProps.length; i++) {
			var propname = requiredProps[i];
			if (!properties.hasOwnProperty(propname)) {
				mraid.fireErrorEvent(
						"required property " + propname + " is missing",
						"mraid.setResizeProperties");
				return;
			}
		}

		if (!validate(properties, "setResizeProperties")) {
			mraid.fireErrorEvent("failed validation", "mraid.setResizeProperties");
			return;
		}

        adjustments = { "x": 0, "y": 0 };

		var allowOffscreen = properties.hasOwnProperty("allowOffscreen") ? properties.allowOffscreen : resizeProperties.allowOffscreen;
        if (!allowOffscreen) {
            if (properties.width > maxSize.width || properties.height > maxSize.height) {
                mraid.fireErrorEvent("resize width or height is greater than the maxSize width or height", "mraid.setResizeProperties");
                return;
            }
            adjustments = fitResizeViewOnScreen(properties);
        } else if (!isCloseRegionOnScreen(properties)) {
            mraid.fireErrorEvent("close event region will not appear entirely onscreen", "mraid.setResizeProperties");
            return;
        }

		var rwProps = [ "width", "height", "offsetX", "offsetY", "customClosePosition", "allowOffscreen" ];
		for (var i = 0; i < rwProps.length; i++) {
			var propname = rwProps[i];
			if (properties.hasOwnProperty(propname)) {
				resizeProperties[propname] = properties[propname];
			}
		}

		isResizeReady = true;
	};

	// SDK: method called by native
	mraid.setCurrentPosition = function(x, y, width, height) {
		log.d("mraid.setCurrentPosition " + x + "," + y + "," + width + ","	+ height);

		var previousSize = {};
		previousSize.width = currentPosition.width;
		previousSize.height = currentPosition.height;
		log.d("previousSize " + previousSize.width + "," + previousSize.height);

		currentPosition.x = x;
		currentPosition.y = y;
		currentPosition.width = width;
		currentPosition.height = height;

		if (width !== previousSize.width || height !== previousSize.height) {
			mraid.fireSizeChangeEvent(width, height);
		}
	};

	// SDK: method called by native
	mraid.setDefaultPosition = function(x, y, width, height) {
		log.d("mraid.setDefaultPosition " + x + "," + y + "," + width + ","	+ height);
		defaultPosition.x = x;
		defaultPosition.y = y;
		defaultPosition.width = width;
		defaultPosition.height = height;
	};

	// SDK: method called by native
	mraid.setExpandSize = function(width, height) {
		log.d("mraid.setExpandSize " + width + "x" + height);
		expandProperties.width = width;
		expandProperties.height = height;
	};

	// SDK: method called by native
	mraid.setMaxSize = function(width, height) {
		log.d("mraid.setMaxSize " + width + "x" + height);
		maxSize.width = width;
		maxSize.height = height;
	};

	// SDK: method called by native
	mraid.setPlacementType = function(pt) {
		log.d("mraid.setPlacementType " + pt);
		placementType = pt;
	};

	// SDK: method called by native
	mraid.setScreenSize = function(width, height) {
		log.d("mraid.setScreenSize " + width + "x" + height);
		screenSize.width = width;
		screenSize.height = height;
		if (!isExpandPropertiesSet) {
			expandProperties.width = width;
			expandProperties.height = height;;
		}
	};

	// SDK: method called by native
	mraid.setSupports = function(sms, tel, calendar, storePicture, inlineVideo) {
		supportedNativeFeatureProperties = {
      		sms: sms,
      		tel: tel,
      		calendar: calendar,
      		storePicture: storePicture,
      		inlineVideo: inlineVideo
    	};
	};

	/***************************************************************************
	 * UI action methods
	 **************************************************************************/

	// API: method called by creative
	mraid.open = function(url) {
		log.d("mraid.open " + url);
    	if (!url) {
    		mraid.fireErrorEvent("URL is required.", "mraid.open");
    	} else {
			callNative("open?url=" + encodeURIComponent(url));
		}
	};

	// API: method called by creative
	mraid.close = function() {
		log.d("mraid.close");
		if (state === STATES.LOADING
				|| (state === STATES.DEFAULT && placementType === PLACEMENT_TYPES.INLINE)
				|| state === STATES.HIDDEN) {
			// do nothing
			return;
		}
		callNative("close");
	};

	// API: method called by creative
	mraid.useCustomClose = function(isCustomClose) {
		log.d("mraid.useCustomClose " + isCustomClose);
		if (expandProperties.useCustomClose !== isCustomClose) {
			expandProperties.useCustomClose = isCustomClose;
			callNative("usecustomclose?shouldUseCustomClose="
					+ expandProperties.useCustomClose);
		}
	};

	// API: method called by creative
	mraid.expand = function(url) {
		if (url === undefined) {
			log.d("mraid.expand (1-part)");
		} else {
			log.d("mraid.expand " + url);
		}
		// The only time it is valid to call expand is when the ad is
		// a banner currently in either default or resized state.
		if (placementType !== PLACEMENT_TYPES.INLINE
				|| (state !== STATES.DEFAULT && state !== STATES.RESIZED)) {
			return;
		}
		if (url === undefined) {
			callNative("expand?shouldUseCustomClose=" + expandProperties.useCustomClose);
		} else {
			callNative("expand?shouldUseCustomClose=" + expandProperties.useCustomClose + "&url=" + encodeURIComponent(url));
		}
	};

	// API: method called by creative
	mraid.resize = function() {
		log.d("mraid.resize");
		// The only time it is valid to call resize is when the ad is
		// a banner currently in either default or resized state.
		// Trigger an error if the current state is expanded.
		if (placementType === PLACEMENT_TYPES.INTERSTITIAL
			|| state === STATES.LOADING
			|| state === STATES.HIDDEN) {
			// do nothing
			return;
		}
		if (state === STATES.EXPANDED) {
			mraid.fireErrorEvent("mraid.resize called when ad is in expanded state", "mraid.resize");
			return;
		}
		if (!isResizeReady) {
			mraid.fireErrorEvent("mraid.resize is not ready to be called", "mraid.resize");
			return;
		}

        var params =
			"width=" + resizeProperties.width +
			"&height=" + resizeProperties.height +
	        "&offsetX=" + (resizeProperties.offsetX + adjustments.x || 0) +
	        "&offsetY=" + (resizeProperties.offsetY + adjustments.y || 0) +
			"&customClosePosition=" + resizeProperties.customClosePosition +
			"&allowOffscreen=" + (!!resizeProperties.allowOffscreen);
		callNative("resize?" + params);
	};

	/***************************************************************************
	 * Native support feature methods
	 **************************************************************************/

	// API: method called by creative
	mraid.storePicture = function(url) {
		log.d("mraid.storePicture " + url);
		if (!mraid.isViewable()) {
			mraid.fireErrorEvent("storePicture cannot be called until the ad is viewable", "storePicture");
		} else if (!url) {
	      	mraid.fireErrorEvent("storePicture must be called with a valid URL", "storePicture");
	    } else {
			callNative("storePicture?uri=" + encodeURIComponent(url));
		}
	};

	// API: method called by creative
	mraid.supports = function(feature) {
  		return supportedNativeFeatureProperties[feature];
  	};

	// API: method called by creative
	mraid.playVideo = function(url) {
		log.d("mraid.playVideo " + url);
		if (!mraid.isViewable()) {
			mraid.fireErrorEvent("playVideo cannot be called until the ad is viewable", "playVideo");
		} else if (!url) {
	      	mraid.fireErrorEvent("playVideo must be called with a valid URL", "playVideo");
	    } else {
			callNative("playVideo?uri=" + encodeURIComponent(url));
		}
	};

	// API: method called by creative
	mraid.createCalendarEvent = function(parameters) {
		// NOT SUPPORTED ON NATIVE
		log.d("mraid.createCalendarEvent with " + parameters);
		callNative("createCalendarEvent?eventJSON="	+ JSON.stringify(parameters));
	};

	/***************************************************************************
	 * Helper methods
	 **************************************************************************/

	 function callNative(command) {
		var iframe = document.createElement("IFRAME");
		iframe.setAttribute("src", "mraid://" + command);
		document.documentElement.appendChild(iframe);
		iframe.parentNode.removeChild(iframe);
		iframe = null;
	};

	function fireEvent(event) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		log.d("fireEvent " + event + " [" + args.toString() + "]");
		var eventListeners = listeners[event];
		if (eventListeners) {
            eventListeners = eventListeners.slice();
			var len = eventListeners.length;
			log.d(len + " listener(s) found");
			for (var i = 0; i < len; i++) {
				eventListeners[i].apply(null, args);
			}
		} else {
			log.d("no listeners found");
		}
	};

	function contains(value, array) {
		for ( var i in array) {
			if (array[i] === value) {
				return true;
			}
		}
		return false;
	};

	// The action parameter is a string which is the name of the setter function
	// which called this function
	// (in other words, setExpandPropeties, setOrientationProperties, or
	// setResizeProperties).
	// It serves both as the key to get the the appropriate set of validating
	// functions from the allValidators object
	// as well as the action parameter of any error event that may be thrown.
	function validate(properties, action) {
		var retval = true;
		var validators = allValidators[action];
		for (var prop in properties) {
			var validator = validators[prop];
			var value = properties[prop];
			if (validator && !validator(value)) {
				mraid.fireErrorEvent("Value of property " + prop + " (" + value	+ ") is invalid", "mraid." + action);
				retval = false;
			}
		}
		return retval;
	};

	var allValidators = {
		"setExpandProperties" : {
			// In MRAID 2.0, the only property in expandProperties we actually care about is useCustomClose.
			// Still, we'll do a basic sanity check on the width and height properties, too.
			"width" : function(width) {
				return !isNaN(width);
			},
			"height" : function(height) {
				return !isNaN(height);
			},
			"useCustomClose" : function(useCustomClose) {
				return (typeof useCustomClose === "boolean");
			}
		},
		"setOrientationProperties" : {
			"allowOrientationChange" : function(allowOrientationChange) {
				return (typeof allowOrientationChange === "boolean");
			},
			"forceOrientation" : function(forceOrientation) {
				var validValues = [ "portrait", "landscape", "none" ];
				return (typeof forceOrientation === "string" && validValues.indexOf(forceOrientation) !== -1);
			}
		},
		"setResizeProperties" : {
			"width" : function(width) {
				return !isNaN(width) && 50 <= width;
			},
			"height" : function(height) {
				return !isNaN(height) && 50 <= height;
			},
			"offsetX" : function(offsetX) {
				return !isNaN(offsetX);
			},
			"offsetY" : function(offsetY) {
				return !isNaN(offsetY);
			},
			"customClosePosition" : function(customClosePosition) {
				var validPositions = [ "top-left", "top-center", "top-right",
				                       "center",
				                       "bottom-left", "bottom-center",	"bottom-right" ];
				return (typeof customClosePosition === "string" && validPositions.indexOf(customClosePosition) !== -1);
			},
			"allowOffscreen" : function(allowOffscreen) {
				return (typeof allowOffscreen === "boolean");
			}
		}
	};

    function isCloseRegionOnScreen(properties) {
        log.d("isCloseRegionOnScreen");
        log.d("defaultPosition " + defaultPosition.x + " " + defaultPosition.y);
        log.d("offset " + properties.offsetX + " " + properties.offsetY);

        var resizeRect = {};
        resizeRect.x = defaultPosition.x + properties.offsetX;
        resizeRect.y = defaultPosition.y + properties.offsetY;
        resizeRect.width = properties.width;
        resizeRect.height = properties.height;
        printRect("resizeRect", resizeRect);

		var customClosePosition = properties.hasOwnProperty("customClosePosition") ?
				properties.customClosePosition : resizeProperties.customClosePosition;
        log.d("customClosePosition " + customClosePosition);

        var closeRect = { "width": 50, "height": 50 };

        if (customClosePosition.search("left") !== -1) {
            closeRect.x = resizeRect.x;
        } else if (customClosePosition.search("center") !== -1) {
            closeRect.x = resizeRect.x + (resizeRect.width / 2) - 25;
        } else if (customClosePosition.search("right") !== -1) {
            closeRect.x = resizeRect.x + resizeRect.width - 50;
        }

        if (customClosePosition.search("top") !== -1) {
            closeRect.y = resizeRect.y;
        } else if (customClosePosition === "center") {
            closeRect.y = resizeRect.y + (resizeRect.height / 2) - 25;
        } else if (customClosePosition.search("bottom") !== -1) {
            closeRect.y = resizeRect.y + resizeRect.height - 50;
        }

        var maxRect = { "x": 0, "y": 0 };
        maxRect.width = maxSize.width;
        maxRect.height = maxSize.height;

        return isRectContained(maxRect, closeRect);
    }

    function fitResizeViewOnScreen(properties) {
        log.d("fitResizeViewOnScreen");
        log.d("defaultPosition " + defaultPosition.x + " " + defaultPosition.y);
        log.d("offset " + properties.offsetX + " " + properties.offsetY);

        var resizeRect = {};
        resizeRect.x = defaultPosition.x + properties.offsetX;
        resizeRect.y = defaultPosition.y + properties.offsetY;
        resizeRect.width = properties.width;
        resizeRect.height = properties.height;
        printRect("resizeRect", resizeRect);

        var maxRect = { "x": 0, "y": 0 };
        maxRect.width = maxSize.width;
        maxRect.height = maxSize.height;

        var adjustments = { "x": 0, "y": 0 };

        if (isRectContained(maxRect, resizeRect)) {
            log.d("no adjustment necessary");
            return adjustments;
        }

        if (resizeRect.x < maxRect.x) {
            adjustments.x = maxRect.x - resizeRect.x;
        } else if ((resizeRect.x + resizeRect.width) > (maxRect.x + maxRect.width)) {
            adjustments.x = (maxRect.x + maxRect.width) - (resizeRect.x + resizeRect.width);
        }
        log.d("adjustments.x " + adjustments.x);

        if (resizeRect.y < maxRect.y) {
            adjustments.y = maxRect.y - resizeRect.y;
        } else if ((resizeRect.y + resizeRect.height) > (maxRect.y + maxRect.height)) {
            adjustments.y = (maxRect.y + maxRect.height) - (resizeRect.y + resizeRect.height);
        }
        log.d("adjustments.y " + adjustments.y);

        resizeRect.x = defaultPosition.x + properties.offsetX + adjustments.x;
        resizeRect.y = defaultPosition.y + properties.offsetY + adjustments.y;
        printRect("adjusted resizeRect", resizeRect);

        return adjustments;
    }

    function isRectContained(containingRect, containedRect) {
        log.d("isRectContained");
        printRect("containingRect", containingRect);
        printRect("containedRect", containedRect);
        return (containedRect.x >= containingRect.x &&
            (containedRect.x + containedRect.width) <= (containingRect.x + containingRect.width) &&
            containedRect.y >= containingRect.y &&
            (containedRect.y + containedRect.height) <= (containingRect.y + containingRect.height));
    }

    function printRect(label, rect) {
        log.d(label +
            " [" + rect.x + "," + rect.y + "]" +
            ",[" + (rect.x + rect.width) + "," + (rect.y + rect.height) + "]" +
            " (" + rect.width + "x" + rect.height + ")");
    }

	console.log("MRAID object loaded");
}());