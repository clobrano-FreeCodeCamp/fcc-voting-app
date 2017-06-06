var express = require("express");
var exphbs = require("express-handlebars");
var exp_session = require('express-session');
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var LocalStrategy = require("passport-local").Strategy;
var logger = require("morgan");
var passport = require("passport");
var path = require('path');
var User = require('./libs/user');

// === Passport
passport.use(new LocalStrategy (function (username, password, done) {
    User.get(username, function(item) {
        if (item)
            return done(null, item);
        else
            return done(null, {}, "could not find user " + username);
    });
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// === Express
var app = express();
app.use(logger('combined'));
app.use(cookieparser());
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(exp_session({secret: 'awsome cat'}));
app.use(passport.initialize());
app.use(passport.session());

// IMPORTANT: engine NAME and EXTNAME must be the same. Also
// the other file ext must be the same (i.e. index.hbs)
app.set('views', path.join(__dirname, 'views/'));
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');


// === Routes
app.get('/', (req, rsp) => {
    rsp.render('login');
});

app.post('/login', passport.authenticate('local'),
    (req, rsp) => {
    rsp.render('index', {'title': 'Hello Node', 'message': 'I finally got it right!'});
});


// === Run
port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on port ' + port);
