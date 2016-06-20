var express = require('express');
var morgan = require('morgan');

var app = express();
app.use('/', express.static('./dist'));
app.use(morgan('common'));

app.get('*', function (req, res) {
	res.sendfile('./dist/index.html');
});

app.listen(process.env.PORT || 5000, function (err) {
	console.log('listening on port ' + (process.env.PORT || 5000));
});
