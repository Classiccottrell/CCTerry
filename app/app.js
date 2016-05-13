import angular from 'angular';
import uiRouter from 'angular-ui-router';

let pageTemplates = {
	home: require('./pages/home.html'),
	about: require('./pages/about.html'),
	cool: require('./pages/cool.html')
};

let pageModules = [];

for( let pageName in pageTemplates ) {
	let component = {
		restrict: 'E',
		template: pageTemplates[pageName]
	};

	config.$inject = [
		'$stateProvider'
	];

	function config($stateProvider) {
		$stateProvider.state(pageName, {
			url: '/' + (pageName === 'home' ? '' : pageName),
			template: `<${pageName}></${pageName}>`
		});
	}

	let module = angular.module(pageName, [
		uiRouter
	])
	.config(config)
	.component(pageName, component);

	pageModules.push(module.name);
};

import template from './app.html';
import './app.less';

angular.module('app', [
	uiRouter
].concat(pageModules))
.config(GlobalConfig)
.component('app', {
	template,
	restrict: 'E'
});

GlobalConfig.$inject = [
	'$locationProvider',
	'$urlRouterProvider'
];

function GlobalConfig($locationProvider, $urlRouterProvider) {
	$locationProvider.html5Mode(true);
	$urlRouterProvider.otherwise('/');
}
