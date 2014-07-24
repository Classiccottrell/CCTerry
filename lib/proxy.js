/*jslint node: true */
"use strict";

var request = require('request');

module.exports = function(data, config, callback) {
	//proxy request
	request.post({
	  url : config.url,
	  form : data
	}, callback);
};