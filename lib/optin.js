/*jslint node: true */
"use strict";

var Proxy = require('./proxy');
var Result = require('./http_result');

module.exports = function (data, config, callback) {
	//get available optin fields
	var optin_fields = checkOptInFields(data.form);

	optin_fields.forEach(function(element) {
		var data = prepareData[element.type](element); //prepare data to send

		Proxy( //proxy call
			data,
			{ url: config[element.type] },
			function(error, response, body) {
				var outcome;

				if( error ) {
					outcome = Result(400, { errors : error });
				} else {
					outcome = Result(response.statusCode, body);
				}

				concludes(callback, outcome);
			}
		);
	});
};

function checkOptInFields(form_data) {
	var optin_fields = [];

	//loop through keys
	for( var key in form_data ) {
		//try to find an optin property which is set to true
		if( form_data[key].hasOwnProperty('optin') && form_data[key].optin == true ) {
			//determine type of optin (Email or SMS)
			if( form_data[key].hasOwnProperty('shortcode') ) {
				form_data[key].type = 'sms';
				form_data[key].phone = form_data.phone;
			} else {
				form_data[key].type = 'email';
				form_data[key].email = form_data.email;
			}

			optin_fields.push(form_data[key]);
		}
	}

	return optin_fields;
}

var prepareData = {
	sms: function(data) {
		return {
			number: data.shortcode,
			keyword: data.keyword,
			phone: data.phone
		};
	},
	email: function(data) {
		return {
			emailaddress: data.email
		}
	}
};

function concludes(callback, outcome) {
	process.nextTick(function() {
		callback(outcome);
	});
}