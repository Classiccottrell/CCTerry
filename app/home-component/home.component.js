import template from './home.html';
import controller from './home.controller.js';
// import './home.less';

let homeComponent = {
	restrict: 'E',
	bindings: {},
	template,
	controller,
	controllerAs: 'vm'
};

export default homeComponent;
