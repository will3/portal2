var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var favicon = require('serve-favicon');

var jsonParser = bodyParser.json();

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.get('/', require('./controllers/editor'));
app.get('/gallery', require('./controllers/gallery'));

var port = 3000;
console.log('started on port: ' + port);
app.listen(port);