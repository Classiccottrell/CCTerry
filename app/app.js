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
})
.run(['$transitions', $transitions => {
	$transitions.onSuccess({}, () => {
		window.scrollTo(0, 0)
	});
}]);

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

// Generate colors (as Chroma.js objects)
var colors = paletteGenerator.generate(
  6, // Colors
  function(color){ // This function filters valid colors
    var hcl = color.hcl();
    return (hcl[0]>=59 || hcl[0]<=290)
      && hcl[1]>=44.02 && hcl[1]<=98.37
      && hcl[2]>=47.83 && hcl[2]<=82.17;
  },
  true, // Using Force Vector instead of k-Means
  50, // Steps (quality)
  false, // Ultra precision
  'Default' // Color distance type (colorblindness)
);
// Sort colors by differenciation first
colors = paletteGenerator.diffSort(colors, 'Default');
