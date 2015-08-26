(function () {

'use strict';

var dbg = debug('app:ThankYouController');

angular.module('app')
.controller('ThankYouController', [
	'$scope',
	'$state',
	function ($scope, $state) {
		dbg($state.params);
		if( ! $state.params.promoCode ) {
			return $state.go('home');
		}

	}
]);

}());