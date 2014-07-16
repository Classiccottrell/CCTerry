(function(){/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.2
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
function t(i,a){"use strict";function n(t,e){return function(){return t.apply(e,arguments)}}var s;if(a=a||{},this.trackingClick=!1,this.trackingClickStart=0,this.targetElement=null,this.touchStartX=0,this.touchStartY=0,this.lastTouchIdentifier=0,this.touchBoundary=a.touchBoundary||10,this.layer=i,this.tapDelay=a.tapDelay||200,!t.notNeeded(i)){for(var o=["onMouse","onClick","onTouchStart","onTouchMove","onTouchEnd","onTouchCancel"],r=this,c=0,l=o.length;l>c;c++)r[o[c]]=n(r[o[c]],r);e&&(i.addEventListener("mouseover",this.onMouse,!0),i.addEventListener("mousedown",this.onMouse,!0),i.addEventListener("mouseup",this.onMouse,!0)),i.addEventListener("click",this.onClick,!0),i.addEventListener("touchstart",this.onTouchStart,!1),i.addEventListener("touchmove",this.onTouchMove,!1),i.addEventListener("touchend",this.onTouchEnd,!1),i.addEventListener("touchcancel",this.onTouchCancel,!1),Event.prototype.stopImmediatePropagation||(i.removeEventListener=function(t,e,a){var n=Node.prototype.removeEventListener;"click"===t?n.call(i,t,e.hijacked||e,a):n.call(i,t,e,a)},i.addEventListener=function(t,e,a){var n=Node.prototype.addEventListener;"click"===t?n.call(i,t,e.hijacked||(e.hijacked=function(t){t.propagationStopped||e(t)}),a):n.call(i,t,e,a)}),"function"==typeof i.onclick&&(s=i.onclick,i.addEventListener("click",function(t){s(t)},!1),i.onclick=null)}}var e=navigator.userAgent.indexOf("Android")>0,i=/iP(ad|hone|od)/.test(navigator.userAgent),a=i&&/OS 4_\d(_\d)?/.test(navigator.userAgent),n=i&&/OS ([6-9]|\d{2})_\d/.test(navigator.userAgent);t.prototype.needsClick=function(t){"use strict";switch(t.nodeName.toLowerCase()){case"button":case"select":case"textarea":if(t.disabled)return!0;break;case"input":if(i&&"file"===t.type||t.disabled)return!0;break;case"label":case"video":return!0}return/\bneedsclick\b/.test(t.className)},t.prototype.needsFocus=function(t){"use strict";switch(t.nodeName.toLowerCase()){case"textarea":return!0;case"select":return!e;case"input":switch(t.type){case"button":case"checkbox":case"file":case"image":case"radio":case"submit":return!1}return!t.disabled&&!t.readOnly;default:return/\bneedsfocus\b/.test(t.className)}},t.prototype.sendClick=function(t,e){"use strict";var i,a;document.activeElement&&document.activeElement!==t&&document.activeElement.blur(),a=e.changedTouches[0],i=document.createEvent("MouseEvents"),i.initMouseEvent(this.determineEventType(t),!0,!0,window,1,a.screenX,a.screenY,a.clientX,a.clientY,!1,!1,!1,!1,0,null),i.forwardedTouchEvent=!0,t.dispatchEvent(i)},t.prototype.determineEventType=function(t){"use strict";return e&&"select"===t.tagName.toLowerCase()?"mousedown":"click"},t.prototype.focus=function(t){"use strict";var e;i&&t.setSelectionRange&&0!==t.type.indexOf("date")&&"time"!==t.type?(e=t.value.length,t.setSelectionRange(e,e)):t.focus()},t.prototype.updateScrollParent=function(t){"use strict";var e,i;if(e=t.fastClickScrollParent,!e||!e.contains(t)){i=t;do{if(i.scrollHeight>i.offsetHeight){e=i,t.fastClickScrollParent=i;break}i=i.parentElement}while(i)}e&&(e.fastClickLastScrollTop=e.scrollTop)},t.prototype.getTargetElementFromEventTarget=function(t){"use strict";return t.nodeType===Node.TEXT_NODE?t.parentNode:t},t.prototype.onTouchStart=function(t){"use strict";var e,n,s;if(t.targetTouches.length>1)return!0;if(e=this.getTargetElementFromEventTarget(t.target),n=t.targetTouches[0],i){if(s=window.getSelection(),s.rangeCount&&!s.isCollapsed)return!0;if(!a){if(n.identifier===this.lastTouchIdentifier)return t.preventDefault(),!1;this.lastTouchIdentifier=n.identifier,this.updateScrollParent(e)}}return this.trackingClick=!0,this.trackingClickStart=t.timeStamp,this.targetElement=e,this.touchStartX=n.pageX,this.touchStartY=n.pageY,t.timeStamp-this.lastClickTime<this.tapDelay&&t.preventDefault(),!0},t.prototype.touchHasMoved=function(t){"use strict";var e=t.changedTouches[0],i=this.touchBoundary;return Math.abs(e.pageX-this.touchStartX)>i||Math.abs(e.pageY-this.touchStartY)>i?!0:!1},t.prototype.onTouchMove=function(t){"use strict";return this.trackingClick?((this.targetElement!==this.getTargetElementFromEventTarget(t.target)||this.touchHasMoved(t))&&(this.trackingClick=!1,this.targetElement=null),!0):!0},t.prototype.findControl=function(t){"use strict";return void 0!==t.control?t.control:t.htmlFor?document.getElementById(t.htmlFor):t.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")},t.prototype.onTouchEnd=function(t){"use strict";var s,o,r,c,l,d=this.targetElement;if(!this.trackingClick)return!0;if(t.timeStamp-this.lastClickTime<this.tapDelay)return this.cancelNextClick=!0,!0;if(this.cancelNextClick=!1,this.lastClickTime=t.timeStamp,o=this.trackingClickStart,this.trackingClick=!1,this.trackingClickStart=0,n&&(l=t.changedTouches[0],d=document.elementFromPoint(l.pageX-window.pageXOffset,l.pageY-window.pageYOffset)||d,d.fastClickScrollParent=this.targetElement.fastClickScrollParent),r=d.tagName.toLowerCase(),"label"===r){if(s=this.findControl(d)){if(this.focus(d),e)return!1;d=s}}else if(this.needsFocus(d))return t.timeStamp-o>100||i&&window.top!==window&&"input"===r?(this.targetElement=null,!1):(this.focus(d),this.sendClick(d,t),i&&"select"===r||(this.targetElement=null,t.preventDefault()),!1);return i&&!a&&(c=d.fastClickScrollParent,c&&c.fastClickLastScrollTop!==c.scrollTop)?!0:(this.needsClick(d)||(t.preventDefault(),this.sendClick(d,t)),!1)},t.prototype.onTouchCancel=function(){"use strict";this.trackingClick=!1,this.targetElement=null},t.prototype.onMouse=function(t){"use strict";return this.targetElement?t.forwardedTouchEvent?!0:t.cancelable&&(!this.needsClick(this.targetElement)||this.cancelNextClick)?(t.stopImmediatePropagation?t.stopImmediatePropagation():t.propagationStopped=!0,t.stopPropagation(),t.preventDefault(),!1):!0:!0},t.prototype.onClick=function(t){"use strict";var e;return this.trackingClick?(this.targetElement=null,this.trackingClick=!1,!0):"submit"===t.target.type&&0===t.detail?!0:(e=this.onMouse(t),e||(this.targetElement=null),e)},t.prototype.destroy=function(){"use strict";var t=this.layer;e&&(t.removeEventListener("mouseover",this.onMouse,!0),t.removeEventListener("mousedown",this.onMouse,!0),t.removeEventListener("mouseup",this.onMouse,!0)),t.removeEventListener("click",this.onClick,!0),t.removeEventListener("touchstart",this.onTouchStart,!1),t.removeEventListener("touchmove",this.onTouchMove,!1),t.removeEventListener("touchend",this.onTouchEnd,!1),t.removeEventListener("touchcancel",this.onTouchCancel,!1)},t.notNeeded=function(t){"use strict";var i,a;if("undefined"==typeof window.ontouchstart)return!0;if(a=+(/Chrome\/([0-9]+)/.exec(navigator.userAgent)||[,0])[1]){if(!e)return!0;if(i=document.querySelector("meta[name=viewport]")){if(-1!==i.content.indexOf("user-scalable=no"))return!0;if(a>31&&document.documentElement.scrollWidth<=window.outerWidth)return!0}}return"none"===t.style.msTouchAction?!0:!1},t.attach=function(e,i){"use strict";return new t(e,i)},"function"==typeof define&&"object"==typeof define.amd&&define.amd?define(function(){"use strict";return t}):"undefined"!=typeof module&&module.exports?(module.exports=t.attach,module.exports.FastClick=t):window.FastClick=t,function(t,e,i){function a(t){var e={},a=/^jQuery\d+$/;return i.each(t.attributes,function(t,i){i.specified&&!a.test(i.name)&&(e[i.name]=i.value)}),e}function n(t,e){var a=this,n=i(a);if(a.value==n.attr("placeholder")&&n.hasClass("placeholder"))if(n.data("placeholder-password")){if(n=n.hide().next().show().attr("id",n.removeAttr("id").data("placeholder-id")),t===!0)return n[0].value=e;n.focus()}else a.value="",n.removeClass("placeholder"),a==o()&&a.select()}function s(){var t,e=this,s=i(e),o=this.id;if(""==e.value){if("password"==e.type){if(!s.data("placeholder-textinput")){try{t=s.clone().attr({type:"text"})}catch(r){t=i("<input>").attr(i.extend(a(this),{type:"text"}))}t.removeAttr("name").data({"placeholder-password":s,"placeholder-id":o}).bind("focus.placeholder",n),s.data({"placeholder-textinput":t,"placeholder-id":o}).before(t)}s=s.removeAttr("id").hide().prev().attr("id",o).show()}s.addClass("placeholder"),s[0].value=s.attr("placeholder")}else s.removeClass("placeholder")}function o(){try{return e.activeElement}catch(t){}}var r="[object OperaMini]"==Object.prototype.toString.call(t.operamini),c="placeholder"in e.createElement("input")&&!r,l="placeholder"in e.createElement("textarea")&&!r,d=i.fn,u=i.valHooks,h=i.propHooks,f,p;c&&l?(p=d.placeholder=function(){return this},p.input=p.textarea=!0):(p=d.placeholder=function(){var t=this;return t.filter((c?"textarea":":input")+"[placeholder]").not(".placeholder").bind({"focus.placeholder":n,"blur.placeholder":s}).data("placeholder-enabled",!0).trigger("blur.placeholder"),t},p.input=c,p.textarea=l,f={get:function(t){var e=i(t),a=e.data("placeholder-password");return a?a[0].value:e.data("placeholder-enabled")&&e.hasClass("placeholder")?"":t.value},set:function(t,e){var a=i(t),r=a.data("placeholder-password");return r?r[0].value=e:a.data("placeholder-enabled")?(""==e?(t.value=e,t!=o()&&s.call(t)):a.hasClass("placeholder")?n.call(t,!0,e)||(t.value=e):t.value=e,a):t.value=e}},c||(u.input=f,h.value=f),l||(u.textarea=f,h.value=f),i(function(){i(e).delegate("form","submit.placeholder",function(){var t=i(".placeholder",this).each(n);setTimeout(function(){t.each(s)},10)})}),i(t).bind("beforeunload.placeholder",function(){i(".placeholder").each(function(){this.value=""})}))}(this,document,jQuery),function(t){"function"==typeof define&&define.amd?define(["jquery"],t):t(jQuery)}(function(t){function e(t){return r.raw?t:encodeURIComponent(t)}function i(t){return r.raw?t:decodeURIComponent(t)}function a(t){return e(r.json?JSON.stringify(t):String(t))}function n(t){0===t.indexOf('"')&&(t=t.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{t=decodeURIComponent(t.replace(o," "))}catch(e){return}try{return r.json?JSON.parse(t):t}catch(e){}}function s(e,i){var a=r.raw?e:n(e);return t.isFunction(i)?i(a):a}var o=/\+/g,r=t.cookie=function(n,o,c){if(void 0!==o&&!t.isFunction(o)){if(c=t.extend({},r.defaults,c),"number"==typeof c.expires){var l=c.expires,d=c.expires=new Date;d.setDate(d.getDate()+l)}return document.cookie=[e(n),"=",a(o),c.expires?"; expires="+c.expires.toUTCString():"",c.path?"; path="+c.path:"",c.domain?"; domain="+c.domain:"",c.secure?"; secure":""].join("")}for(var u=n?void 0:{},h=document.cookie?document.cookie.split("; "):[],f=0,p=h.length;p>f;f++){var m=h[f].split("="),v=i(m.shift()),g=m.join("=");if(n&&n===v){u=s(g,o);break}n||void 0===(g=s(g))||(u[v]=g)}return u};r.defaults={},t.removeCookie=function(e,i){return void 0!==t.cookie(e)?(t.cookie(e,"",t.extend({},i,{expires:-1})),!0):!1}}),function(e,i,a,n){"use strict";function s(t){return("string"==typeof t||t instanceof String)&&(t=t.replace(/^['\\/"]+|(;\s?})+|['\\/"]+$/g,"")),t}var o=function(t){for(var i=t.length,a=e("head");i--;)0===a.has("."+t[i]).length&&a.append('<meta class="'+t[i]+'" />')};o(["foundation-mq-small","foundation-mq-medium","foundation-mq-large","foundation-mq-xlarge","foundation-mq-xxlarge","foundation-data-attribute-namespace"]),e(function(){"undefined"!=typeof t&&"undefined"!=typeof a.body&&t.attach(a.body)});var r=function(t,i){if("string"==typeof t){if(i){var n;if(i.jquery){if(n=i[0],!n)return i}else n=i;return e(n.querySelectorAll(t))}return e(a.querySelectorAll(t))}return e(t,i)},c=function(t){var e=[];return t||e.push("data"),this.namespace.length>0&&e.push(this.namespace),e.push(this.name),e.join("-")},l=function(t){for(var e=t.split("-"),i=e.length,a=[];i--;)0!==i?a.push(e[i]):this.namespace.length>0?a.push(this.namespace,e[i]):a.push(e[i]);return a.reverse().join("-")},d=function(t,i){var a=this,n=!r(this).data(this.attr_name(!0));return r(this.scope).is("["+this.attr_name()+"]")?(r(this.scope).data(this.attr_name(!0)+"-init",e.extend({},this.settings,i||t,this.data_options(r(this.scope)))),n&&this.events(this.scope)):r("["+this.attr_name()+"]",this.scope).each(function(){var n=!r(this).data(a.attr_name(!0)+"-init");r(this).data(a.attr_name(!0)+"-init",e.extend({},a.settings,i||t,a.data_options(r(this)))),n&&a.events(this)}),"string"==typeof t?this[t].call(this,i):void 0},u=function(t,e){function i(){e(t[0])}function a(){if(this.one("load",i),/MSIE (\d+\.\d+);/.test(navigator.userAgent)){var t=this.attr("src"),e=t.match(/\?/)?"&":"?";e+="random="+(new Date).getTime(),this.attr("src",t+e)}}return t.attr("src")?void(t[0].complete||4===t[0].readyState?i():a.call(t)):void i()};i.matchMedia=i.matchMedia||function(t){var e,i=t.documentElement,a=i.firstElementChild||i.firstChild,n=t.createElement("body"),s=t.createElement("div");return s.id="mq-test-1",s.style.cssText="position:absolute;top:-100em",n.style.background="none",n.appendChild(s),function(t){return s.innerHTML='&shy;<style media="'+t+'"> #mq-test-1 { width: 42px; }</style>',i.insertBefore(n,a),e=42===s.offsetWidth,i.removeChild(n),{matches:e,media:t}}}(a),function(t){function e(){a&&(o(e),c&&jQuery.fx.tick())}for(var a,n=0,s=["webkit","moz"],o=i.requestAnimationFrame,r=i.cancelAnimationFrame,c="undefined"!=typeof jQuery.fx;n<s.length&&!o;n++)o=i[s[n]+"RequestAnimationFrame"],r=r||i[s[n]+"CancelAnimationFrame"]||i[s[n]+"CancelRequestAnimationFrame"];o?(i.requestAnimationFrame=o,i.cancelAnimationFrame=r,c&&(jQuery.fx.timer=function(t){t()&&jQuery.timers.push(t)&&!a&&(a=!0,e())},jQuery.fx.stop=function(){a=!1})):(i.requestAnimationFrame=function(t){var e=(new Date).getTime(),a=Math.max(0,16-(e-n)),s=i.setTimeout(function(){t(e+a)},a);return n=e+a,s},i.cancelAnimationFrame=function(t){clearTimeout(t)})}(jQuery),i.Foundation={name:"Foundation",version:"5.3.0",media_queries:{small:r(".foundation-mq-small").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),medium:r(".foundation-mq-medium").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),large:r(".foundation-mq-large").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),xlarge:r(".foundation-mq-xlarge").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,""),xxlarge:r(".foundation-mq-xxlarge").css("font-family").replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g,"")},stylesheet:e("<style></style>").appendTo("head")[0].sheet,global:{namespace:n},init:function(t,e,i,a,n){var s=[t,i,a,n],o=[];if(this.rtl=/rtl/i.test(r("html").attr("dir")),this.scope=t||this.scope,this.set_namespace(),e&&"string"==typeof e&&!/reflow/i.test(e))this.libs.hasOwnProperty(e)&&o.push(this.init_lib(e,s));else for(var c in this.libs)o.push(this.init_lib(c,e));return t},init_lib:function(t,i){return this.libs.hasOwnProperty(t)?(this.patch(this.libs[t]),i&&i.hasOwnProperty(t)?("undefined"!=typeof this.libs[t].settings?e.extend(!0,this.libs[t].settings,i[t]):"undefined"!=typeof this.libs[t].defaults&&e.extend(!0,this.libs[t].defaults,i[t]),this.libs[t].init.apply(this.libs[t],[this.scope,i[t]])):(i=i instanceof Array?i:new Array(i),this.libs[t].init.apply(this.libs[t],i))):function(){}},patch:function(t){t.scope=this.scope,t.namespace=this.global.namespace,t.rtl=this.rtl,t.data_options=this.utils.data_options,t.attr_name=c,t.add_namespace=l,t.bindings=d,t.S=this.utils.S},inherit:function(t,e){for(var i=e.split(" "),a=i.length;a--;)this.utils.hasOwnProperty(i[a])&&(t[i[a]]=this.utils[i[a]])},set_namespace:function(){var t=this.global.namespace===n?e(".foundation-data-attribute-namespace").css("font-family"):this.global.namespace;this.global.namespace=t===n||/false/i.test(t)?"":t},libs:{},utils:{S:r,throttle:function(t,e){var i=null;return function(){var a=this,n=arguments;null==i&&(i=setTimeout(function(){t.apply(a,n),i=null},e))}},debounce:function(t,e,i){var a,n;return function(){var s=this,o=arguments,r=function(){a=null,i||(n=t.apply(s,o))},c=i&&!a;return clearTimeout(a),a=setTimeout(r,e),c&&(n=t.apply(s,o)),n}},data_options:function(t,i){function a(t){return!isNaN(t-0)&&null!==t&&""!==t&&t!==!1&&t!==!0}function n(t){return"string"==typeof t?e.trim(t):t}i=i||"options";var s={},o,r,c,l=function(t){var e=Foundation.global.namespace;return t.data(e.length>0?e+"-"+i:i)},d=l(t);if("object"==typeof d)return d;for(c=(d||":").split(";"),o=c.length;o--;)r=c[o].split(":"),r=[r[0],r.slice(1).join(":")],/true/i.test(r[1])&&(r[1]=!0),/false/i.test(r[1])&&(r[1]=!1),a(r[1])&&(r[1]=-1===r[1].indexOf(".")?parseInt(r[1],10):parseFloat(r[1])),2===r.length&&r[0].length>0&&(s[n(r[0])]=n(r[1]));return s},register_media:function(t,i){Foundation.media_queries[t]===n&&(e("head").append('<meta class="'+i+'"/>'),Foundation.media_queries[t]=s(e("."+i).css("font-family")))},add_custom_rule:function(t,e){if(e===n&&Foundation.stylesheet)Foundation.stylesheet.insertRule(t,Foundation.stylesheet.cssRules.length);else{var i=Foundation.media_queries[e];i!==n&&Foundation.stylesheet.insertRule("@media "+Foundation.media_queries[e]+"{ "+t+" }")}},image_loaded:function(t,e){var i=this,a=t.length;0===a&&e(t),t.each(function(){u(i.S(this),function(){a-=1,0===a&&e(t)})})},random_str:function(){return this.fidx||(this.fidx=0),this.prefix=this.prefix||[this.name||"F",(+new Date).toString(36)].join("-"),this.prefix+(this.fidx++).toString(36)}}},e.fn.foundation=function(){var t=Array.prototype.slice.call(arguments,0);return this.each(function(){return Foundation.init.apply(Foundation,[this].concat(t)),this})}}(jQuery,window,window.document),function(t,e,i,a){"use strict";Foundation.libs.topbar={name:"topbar",version:"5.3.0",settings:{index:0,sticky_class:"sticky",custom_back_text:!0,back_text:"Back",is_hover:!0,scrolltop:!0,sticky_on:"all"},init:function(e,i,a){Foundation.inherit(this,"add_custom_rule register_media throttle");var n=this;n.register_media("topbar","foundation-mq-topbar"),this.bindings(i,a),n.S("["+this.attr_name()+"]",this.scope).each(function(){var e=t(this),i=e.data(n.attr_name(!0)+"-init"),a=n.S("section",this);e.data("index",0);var s=e.parent();s.hasClass("fixed")||n.is_sticky(e,s,i)?(n.settings.sticky_class=i.sticky_class,n.settings.sticky_topbar=e,e.data("height",s.outerHeight()),e.data("stickyoffset",s.offset().top)):e.data("height",e.outerHeight()),i.assembled||n.assemble(e),i.is_hover?n.S(".has-dropdown",e).addClass("not-click"):n.S(".has-dropdown",e).removeClass("not-click"),n.add_custom_rule(".f-topbar-fixed { padding-top: "+e.data("height")+"px }"),s.hasClass("fixed")&&n.S("body").addClass("f-topbar-fixed")})},is_sticky:function(t,e,i){var a=e.hasClass(i.sticky_class);return a&&"all"===i.sticky_on?!0:a&&this.small()&&"small"===i.sticky_on?matchMedia(Foundation.media_queries.small).matches&&!matchMedia(Foundation.media_queries.medium).matches&&!matchMedia(Foundation.media_queries.large).matches:a&&this.medium()&&"medium"===i.sticky_on?matchMedia(Foundation.media_queries.small).matches&&matchMedia(Foundation.media_queries.medium).matches&&!matchMedia(Foundation.media_queries.large).matches:a&&this.large()&&"large"===i.sticky_on?matchMedia(Foundation.media_queries.small).matches&&matchMedia(Foundation.media_queries.medium).matches&&matchMedia(Foundation.media_queries.large).matches:!1},toggle:function(i){var a=this,n;n=i?a.S(i).closest("["+this.attr_name()+"]"):a.S("["+this.attr_name()+"]");var s=n.data(this.attr_name(!0)+"-init"),o=a.S("section, .section",n);a.breakpoint()&&(a.rtl?(o.css({right:"0%"}),t(">.name",o).css({right:"100%"})):(o.css({left:"0%"}),t(">.name",o).css({left:"100%"})),a.S("li.moved",o).removeClass("moved"),n.data("index",0),n.toggleClass("expanded").css("height","")),s.scrolltop?n.hasClass("expanded")?n.parent().hasClass("fixed")&&(s.scrolltop?(n.parent().removeClass("fixed"),n.addClass("fixed"),a.S("body").removeClass("f-topbar-fixed"),e.scrollTo(0,0)):n.parent().removeClass("expanded")):n.hasClass("fixed")&&(n.parent().addClass("fixed"),n.removeClass("fixed"),a.S("body").addClass("f-topbar-fixed")):(a.is_sticky(n,n.parent(),s)&&n.parent().addClass("fixed"),n.parent().hasClass("fixed")&&(n.hasClass("expanded")?(n.addClass("fixed"),n.parent().addClass("expanded"),a.S("body").addClass("f-topbar-fixed")):(n.removeClass("fixed"),n.parent().removeClass("expanded"),a.update_sticky_positioning())))},timer:null,events:function(i){var a=this,n=this.S;n(this.scope).off(".topbar").on("click.fndtn.topbar","["+this.attr_name()+"] .toggle-topbar",function(t){t.preventDefault(),a.toggle(this)}).on("click.fndtn.topbar",'.top-bar .top-bar-section li a[href^="#"],['+this.attr_name()+'] .top-bar-section li a[href^="#"]',function(e){var i=t(this).closest("li");!a.breakpoint()||i.hasClass("back")||i.hasClass("has-dropdown")||a.toggle()}).on("click.fndtn.topbar","["+this.attr_name()+"] li.has-dropdown",function(e){var i=n(this),s=n(e.target),o=i.closest("["+a.attr_name()+"]"),r=o.data(a.attr_name(!0)+"-init");return s.data("revealId")?void a.toggle():void(a.breakpoint()||(!r.is_hover||Modernizr.touch)&&(e.stopImmediatePropagation(),i.hasClass("hover")?(i.removeClass("hover").find("li").removeClass("hover"),i.parents("li.hover").removeClass("hover")):(i.addClass("hover"),t(i).siblings().removeClass("hover"),"A"===s[0].nodeName&&s.parent().hasClass("has-dropdown")&&e.preventDefault())))}).on("click.fndtn.topbar","["+this.attr_name()+"] .has-dropdown>a",function(t){if(a.breakpoint()){t.preventDefault();var e=n(this),i=e.closest("["+a.attr_name()+"]"),s=i.find("section, .section"),o=e.next(".dropdown").outerHeight(),r=e.closest("li");i.data("index",i.data("index")+1),r.addClass("moved"),a.rtl?(s.css({right:-(100*i.data("index"))+"%"}),s.find(">.name").css({right:100*i.data("index")+"%"})):(s.css({left:-(100*i.data("index"))+"%"}),s.find(">.name").css({left:100*i.data("index")+"%"})),i.css("height",e.siblings("ul").outerHeight(!0)+i.data("height"))}}),n(e).off(".topbar").on("resize.fndtn.topbar",a.throttle(function(){a.resize.call(a)},50)).trigger("resize").trigger("resize.fndtn.topbar"),n("body").off(".topbar").on("click.fndtn.topbar touchstart.fndtn.topbar",function(t){var e=n(t.target).closest("li").closest("li.hover");e.length>0||n("["+a.attr_name()+"] li.hover").removeClass("hover")}),n(this.scope).on("click.fndtn.topbar","["+this.attr_name()+"] .has-dropdown .back",function(t){t.preventDefault();var e=n(this),i=e.closest("["+a.attr_name()+"]"),s=i.find("section, .section"),o=i.data(a.attr_name(!0)+"-init"),r=e.closest("li.moved"),c=r.parent();i.data("index",i.data("index")-1),a.rtl?(s.css({right:-(100*i.data("index"))+"%"}),s.find(">.name").css({right:100*i.data("index")+"%"})):(s.css({left:-(100*i.data("index"))+"%"}),s.find(">.name").css({left:100*i.data("index")+"%"})),0===i.data("index")?i.css("height",""):i.css("height",c.outerHeight(!0)+i.data("height")),setTimeout(function(){r.removeClass("moved")},300)})},resize:function(){var t=this;t.S("["+this.attr_name()+"]").each(function(){var e=t.S(this),a=e.data(t.attr_name(!0)+"-init"),n=e.parent("."+t.settings.sticky_class),s;if(!t.breakpoint()){var o=e.hasClass("expanded");e.css("height","").removeClass("expanded").find("li").removeClass("hover"),o&&t.toggle(e)}t.is_sticky(e,n,a)&&(n.hasClass("fixed")?(n.removeClass("fixed"),s=n.offset().top,t.S(i.body).hasClass("f-topbar-fixed")&&(s-=e.data("height")),e.data("stickyoffset",s),n.addClass("fixed")):(s=n.offset().top,e.data("stickyoffset",s)))})},breakpoint:function(){return!matchMedia(Foundation.media_queries.topbar).matches},small:function(){return matchMedia(Foundation.media_queries.small).matches},medium:function(){return matchMedia(Foundation.media_queries.medium).matches},large:function(){return matchMedia(Foundation.media_queries.large).matches},assemble:function(e){var i=this,a=e.data(this.attr_name(!0)+"-init"),n=i.S("section",e);n.detach(),i.S(".has-dropdown>a",n).each(function(){var e=i.S(this),n=e.siblings(".dropdown"),s=e.attr("href"),o;n.find(".title.back").length||(o=t('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5></li>'),t("h5>a",o).html(1==a.custom_back_text?a.back_text:"&laquo; "+e.html()),n.prepend(o))}),n.appendTo(e),this.sticky(),this.assembled(e)},assembled:function(e){e.data(this.attr_name(!0),t.extend({},e.data(this.attr_name(!0)),{assembled:!0}))},height:function(e){var i=0,a=this;return t("> li",e).each(function(){i+=a.S(this).outerHeight(!0)}),i},sticky:function(){var t=this;this.S(e).on("scroll",function(){t.update_sticky_positioning()})},update_sticky_positioning:function(){var t="."+this.settings.sticky_class,i=this.S(e),a=this;if(a.settings.sticky_topbar&&a.is_sticky(this.settings.sticky_topbar,this.settings.sticky_topbar.parent(),this.settings)){var n=this.settings.sticky_topbar.data("stickyoffset");a.S(t).hasClass("expanded")||(i.scrollTop()>n?a.S(t).hasClass("fixed")||(a.S(t).addClass("fixed"),a.S("body").addClass("f-topbar-fixed")):i.scrollTop()<=n&&a.S(t).hasClass("fixed")&&(a.S(t).removeClass("fixed"),a.S("body").removeClass("f-topbar-fixed")))}},off:function(){this.S(this.scope).off(".fndtn.topbar"),this.S(e).off(".fndtn.topbar")},reflow:function(){}}}(jQuery,this,this.document),$(document).foundation(),$("#scope").foundation()}).call(this);
//# sourceMappingURL=./app.map