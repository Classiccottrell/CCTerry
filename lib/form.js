/*jslint node: true */
"use strict";

var proxy = require('./proxy');
var validator = require('./validator');
var result = require('./http_result');

/**
 * Validates a form and sends it to the form service
 * @param  {object}   data     follows this format { form : {}, rules : {}}
 * @param  {object}   config   contains form service url { url : 'url.com/form' }
 * @param  {Function} callback callback
 * @return {void}            
 */
module.exports = function(data, config, callback) {
	validator(data, function(err, validationErrors) {
		if (validationErrors) {
			hasErrors(validationErrors, callback);
		} else {
			doesntHaveErrors(data, config, callback);
		}
	});
};

function hasErrors(errors, callback) {
	var outcome = result(400, { errors : errors });
	concludes(callback, outcome);
}

function doesntHaveErrors(data, config, callback) {
	//prepare data to send to platform
	var service_data = {
		form_data : JSON.stringify(data.form),
		referer : data.referer,
		widget_label : data.widgetLabel,
		iid : data.iid
	};

	proxy(service_data, config, function(error, response, body) {
		var outcome = result(response.statusCode, body);
		concludes(callback, outcome);
	});
}

function concludes(callback, outcome) {
	process.nextTick(function() {
		callback(outcome);
	});
}