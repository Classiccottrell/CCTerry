##################################
# Default JS Files - leave as is #
##################################

	# @codekit-prepend '../../bower_components/jquery/dist/jquery.js'
	# @codekit-prepend '../../bower_components/fastclick/lib/fastclick.js'
	# @codekit-prepend '../../bower_components/jquery-placeholder/jquery.placeholder.js'
	# @codekit-prepend '../../bower_components/jquery.cookie/jquery.cookie.js'
	# @codekit-prepend '../../bower_components/foundation/js/foundation/foundation.js'

	# Angular Files
	# @codekit-prepend '../../bower_components/angular/angular.js'
	# @codekit-prepend '../../bower_components/angular-cookies/angular-cookies.js'
	# @codekit-prepend '../../bower_components/angular-resource/angular-resource.js'
	# @codekit-prepend '../../bower_components/angular-route/angular-route.js'
	# @codekit-prepend 'tagga-twt.min.js'

# Intialize Tagga App
angular.module "app", ["tagga-twt"]

# Optional Foundation JS - leave commented out
# Add an '@' in front of 'codekit-prepend' to load that JS

	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.abide.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.accordion.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.alert.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.clearing.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.dropdown.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.equalizer.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.interchange.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.joyride.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.magellan.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.offcanvas.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.reveal.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.slider.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.tab.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.tooltip.js'
	# codekit-prepend '../../bower_components/foundation/js/foundation/foundation.topbar.js'
	# codekit-prepend '../../bower_components/slick-carousel/slick/slick.min.js'

$(document).foundation() # Intialize Foundation

# Global JS Component configuration
#   To initialize all Foundation JavaScript with default configuration
#  leave the #scope uncommented.  If you want to change the default
#  configuration for one or more JS components, comment out the #scope
#  line and uncomment the document.foundation line and any components
#  you are configuring.  If you have multiples of the same components
#  and need to customize them individually, it is recommended you do
#  it outside of this and leave this for global configuration.

$("#scope").foundation() # Intialize all JS components with default settings

# $(document).foundation
#   abide:
#     live_validate: false
#     focus_on_invalid: true
#     error_labels: true # labels with a for="inputId" will recieve an `error` class
#     timeout: 1000
#     patterns:
#       alpha: /^[a-zA-Z]+$/
#       alpha_numeric: /^[a-zA-Z0-9]+$/
#       integer: /^[-+]?\d+$/
#       number: /^[-+]?[1-9]\d*$/
#      # amex, visa, diners
#       card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
#       cvv: /^([0-9]){3,4}$/
#      # http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
#       email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
#       url: /(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/
#      # abc.de
#       domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/
#       datetime: /([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))/
#      # YYYY-MM-DD
#       date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))/
#      # HH:MM:SS
#       time: /(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}/
#       dateISO: /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
#      # MM/DD/YYYY
#       month_day_year: /(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/
#      # #FFF or #FFFFFF
#       color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
#    # custom validators can be written, for example dice roll validation
#     validators:
#       diceRoll: (el, required, parent) ->
#         possibilities = [
#           true
#           false
#         ]
#         possibilities[Math.round(Math.random())]

#  accordion:
#    active_class: 'active' # specify the class used for active (or open) accordion panels
#    multi_expand: true # allow multiple accordion panels to be active at the same time
#    toggleable: false # allow accordion panels to be closed by clicking on their headers
#             # setting to false only closes accordion panels when another is opened

#   clearing:
#     close_selectors: '.clearing-close' # specify the classes or IDs will close clearing when clicked.
#     touch_label: '&larr;&nbsp;Swipe to Advance&nbsp;&rarr;'

#   dropdown:
#     active_class: 'open' # specify the class used for active dropdowns
#     is_hover: false

#   interchange:
#     load_attr: 'interchange'

#   joyride:
#     expose: false # turn on or off the expose feature
#     modal: true # Whether to cover page with modal during the tour
#     tip_location: "bottom" # 'top' or 'bottom' in relation to parent
#     nub_position: "auto" # override on a per tooltip bases
#     scroll_speed: 1500 # Page scrolling speed in milliseconds, 0 = no scroll animation
#     scroll_animation: "linear" # supports 'swing' and 'linear', extend with jQuery UI.
#     timer: 0 # 0 = no timer , all other numbers = timer in milliseconds
#     start_timer_on_click: true # true or false - true requires clicking the first button start the timer
#     start_offset: 0 # the index of the tooltip you want to start on (index of the li)
#     next_button: true # true or false to control whether a next button is used
#     tip_animation: "fade" # 'pop' or 'fade' in each tip
#     pause_after: [] # array of indexes where to pause the tour after
#     exposed: [] # array of expose elements
#     tip_animation_fade_speed: 300 # when tipAnimation = 'fade' this is speed in milliseconds for the transition
#     cookie_monster: false # true or false to control whether cookies are used
#     cookie_name: "joyride" # Name the cookie you'll use
#     cookie_domain: false # Will this cookie be attached to a domain, ie. '.notableapp.com'
#     cookie_expires: 365 # set when you would like the cookie to expire.
#     tip_container: "body" # Where will the tip be attached
#     tip_location_patterns:
#       top: ["bottom"]
#       bottom: [] # bottom should not need to be repositioned
#       left: [
#         "right"
#         "top"
#         "bottom"
#       ]
#       right: [
#         "left"
#         "top"
#         "bottom"
#       ]
#     post_ride_callback: -> # A method to call once the tour closes (canceled or complete)
#     post_step_callback: -> # A method to call after each step
#     pre_step_callback: -> # A method to call before each step
#     pre_ride_callback: -> # A method to call before the tour starts (passed index, tip, and cloned exposed element)
#     post_expose_callback: -> # A method to call after an element has been exposed
#     template: # HTML segments for tip layout
#       link: "<a href=\"#close\" class=\"joyride-close-tip\">&times;</a>"
#       timer: "<div class=\"joyride-timer-indicator-wrap\"><span class=\"joyride-timer-indicator\"></span></div>"
#       tip: "<div class=\"joyride-tip-guide\"><span class=\"joyride-nub\"></span></div>"
#       wrapper: "<div class=\"joyride-content-wrapper\"></div>"
#       button: "<a href=\"#\" class=\"small button joyride-next-tip\"></a>"
#       modal: "<div class=\"joyride-modal-bg\"></div>"
#       expose: "<div class=\"joyride-expose-wrapper\"></div>"
#       expose_cover: "<div class=\"joyride-expose-cover\"></div>"
#     expose_add_class: "" # One or more space-separated class names to be added to exposed element

#   magellan:
#     active_class: 'active' # specify the class used for active sections
#     threshold: 0 # how many pixels until the magellan bar sticks, 0 = auto
#     destination_threshold: 20 # pixels from the top of destination for it to be considered active
#     throttle_delay: 50 # calculation throttling to increase framerate

#   offcanvas:
#     open_method: 'move' # Sets method in which offcanvas opens, can also be 'overlap'
#     close_on_click: true

#   reveal:
#     animation: "fadeAndPop"
#     animation_speed: 250
#     close_on_background_click: true
#     dismiss_modal_class: "close-reveal-modal"
#     bg_class: "reveal-modal-bg"
#     bg: $(".reveal-modal-bg")
#     css:
#       open:
#         opacity: 0
#         visibility: "visible"
#         display: "block"

#       close:
#         opacity: 1
#         visibility: "hidden"
#         display: "none"

#   sliders:
#     start: 0
#     end: 100
#     step: 1

#   tab:
#     active_class: 'active'
#     is_hover: false

#   tooltip:
#     selector: ".has-tip"
#     additional_inheritable_classes: []
#     tooltip_class: ".tooltip"
#     touch_close_text: "tap to close"
#     disable_for_touch: false
#     tip_template: (selector, content) ->
#       "<span data-selector=\"" + selector + "\" class=\"" + Foundation.libs.tooltip.settings.tooltip_class.substring(1) + "\">" + content + "<span class=\"nub\"></span></span>"

# 	topbar:
#     sticky_class : 'sticky'
#     custom_back_text: true # Set this to false and it will pull the top level link name as the back text
#     back_text: 'Back' # Define what you want your custom back text to be if custom_back_text: true
# 		is_hover: false
#     mobile_show_parent_link: false # will copy parent links into dropdowns for mobile navigation
#     scrolltop : true # jump to top when sticky nav menu toggle is clicked

# Slick Carousel - http://kenwheeler.github.io/slick/

# $(document).ready ->
#   $(".your-class").slick
#     accessibility: true # Enables tabbing and arrow key navigation
#     autoplay: true # Enables Autoplay
#     autoplaySpeed: 3000 # Autoplay Speed in milliseconds
#     arrows: true # Prev/Next Arrows
#     centerMode: false # Enables centered view with partial prev/next slides. Use with odd numbered slidesToShow counts.
#     centerPadding: "50px" # Side padding when in center mode (px or %)
#     cssEase: "ease" # CSS3 Animation Easing
#     dots: false # Show dot indicators
#     draggable: true # Enable mouse dragging
#     fade: false # Enable fade
#     easing: "linear" # Add easing for jQuery animate. Use with easing libraries or default easing methods
#     infinite: true # Infinite loop sliding
#     lazyLoad: "ondemand" # Set lazy loading technique. Accepts 'ondemand' or 'progressive'.
#     pauseOnHover: true # Pause Autoplay On Hover
#    # Object containing breakpoints and settings objects (see demo). Enables settings sets at given screen width.
#     responsive: [
#       breakpoint: 1024
#       settings:
#         arrows: false
#         centerMode: true
#         centerPadding: "40px"
#         dots: true
#         infinite: true
#         slidesToShow: 3
#         slidesToScroll: 3
#     ]
#     slide: "div" # Element query to use as slide
#     slidesToShow: 1 # # of slides to show
#     slidesToScroll: 1 # # of slides to scroll
#     speed: 300 # Slide/Fade animation speed
#     swipe: true # Enable swiping
#     touchMove: true # Enable slide motion with touch
#     touchThreshold: 5 # Swipe distance threshold
#     useCSS: true # Enable/Disable CSS Transitions
#     vertical: false # Vertical slide mode
#  return