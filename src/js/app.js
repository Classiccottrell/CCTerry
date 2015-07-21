(function () {

'use strict';

var dbg = debug('app:app');

angular.module('app', [
	'tagga-twt',
	'ui.router',
	'angular-loading-bar'
]);

angular.module('app')
.config([
	'taggaIIDProvider',
	'$compileProvider',
	'$locationProvider',
	'$stateProvider',
	'$urlRouterProvider',
	function (taggaIIDProvider, $compileProvider, $locationProvider, $stateProvider, $urlRouterProvider) {
		//false debug info on compile - speed improvement
		$compileProvider.debugInfoEnabled(false);

		//tagga iid url
		taggaIIDProvider.setIIDUrl('https://platform.tagga.com/widgetservices/iid');

		$locationProvider.html5Mode(true);

		$urlRouterProvider.otherwise('/');

		$stateProvider
		.state('home', {
			url: '/',
			templateUrl: 'html/templates/home.html',
			controller: 'HomeController'
		})
		.state('share', {
			url: '/share/:imageUrl',
			templateUrl: 'html/templates/share.html',
			controller: 'ShareController'
		})
		;
	}
]);

angular.module('app')
.run([
	'$state',
	function ($state) {

	}
]);

})();