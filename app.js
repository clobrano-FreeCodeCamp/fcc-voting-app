var express = require("express");
var exphbs = require("express-handlebars");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var localStrategy = require("passport-local");
var logger = require("morgan");
var passport = require("passport");
var path = require('path');


var app = express();

// === Express
app.use(logger('combined'));
app.use(cookieparser());
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

// IMPORTANT: engine NAME and EXTNAME must be the same. Also
// the other file ext must be the same (i.e. index.hbs)
app.set('views', path.join(__dirname, 'views/'));
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

// === Passport
// === Routes
app.get('/', (req, rsp) => {
    rsp.render('index', {'title': 'Hello Node', 'message': 'I finally got it right!'});
});


// === Run
port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on port ' + port);
