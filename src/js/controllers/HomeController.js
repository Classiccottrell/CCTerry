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
		$scope.submitCustom = function () {
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
					$state.go('share');
				})
				.error(function (resp) {
					dbg('Error submitting form.', resp);
				});
			});
		};
	}
]);

}());