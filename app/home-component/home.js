import angular from 'angular';
import uiRouter from 'angular-ui-router';

import homeComponent from './home.component.js';

let homeModule = angular.module('home', [
	uiRouter
])
.config(GlobalConfig)
.component('home', homeComponent)
;

GlobalConfig.$inject = [
	'$urlRouterProvider',
	'$stateProvider'
];

function GlobalConfig($urlRouterProvider, $stateProvider) {
	$urlRouterProvider.otherwise('/');

	$stateProvider
	.state('home', {
		url: '/',
		template: '<home></home>'
	});
}

export default homeModule
