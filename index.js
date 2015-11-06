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

app.post('/save', jsonParser, require('./controllers/save'));
app.get('/', require('./controllers/editor'));
app.get('/v/:user/:name', require('./controllers/editor'));

console.log('started on port: ' + 3000);
app.listen(3000);