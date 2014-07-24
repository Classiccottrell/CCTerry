/*jslint node: true */
"use strict";

/**
 * Builds a result object for http api results
 * @param  {integer} code http code to build the response
 *                        200 for success, 500 for server error, etc
 * @param  {object} body body for the http response
 * @return {object}      format : 
 *                       { code : 200, body : { status : "success" } }
 */
module.exports = function(code, body) {
	body = body || {};
	code = code || 200;
	var status = 'success';

	if ( ! body.status ) {
		if ( code >= 300 ) {
			status = 'failed';
		}
		body.status = status;
	}

	if ( code == 500 ) {
		body.description = "Internal error";
	}

	return {
		code : code,
		body : body
	};
};