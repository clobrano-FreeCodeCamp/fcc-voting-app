var path = require('path');
var logger = require("morgan");

var express = require("express");
var exphbs = require("express-handlebars");
var exp_session = require('express-session');
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var flash = require('connect-flash');

var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var User = require('./libs/user');
var Polls = require('./libs/polls');

// === Passport
passport.use('local', new LocalStrategy (
  function (username, password, done) {
        var user = {'username': username, 'password': password};
    User.get(user,
      function(item) {
        if (item) {
          return done(null, item);
        } else {
          return done(null, false, { message: "Username and/or password are wrong"});
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
app.use(flash());
app.use(passport.session());
app.use("/static", express.static(path.join(__dirname, "/static")));

// IMPORTANT: engine NAME and EXTNAME must be the same. Also
// the other file ext must be the same (i.e. index.hbs)
app.set('views', path.join(__dirname, 'views/'));
app.engine('hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');


// === Routes
app.get('/', (req, rsp) => {
  var data = {};
  var filter = {};

  if (req.user)
    data.username = req.user.username;

  Polls.get({},
    function(err, user_polls) {
      if (err) {
        rsp.render('index', {'err_message': req.user.username + ', something went wrong'});
      } else {
        data.polls = user_polls;

        if (user_polls.length == 0)
          data.info_message = 'No polls yet';

        rsp.render('index', data);
      }
  });
});

app.get('/login', (req, rsp) => {
  rsp.render('user-form', {'action': '/user/login',
                           'title': 'Please login',
                           'error': req.flash('error'),
                           'warning': req.flash('warning'),
                           'info': req.flash('info')});
});

app.post('/user/login',
  passport.authenticate('local', { successRedirect: '/user/polls',
                                   failureRedirect: '/login',
                                   failureFlash: true}));

app.get ('/user/logout', function(req, rsp) {
  req.logout();
  rsp.redirect('/');
});

app.get('/user/polls', function(req, rsp) {
  var data = {};
  var filter = {};

  if (!req.user) {
    req.flash('error', 'No user defined');
    req.redirect('/');
  } else {
    data.username = req.user.username;
    filter = {'owner': req.user._id};

    Polls.get(filter,
      function(err, user_polls) {
        console.log(user_polls);
        if (err) {
          rsp.render('index', {'err_message': req.user.username + ', something went wrong'});
        } else {
          data.polls = user_polls;

          if (user_polls.length == 0)
            data.info_message = 'No polls yet';

          rsp.render('index', data);
        }
    });
  }
});


// --- Subscribe
app.get('/signup', (req, rsp) => {
  rsp.render('user-form', {'action': '/subscribe', 'title': 'Please register'});
});

app.post('/subscribe', function(req, rsp, next) {
  passport.authenticate('local',
    function(err, user, info) {
      if (err) {
        return rsp.send(500);
      }

      if (user) {
        return rsp.render('user-form',
          {'action': '/subscribe',
            'title': 'Please register',
            'warning': 'This user already exists'});
      } else {
        User.save(req.body.username,
                  req.body.password,
                  function(err, user_polls) {
                    if (err) rsp.send(501);
                    return rsp.render('index',
                      {
                        'username': user.username,
                        'success_message': 'Welcome ' + user.username + '!'
                      });
                  });
      }
    })(req, rsp, next);
});


app.get('/polls/new',
        //passport.authenticate('local'),
        function(req, rsp) {
          rsp.render('new-poll', {'action': '/polls/new'});
});

app.post('/polls/new',
         // TODO get user from session
         //passport.authenticate('local'),
         function(req, rsp) {
           if (req.session.user_id === null) {
              return rsp.render('index', {'err_message': 'Something went wrong'});
           }

           var title = req.body.title;
           var choices = req.body.choices;
           if (!title || title.length == 0)
             return rsp.render('new-poll',
                               {
                                 'action': '/polls/new',
                                 'err_message': 'Title is missing'
                               });

           if (!choices || choices.length == 0)
             return rsp.render('new-poll',
                               {
                                 'action': '/polls/new',
                                 'err_message': 'No Choices provided'
                               });

           var choice_list = choices.split("\r\n");
           var choice_map = {};

           for (i = 0; i < choice_list.length; i++) {
              choice_map[choice_list[i]] = 0.0;
           }

           data = {'title': title,
                   'owner': req.user._id,
                   'choices': choice_map,
                   'votes': 0};

           Polls.save(data,
                      function(err, result) {
                        if (err)
                          return rsp.render('index', {'err_message': err});
                        rsp.redirect('/');
                      });
         });

// === Run
port = process.env.PORT || 3001
app.listen(port);
console.log('Server listening on port ' + port);
