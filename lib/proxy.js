/*jslint node: true */
"use strict";

var request = require('request');

module.exports = function(data, config, callback) {

	//prepare data to send to platform
	var service_data = {
		form_data : JSON.stringify(data.form),
		referer : data.referer,
		widget_label : data.widgetLabel,
		iid : data.iid
	};

	//proxy request
	request.post({
	  url : config.url,
	  form : service_data
	}, callback);
};