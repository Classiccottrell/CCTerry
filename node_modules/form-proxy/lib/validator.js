/*jslint node: true */
"use strict";

var anchor = require('anchor');

module.exports = function(data, cb) {

	var errors = anchor( data.form )
	.to( { type : data.rules } );

	process.nextTick(function() {
		cb(null, errors);
	});
};