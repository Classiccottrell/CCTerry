(function () {

'use strict';

var dbg = debug('app:foundation');

angular.module('app')
.directive('foundation', [
	'$document',
	function ($document) {
		return {
			restrict: 'A',
			scope: {
				foundation: '@'
			},
			compile: function (element, attrs) {
				$(element).foundation(attrs.foundation);
			}
		};
	}
]);

}());