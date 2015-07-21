/*global angular*/
(function (module) {

  module
  .provider('ezfb', function () {

    var NO_CALLBACK = -1;

    /**
     * Specify published apis and executable callback argument index
     *
     * ref: https://developers.facebook.com/docs/reference/javascript/
     */
    var _publishedApis = {
      // core
      api: [1, 2, 3],
      ui: 1,

      // auth
      getAuthResponse: NO_CALLBACK,
      getLoginStatus: 0,
      login: 0,
      logout: 0,

      // event
      'Event.subscribe': 1,
      'Event.unsubscribe': 1,  // not quite a callback though

      // xfbml
      'XFBML.parse': 1,

      // canvas
      'Canvas.Prefetcher.addStaticResource': NO_CALLBACK,
      'Canvas.Prefetcher.setCollectionMode': NO_CALLBACK,
      'Canvas.hideFlashElement': NO_CALLBACK,
      'Canvas.scrollTo': NO_CALLBACK,
      'Canvas.setAutoGrow': NO_CALLBACK,
      'Canvas.setDoneLoading': 0,
      'Canvas.setSize': NO_CALLBACK,
      'Canvas.setUrlHandler': 0,
      'Canvas.showFlashElement': NO_CALLBACK,
      'Canvas.startTimer': NO_CALLBACK,
      'Canvas.stopTimer': 0
    };

    // Default locale
    var _locale = 'en_US';

    // Default init parameters
    var _initParams = {
      // appId      : '{your-app-id}', // App ID from the App Dashboard
      status     : true, // check the login status upon init?
      cookie     : true, // set sessions cookies to allow your server to access the session?
      xfbml      : true,  // parse XFBML tags on this page?

      // version information: https://developers.facebook.com/docs/apps/changelog/
      version    : 'v1.0'
    };
    
    /**
     * Default load SDK function
     *
     * Injectable local: 
     *   ezfbAsyncInit - module's private trigger of FB.init, should always be called to complete the ezfb init process
     *   ezfbLocale    - configured SDK locale
     */
    var _defaultLoadSDKFunction = [
                   '$window', '$document', 'ezfbAsyncInit', 'ezfbLocale',
          function ($window,   $document,   ezfbAsyncInit,   ezfbLocale) {
            // Load the SDK's source Asynchronously
            (function(d){
              var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
              if (d.getElementById(id)) {return;}
              js = d.createElement('script'); js.id = id; js.async = true;
              js.src = "//connect.facebook.net/" + ezfbLocale + "/sdk.js";
              // js.src = "//connect.facebook.net/" + ezfbLocale + "/sdk/debug.js";  // debug
              ref.parentNode.insertBefore(js, ref);
            }($document[0]));

            $window.fbAsyncInit = ezfbAsyncInit;
          }],
        _loadSDKFunction = _defaultLoadSDKFunction;

    /**
     * Default init function
     *
     * Injectable locals: 
     *   ezfbInitParams - parameters provided by ezfbProvider.setInitParams() or ezfb.init()
     */
    var _defaultInitFunction = [
                   '$window', 'ezfbInitParams', 
          function ($window,   ezfbInitParams) {
            // Initialize the FB JS SDK
            $window.FB.init(ezfbInitParams);
          }],
        _initFunction = _defaultInitFunction;

    /**
     * Getter/setter of a config
     *
     * @param  {object} target to be configured object
     * @param  {object} config configuration(optional)
     * @return {*}             copied target if "config" is not given
     */
    function _config(target, config) {
      if (angular.isObject(config)) {
        angular.extend(target, config);
      }
      else {
        return angular.copy(target);
      }
    }

    /**
     * Context and arguments proxy function
     *
     * @param  {function} func    the function
     * @param  {object}   context the context
     * @param  {array}    args    arguments
     * @return {function}         proxied function
     */
    function _proxy(func, context, args) {
      return function () {
        return func.apply(context, args);
      };
    }

    return {
      ////////////////////////////
      // provider configuration //
      ////////////////////////////
      setInitParams: function (params) {
        _config(_initParams, params);
      },
      getInitParams: function () {
        return _config(_initParams);
      },

      setLocale: function(locale) {
        _locale = locale;
      },
      getLocale: function() {
        return _locale;
      },
      
      setLoadSDKFunction: function (func) {
        if (angular.isArray(func) || angular.isFunction(func)) {
          _loadSDKFunction = func;
        }
        else {
          throw new Error('Init function type error.');
        }
      },
      getLoadSDKFunction: function () {
        return _loadSDKFunction;
      },

      setInitFunction: function (func) {
        if (angular.isArray(func) || angular.isFunction(func)) {
          _initFunction = func;
        }
        else {
          throw new Error('Init function type error.');
        }
      },
      getInitFunction: function () {
        return _initFunction;
      },

      //////////
      // $get //
      //////////
      $get: [
               '$window', '$q', '$document', '$parse', '$rootScope', '$injector',
      function ($window,   $q,   $document,   $parse,   $rootScope,   $injector) {
        var _initReady, _ezfb, _savedListeners, _paramsReady, ezfbAsyncInit;

        _savedListeners = {};

        _paramsReady = $q.defer();

        if (_initParams.appId || _initFunction !== _defaultInitFunction) {
          _paramsReady.resolve();
        }

        _initReady = $q.defer();
        
        /**
         * #fb-root check & create
         */
        if (!$document[0].getElementById('fb-root')) {
          $document.find('body').append('<div id="fb-root"></div>');
        }

        // Run load SDK function
        ezfbAsyncInit = function () {
          _paramsReady.promise.then(function() {
            // Run init function
            $injector.invoke(_initFunction, null, {'ezfbInitParams': _initParams});

            _ezfb.$$ready = true;
            _initReady.resolve();
          });
        };
        $injector.invoke(_loadSDKFunction, null, {
          'ezfbAsyncInit': ezfbAsyncInit,
          'ezfbLocale': _locale
        });

        _ezfb = {
          $$ready: false,
          init: function (params) {
            _config(_initParams, params);
            _paramsReady.resolve();
          }
        };

        /**
         * _ezfb initialization
         *
         * Publish FB APIs with auto-check ready state
         */
        angular.forEach(_publishedApis, function (cbArgIndex, apiPath) {
          var getter = $parse(apiPath),
              setter = getter.assign;
          setter(_ezfb, function () {
            var apiCall = _proxy(function (args) {
              var dfd, replaceCallbackAt;

              dfd = $q.defer();

              /**
               * Add or replce original callback function with deferred resolve
               * 
               * @param  {number} index expected api callback index
               */
              replaceCallbackAt = function (index) {
                var func, newFunc;

                func = angular.isFunction(args[index]) ? args[index] : angular.noop;
                newFunc = function () {
                  var funcArgs = Array.prototype.slice.call(arguments);

                  if ($rootScope.$$phase) {
                    // already in angularjs context
                    func.apply(null, funcArgs);
                    dfd.resolve.apply(dfd, funcArgs);
                  }
                  else {
                    // not in angularjs context
                    $rootScope.$apply(function () {
                      func.apply(null, funcArgs);
                      dfd.resolve.apply(dfd, funcArgs);
                    });
                  }
                };

                while (args.length <= index) {
                  args.push(null);
                }

                /**
                 * `FB.Event.unsubscribe` requires the original listener function.
                 * Save the mapping of original->wrapped on `FB.Event.subscribe` for unsubscribing.
                 */
                var eventName;
                if (apiPath === 'Event.subscribe') {
                  eventName = args[0];
                  if (angular.isUndefined(_savedListeners[eventName])) {
                    _savedListeners[eventName] = [];
                  }
                  _savedListeners[eventName].push({
                    original: func,
                    wrapped: newFunc
                  });
                }
                else if (apiPath === 'Event.unsubscribe') {
                  eventName = args[0];
                  if (angular.isArray(_savedListeners[eventName])) {
                    var i, subscribed, l = _savedListeners[eventName].length;
                    for (i = 0; i < l; i++) {
                      subscribed = _savedListeners[eventName][i];
                      if (subscribed.original === func) {
                        newFunc = subscribed.wrapped;
                        _savedListeners[eventName].splice(i, 1);
                        break;
                      }
                    }
                  }
                }

                // Replace the original one (or null) with newFunc
                args[index] = newFunc;
              };

              if (cbArgIndex !== NO_CALLBACK) {
                if (angular.isNumber(cbArgIndex)) {
                  /**
                   * Constant callback argument index
                   */
                  replaceCallbackAt(cbArgIndex);
                }
                else if (angular.isArray(cbArgIndex)) {
                  /**
                   * Multiple possible callback argument index
                   */
                  var i, c;
                  for (i = 0; i < cbArgIndex.length; i++) {
                    c = cbArgIndex[i];

                    if (args.length == c ||
                        args.length == (c + 1) && angular.isFunction(args[c])) {

                      replaceCallbackAt(c);

                      break;
                    }
                  }
                }
              }

              /**
               * Apply back to original FB SDK
               */
              var origFBFunc = getter($window.FB);
              if (!origFBFunc) {
                throw new Error("Facebook API `FB." + apiPath + "` doesn't exist.");
              }
              origFBFunc.apply($window.FB, args);

              return dfd.promise;
            }, null, [Array.prototype.slice.call(arguments)]);

            /**
             * Wrap the api function with our ready promise
             *
             * The only exception is `getAuthResponse`, which doesn't rely on a callback function to get the response
             */
            if (apiPath === 'getAuthResponse') {
              if (angular.isUndefined($window.FB)) {
                throw new Error('`FB` is not ready.');
              }
              return $window.FB.getAuthResponse();
            }
            else if (cbArgIndex === NO_CALLBACK) {
              // Do not return promise for no-callback apis
              _initReady.promise.then(apiCall); 
            }
            else {
              return _initReady.promise.then(apiCall);
            }
          });
        });

        return _ezfb;
      }]
    };
  })

  /**
   * @ngdoc directive
   * @name ng.directive:ezfbXfbml
   * @restrict EAC
   *
   * @description
   * Parse XFBML inside the directive
   *
   * @param {boolean} ezfb-xfbml Reload trigger for inside XFBML,
   *                             should keep only XFBML content inside the directive.
   * @param {expr}    onrender   Evaluated every time content xfbml gets rendered.
   */
  .directive('ezfbXfbml', [
           'ezfb', '$parse', '$compile', '$timeout',
  function (ezfb,   $parse,   $compile,   $timeout) {
    return {
      restrict: 'EAC',
      controller: function () {
        // do nothing
      },
      compile: function (tElm, tAttrs) {
        var _savedHtml = tElm.html();

        return function postLink(scope, iElm, iAttrs) {
          var _rendering = true,
              onrenderExp = iAttrs.onrender,
              onrenderHandler = function () {
                if (_rendering) {
                  if (onrenderExp) {
                    scope.$eval(onrenderExp);
                  }
                  
                  _rendering = false;
                }
              };

          ezfb.XFBML.parse(iElm[0], onrenderHandler);

          /**
           * The trigger
           */
          var setter = $parse(iAttrs.ezfbXfbml).assign;
          scope.$watch(iAttrs.ezfbXfbml, function (val) {
            if (val) {
              _rendering = true;
              iElm.html(_savedHtml);

              $compile(iElm.contents())(scope);
              $timeout(function () {
                ezfb.XFBML.parse(iElm[0], onrenderHandler);
              });

              // Reset the trigger if it's settable
              (setter || angular.noop)(scope, false);
            }
          }, true);

        };
      }
    };
  }]);


  // ref: https://developers.facebook.com/docs/plugins
  var _socialPluginDirectiveConfig = {
    'fbLike': [
      'action', 'colorscheme', 'href', 'kidDirectedSite',
      'layout', 'ref', 'share', 'showFaces', 'width'
    ],
    'fbShareButton': [
      'href', 'layout', 'width'
    ],
    'fbSend': [
      'colorscheme', 'href', 'kidDirectedSite', 'ref'
    ],
    'fbPost': [
      'href', 'width'
    ],
    'fbFollow': [
      'colorscheme', 'href', 'kidDirectedSite', 'layout',
      'showFaces', 'width'
    ],
    'fbComments': [
      'colorscheme', 'href', 'mobile', 'numPosts',
      'orderBy', 'width'
    ],
    'fbCommentsCount': [
      'href'
    ],
    'fbActivity': [
      'action', 'appId', 'colorscheme', 'filter', 'header',
      'height', 'linktarget', 'maxAge', 'recommendations',
      'ref', 'site', 'width'
    ],
    'fbRecommendations': [
      'action', 'appId', 'colorscheme', 'header', 'height',
      'linktarget', 'maxAge', 'ref', 'site', 'width'
    ],
    'fbRecommendationsBar': [
      'action', 'href', 'maxAge', 'numRecommendations',
      'readTime', 'ref', 'side', 'site', 'trigger'
    ],
    'fbLikeBox': [
      'colorscheme', 'forceWall', 'header', 'height',
      'href', 'showBorder', 'showFaces', 'stream', 'width'
    ],
    'fbFacepile': [
      'action', 'appId', 'colorscheme', 'href', 'maxRows',
      'size', 'width'
    ]
  };

  angular.forEach(_socialPluginDirectiveConfig, creatSocialPluginDirective);

  function creatSocialPluginDirective(availableAttrs, dirName) {
    var CLASS_WRAP_SPAN = 'ezfb-social-plugin-wrap',
        STYLE_WRAP_SPAN = 'display: inline-block; width: 0; height: 0; overflow: hidden;';
    
    /**
     * Wrap-related functions
     */
    var _wrap = function ($elm) {
          var tmpl = '<span class="'+CLASS_WRAP_SPAN+'" style="'+STYLE_WRAP_SPAN+'">';
          return $elm.wrap(tmpl).parent();
        },
        _isWrapped = function ($elm) {
          return $elm.parent().hasClass(CLASS_WRAP_SPAN);
        },
        _unwrap = function ($elm) {
          var $parent = $elm.parent();
          $parent.after($elm).remove();
          return $elm;
        };
    
    module.directive(dirName, [
             'ezfb',
    function (ezfb) {
      return {
        restrict: 'EC',
        require: '?^ezfbXfbml',
        link: function postLink(scope, iElm, iAttrs, xfbmlCtrl) {
          /**
           * For backward compatibility, skip self rendering if contained by easyfb-xfbml directive
           */
          if (xfbmlCtrl) {
            return;
          }

          var rendering = false,
              renderId = 0;

          scope.$watch(function () {
            var watchList = [];
            angular.forEach(availableAttrs, function (attrName) {
              watchList.push(iAttrs[attrName]);
            });
            return watchList;
          }, function (v) {
            renderId++;
            if (!rendering) {
              rendering = true;

              // Wrap the social plugin code for FB.XFBML.parse
              ezfb.XFBML.parse(_wrap(iElm)[0], genOnRenderHandler(renderId));
            }
            else {
              // Already rendering, do not wrap
              ezfb.XFBML.parse(iElm.parent()[0], genOnRenderHandler(renderId));
            }
          }, true);

          // Unwrap on $destroy
          iElm.bind('$destroy', function () {
            if (_isWrapped(iElm)) {
              _unwrap(iElm);
            }
          });

          function genOnRenderHandler(id) {
            return function () {
              var onrenderExp;

              if (rendering && id === renderId) {
                onrenderExp = iAttrs.onrender;
                if (onrenderExp) {
                  scope.$eval(onrenderExp);
                }

                rendering = false;
                _unwrap(iElm);
              }
            };
          }
        }
      };
    }]);
  }

})(angular.module('ezfb', []));
var ngMap = angular.module('ngMap', []);

/**
 * @ngdoc service
 * @name Attr2Options
 * @description 
 *   Converts tag attributes to options used by google api v3 objects, map, marker, polygon, circle, etc.
 */
/*jshint -W030*/
ngMap.service('Attr2Options', ['$parse', 'NavigatorGeolocation', 'GeoCoder', function($parse, NavigatorGeolocation, GeoCoder) { 
  var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
  var MOZ_HACK_REGEXP = /^moz([A-Z])/;  

  var orgAttributes = function(el) {
    (el.length > 0) && (el = el[0]);
    var orgAttributes = {};
    for (var i=0; i<el.attributes.length; i++) {
      var attr = el.attributes[i];
      orgAttributes[attr.name] = attr.value;
    }
    return orgAttributes;
  }

  var camelCase = function(name) {
    return name.
      replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
        return offset ? letter.toUpperCase() : letter;
      }).
      replace(MOZ_HACK_REGEXP, 'Moz$1');
  }

  var JSONize = function(str) {
    try {       // if parsable already, return as it is
      JSON.parse(str);
      return str;
    } catch(e) { // if not parsable, change little
      return str
        // wrap keys without quote with valid double quote
        .replace(/([\$\w]+)\s*:/g, function(_, $1){return '"'+$1+'":'})
        // replacing single quote wrapped ones to double quote 
        .replace(/'([^']+)'/g, function(_, $1){return '"'+$1+'"'})
    }
  }

  var toOptionValue = function(input, options) {
    var output, key=options.key, scope=options.scope;
    try { // 1. Number?
      var num = Number(input);
      if (isNaN(num)) {
        throw "Not a number";
      } else  {
        output = num;
      }
    } catch(err) { 
      try { // 2.JSON?
        if (input.match(/^[\+\-]?[0-9\.]+,[ ]*\ ?[\+\-]?[0-9\.]+$/)) { // i.e "-1.0, 89.89"
          input = "["+input+"]";
        }
        output = JSON.parse(JSONize(input));
        if (output instanceof Array) {
          var t1stEl = output[0];
          if (t1stEl.constructor == Object) { // [{a:1}] : not lat/lng ones
          } else if (t1stEl.constructor == Array) { // [[1,2],[3,4]] 
            output =  output.map(function(el) {
              return new google.maps.LatLng(el[0], el[1]);
            });
          } else if(!isNaN(parseFloat(t1stEl)) && isFinite(t1stEl)) {
            return new google.maps.LatLng(output[0], output[1]);
          }
        }
      } catch(err2) {
        // 3. Object Expression. i.e. LatLng(80,-49)
        if (input.match(/^[A-Z][a-zA-Z0-9]+\(.*\)$/)) {
          try {
            var exp = "new google.maps."+input;
            output = eval(exp); // TODO, still eval
          } catch(e) {
            output = input;
          } 
        // 4. Object Expression. i.e. MayTypeId.HYBRID 
        } else if (input.match(/^([A-Z][a-zA-Z0-9]+)\.([A-Z]+)$/)) {
          try {
            var matches = input.match(/^([A-Z][a-zA-Z0-9]+)\.([A-Z]+)$/);
            output = google.maps[matches[1]][matches[2]];
          } catch(e) {
            output = input;
          } 
        // 5. Object Expression. i.e. HYBRID 
        } else if (input.match(/^[A-Z]+$/)) {
          try {
            var capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            if (key.match(/temperatureUnit|windSpeedUnit|labelColor/)) {
              capitalizedKey = capitalizedKey.replace(/s$/,"");
              output = google.maps.weather[capitalizedKey][input];
            } else {
              output = google.maps[capitalizedKey][input];
            }
          } catch(e) {
            output = input;
          } 
        } else {
          output = input;
        }
      } // catch(err2)
    } // catch(err)
    return output;
  };

  var setDelayedGeoLocation = function(object, method, param, options) {
    options = options || {};
    var centered = object.centered || options.centered;
    var errorFunc = function() {
      console.log('error occurred while', object, method, param, options);
      var fallbackLocation = options.fallbackLocation || new google.maps.LatLng(0,0);
      object[method](fallbackLocation);
    };
    if (!param || param.match(/^current/i)) { // sensored position
      NavigatorGeolocation.getCurrentPosition().then(
        function(position) { // success
          var lat = position.coords.latitude;
          var lng = position.coords.longitude;
          var latLng = new google.maps.LatLng(lat,lng);
          object[method](latLng);
          if (centered) {
            object.map.setCenter(latLng);
          }
        },
        errorFunc
      );
    } else { //assuming it is address
      GeoCoder.geocode({address: param}).then(
        function(results) { // success
          object[method](results[0].geometry.location);
          if (centered) {
            object.map.setCenter(results[0].geometry.location);
          }
        },
        errorFunc
      );
    }
  };


  var getAttrsToObserve = function(attrs) {
    var attrsToObserve = [];
    if (attrs["ng-repeat"] || attrs.ngRepeat) {  // if element is created by ng-repeat, don't observe any
    } else {
      for (var attrName in attrs) {
        var attrValue = attrs[attrName];
        if (attrValue && attrValue.match(/\{\{.*\}\}/)) { // if attr value is {{..}}
          console.log('setting attribute to observe', attrName, camelCase(attrName), attrValue);
          attrsToObserve.push(camelCase(attrName));
        }
      }
    }
    return attrsToObserve;
  };

  var observeAttrSetObj = function(orgAttrs, attrs, obj) {
    var attrsToObserve = getAttrsToObserve(orgAttrs);
    if (Object.keys(attrsToObserve).length) {
      console.log(obj, "attributes to observe", attrsToObserve);
    }
    for (var i=0; i<attrsToObserve.length; i++) {
      observeAndSet(attrs, attrsToObserve[i], obj);
    }
  }

  var observeAndSet = function(attrs, attrName, object) {
    attrs.$observe(attrName, function(val) {
      if (val) {
        console.log('observing ', object, attrName, val);
        var setMethod = camelCase('set-'+attrName);
        var optionValue = toOptionValue(val, {key: attrName});
        console.log('setting ', object, attrName, 'with value', optionValue);
        if (object[setMethod]) { //if set method does exist
          /* if an location is being observed */
          if (attrName.match(/center|position/) && 
            typeof optionValue == 'string') {
            setDelayedGeoLocation(object, setMethod, optionValue);
          } else {
            object[setMethod](optionValue);
          }
        }
      }
    });
  };

  return {
    /**
     * filters attributes by skipping angularjs methods $.. $$..
     * @memberof Attr2Options
     * @param {Hash} attrs tag attributes
     * @returns {Hash} filterd attributes
     */
    filter: function(attrs) {
      var options = {};
      for(var key in attrs) {
        if (key.match(/^\$/) || key.match(/^ng[A-Z]/)) {
        } else {
          options[key] = attrs[key];
        }
      }
      return options;
    },


    /**
     * converts attributes hash to Google Maps API v3 options  
     * ```
     *  . converts numbers to number   
     *  . converts class-like string to google maps instance   
     *    i.e. `LatLng(1,1)` to `new google.maps.LatLng(1,1)`  
     *  . converts constant-like string to google maps constant    
     *    i.e. `MapTypeId.HYBRID` to `google.maps.MapTypeId.HYBRID`   
     *    i.e. `HYBRID"` to `google.maps.MapTypeId.HYBRID`  
     * ```
     * @memberof Attr2Options
     * @param {Hash} attrs tag attributes
     * @param {scope} scope angularjs scope
     * @returns {Hash} options converted attributess
     */
    getOptions: function(attrs, scope) {
      var options = {};
      for(var key in attrs) {
        if (attrs[key]) {
          if (key.match(/^on[A-Z]/)) { //skip events, i.e. on-click
            continue;
          } else if (key.match(/ControlOptions$/)) { // skip controlOptions
            continue;
          } else {
            options[key] = toOptionValue(attrs[key], {scope:scope, key: key});
          }
        } // if (attrs[key])
      } // for(var key in attrs)
      return options;
    },

    /**
     * converts attributes hash to scope-specific event function 
     * @memberof Attr2Options
     * @param {scope} scope angularjs scope
     * @param {Hash} attrs tag attributes
     * @returns {Hash} events converted events
     */
    getEvents: function(scope, attrs) {
      var events = {};
      var toLowercaseFunc = function($1){
        return "_"+$1.toLowerCase();
      };
      var eventFunc = function(attrValue) {
        var matches = attrValue.match(/([^\(]+)\(([^\)]*)\)/);
        var funcName = matches[1];
        var argsStr = matches[2].replace(/event[ ,]*/,'');  //remove string 'event'
        
        var args = scope.$eval("["+argsStr+"]");
        return function(event) {
          scope[funcName].apply(this, [event].concat(args));
          scope.$apply();
        }
      }

      for(var key in attrs) {
        if (attrs[key]) {
          if (!key.match(/^on[A-Z]/)) { //skip if not events
            continue;
          }
          
          //get event name as underscored. i.e. zoom_changed
          var eventName = key.replace(/^on/,'');
          eventName = eventName.charAt(0).toLowerCase() + eventName.slice(1);
          eventName = eventName.replace(/([A-Z])/g, toLowercaseFunc);

          var attrValue = attrs[key];
          events[eventName] = new eventFunc(attrValue);
        }
      }
      return events;
    },

    /**
     * control means map controls, i.e streetview, pan, etc, not a general control
     * @memberof Attr2Options
     * @param {Hash} filtered filtered tag attributes
     * @returns {Hash} Google Map options
     */
    getControlOptions: function(filtered) {
      var controlOptions = {};
      if (typeof filtered != 'object')
        return false;

      for (var attr in filtered) {
        if (filtered[attr]) {
          if (!attr.match(/(.*)ControlOptions$/)) { 
            continue; // if not controlOptions, skip it
          }

          //change invalid json to valid one, i.e. {foo:1} to {"foo": 1}
          var orgValue = filtered[attr];
          var newValue = orgValue.replace(/'/g, '"');
          newValue = newValue.replace(/([^"]+)|("[^"]+")/g, function($0, $1, $2) {
            if ($1) {
              return $1.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
            } else {
              return $2; 
            } 
          });
          try {
            var options = JSON.parse(newValue);
            for (var key in options) { //assign the right values
              if (options[key]) {
                var value = options[key];
                if (typeof value === 'string') {
                  value = value.toUpperCase();
                } else if (key === "mapTypeIds") {
                  value = value.map( function(str) {
                    if (str.match(/^[A-Z]+$/)) { // if constant
                      return google.maps.MapTypeId[str.toUpperCase()];
                    } else { // else, custom map-type
                      return str;
                    }
                  });
                } 
                
                if (key === "style") {
                  var str = attr.charAt(0).toUpperCase() + attr.slice(1);
                  var objName = str.replace(/Options$/,'')+"Style";
                  options[key] = google.maps[objName][value];
                } else if (key === "position") {
                  options[key] = google.maps.ControlPosition[value];
                } else {
                  options[key] = value;
                }
              }
            }
            controlOptions[attr] = options;
          } catch (e) {
            console.error('invald option for', attr, newValue, e, e.stack);
          }
        }
      } // for

      return controlOptions;
    }, // function

    toOptionValue: toOptionValue,
    camelCase: camelCase,
    setDelayedGeoLocation: setDelayedGeoLocation,
    getAttrsToObserve: getAttrsToObserve,
    observeAndSet: observeAndSet,
    observeAttrSetObj: observeAttrSetObj,
    orgAttributes: orgAttributes

  }; // return
}]); 

/**
 * @ngdoc service
 * @name GeoCoder
 * @description
 *   Provides [defered/promise API](https://docs.angularjs.org/api/ng/service/$q) service for Google Geocoder service
 */
ngMap.service('GeoCoder', ['$q', function($q) {
  return {
    /**
     * @memberof GeoCoder
     * @param {Hash} options https://developers.google.com/maps/documentation/geocoding/#geocoding
     * @example
     * ```
     *   GeoCoder.geocode({address: 'the cn tower'}).then(function(result) {
     *     //... do something with result
     *   });
     * ```
     * @returns {HttpPromise} Future object
     */
    geocode : function(options) {
      var deferred = $q.defer();
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode(options, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          deferred.resolve(results);
        } else {
          deferred.reject('Geocoder failed due to: '+ status);
        }
      });
      return deferred.promise;
    }
  }
}]);

/**
 * @ngdoc service
 * @name NavigatorGeolocation
 * @description
 *  Provides [defered/promise API](https://docs.angularjs.org/api/ng/service/$q) service for navigator.geolocation methods
 */
ngMap.service('NavigatorGeolocation', ['$q', function($q) {
  return {
    /**
     * @memberof NavigatorGeolocation
     * @param {function} success success callback function
     * @param {function} failure failure callback function
     * @example
     * ```
     *  NavigatorGeolocation.getCurrentPosition()
     *    .then(function(position) {
     *      var lat = position.coords.latitude, lng = position.coords.longitude;
     *      .. do something lat and lng
     *    });
     * ```
     * @returns {HttpPromise} Future object
     */
    getCurrentPosition: function() {
      var deferred = $q.defer();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            deferred.resolve(position);
          }, function(evt) {
            console.error(evt);
            deferred.reject(evt);
          }
        );
      } else {
        deferred.reject("Browser Geolocation service failed.");
      }
      return deferred.promise;
    },

    watchPosition: function() {
      return "TODO";
    },

    clearWatch: function() {
      return "TODO";
    }
  };
}]); 


/**
 * @ngdoc service
 * @name StreetView
 * @description
 *  Provides [defered/promise API](https://docs.angularjs.org/api/ng/service/$q) service 
 *  for [Google StreetViewService](https://developers.google.com/maps/documentation/javascript/streetview)
 */
ngMap.service('StreetView', ['$q', function($q) {
  return {
    /**
     * Retrieves panorama id from the given map (and or position)
     * @memberof StreetView
     * @param {map} map Google map instance
     * @param {LatLng} latlng Google LatLng instance  
     *   default: the center of the map
     * @example
     *   StreetView.getPanorama(map).then(function(panoId) {
     *     $scope.panoId = panoId;
     *   });
     * @returns {HttpPromise} Future object
     */
    getPanorama : function(map, latlng) {
      latlng = latlng || map.getCenter();
      var deferred = $q.defer();
      var svs = new google.maps.StreetViewService();
      svs.getPanoramaByLocation( (latlng||map.getCenter), 100, function (data, status) {
        // if streetView available
        if (status === google.maps.StreetViewStatus.OK) {
          deferred.resolve(data.location.pano);
        } else {
          // no street view available in this range, or some error occurred
          deferred.resolve(false);
          //deferred.reject('Geocoder failed due to: '+ status);
        }
      });
      return deferred.promise;
    },
    /**
     * Set panorama view on the given map with the panorama id
     * @memberof StreetView
     * @param {map} map Google map instance
     * @param {String} panoId Panorama id fro getPanorama method
     * @example
     *   StreetView.setPanorama(map, panoId);
     */
    setPanorama : function(map, panoId) {
      var svp = new google.maps.StreetViewPanorama(map.getDiv(), {enableCloseButton: true});
      svp.setPano(panoId);
    }
  }; // return
}]);

/**
 * @ngdoc directive
 * @name bicycling-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <bicycling-layer></bicycling-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('bicyclingLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getLayer = function(options, events) {
    var layer = new google.maps.BicyclingLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }
    return layer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);

      console.log('bicycling-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('bicyclingLayers', layer);
      parser.observeAttrSetObj(orgAttrs, attrs, layer);  //observers
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name cloud-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <cloud-layer></cloud-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('cloudLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getLayer = function(options, events) {
    var layer = new google.maps.weather.CloudLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }
    return layer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);
      console.log('cloud-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('cloudLayers', layer);
      parser.observeAttrSetObj(orgAttrs, attrs, layer);  //observers
    }
   }; // return
}]);

/*jshint -W030*/
/**
 * @ngdoc directive
 * @name custom-control
 * @requires Attr2Options 
 * @requires $compile
 * @description 
 *   Build custom control and set to the map with position
 *   
 *   Requires:  map directive
 *
 *   Restrict To:  Element
 *
 * @param {String} position position of this control
 *        i.e. TOP_RIGHT
 * @param {Number} index index of the control
 * @example
 *
 * Example: 
 *  <map center="41.850033,-87.6500523" zoom="3">
 *    <custom-control id="home" position="TOP_LEFT" index="1">
 *      <div style="background-color: white;">
 *        <b>Home</b>
 *      </div>
 *    </custom-control>
 *  </map>
 *
 */
/*jshint -W089*/
ngMap.directive('customControl', ['Attr2Options', '$compile', function(Attr2Options, $compile)  {
  var parser = Attr2Options;

  return {
    restrict: 'E',
    require: '^map',
    link: function(scope, element, attrs, mapController) {
      element.css('display','none');
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered, scope);
      var events = parser.getEvents(scope, filtered);
      console.log("custom-control options", options, "events", events);

      /**
       * build a custom control element
       */
      var compiled = $compile(element.html().trim())(scope);
      var customControlEl = compiled[0];

      /**
       * set events
       */
      for (var eventName in events) {
        google.maps.event.addDomListener(customControlEl, eventName, events[eventName]);
      }

      mapController.addObject('customControls', customControlEl);
      scope.$on('mapInitialized', function(evt, map) {
        var position = options.position;
        map.controls[google.maps.ControlPosition[position]].push(customControlEl);
      });

    } //link
  }; // return
}]);// function

/**
 * @ngdoc directive
 * @name dynamic-maps-engine-layer
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *   <map zoom="14" center="[59.322506, 18.010025]">
 *     <dynamic-maps-engine-layer layer-id="06673056454046135537-08896501997766553811"></dynamic-maps-engine-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('dynamicMapsEngineLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;

  var getDynamicMapsEngineLayer = function(options, events) {
    var layer = new google.maps.visualization.DynamicMapsEngineLayer(options);

    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }

    return layer;
  };

  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered, events);
      console.log('dynamic-maps-engine-layer options', options, 'events', events);

      var layer = getDynamicMapsEngineLayer(options, events);
      mapController.addObject('mapsEngineLayers', layer);
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name fusion-tables-layer
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *   <map zoom="11" center="41.850033, -87.6500523">
 *     <fusion-tables-layer query="{
 *       select: 'Geocodable address',
 *       from: '1mZ53Z70NsChnBMm-qEYmSDOvLXgrreLTkQUvvg'}">
 *     </fusion-tables-layer>
 *   </map>
 */
/*jshint -W089*/
ngMap.directive('fusionTablesLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;

  var getLayer = function(options, events) {
    var layer = new google.maps.FusionTablesLayer(options);

    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }

    return layer;
  };

  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered, events);
      console.log('fusion-tables-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('fusionTablesLayers', layer);
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name heatmap-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="11" center="[41.875696,-87.624207]">
 *     <heatmap-layer data="taxiData"></heatmap-layer>
 *   </map>
 */
/*jshint -W089*/
ngMap.directive('heatmapLayer', ['Attr2Options', '$window', function(Attr2Options, $window) {
  var parser = Attr2Options;
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var filtered = parser.filter(attrs);

      /**
       * set options 
       */
      var options = parser.getOptions(filtered);
      options.data = $window[attrs.data] || scope[attrs.data];
      if (options.data instanceof Array) {
        options.data = new google.maps.MVCArray(options.data);
      } else {
        throw "invalid heatmap data";
      }
      var layer = new google.maps.visualization.HeatmapLayer(options);

      /**
       * set events 
       */
      var events = parser.getEvents(scope, filtered);
      console.log('heatmap-layer options', layer, 'events', events);

      mapController.addObject('heatmapLayers', layer);
    }
   }; // return
}]);

/*jshint -W030*/
/**
 * @ngdoc directive
 * @name info-window 
 * @requires Attr2Options 
 * @requires $compile
 * @description 
 *   Defines infoWindow and provides compile method
 *   
 *   Requires:  map directive
 *
 *   Restrict To:  Element
 *
 * @param {Boolean} visible Indicates to show it when map is initialized
 * @param {Boolean} visible-on-marker Indicates to show it on a marker when map is initialized
 * @param {String} &lt;InfoWindowOption> Any InfoWindow options,
 *        https://developers.google.com/maps/documentation/javascript/reference?csw=1#InfoWindowOptions  
 * @param {String} &lt;InfoWindowEvent> Any InfoWindow events, https://developers.google.com/maps/documentation/javascript/reference
 * @example
 * Usage: 
 *   <map MAP_ATTRIBUTES>
 *    <info-window id="foo" ANY_OPTIONS ANY_EVENTS"></info-window>
 *   </map>
 *
 * Example: 
 *  <map center="41.850033,-87.6500523" zoom="3">
 *    <info-window id="1" position="41.850033,-87.6500523" >
 *      <div ng-non-bindable>
 *        Chicago, IL<br/>
 *        LatLng: {{chicago.lat()}}, {{chicago.lng()}}, <br/>
 *        World Coordinate: {{worldCoordinate.x}}, {{worldCoordinate.y}}, <br/>
 *        Pixel Coordinate: {{pixelCoordinate.x}}, {{pixelCoordinate.y}}, <br/>
 *        Tile Coordinate: {{tileCoordinate.x}}, {{tileCoordinate.y}} at Zoom Level {{map.getZoom()}}
 *      </div>
 *    </info-window>
 *  </map>
 */
ngMap.directive('infoWindow', ['Attr2Options', '$compile', function(Attr2Options, $compile)  {
  var parser = Attr2Options;

  var getInfoWindow = function(options, events) {
    var infoWindow;

    /**
     * set options
     */
    if (!(options.position instanceof google.maps.LatLng)) {
      var address = options.position;
      options.position = new google.maps.LatLng(0,0);
      infoWindow = new google.maps.InfoWindow(options);
      parser.setDelayedGeoLocation(infoWindow, 'setPosition', address);
    } else {
      infoWindow = new google.maps.InfoWindow(options);
    }

    /**
     * set events
     */
    if (Object.keys(events).length > 0) {
      console.log("infoWindow events", events);
    }
    for (var eventName in events) {
      if (eventName) {
        google.maps.event.addListener(infoWindow, eventName, events[eventName]);
      }
    }

    return infoWindow;
  };

  return {
    restrict: 'E',
    require: '^map',
    link: function(scope, element, attrs, mapController) {
      element.css('display','none');
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered, scope);
      var events = parser.getEvents(scope, filtered);
      console.log('infoWindow', 'options', options, 'events', events);

      /**
       * it must have a container element with ng-non-bindable
       */
      var template = element.html().trim();
      if (angular.element(template).length != 1) {
        throw "info-window working as a template must have a container";
      }

      var infoWindow = getInfoWindow(options, events);
      infoWindow.template = template.replace(/ng-non-/,"");
      mapController.addObject('infoWindows', infoWindow);
      parser.observeAttrSetObj(orgAttrs, attrs, infoWindow); /* observers */

      /**
       * provide showInfoWindow method to scope
       */
      scope.showInfoWindow  = scope.showInfoWindow || function(event, id, anchor) {
        var infoWindow = mapController.map.infoWindows[id];
        var html = infoWindow.template.trim();
        var compiledHtml = html.replace(/{{([^}]+)}}/g, function(_,$1) {
          return scope.$eval($1);
        });
        //var compiledEl = $compile(html)(scope);
        infoWindow.setContent(compiledHtml);
        if (anchor) {
          infoWindow.setPosition(anchor);
          infoWindow.open(mapController.map);
        } else if (this.getPosition) {
          infoWindow.open(mapController.map, this);
        } else {
          infoWindow.open(mapController.map);
        }
      }

      // show InfoWindow when initialized
      if (infoWindow.visible) {
        scope.$on('mapInitialized', function(evt, map) {
          var compiledEl = $compile(infoWindow.template)(scope);
          infoWindow.setContent(compiledEl.html());
          infoWindow.open(mapController.map);
        });
      }
      // show InfoWindow on a marker  when initialized
      if (infoWindow.visibleOnMarker) {
        scope.$on('mapInitialized', function(evt, map) {
          var marker = mapController.map.markers[infoWindow.visibleOnMarker];
          if (!marker) throw "Invalid marker id";
          var compiledHtml = infoWindow.template.replace(/{{([^}]+)}}/g, function(_,$1) {
            return scope.$eval($1);
          });
          infoWindow.setContent(compiledHtml);
          infoWindow.open(mapController.map, marker);
        });
      }
    } //link
  }; // return
}]);// function

/**
 * @ngdoc directive
 * @name kml-layer
 * @requires Attr2Options 
 * @description 
 *   renders Kml layer on a map
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @param {Url} url url of the kml layer
 * @param {KmlLayerOptions} KmlLayerOptions
 *   (https://developers.google.com/maps/documentation/javascript/reference#KmlLayerOptions)  
 * @param {String} &lt;KmlLayerEvent> Any KmlLayer events, https://developers.google.com/maps/documentation/javascript/reference
 * @example
 * Usage: 
 *   <map MAP_ATTRIBUTES>
 *    <kml-layer ANY_KML_LAYER ANY_KML_LAYER_EVENTS"></kml-layer>
 *   </map>
 *
 * Example: 
 *
 *   <map zoom="11" center="[41.875696,-87.624207]">
 *     <kml-layer url="http://gmaps-samples.googlecode.com/svn/trunk/ggeoxml/cta.kml" ></kml-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('kmlLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getKmlLayer = function(options, events) {
    var kmlLayer = new google.maps.KmlLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(kmlLayer, eventName, events[eventName]);
    }
    return kmlLayer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);
      console.log('kml-layer options', kmlLayer, 'events', events);

      var kmlLayer = getKmlLayer(options, events);
      mapController.addObject('kmlLayers', kmlLayer);
      parser.observeAttrSetObj(orgAttrs, attrs, kmlLayer);  //observers
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name map-data
 * @description 
 *   set map data
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @param {String} method-name, run map.data[method-name] with attribute value
 * @example
 * Example: 
 *
 *   <map zoom="11" center="[41.875696,-87.624207]">
 *     <map-data load-geo-json="https://storage.googleapis.com/maps-devrel/google.json"></map-data>
 *    </map>
 */
ngMap.directive('mapData', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered, events);

      console.log('map-data options', options);
      scope.$on('mapInitialized', function(event, map) {
        /**
         * options
         */
        for (var key in options) {
          if (key) {
            var val = options[key];
            if (typeof scope[val] === "function") {
              map.data[key](scope[val]);
            } else {
              map.data[key](val);
            }
          } // if (key)
        }

        /**
         * events
         */
        for (var eventName in events) {
          if (events[eventName]) {
            map.data.addListener(eventName, events[eventName]);
          }
        }
      });
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name map-type
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <map-type name="coordinate" object="coordinateMapType"></map-type>
 *   </map>
 */
/*jshint -W089*/
ngMap.directive('mapType', ['Attr2Options', '$window', function(Attr2Options, $window) {
  var parser = Attr2Options;
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var mapTypeName = attrs.name, mapTypeObject;
      if (!mapTypeName) {
        throw "invalid map-type name";
      }
      if (attrs.object) {
        var __scope = scope[attrs.object] ? scope : $window;
        mapTypeObject = __scope[attrs.object];
        if (typeof mapTypeObject == "function") {
          mapTypeObject = new mapTypeObject();
        }
      }
      if (!mapTypeObject) {
        throw "invalid map-type object";
      }

      scope.$on('mapInitialized', function(evt, map) {
        map.mapTypes.set(mapTypeName, mapTypeObject);
      });
      mapController.addObject('mapTypes', mapTypeObject);
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name map
 * @requires Attr2Options
 * @description
 *   Implementation of {@link MapController}
 *   Initialize a Google map within a `<div>` tag with given options and register events
 *   It accepts children directives; marker, shape, or marker-clusterer
 *
 *   It initialize map, children tags, then emits message as soon as the action is done
 *   The message emitted from this directive is;
 *     . mapInitialized
 *
 *   Restrict To:
 *     Element
 *
 * @param {Array} geo-fallback-center 
 *    The center of map incase geolocation failed. i.e. [0,0]
 * @param {String} init-event The name of event to initialize this map. 
 *        If this option is given, the map won't be initialized until the event is received.
 *        To invoke the event, use $scope.$emit or $scope.$broacast. 
 *        i.e. <map init-event="init-map" ng-click="$emit('init-map')" center=... ></map>
 * @param {String} &lt;MapOption> Any Google map options, 
 *        https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapOptions
 * @param {String} &lt;MapEvent> Any Google map events, 
 *        https://rawgit.com/allenhwkim/angularjs-google-maps/master/build/map_events.html
 * @example
 * Usage:
 *   <map MAP_OPTIONS_OR_MAP_EVENTS ..>
 *     ... Any children directives
 *   </map>
 * 
 * Example:
 *   <map center="[40.74, -74.18]" on-click="doThat()">
 *   </map>
 *
 *   <map geo-fallback-center="[40.74, -74.18]">
 *   </map>
 */
/*jshint -W030*/
ngMap.directive('map', ['Attr2Options', '$timeout', function(Attr2Options, $timeout) {
  var parser = Attr2Options;
  function getStyle(el,styleProp)
  {
    if (el.currentStyle) {
      var y = el.currentStyle[styleProp];
    } else if (window.getComputedStyle) {
      var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
    }
    return y;
  }

  return {
    restrict: 'AE',
    controller: ngMap.MapController,
    /**
     * Initialize map and events
     * @memberof map
     * @param {$scope} scope
     * @param {angular.element} element
     * @param {Hash} attrs
     * @ctrl {MapController} ctrl
     */
    link: function (scope, element, attrs, ctrl) {
      var orgAttrs = parser.orgAttributes(element);

      scope.google = google;  //used by $scope.eval in Attr2Options to avoid eval()

      /**
       * create a new `div` inside map tag, so that it does not touch map element
       * http://stackoverflow.com/questions/20955356
       */
      var el = document.createElement("div");
      el.style.width = "100%";
      el.style.height = "100%";
      element.prepend(el);

      /**
       * if style is not given to the map element, set display and height
       */
      if (getStyle(element[0], 'display') != "block") {
        element.css('display','block');
      }
      if (getStyle(element[0], 'height').match(/^0/)) {
        element.css('height','300px');
      }

      /**
       * initialize function
       */
      var initializeMap = function(mapOptions, mapEvents) {
        var map = new google.maps.Map(el, {});
        map.markers = {};
        map.shapes = {};
       
        /**
         * resize the map to prevent showing partially, in case intialized too early
         */
        $timeout(function() {
          google.maps.event.trigger(map, "resize");
        });

        /**
         * set options
         */
        mapOptions.zoom = mapOptions.zoom || 15;
        var center = mapOptions.center;
        if (!(center instanceof google.maps.LatLng)) {
          delete mapOptions.center;
          Attr2Options.setDelayedGeoLocation(map, 'setCenter', 
              center, options.geoFallbackCenter);
        }
        map.setOptions(mapOptions);

        /**
         * set events
         */
        for (var eventName in mapEvents) {
          if (eventName) {
            google.maps.event.addListener(map, eventName, mapEvents[eventName]);
          }
        }

        /**
         * set observers
         */
        parser.observeAttrSetObj(orgAttrs, attrs, map);

        /**
         * set controller and set objects
         * so that map can be used by other directives; marker or shape 
         * ctrl._objects are gathered when marker and shape are initialized before map is set
         */
        ctrl.map = map;   /* so that map can be used by other directives; marker or shape */
        ctrl.addObjects(ctrl._objects);

        // /* providing method to add a marker used by user scope */
        // map.addMarker = ctrl.addMarker;

        /**
         * set map for scope and controller and broadcast map event
         * scope.map will be overwritten if user have multiple maps in a scope,
         * thus the last map will be set as scope.map.
         * however an `mapInitialized` event will be emitted every time.
         */
        scope.map = map;
        scope.map.scope = scope;
        //google.maps.event.addListenerOnce(map, "idle", function() {
        scope.$emit('mapInitialized', map);  
        //});

        // the following lines will be deprecated on behalf of mapInitialized
        // to collect maps, we should use scope.maps in your own controller, i.e. MyCtrl
        scope.maps = scope.maps || {}; 
        scope.maps[options.id||Object.keys(scope.maps).length] = map;
        scope.$emit('mapsInitialized', scope.maps);  
      }; // function initializeMap()

      /**
       * get map options and events
       */
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered, scope);
      var controlOptions = parser.getControlOptions(filtered);
      var mapOptions = angular.extend(options, controlOptions);
      var mapEvents = parser.getEvents(scope, filtered);
      console.log("filtered", filtered, "mapOptions", mapOptions, 'mapEvents', mapEvents);

      if (attrs.initEvent) { // allows controlled initialization
        scope.$on(attrs.initEvent, function() {
          !ctrl.map && initializeMap(mapOptions, mapEvents); // init if not done
        });
      } else {
        initializeMap(mapOptions, mapEvents);
      } // if
    }
  }; 
}]);

/**
 * @ngdoc directive
 * @name MapController
 * @requires $scope
 * @property {Hash} controls collection of Controls initiated within `map` directive
 * @property {Hash} markersi collection of Markers initiated within `map` directive
 * @property {Hash} shapes collection of shapes initiated within `map` directive
 * @property {MarkerClusterer} markerClusterer MarkerClusterer initiated within `map` directive
 */
/*jshint -W089*/
ngMap.MapController = function($scope) { 

  this.map = null;
  this._objects = [];

  /**
   * Add a marker to map and $scope.markers
   * @memberof MapController
   * @name addMarker
   * @param {Marker} marker google map marker
   */
  this.addMarker = function(marker) {
    /**
     * marker and shape are initialized before map is initialized
     * so, collect _objects then will init. those when map is initialized
     * However the case as in ng-repeat, we can directly add to map
     */
    if (this.map) {
      this.map.markers = this.map.markers || {};
      marker.setMap(this.map);
      if (marker.centered) {
        this.map.setCenter(marker.position);
      }
      var len = Object.keys(this.map.markers).length;
      this.map.markers[marker.id || len] = marker;
    } else {
      this._objects.push(marker);
    }
  };

  /**
   * Add a shape to map and $scope.shapes
   * @memberof MapController
   * @name addShape
   * @param {Shape} shape google map shape
   */
  this.addShape = function(shape) {
    if (this.map) {
      this.map.shapes = this.map.shapes || {};
      shape.setMap(this.map);
      var len = Object.keys(this.map.shapes).length;
      this.map.shapes[shape.id || len] = shape;
    } else {
      this._objects.push(shape);
    }
  };

  this.addObject = function(groupName, obj) {
    if (this.map) {
      this.map[groupName] = this.map[groupName] || {};
      var len = Object.keys(this.map[groupName]).length;
      this.map[groupName][obj.id || len] = obj;
      if (groupName != "infoWindows" && obj.setMap) { //infoWindow.setMap works like infoWindow.open
        obj.setMap(this.map);
      }
    } else {
      obj.groupName = groupName;
      this._objects.push(obj);
    }
  }

  /**
   * Add a shape to map and $scope.shapes
   * @memberof MapController
   * @name addShape
   * @param {Shape} shape google map shape
   */
  this.addObjects = function(objects) {
    for (var i=0; i<objects.length; i++) {
      var obj=objects[i];
      if (obj instanceof google.maps.Marker) {
        this.addMarker(obj);
      } else if (obj instanceof google.maps.Circle ||
        obj instanceof google.maps.Polygon ||
        obj instanceof google.maps.Polyline ||
        obj instanceof google.maps.Rectangle ||
        obj instanceof google.maps.GroundOverlay) {
        this.addShape(obj);
      } else {
        this.addObject(obj.groupName, obj);
      }
    }
  };

};

/**
 * @ngdoc directive
 * @name maps-engine-layer
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *   <map zoom="14" center="[59.322506, 18.010025]">
 *     <maps-engine-layer layer-id="06673056454046135537-08896501997766553811"></maps-engine-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('mapsEngineLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;

  var getMapsEngineLayer = function(options, events) {
    var layer = new google.maps.visualization.MapsEngineLayer(options);

    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }

    return layer;
  };

  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered, events);
      console.log('maps-engine-layer options', options, 'events', events);

      var layer = getMapsEngineLayer(options, events);
      mapController.addObject('mapsEngineLayers', layer);
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name marker
 * @requires Attr2Options 
 * @requires NavigatorGeolocation
 * @description 
 *   Draw a Google map marker on a map with given options and register events  
 *   
 *   Requires:  map directive
 *
 *   Restrict To:  Element 
 *
 * @param {String} position address, 'current', or [latitude, longitude]  
 *    example:  
 *      '1600 Pennsylvania Ave, 20500  Washingtion DC',   
 *      'current position',  
 *      '[40.74, -74.18]'  
 * @param {Boolean} centered if set, map will be centered with this marker
 * @param {String} &lt;MarkerOption> Any Marker options, https://developers.google.com/maps/documentation/javascript/reference?csw=1#MarkerOptions  
 * @param {String} &lt;MapEvent> Any Marker events, https://developers.google.com/maps/documentation/javascript/reference
 * @example
 * Usage: 
 *   <map MAP_ATTRIBUTES>
 *    <marker ANY_MARKER_OPTIONS ANY_MARKER_EVENTS"></MARKER>
 *   </map>
 *
 * Example: 
 *   <map center="[40.74, -74.18]">
 *    <marker position="[40.74, -74.18]" on-click="myfunc()"></div>
 *   </map>
 *
 *   <map center="the cn tower">
 *    <marker position="the cn tower" on-click="myfunc()"></div>
 *   </map>
 */
ngMap.directive('marker', ['Attr2Options', function(Attr2Options)  {
  var parser = Attr2Options;

  var getMarker = function(options, events) {
    var marker;

    /**
     * set options
     */
    if (options.icon instanceof Object) {
      if ((""+options.icon.path).match(/^[A-Z_]+$/)) {
        options.icon.path =  google.maps.SymbolPath[options.icon.path];
      }
      for (var key in options.icon) {
        var arr = options.icon[key];
        if (key == "anchor" || key == "origin") {
          options.icon[key] = new google.maps.Point(arr[0], arr[1]);
        } else if (key == "size" || key == "scaledSize") {
          options.icon[key] = new google.maps.Size(arr[0], arr[1]);
        } 
      }
    }
    if (!(options.position instanceof google.maps.LatLng)) {
      var orgPosition = options.position;
      options.position = new google.maps.LatLng(0,0);
      marker = new google.maps.Marker(options);
      parser.setDelayedGeoLocation(marker, 'setPosition', orgPosition);
    } else {
      marker = new google.maps.Marker(options);
    }

    /**
     * set events
     */
    if (Object.keys(events).length > 0) {
      console.log("markerEvents", events);
    }
    for (var eventName in events) {
      if (eventName) {
        google.maps.event.addListener(marker, eventName, events[eventName]);
      }
    }

    return marker;
  };

  return {
    restrict: 'E',
    require: '^map',
    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var markerOptions = parser.getOptions(filtered, scope);
      var markerEvents = parser.getEvents(scope, filtered);
      console.log('marker options', markerOptions, 'events', markerEvents);

      /**
       * set event to clean up removed marker
       * useful with ng-repeat
       */
      element.bind('$destroy', function() {
        var markers = marker.map.markers;
        for (var name in markers) {
          if (markers[name] == marker) {
            delete markers[name];
          }
        }
        marker.setMap(null);          
      });

      var marker = getMarker(markerOptions, markerEvents);
      mapController.addMarker(marker);

      /**
       * set observers
       */
      parser.observeAttrSetObj(orgAttrs, attrs, marker); /* observers */

    } //link
  }; // return
}]);// 

/**
 * @ngdoc directive
 * @name overlay-map-type
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <overlay-map-type index="0" object="coordinateMapType"></map-type>
 *   </map>
 */
/*jshint -W089*/
ngMap.directive('overlayMapType', ['Attr2Options', '$window', function(Attr2Options, $window) {
  var parser = Attr2Options;
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var overlayMapTypeObject;
      var initMethod = attrs.initMethod || "insertAt";
      if (attrs.object) {
        var __scope = scope[attrs.object] ? scope : $window;
        overlayMapTypeObject = __scope[attrs.object];
        if (typeof overlayMapTypeObject == "function") {
          overlayMapTypeObject = new overlayMapTypeObject();
        }
      }
      if (!overlayMapTypeObject) {
        throw "invalid map-type object";
      }

      scope.$on('mapInitialized', function(evt, map) {
        if (initMethod == "insertAt") {
          var index = parseInt(attrs.index, 10);
          map.overlayMapTypes.insertAt(index, overlayMapTypeObject);
        } else if (initMethod == "push") {
          map.overlayMapTypes.push(overlayMapTypeObject);
        }
      });
      mapController.addObject('overlayMapTypes', overlayMapTypeObject);
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name shape
 * @requires Attr2Options 
 * @description 
 *   Initialize a Google map shape in map with given options and register events  
 *   The shapes are:
 *     . circle
 *     . polygon
 *     . polyline
 *     . rectangle
 *     . groundOverlay(or image)
 *   
 *   Requires:  map directive
 *
 *   Restrict To:  Element
 *
 * @param {Boolean} centered if set, map will be centered with this marker
 * @param {String} &lt;OPTIONS>
 *   For circle, [any circle options](https://developers.google.com/maps/documentation/javascript/reference#CircleOptions)  
 *   For polygon, [any polygon options](https://developers.google.com/maps/documentation/javascript/reference#PolygonOptions)  
 *   For polyline, [any polyline options](https://developers.google.com/maps/documentation/javascript/reference#PolylineOptions)   
 *   For rectangle, [any rectangle options](https://developers.google.com/maps/documentation/javascript/reference#RectangleOptions)   
 *   For image, [any groundOverlay options](https://developers.google.com/maps/documentation/javascript/reference#GroundOverlayOptions)   
 * @param {String} &lt;MapEvent> Any Shape events, https://developers.google.com/maps/documentation/javascript/reference
 * @example
 * Usage: 
 *   <map MAP_ATTRIBUTES>
 *    <shape name=SHAPE_NAME ANY_SHAPE_OPTIONS ANY_SHAPE_EVENTS"></MARKER>
 *   </map>
 *
 * Example: 
 *
 *   <map zoom="11" center="[40.74, -74.18]">
 *     <shape id="polyline" name="polyline" geodesic="true" stroke-color="#FF0000" stroke-opacity="1.0" stroke-weight="2"
 *      path="[[40.74,-74.18],[40.64,-74.10],[40.54,-74.05],[40.44,-74]]" ></shape>
 *    </map>
 *
 *   <map zoom="11" center="[40.74, -74.18]">
 *     <shape id="polygon" name="polygon" stroke-color="#FF0000" stroke-opacity="1.0" stroke-weight="2"
 *      paths="[[40.74,-74.18],[40.64,-74.18],[40.84,-74.08],[40.74,-74.18]]" ></shape>
 *   </map>
 *   
 *   <map zoom="11" center="[40.74, -74.18]">
 *     <shape id="rectangle" name="rectangle" stroke-color='#FF0000' stroke-opacity="0.8" stroke-weight="2"
 *      bounds="[[40.74,-74.18], [40.78,-74.14]]" editable="true" ></shape>
 *   </map>
 *
 *   <map zoom="11" center="[40.74, -74.18]">
 *     <shape id="circle" name="circle" stroke-color='#FF0000' stroke-opacity="0.8"stroke-weight="2" 
 *      center="[40.70,-74.14]" radius="4000" editable="true" ></shape>
 *   </map>
 *
 *   <map zoom="11" center="[40.74, -74.18]">
 *     <shape id="image" name="image" url="https://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg"
 *      bounds="[[40.71,-74.22],[40.77,-74.12]]" opacity="0.7" clickable="true" ></shape>
 *   </map>
 *
 *  For full-working example, please visit 
 *    [shape example](https://rawgit.com/allenhwkim/angularjs-google-maps/master/build/shape.html)
 */
ngMap.directive('shape', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getBounds = function(points) {
    return new google.maps.LatLngBounds(points[0], points[1]);
  };
  
  var getShape = function(options, events) {
    var shape;

    var shapeName = options.name;
    delete options.name;  //remove name bcoz it's not for options
    console.log("shape", shapeName, "options", options, 'events', events);

    /**
     * set options
     */
    if (options.icons) {
      for (var i=0; i<options.icons.length; i++) {
        var el = options.icons[i];
        if (el.icon.path.match(/^[A-Z_]+$/)) {
          el.icon.path =  google.maps.SymbolPath[el.icon.path];
        }
      }
    }
    switch(shapeName) {
      case "circle":
        if (options.center instanceof google.maps.LatLng) {
          shape = new google.maps.Circle(options);
        } else {
          var orgCenter = options.center;
          options.center = new google.maps.LatLng(0,0);
          shape = new google.maps.Circle(options);
          parser.setDelayedGeoLocation(shape, 'setCenter', orgCenter);
        }
        break;
      case "polygon":
        shape = new google.maps.Polygon(options);
        break;
      case "polyline": 
        shape = new google.maps.Polyline(options);
        break;
      case "rectangle": 
        if (options.bounds) {
          options.bounds = getBounds(options.bounds);
        }
        shape = new google.maps.Rectangle(options);
        break;
      case "groundOverlay":
      case "image":
        var url = options.url;
        var bounds = getBounds(options.bounds);
        var opts = {opacity: options.opacity, clickable: options.clickable, id:options.id};
        shape = new google.maps.GroundOverlay(url, bounds, opts);
        break;
    }

    /**
     * set events
     */
    for (var eventName in events) {
      if (events[eventName]) {
        google.maps.event.addListener(shape, eventName, events[eventName]);
      }
    }
    return shape;
  };
  
  return {
    restrict: 'E',
    require: '^map',
    /**
     * link function
     * @private
     */
    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var shapeOptions = parser.getOptions(filtered);
      var shapeEvents = parser.getEvents(scope, filtered);

      var shape = getShape(shapeOptions, shapeEvents);
      mapController.addShape(shape);

      /**
       * set observers
       */
      parser.observeAttrSetObj(orgAttrs, attrs, shape); 
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name traffic-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <traffic-layer></traffic-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('trafficLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getLayer = function(options, events) {
    var layer = new google.maps.TrafficLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }
    return layer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);
      console.log('traffic-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('trafficLayers', layer);
      parser.observeAttrSetObj(orgAttrs, attrs, layer);  //observers
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name transit-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <transit-layer></transit-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('transitLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getLayer = function(options, events) {
    var layer = new google.maps.TransitLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }
    return layer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);
      console.log('transit-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('transitLayers', layer);
      parser.observeAttrSetObj(orgAttrs, attrs, layer);  //observers
    }
   }; // return
}]);

/**
 * @ngdoc directive
 * @name weather-layer
 * @requires Attr2Options 
 * @description 
 *   Requires:  map directive
 *   Restrict To:  Element
 *
 * @example
 * Example: 
 *
 *   <map zoom="13" center="34.04924594193164, -118.24104309082031">
 *     <weather-layer></weather-layer>
 *    </map>
 */
/*jshint -W089*/
ngMap.directive('weatherLayer', ['Attr2Options', function(Attr2Options) {
  var parser = Attr2Options;
  
  var getLayer = function(options, events) {
    var layer = new google.maps.weather.WeatherLayer(options);
    for (var eventName in events) {
      google.maps.event.addListener(layer, eventName, events[eventName]);
    }
    return layer;
  };
  
  return {
    restrict: 'E',
    require: '^map',

    link: function(scope, element, attrs, mapController) {
      var orgAttrs = parser.orgAttributes(element);
      var filtered = parser.filter(attrs);
      var options = parser.getOptions(filtered);
      var events = parser.getEvents(scope, filtered);

      console.log('weather-layer options', options, 'events', events);

      var layer = getLayer(options, events);
      mapController.addObject('weatherLayers', layer);
      parser.observeAttrSetObj(orgAttrs, attrs, layer);  //observers
    }
   }; // return
}]);
'use strict';

angular
.module('tagga-twt', [
	// 'ezfb',
	'ngCookies',
	'ngResource',
	'ngMap'
])
.config([
	'$locationProvider',
	function($locationProvider) {
		$locationProvider.html5Mode(true);
	}
]);

'use strict';

angular.module('tagga-twt')
.factory('taggaFormUtils', [
  function () {
    return {
      generateAttributes: function (elem, config) {
        var attr, i, l, attrs;

        // check that all required attributes are on the element
        for (i=0, attrs=config.requiredAttrs, l=attrs.length; i<l; i++) {
          attr = attrs[i];
          if (!elem.getAttribute(attr)) {
            throw new Error('A ' + attr + ' attribute is required for ' + elem.nodeName);
          }
        }

        // add all attributes but check if it should be renamed first
        // renaming to null excludes the field and stops it from being copied
        var addedAttrs = {};
        for (var i=0, attrs=elem.attributes, l=attrs.length; i<l; i++) {
          attr = attrs.item(i);
          if (config.renameAttrs) {
            if (config.renameAttrs.hasOwnProperty(attr.nodeName)) {
              var newAttr = config.renameAttrs[attr.nodeName];
              if (newAttr) {
                addedAttrs[newAttr]=attr.value;
              }
              continue;
            }
          }
          addedAttrs[attr.nodeName]=attr.value;

          if( attr.nodeName === 'name' ) {
            addedAttrs.id = attr.value;
          }
        }

        // add all default properties that do not have values
        if (config.defaultAttrs) {
          for(var fnName in config.defaultAttrs){
            if (!addedAttrs.hasOwnProperty(fnName)) {
              addedAttrs[fnName]=config.defaultAttrs[fnName];
            }
          }
        }
        return addedAttrs;
      },
      getTaggaForm: function (elem) {
        var element = elem;

        //traverse through element's parents until:
        // - we hit TAGGA-FORM
        // - we hit window object (undefined tag name)
        while( element.prop('tagName') ) {
          element = element.parent();
          if ( element.prop('tagName') === 'TG-FORM' ) {
            return element[0];
          }
        }

        throw new Error('Cannot find a TG-FORM parent');
      },
      getAttributesText: function (attrObj) {
        var result = '';
        for(var nodeName in attrObj){
          result = result.concat(nodeName);
          if (attrObj[nodeName]) {
            result = result.concat('="' + attrObj[nodeName] + '"');
          }
          result = result.concat(' ');
        }
        return result;
      },
      camelCaseToTitleCase: function (input) {
        return input.charAt(0).toUpperCase() + input.substr(1).replace(/[A-Z]/g, ' $&');
      },
      camelCase:function (str) {
          var camelCased = str.replace(/[-_ .]+(.)?/g, function (match, p) {
              if (p) {
                  return p.toUpperCase();
              }
              return '';
          }).replace(/[^\w]/gi, '');
          return camelCased;
      },
      checkRequiredAttributes: function (elem, requiredAttrs) {
        // check that all required attributes are on the element
        for (var i = 0, length = requiredAttrs.length; i < length; i++) {
          var attr = requiredAttrs[i];
          if( ! elem.hasAttribute(attr) ) {
            throw new Error('The ' + attr + ' attribute is required for ' + elem.nodeName);
          }
        }
      }
    };
  }
]);
'use strict';

//module to retrieve IID from a CORS request
angular.module('tagga-twt')
.provider('taggaIID', function () {
  this.IIDUrl = '//localhost:8080/widgetservices/iid';

  this.setIIDUrl = function (url) {
    this.IIDUrl = url;
  };

  this.$get = [
    '$http',
    '$window',
    '$document',
    '$timeout',
    '$q',
    function ($http, $window, $document, $timeout, $q) {
      var IIDUrl = this.IIDUrl;
      //inject IID endpoint as script if it doesn't exist
      (function(d){
        var js, id = 'tagga-iid', ref = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = IIDUrl;
        ref.parentNode.insertBefore(js, ref);
      }($document[0]));

      var deferred = $q.defer();

      //check until the global iid variable becomes available
      $timeout(function _iid() {
        if( $window.iid ) {
          console.log($window.iid, 'IID');
          deferred.resolve($window.iid);
        } else {
          $timeout(_iid, 300);
        }
      });

      return {
        get: function () {
          return deferred.promise;
        }
      };
    }
  ];
});
'use strict';

//module to retrieve Social sharing link
angular.module('tagga-twt')
.factory('tgSocialLink', [
  '$http',
  'taggaIID',
  function ($http, taggaIID) {
    return {
      getLink: function (url, social_type) {
        return taggaIID.get().then(function (iid) {
          return $http({
            url: '/sociallink',
            data: {
              url: url,
              social_type: social_type,
              iid: iid
            },
            method: 'post'
          }).then(
            function (response) {
              return 'https://' + response.data.url;
            },
            function (response) {
              console.warn('Could not get ' + social_type + ' share url!');
              return url;
            }
          );
        });
      }
    };
  }
]);
'use strict';

angular.module('tagga-twt')
.directive('tgFacebookAuth',
  [
    'ezfb', //FB service
    'taggaFormUtils',
    '$location',
    '$window',
    '$timeout',
    function (ezfb, util, $location, $window, $timeout) {
      var formModel; //keep track of form model for autofill
      var errorElement; //ID of element to show oAuth errors

      var firstnameField, lastnameField, emailField; //fields to autofill
      var agreementField = false;
      var autoSubmit = false; //auto submit form after fill

      var appId; //fb app id

      return {
        scope: false,
        restrict: 'E',
        transclude: true,
        template: function (elem, attrs) {
          //all attrs required except auto-submit
          var requiredAttrs = [
            'form-name',
            'error-element',
            'firstname-field',
            'lastname-field',
            'email-field',
            'app-id'
          ];

          //check required attrs and throw error if needed
          util.checkRequiredAttributes(elem[0], requiredAttrs);

          //now we can direct assign without fear
          formModel = attrs.formName;
          errorElement = attrs.errorElement;
          firstnameField = attrs.firstnameField;
          lastnameField = attrs.lastnameField;
          emailField = attrs.emailField;

          if( elem[0].hasAttribute('agreement-field') ) {
            agreementField = attrs.agreementField;
          }

          autoSubmit = elem[0].hasAttribute('auto-submit');

          appId = attrs.appId;

          //transclude everything inside to a link
          var template = '<a href="" ng-click="fb_login()" ng-transclude></a>';

          return template;
        },
        link: function (scope, elem) {
          //function to run after login, autofills form
          function afterLogin(user) {
            if( !user.email ) {
              scope.fb_error('Email is required for Facebook.');
            }

            //name parsing, is there a better way ?
            var name_parts = user.name.split(' ');
            var first_name = name_parts[0];
            var last_name = name_parts[name_parts.length-1];

            //fill in model fields
            scope[formModel][util.camelCase(firstnameField)] = first_name;
            scope[formModel][util.camelCase(lastnameField)] = last_name;
            scope[formModel][util.camelCase(emailField)] = user.email;

            if( agreementField ) {
              scope[formModel][util.camelCase(agreementField)] = true;
            }

            //apply if not already $digest ing
            if( !scope.$$phase ) {
              scope.$apply();
            }

            //auto submit if needed
            if( autoSubmit ) {
              //small delay before submission so the digest cycle is over
              //otherwise models don't get updated
              $timeout(scope.submit, 100);
            }
          }

          //init FB service with values
          ezfb.init({
            appId: appId,
            xfbml: true,
            version: 'v2.0',
            status: true,
            cookie: true,
            oauth: true
          });

          //main login function
          scope.fb_login = function () {
            //if their browser sucks, use alternate login flow
            if( navigator.userAgent.match('CriOS') || navigator.userAgent.match('iPhone') ) {
                $window.location.href = "https://m.facebook.com/dialog/oauth?client_id=" + appId
                  + "&response_type=code&redirect_uri=" + $window.location.href
                  + "&scope=email&response_type=token";
                return;
            }

            //attempt to login using SDK
            ezfb.login(function (response) {
              if( response.authResponse && response.authResponse.accessToken ) {    
                ezfb.api('me?fields=id,name,email', afterLogin);
              } else {
                scope.fb_error("You're not logged in.");
              }
            }, {scope:'email'});
          };

          //display any errors on the error element
          scope.fb_error = function (message) {
            $('#' + errorElement).text(message);
          }

          //if we detect a url fragment, attempt to parse it
          //this is the alternate login flow
          if( $location.hash() ) {
            var parsed_fragment = {};
            var query_params = $location.hash().split('&');
            for( var i = 0; i < query_params.length; i++ ) {
              var parts = query_params[i].split('=');
              parsed_fragment[parts[0]] = parts[1];
            }

            //if there's a fragment, and access_token exists
            if( parsed_fragment && parsed_fragment.access_token ) {
              $location.hash(''); //remove fragment from url
              //login
              ezfb.getLoginStatus(function (resp) {
                ezfb.api('me?fields=id,name,email', afterLogin);
              });
            }
          }
        }
      };
    }
  ]
);
'use strict';

angular.module('tagga-twt')
.directive('tgFacebook',
  [
    '$window',
    '$http',
    'tgSocialLink',
    'taggaFormUtils',
    'ezfb',
    function ($window, $http, social, util, ezfb) {
      var appId; //fb app id
      var shareMode = 'link';

      return {
        scope: {
          url: '@',
          picture: '@',
          title: '@',
          description: '@'
        },
        restrict: 'E',
        transclude: true,
        template: function (elem, attrs) {
          //check for url attr
          util.checkRequiredAttributes(elem[0], ['url']);

          //check if share mode is app (default link)
          if( elem[0].hasAttribute('share-mode') ) {
            if( attrs.shareMode == 'app' ) {
              if( !attrs.appId ) {
                throw new Error('app-id attribute is required for share-mode="app" for fb-auth');
              }

              appId = attrs.appId;
              shareMode = 'app';
            }
          }

          var template = '<a href="" ng-click="share_' + shareMode + '()" ng-transclude></a>';

          //check if we want to show counts
          if( elem[0].hasAttribute('show-count') ) {
            template +=  ' Shares: {{count}}';
          }

          return template;
        },
        link: function (scope, elem) {
          //pre-emptively get short url from platform
          social.getLink(scope.url, 'FACEBOOK').then(function (url) {
            scope.url = url;
          });

          if( shareMode == 'app' ) {
            //init FB service with values
            ezfb.init({
              appId: appId,
              xfbml: true,
              version: 'v2.0',
              status: true,
              cookie: true,
              oauth: true
            });
          }

          //share function upon clicking the link
          scope.share_app = function () {
            //fb sdk call
            ezfb.ui(
              {
                method: 'share',
                href: scope.url
              },
              function (response) {
                console.log('fb response', response);
              }
            );
          };

          scope.share_link = function () {
            window.open('https://www.facebook.com/sharer/sharer.php?' + '&u=' + scope.url,
              "Share",
              "status = 1, height = 400, width = 525, resizable = 0"
            );
          }

          if( elem[0].hasAttribute('show-count') ) {
            //hold the like/share count
            scope.count = 0;
            //get the count from FB using FQL
            $http({
             url: 'https://graph.facebook.com/fql',
             params: {
               q: 'SELECT url, normalized_url, share_count, like_count, comment_count, total_count, commentsbox_count, comments_fbid, click_count FROM link_stat WHERE url="' + scope.url + '"',
               cachebuster: new Date().getTime()
             }
            }).then(function (response) {
             if( response.data && response.data.data && response.data.data[0] ) {
               scope.count = response.data.data[0].total_count;
             }
            });
          }
        }
      };
    }
  ]
);
'use strict';

angular.module('tagga-twt')
.directive('tgForm', [
  'taggaFormUtils',
  function (util) {
    var formName;
    var modelName;
    var model = {}; //model data
    var postSubmitUrl = '/'; //default post submit action
    var onceOnly = false; //user goes to post-submit-url if form is submitted once

    return {
      template : function (elem) {
      	var taggaform = elem[0]; 
        modelName = util.camelCase(taggaform.getAttribute('model'));

        //get attributes as a string
        var formAttrs = util.generateAttributes(
          taggaform, 
          {
            requiredAttrs:['model'],
            defaultAttrs: { 'name': modelName + 'Form',
                            'ng-submit':'submit()',
                            'novalidate':''
                          },
            renameAttrs:  {'model':null,
                            'form-class':'class'}
          });

          formName = formAttrs.name;

          //post-submit-url is required
          if( ! taggaform.hasAttribute('post-submit-url') ) {
            throw Error('post-submit-url attribute is required for tg-form!');
          }

          postSubmitUrl = taggaform.getAttribute('post-submit-url');

          if( taggaform.hasAttribute('once-only') ) {
            onceOnly = true;
          }

    	    var template = '<form ng-transclude ' + util.getAttributesText(formAttrs) + '></form>';
          return template;
      },
      restrict: 'E',
      transclude: true,
      scope : false,
  	  controller: [
        '$scope',
        '$http',
        'taggaIID',
        '$window',
        // '$cookies',
        function ($scope, $http, taggaIID, $window, $cookies) {
          //redirect the user if the form was submitted before
          //and the cookie is found & form has once-only attribute
          // if( onceOnly && $cookies.formSubmitted ) {
          //   $window.location.href = postSubmitUrl;
          // }

          //init model data & submitted flag
          $scope[modelName] = model;
          $scope[modelName+'Submitted'] = false;

          //form submit action
          $scope.submit = function () {
            $scope[modelName+'Submitted'] = true; //set flag for validation

            //don't submit if form is invalid
            if( ! $scope[formName].$valid ) {
              return false;
            }

            console.log('Submitted', model);

            //get IID and then post form data
            taggaIID.get().then(
              function (iid) {
                $http({
                  method: 'post',
                  url: '/form',
                  data: {
                    'form_data': model,
                    'iid': iid
                  }
                }).success(function (resp) {
                  //set submitted cookie if onceOnly is enabled
                  // if( onceOnly ) {
                  //   $cookies.formSubmitted = true;
                  // }
                  $window.location.href = postSubmitUrl;
                }).error(function (resp) {
                  console.warn('Error submitting form.', resp);
                });
              }
            );
    	  	};
    	  }
      ],
      link: function (scope, element) {
        //replace to remove the <tg-form> element
        var firstChild = element[0].firstChild;
        element.replaceWith(firstChild);
      }
    };
  }
]);
'use strict';

angular.module('tagga-twt')
.directive('tgGplus',
  [
    '$window',
    '$http',
    'tgSocialLink',
    'taggaFormUtils',
    function ($window, $http, social, util) {
      return {
        scope: {
          url: '@' //bind url from attr
        },
        restrict: 'E',
        transclude: true,
        template: function (elem) {
          //check for url attr
          util.checkRequiredAttributes(elem[0], ['url']);

          var template = '<a href="" ng-click="share()" ng-transclude></a>';

          //show count if enabled
          if( elem[0].hasAttribute('show-count') ) {
            template += ' Shares: {{count}}';
          }

          return template;
        },
        link: function (scope, elem) {
          //pre-emptively get short url from platform
          social.getLink(scope.url, 'GOOGLEPLUS').then(function (url) {
            scope.url = url;
          });

          //share function upon clicking the link
          scope.share = function () {
            $window.open(
              'https://plus.google.com/share?' + 'url=' + encodeURIComponent(scope.url),
              'sharer',
              'toolbar=0,status=0,width=626,height=436');
          };

          if( elem[0].hasAttribute('show-count') ) {
            //hold the share count
            scope.count = 0;

            //request gplus count
            $http({
              method: 'post',
              url: '/gplusCount',
              data: {
                'url': scope.url
              }
            }).success(function (response) {
              scope.count = response.count;
            }).error(function (response) {
              console.warn('Cannot get gplus count!', response);
            });
          }
        }
      };
    }
  ]
);
'use strict';

angular.module('tagga-twt')
.directive('tgInput', [
  'taggaFormUtils',
  function (util) {
    return {
      template : function (elem, attrs) {
        var taggaInput = elem[0]; //dom element
        var taggaForm = util.getTaggaForm(elem); //form element

        //element properties
        var name = taggaInput.getAttribute('name');
        var property = util.camelCase(name);

        //label options
        var label = taggaInput.getAttribute('label');
        if (!label) {
          label = util.camelCaseToTitleCase(property);
        }
        var disableLabel = taggaInput.hasAttribute('disable-label');

        //model names in scope
        var modelName = util.camelCase(taggaForm.getAttribute('model'));
        var formName = taggaForm.getAttribute('name');
        if (!formName) {
          formName = modelName + 'Form';
        }
        var modelPropName = formName + '.' + name;

        //construct attributes
        var formAttrs = util.generateAttributes(
          taggaInput, 
          {
            requiredAttrs:['name'],
            defaultAttrs: {
              'ng-model': modelName + '.' + property,
              'type': 'text',
              'novalidate': ''
            },
            renameAttrs: {
              'minlength': 'ng-minlength',
              'maxlength': 'ng-maxlength',
              'pattern': 'ng-pattern',
              'input-class': 'class',
              'div-class': null,
              'class': null
            }
          }
        );

        //attribute options
        var isRequired = (taggaInput.getAttribute('required') !== null) || (taggaInput.getAttribute('ng-required') !== null);
        var isClass = taggaInput.hasAttribute('div-class');
        var className = taggaInput.getAttribute('div-class');
        var isEmail = (formAttrs.type === 'email');
        if( ! isClass ) {
          className = 'large-12 columns';
        }
        var isCheckbox = taggaInput.getAttribute('type') === 'checkbox';
        var inputType = taggaInput.getAttribute('type');
        var phoneValidationPattern;
        if( inputType === 'tel' ) {
          phoneValidationPattern = ' ng-pattern="/^\\+?\\d{3}[- ]?\\d{3}[- ]?\\d{4}$/"';
        }

        //template for checkbox (label comes after)
        var checkboxTemplate =
          ( ! disableLabel ? '<label for="' + name + '">' : '' )
          + '<input ' + util.getAttributesText(formAttrs) + '/>'
          + ( ! disableLabel ? ' <span>' + label + '</span>' : '' )
          + ( isRequired ? ' <span class="required-asterisk">*</span>' : '' )
          + ( ! disableLabel ? '</label>' : '' )
        ;

        //template for input
        var inputTemplate =
          ( ! disableLabel ? '<label for="' + name + '"' + ' ng-class="{error:' + modelPropName + '.$error && ' + modelPropName + '.dirty}">' + label : '' )
          + ( isRequired && ! disableLabel ? ' <span class="required-asterisk">*</span>' : '' )
          + '<input ' + util.getAttributesText(formAttrs) + ( phoneValidationPattern ? phoneValidationPattern : '' ) + '/>'
          + ( ! disableLabel ? '</label>' : '' )
        ;

        //pristine AND form has to be submitted for validation to take effect
        // var submitBehavior = ' && (!' + modelPropName + '.$pristine || ' + modelName + 'Submitted)';
        var submitBehavior = ' && ' + modelName + 'Submitted';

        //error options
        var errorAccessor = modelPropName + '.$error';
        var errorMessages = {
          required: label + ' is required.',
          email: label + ' is not a valid email address.',
          minlength: label + ' must have at least ' + (formAttrs.hasOwnProperty('ng-minlength') ? formAttrs['ng-minlength'] : 0) + ' characters.',
          maxlength: label + ' must have at most ' + (formAttrs.hasOwnProperty('ng-maxlength') ? formAttrs['ng-maxlength'] : 0) + ' characters.',
          pattern: label + ' is not a valid phone number.'
        };

        //set errors from attributes
        if( attrs.hasOwnProperty('requiredError') ) {
          errorMessages.required = attrs.requiredError;
        }
        if( attrs.hasOwnProperty('emailError') ) {
          errorMessages.email = attrs.emailError;
        }
        if( attrs.hasOwnProperty('minlengthError') ) {
          errorMessages.minlength = attrs.minlengthError;
        }
        if( attrs.hasOwnProperty('maxlengthError') ) {
          errorMessages.maxlength = attrs.maxlengthError;
        }
        if( attrs.hasOwnProperty('phoneError') ) {
          errorMessages.pattern = attrs.phoneError;
        }

        //utility function for sanity's sake
        function generateErrorMarkup(errorField) {
          return '<small class="error" ng-show="' + errorAccessor + '.' + errorField + ' ' + submitBehavior + '">' + errorMessages[errorField] + '</small>';
        }

        //resulting template
        var template =
          '<div class="' + className + '" ng-class="{error: ' + modelPropName + '.$invalid' + submitBehavior + '}">'// ng-messages="' + modelPropName + '.$error">'
          + ( isCheckbox ? checkboxTemplate : inputTemplate )
          + ( isRequired ? generateErrorMarkup('required') : '' )
          + ( isEmail ? generateErrorMarkup('email') : '' )
          + ( formAttrs.hasOwnProperty('ng-minlength') ? generateErrorMarkup('minlength') : '')
          + ( formAttrs.hasOwnProperty('ng-maxlength') ? generateErrorMarkup('maxlength') : '')
          + ( phoneValidationPattern ? generateErrorMarkup('pattern') : '')
          + ( ! disableLabel ? '</label>' : '' )
          + '</div>';
        return template;
      },
      scope: false,
      restrict: 'E',
      require: '^tgForm',
      link: function (scope, element) {
        //replace element so we remove the <tg-input> tags
        var firstChild = element[0].firstChild;
        element.replaceWith(firstChild);
      }
    };
  }
]);
'use strict';

angular.module('tagga-twt')
.directive('tgSmsOptIn', [
  'taggaFormUtils',
  function (util) {
    var taggaFormElem, modelName, propertyName;

    var shortcode, keyword;
    var phoneField;

    return {
      template : function (elem, attrs) {
        var element = elem[0];

        var name = element.getAttribute('name');
        propertyName = util.camelCase(name);
        var divClass = element.getAttribute('div-class') || 'large-12 columns';
        var label = element.getAttribute('label') || 'Yes! I want to receive the latest offers, promotions and news via phone.';
        shortcode = element.getAttribute('shortcode');
        keyword = element.getAttribute('keyword');

        taggaFormElem = util.getTaggaForm(elem);
        modelName = util.camelCase(taggaFormElem.getAttribute('model'));
        var optinToggle = modelName + '.' + propertyName + '.optin';

        var forDelegate = element.getAttribute('for');

        var required = '';
        if( element.hasAttribute('required') ) {
          required = 'required';
        }

        var requiredError = '';
        if( element.hasAttribute('required-error') ) {
          requiredError = 'required-error="' + attrs.requiredError + '"';
        }

        var phoneLabel = '';
        if( element.hasAttribute('phone-label') ) {
          phoneLabel = 'label="' + attrs.phoneLabel + '"';
        }

        var phoneError = '';
        if( element.hasAttribute('phone-error') ) {
          phoneError = 'phone-error="' + attrs.phoneError + '"';
        }

        var phoneRequiredError = '';
        if( element.hasAttribute('phone-required-error') ) {
          phoneRequiredError = 'required-error="' + attrs.phoneRequiredError + '"';
        }

        var consentLabel = element.getAttribute('consent-label') || 'Agree to terms of consent';

        var consentError = '';
        if( element.hasAttribute('consent-error') ) {
          consentError = 'required-error="' + attrs.consentError + '"';
        }

        var checkbox =
          '<div class="' + divClass + '">'
          +  '<tg-input type="checkbox" name="' + name + '" ng-model="' + optinToggle + '" label="' + label + '" ' + required + ' ' + requiredError + '></tg-input>'
          + '</div>';

        if( ! forDelegate ) {
          checkbox +=
            '<div class="' + divClass + '" ng-show="' + optinToggle + '">'
            +  '<tg-input name="phone" type="tel" placeholder="555-555-5555" ng-required="'+optinToggle+'" ' + phoneError + ' ' + phoneLabel + ' ' + phoneRequiredError + '></tg-input>'
            +  '<tg-input type="checkbox" name="' + name + '_agreed' + '" ng-model="' + modelName + '.' + propertyName + '.agreed' + '" label="' + consentLabel + '" ng-required="' + optinToggle + '" ' + consentError + '></tg-input>'
            + '</div>';

          phoneField = 'phone';
        } else {
          phoneField = forDelegate;
        }

        var template = '<div>' + checkbox + '</div>';
        return template;
      },
      scope: false,
      restrict: 'E',
      require: '^tgForm',
      link: function (scope, elem) {
        var element = elem[0];

        var firstChild = element.firstChild;
        elem.replaceWith(firstChild);

        scope[modelName][propertyName] = {
          optin: false,
          agreed: false,
          shortcode: shortcode,
          keyword: keyword,
          phoneField: util.camelCase(phoneField)
        };
      }
    };
  }
]);

angular.module('tagga-twt')
.directive('tgEmailOptIn', [
  'taggaFormUtils',
  function (util) {
    var taggaFormElem, modelName, propertyName;

    var listId;
    var apiKey;
    var firstNameField, lastNameField, emailField;

    return {
      template : function (elem, attrs) {
        var element = elem[0];

        var name = element.getAttribute('name');
        propertyName = util.camelCase(name);
        var divClass = element.getAttribute('div-class') || 'large-12 columns';
        var label = element.getAttribute('label') || 'Yes! I want to receive the latest offers, promotions and news via email.';

        if( ! element.hasAttribute('list-id') ) {
          throw new Error('list-id is required for email opt-in!');
        }
        listId = element.getAttribute('list-id');

        if( ! element.hasAttribute('api-key') ) {
          throw new Error('api-key is required for email opt-in');
        }
        apiKey = element.getAttribute('api-key');

        if( ! element.hasAttribute('firstname-field') ) {
          throw new Error('firstname-field attr is required for email opt-in');
        }
        firstNameField = element.getAttribute('firstname-field');

        if( ! element.hasAttribute('lastname-field') ) {
          throw new Error('lastname-field attr is required for email opt-in');
        }
        lastNameField = element.getAttribute('lastname-field');

        taggaFormElem = util.getTaggaForm(elem);
        modelName = util.camelCase(taggaFormElem.getAttribute('model'));
        var optinToggle = modelName + '.' + propertyName + '.optin';

        var forDelegate = element.getAttribute('for');

        var emailLabel = '';
        if( element.hasAttribute('email-label') ) {
          emailLabel = 'label="' + attrs.emailLabel + '"';
        }

        var emailError = '';
        if( element.hasAttribute('email-error') ) {
          emailError = 'email-error="' + attrs.emailError + '"';
        }

        var emailRequiredError = '';
        if( element.hasAttribute('email-required-error') ) {
          emailRequiredError = 'required-error="' + attrs.emailRequiredError + '"';
        }

        var required = '';
        if( element.hasAttribute('required') ) {
          required = 'required';
        }

        var requiredError = '';
        if( element.hasAttribute('required-error') ) {
          requiredError = 'required-error="' + attrs.requiredError + '"';
        }

        var checkbox =
          '<div class="' + divClass + '">'
          +  '<tg-input type="checkbox" name="' + name + '" ng-model="' + optinToggle + '" label="' + label + '" ' + required + ' ' + requiredError + '></tg-input>'
          + '</div>';

        if( ! forDelegate ) {
          checkbox +=
            '<div class="' + divClass + '" ng-show="' + optinToggle + '">'
            +  '<tg-input name="email" type="email" ng-required="'+optinToggle+'" ' + emailLabel + ' ' + emailError + ' ' + emailRequiredError + '></tg-input>'
            + '</div>';

          emailField = 'email';
        } else {
          emailField = forDelegate;
        }

        var template = '<div>' + checkbox + '</div>';
        return template;
      },
      scope: false,
      restrict: 'E',
      require: '^tgForm',
      link: function (scope, elem) {
        var element = elem[0];

        var firstChild = element.firstChild;
        elem.replaceWith(firstChild);

        scope[modelName][propertyName] = {
          optin: false,
          listId: listId,
          apiKey: apiKey,
          firstNameField: util.camelCase(firstNameField),
          lastNameField: util.camelCase(lastNameField),
          emailField: util.camelCase(emailField)
        };
      }
    };
  }
]);
angular.module('tagga-twt')
.directive('tgPinterest',
  [
    '$window',
    '$http',
    'tgSocialLink',
    'taggaFormUtils',
    function ($window, $http, social, util) {
      return {
        scope: {
          url: '@',
          description: '@',
          imgUrl: '@'
        },
        restrict: 'E',
        transclude: true,
        template: function (elem) {
          //check for url attr
          util.checkRequiredAttributes(elem[0], ['url', 'img-url']);

          var template = '<a href="" ng-click="share()" ng-transclude></a>';

          return template;
        },
        link: function (scope, elem) {
          //pre-emptively get short url from platform
          social.getLink(scope.url, 'PINTEREST').then(function (url) {
            scope.url = url;
          });

          //share function upon clicking the link
          scope.share = function () {
            $window.open(
              'http://pinterest.com/pin/create/button/?url='
              + encodeURIComponent(scope.url)
              + '&media='+encodeURIComponent(scope.imgUrl)
              + '&description='+encodeURIComponent(scope.description),
              'sharer',
              'toolbar=0,status=0,width=626,height=436');
          };
        }
      };
    }
  ]
);
'use strict';

//service for resource
angular.module('tagga-twt')
.service('StoreLocator', [
  '$resource',
  function ($resource) {
    var storeResource = $resource('/storelocator', {},
      {
      getSearchParams: {
        method: 'get',
        url: '/storelocator',
        isArray: false,
        cache: true,
        params: {
          widget_id: '@widget_id'
        }
      },
      search: {
        method: 'post',
        url: '/storelocator',
        cache: true,
        params: {
          widget_id: '@widget_id'
        }
      }
    });

    return {
      resource: storeResource
    }
  }
]);

//main controller
angular.module('tagga-twt')
.controller('StoreLocatorCtrl', [
  'StoreLocator',
  '$scope',
  '$location',
  '$rootScope',
  function (StoreLocator, $scope, $location, $rootScope) {
    console.log('ctrl init');

    $scope.$watch('widget_id', function (newVal) {
      console.log('watch', newVal);
      $scope.search_params = StoreLocator.resource.getSearchParams({widget_id: $scope.widget_id});

      $scope.search = angular.copy($location.search());
      if( ! angular.equals({}, $scope.search) ) {
        $scope.doSearch();

        if( $scope.search.location && newVal ) {
          $scope.search_result.$promise.then(function (a) {
            $scope.showDetails($scope.search.location);
          });
        }
      }
    });

    $scope.search = {};
    $scope.search_result = {};
    $scope.searched = false;
    $scope.store_detail = false;
    $scope.google = {
      autocomplete: ''
    };

    $scope.doSearch = function () {
      console.log('searching', $scope.search);
      var search_params = angular.copy($scope.search);
      search_params.widget_id = $scope.widget_id;

      $scope.search_result = StoreLocator.resource.search(search_params);
      $location.search($scope.search);
      $scope.searched = true;
    };

    $scope.getLocationAndSearch = function () {
      navigator.geolocation.getCurrentPosition(function(position) {
        $scope.search.lat = position.coords.latitude;
        $scope.search.long = position.coords.longitude;

        $scope.$apply();
        $scope.doSearch();
      }, function(error) {
        $scope.geolocationError = 'There was an error retrieving your location. Please try searching with parameters.';
        $scope.$apply();
      });
    };

    $scope.resetSearch = function () {
      $scope.search = {};
      $scope.search_result = {};
      $scope.searched = false;
      $scope.store_detail = false;
      $scope.google.autocomplete = '';
      $location.search({});
    };

    $scope.showDetails = function (store_name) {
      for( key in $scope.search_result.results ) {
        if( store_name == $scope.search_result.results[key].name ) {
          console.log('found', $scope.search_result.results[key]);
          $scope.store_detail = $scope.search_result.results[key];
        }
      }
    }

    $scope.closeDetails = function () {
      $scope.store_detail = false;
    };

    $rootScope.$on("$locationChangeStart", function(event, next, current) { 
      console.log($location.search(), $scope.search_result.results);
      var qs = angular.copy($location.search());

      if( qs.location ) {
        $scope.showDetails(qs.location);
      }
    });
  }
]);

//----- Search Form -----//

//overall wrapper, wraps everything
angular.module('tagga-twt')
.directive('tgStoreLocator', [
  'taggaFormUtils',
  function (taggaFormUtils) {
    return {
      scope: false,
      restrict: 'E',
      transclude: true,
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['widget-id']);

        return '<div id="storelocator-search-form" ng-transclude></div>';
      },
      controller: 'StoreLocatorCtrl',
      link: function (scope, element, attrs, controller, transclude) {
        scope.widget_id = attrs.widgetId;
        transclude(scope, function () {
          //empty function, just bind the parent scope
        });
      }
    };
  }
]);

//wrapper for search form
angular.module('tagga-twt')
.directive('tgStoreLocatorSearchForm', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      transclude: true,
      template: function (elem, attrs) {
        return '<form ng-transclude ng-hide="searched"></form>';
      }
    };
  }
]);

//state dropdown
angular.module('tagga-twt')
.directive('tgStoreLocatorStateDropdown', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        return '<select ng-model="search.state" ng-options="state.country_state_shortname as state.country_state_label for state in search_params.states"><option value="">All</option></select>';
      }
    };
  }
]);

//location type dropdown
angular.module('tagga-twt')
.directive('tgStoreLocatorTypeDropdown', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        var multiple = '';
        if( elem[0].hasAttribute('multiple') ) {
          multiple = 'multiple';
        }
        return '<select ng-model="search.location_type_id" ng-options="type.id as type.description for type in search_params.location_types" ' + multiple + '><option value="">All</option></select>';
      }
    };
  }
]);

//search field for zip, city, name
angular.module('tagga-twt')
.directive('tgStoreLocatorSearchField', [
  'taggaFormUtils',
  function (taggaFormUtils) {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['type']);

        var fieldTypes = [
          'city',
          'zip',
          'name'
        ];

        var type = fieldTypes.indexOf(attrs.type);
        if( type == -1 ) {
          throw new Error('"type" attribute for store-locator-search-field must be "city", "zip" or "name"');
        }

        var validAttrs = {};
        for(var key in attrs) {
          if( key.indexOf('$') === -1 ) {
            validAttrs[key] = attrs[key];
          }
        }

        return '<input type="text" ng-model="search.' + fieldTypes[type] + '" ' + taggaFormUtils.getAttributesText(validAttrs) + '>';
      }
    };
  }
]);

//geolocation detect button
angular.module('tagga-twt')
.directive('tgStoreLocatorDetectLocation', [
  'taggaFormUtils',
  '$window',
  function (taggaFormUtils, $window) {
    return {
      restrict: 'E',
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['title']);

        if( $window.navigator.geolocation ) {
          return '<button ng-click="getLocationAndSearch()" type="button">' + attrs.title + '</button><small class="error" ng-show="geolocationError">{{geolocationError}}</small>';
        } else {
          return '';
        }
      }
    };
  }
]);

//google places autocomplete
angular.module('tagga-twt')
.directive('tgStoreLocatorAutocomplete', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        return '<input type="text" ng-model="google.autocomplete">';
      },
      link: function (scope, elem, attrs) {console.log('place scoe id', scope, elem);
        var address_component_list = {
          locality: 'long_name',
          administrative_area_level_1: 'short_name',
          postal_code: 'short_name'
        };

        var autocomplete = new google.maps.places.Autocomplete(
          elem[0].firstChild,
          {
            types: ['geocode']
          }
        );

        google.maps.event.addListener(autocomplete, 'place_changed', function () {
          var place = autocomplete.getPlace();
          console.log('autocomplete done', autocomplete.getPlace());

          for( var key in place.address_components ) {
            var address_type = place.address_components[key].types[0];

            if( address_component_list[address_type] ) {
              var val = place.address_components[key][address_component_list[address_type]];

              switch( address_type ) {
                case 'locality':
                  scope.search.city = val;
                  break;

                case 'administrative_area_level_1':
                  scope.search.state = val;
                  break;

                case 'postal_code':
                  scope.search.zip = val;
                  break;
              }

              scope.$apply();
            }
          }
        });

        google.maps.event.addDomListener(elem[0].firstChild, 'keydown', function (event) {
          if( event.keyCode == 13 && $('.pac-container').is(':visible') ) {
            event.preventDefault();
          }
        });
      }
    };
  }
]);

//search button
angular.module('tagga-twt')
.directive('tgStoreLocatorSearchButton', [
  'taggaFormUtils',
  function (taggaFormUtils) {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['title']);

        return '<button ng-click="doSearch()" ng-disabled="! search_params.$resolved">' + attrs.title + '</button>';
      }
    };
  }
]);

//reset button
angular.module('tagga-twt')
.directive('tgStoreLocatorResetButton', [
  'taggaFormUtils',
  function (taggaFormUtils) {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['title']);

        return '<button ng-click="resetSearch()">' + attrs.title + '</button>';
      }
    };
  }
]);

//----- Search Results -----//

//search results container
angular.module('tagga-twt')
.directive('tgStoreLocatorResult', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      transclude: true,
      template: function (elem, attrs) {
        return '<div ng-transclude ng-if="!store_detail"></div>';
      }
    };
  }
]);

//default template for the results display
angular.module('tagga-twt')
.directive('tgStoreLocatorResultDefault', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        return '\
          <div class="row store-list-item">\
            <div class="large-9 columns">\
              <div class="store-name"><a href="?location={{store.name}}">{{store.name}}</a></div>\
              <div class="store-address">{{store.address}}</div>\
              <div class="store-city">{{store.city}}</div>\
              <div class="store-state">{{store.state}}</div>\
              <div class="store-description" ng-show="store.description">{{store.description}}</div>\
              <div class="store-phone">{{store.phone}}</div>\
            </div>\
            <div class="large-3 columns">\
              <map center="{{store.latitude}}, {{store.longitude}}" zoom="13" style="height: 100px" disable-default-u-i="true">\
                <marker position="{{store.latitude}}, {{store.longitude}}" title="{{store.name}}"></marker>\
              </map>\
            </div>\
          </div>';
      }
    };
  }
]);

//error message if no results are found
angular.module('tagga-twt')
.directive('tgStoreLocatorResultError', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      transclude: true,
      template: function (elem, attrs) {
        return '<div ng-transclude ng-show="search_result.count == 0"></div>';
      }
    };
  }
]);

//----- Location Details -----//

angular.module('tagga-twt')
.directive('tgStoreLocatorDetails', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      transclude: true,
      template: function (elem, attrs) {
        return '<div ng-transclude></div>';
      }
    };
  }
]);

angular.module('tagga-twt')
.directive('tgStoreLocatorDetailsDefault', [
  function () {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        return '\
          <div ng-if="store_detail">\
            <div class="large-12 columns store-list-item">\
              <div class="store-name">{{store_detail.name}}</div>\
              <div class="store-address">{{store_detail.address}}</div>\
              <div class="store-city">{{store_detail.city}}</div>\
              <div class="store-state">{{store_detail.state}}</div>\
              <div class="store-description" ng-show="store_detail.description">{{store_detail.description}}</div>\
              <div class="store-phone">{{store_detail.phone}}</div>\
            </div>\
            <h2 class="store-map-title">Map</h2>\
            <hr class="store-map-hr"></hr>\
            <div class="large-12 columns">\
              <map center="{{store_detail.latitude}}, {{store_detail.longitude}}" zoom="13" style="height: 500px">\
                <marker position="{{store_detail.latitude}}, {{store_detail.longitude}}" title="{{store_detail.name}}" id="store-marker" on-click="showInfoWindow(1)"></marker>\
                <info-window id="1" position="{{store_detail.latitude}}, {{store_detail.longitude}}" visible-on-marker="store-marker">\
                  <div ng-non-bindable="" style="height:auto">\
                    <div class="store-name">{{store_detail.name}}</div>\
                    <div class="store-address">{{store_detail.address}}</div>\
                    <div class="store-city">{{store_detail.city}}</div>\
                    <div class="store-state">{{store_detail.state}}</div>\
                    <div class="store-description" ng-show="store_detail.description">{{store_detail.description}}</div>\
                    <div class="store-phone">{{store_detail.phone}}</div>\
                    <div class="store-image" ng-if="store_detail.img_url"><img src="{{store_detail.img_url}}"></div>\
                  </div>\
                </info-window>\
              </map>\
            </div>\
          </div>\
          ';
      }
    };
  }
]);

angular.module('tagga-twt')
.directive('tgStoreLocatorDetailsClose', [
  'taggaFormUtils',
  function (taggaFormUtils) {
    return {
      scope: false,
      restrict: 'E',
      template: function (elem, attrs) {
        taggaFormUtils.checkRequiredAttributes(elem[0], ['title']);

        return '<button ng-click="closeDetails()" ng-if="store_detail" >' + attrs.title + '</button>';
      }
    };
  }
]);
'use strict';

angular.module('tagga-twt')
.directive('tgTwitter',
  [
    '$window',
    '$http',
    'tgSocialLink',
    'taggaFormUtils',
    function ($window, $http, social, util) {
      return {
        scope: {
          url: '@',
          text: '@',
          hashtags: '@'
        },
        restrict: 'E',
        transclude: true,
        template: function (elem) {
          //check for url attr
          util.checkRequiredAttributes(elem[0], ['url']);

          var template = '<a href="" ng-click="share()" ng-transclude></a>';

          //show count if enabled
          if( elem[0].hasAttribute('show-count') ) {
            template += ' Shares: {{count}}';
          }

          return template;
        },
        link: function (scope, elem) {
          //pre-emptively get short url from platform
          social.getLink(scope.url, 'TWITTER').then(function (url) {
            scope.url = url;
          });

          //share function upon clicking the link
          scope.share = function () {
            $window.open(
              'http://twitter.com/share?text='
              + encodeURIComponent(scope.text)
              + '&url='+encodeURIComponent(scope.url)
              + '&hashtags='+encodeURIComponent(scope.hashtags),
              'sharer',
              'toolbar=0,status=0,width=626,height=436');
          };

          if( elem[0].hasAttribute('show-count') ) {
            //hold the share count
            scope.count = 0;
            //get count from twitter api
            $http.jsonp('https://cdn.api.twitter.com/1/urls/count.json?url=' + scope.url + '&callback=JSON_CALLBACK',
              {
                params: {cachebuster: new Date().getTime()}
              }
            ).success(function (response) {
              if( response.data && response.data.count ) {
                scope.count = response.data.count;
              }
            }).error(function (response) {
              console.warn('Cannot get twitter count!', response);
            });
          }
        }
      };
    }
  ]
);