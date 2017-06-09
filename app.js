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
  var data = {};
  var filter = {};

  if (req.user) {
    data.username = req.user.username;
    filter = {'owner': req.user._id};
  }

  Polls.get(filter,
    function(err, user_polls) {
      console.log(user_polls);
      if (err) {
        rsp.render('index', {'err_message': req.user.username + ', something went wrong'});
      } else {
        data.polls = user_polls;

        if (user_polls.length == 0)
          data.info_message = req.user.username + ', you don\'t have any polls yet';

        rsp.render('index', data);
      }
  });
});

// --- Login
app.get('/signin', (req, rsp) => {
  rsp.render('user-form', {'action': '/login', 'message': 'Please login'});
});
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/signin'}));

// --- Subscribe
app.get('/signup', (req, rsp) => {
  rsp.render('user-form', {'action': '/subscribe', 'message': 'Please register'});
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
            'message': 'Please register',
            'warn_message': 'This user already exists'});
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
