(function () {

'use strict';

var dbg = debug('app:HomeController');

angular.module('app')
.controller('HomeController', [
	'$scope',
	'taggaIID',
	'$state',
	'$http',
	function ($scope, taggaIID, $state, $http) {
		$scope.$watch('contact', function (newV) {
			if( ! newV ) return;

			$scope.contact.emailOptIn.optin = true;
		});

		$scope.submitCustom = function () {
			$scope['contactForm'].promoCode.$error.invalid = false;
			$scope['contactForm'].promoCode.$error.claimed = false;

			$scope['contactSubmitted'] = true; //set flag for validation

			//don't submit if form is invalid
			if( ! $scope['contactForm'].$valid ) {
				return false;
			}

			dbg('Submitted', $scope['contact']);

			//get IID and then post form data
			taggaIID.get().then(function (iid) {
				$http({
					method: 'post',
					url: '/form',
					data: {
						'form_data': $scope['contact'],
						'iid': iid
					}
				})
				.success(function (resp) {
					$state.go('thank-you', {promoCode: $scope.contact.promoCode});
				})
				.error(function (resp) {
					dbg('Error submitting form.', resp);

					if( resp.error.message === 'invalid code' ) {
						$scope['contactForm'].promoCode.$error.invalid = true;
					}

					if( resp.error.message === 'already claimed' ) {
						$scope['contactForm'].promoCode.$error.claimed = true;
					}
				});
			});
		};
	}
]);

}());