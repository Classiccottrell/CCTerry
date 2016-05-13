import angular from 'angular';
import uiRouter from 'angular-ui-router';

let pageTemplates = {
	home: require('./pages/home.html'),
	about: require('./pages/about.html'),
	cool: require('./pages/cool.html')
};

let partialTemplates = {
	header: require('./partials/header.html'),
	footer: require('./partials/footer.html')
};

export default function() {
	let allModules = {
		pages: [],
		partials: []
	};

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

		allModules.pages.push(module.name);
	};

	for( let partialName in partialTemplates ) {
		let component = {
			restrict: 'E',
			template: partialTemplates[partialName]
		};

		allModules.partials.push({
			partialName, component
		});
	};

	return allModules;
}
