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
passport.use('local', new LocalStrategy (
	function (username, password, done) {
		User.get(username,
			function(item) {
				if (item) {
					console.log(item);
					return done(null, item);
				} else {
					return done(null, false, "could not find user " + username);
				}
			}
		);
	}
));

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
app.use(exp_session({
	secret: 'awsome cat',
	saveUninitialized: false,
	resave: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/static", express.static(path.join(__dirname, "/static")));

// IMPORTANT: engine NAME and EXTNAME must be the same. Also
// the other file ext must be the same (i.e. index.hbs)
app.set('views', path.join(__dirname, 'views/'));
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');


// === Routes
app.get('/', (req, rsp) => {
	rsp.render('index');
});

// --- Login
app.get('/signin', (req, rsp) => {
	rsp.render('user-form', {'action': '/login', 'message': 'Please login'});
});
app.post('/login', function(req, rsp, next) {
	passport.authenticate('local',
		function(err, user, info) {
			if (err)
        return rsp.send(500);
			if (user) {
        return rsp.render('index', {'username': user.username, 'success_message': 'Welcome back ' + user.username + '!'});
			}
			else
        return rsp.render(
          'user-form',
          {
            'action': '/login',
            'message': 'Please login',
            'warn_message': 'Username and/or password are wrong. Retry or Sign Up'
          });
		})(req, rsp, next);
});

// --- Subscribe
app.get('/signup', (req, rsp) => {
	rsp.render('user-form', {'action': '/subscribe', 'message': 'Please register'});
});
app.post('/subscribe', function(req, rsp, next) {
	passport.authenticate('local',
		function(err, user, info) {
			if (err)
        return rsp.send(500);
			if (user)
        return rsp.render('user-form', {'action': '/subscribe', 'message': 'Please register', 'warn_message': 'This user already exists'});
			else {
				User.save(req.body.username,
					req.body.password,
					function(user) {rsp.render('index', {'username': user.username, 'success_message': 'Welcome ' + user.username + '!'});});
			}
		})(req, rsp, next);
});

// === Run
port = process.env.PORT || 3000
app.listen(port);
console.log('Server listening on port ' + port);
