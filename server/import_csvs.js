var colors = require('colors/safe');
var csv = require('fast-csv');
var Promise = require('bluebird');
var argv = require('minimist')(process.argv.slice(2));

var mysql = require('mysql');
Promise.promisifyAll(require('mysql/lib/Connection').prototype);
Promise.promisifyAll(require('mysql/lib/Pool').prototype);

function chunk(arr, len) {
	var chunks = [],
		i = 0,
		n = arr.length;

	while( i < n ) {
		chunks.push(arr.slice(i, i += len));
	}

	return chunks;
}

var DB = mysql.createConnection({
	host: 'tagga-prod.clypjybbwtoo.us-east-1.rds.amazonaws.com',
	user: 'admin_inv',
	password: 'uvTochVont',
	database: 'tagga-platform'
});

DB.connectAsync()
.then(function () {
	console.log(colors.green('Connected to database.'));
	console.log('file', argv.file);

	var entries = [];

	return csv.fromPath(argv.file, {
		headers: true
	})
	.on('data', function (data) {
		// console.log(data);
		var array = Object.keys(data).map(function (key) {
			return data[key];
		});

		entries.push(array);
	})
	.on('end', function () {
		console.log('read csv, starting sql insert');

		var splitNum = 5000;
		var chunks = chunk(entries, splitNum);

		return Promise.map(chunks, function (chunk) {
			return DB.queryAsync('INSERT INTO gordmans_direct_codes (intelligent_mail_barcode, sack_and_pa, seque, opt_endorsement_line, code, fullname, altaddr, deladdr, city, st, zipcode, vis, list) VALUES ?', [chunk])
		})
		.then(function (insertedChunk) {
			console.log('loaded', insertedChunk.length, 'chunks of', splitNum, 'rows');
		})
		.catch(function (err) {
			console.log('err while inserting', err);
		});
	});

})
.catch(function (err) {
	if( err ) {
		console.log(colors.red('Error establishing database connection! Fatal.'));
		console.log(err);
		process.exit(-1);
	}
});
