import angular from 'angular';
import uiRouter from 'angular-ui-router';
import 'jquery';
import 'bootstrap';

import template from './app.html';
import './app.less';

import loadModules from './loadModules.js';

let allModules = loadModules();

angular.module('app', [
	uiRouter
].concat(allModules.pages))
.config(GlobalConfig)
.component('app', {
	template,
	restrict: 'E'
});

allModules.partials.forEach(partial => {
	angular.module('app')
	.component(partial.partialName, partial.component);
});

GlobalConfig.$inject = [
	'$locationProvider',
	'$urlRouterProvider'
];

function GlobalConfig($locationProvider, $urlRouterProvider) {
	// $locationProvider.html5Mode(true);
	$urlRouterProvider.otherwise('/');
}
