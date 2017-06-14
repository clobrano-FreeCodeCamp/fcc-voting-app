var express = require("express")
    , exphbs = require("express-handlebars")
    , exp_session = require('express-session')
    , bodyparser = require("body-parser")
    , cookieparser = require("cookie-parser")
    , flash = require('connect-flash')
    , handlebars = require('handlebars');

var passport = require("passport")
    , LocalStrategy = require("passport-local").Strategy;

var Users = require('./libs/user');
var Polls = require('./libs/polls');
var assert = require('assert');
var path = require('path');
var logger = require("morgan");


// === Passport
passport.use('local', new LocalStrategy (
  function (username, password, done) {
    var user = {'username': username, 'password': password};
    Users.get(user,
      function(err, item) {
        if (err) { return done(err); }
        if (!item) { return done(null, false, { message: "Username and/or password are wrong"}); }
        return done(null, item);
      }
    );
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  Users.getById(id, function(err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
});


// === handlebars helpers
handlebars.registerHelper({
  inc: function(value, options) {
    return parseInt(value) + 1;
  },
  eq: function (v1, v2) {
    return v1 === v2;
  },
  neq: function (v1, v2) {
    return v1 !== v2;
  },
  escape: function(value) {
    return value.replace(/['"]/g, '');
  },
  len: function(value) {
    return value.length;
  }
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
app.get('/', function (req, rsp) {
  var data = {};

  if (req.user && req.user.username) {
    data.username = req.user.username;
  }

  rsp.render('home', data);
});

app.get('/polls', (req, rsp) => {
  var data = {};
  var filter = {};

  if (req.user && req.user.username) {
    data.username = req.user.username;
  }

  Polls.get({},
    function(err, all_polls)
    {
      if (err)
      {
        rsp.render('index', {'error': 'Something went wrong'});
      }
      else
      {
        for (i = 0; i < all_polls.length; i++) {
          var votes = 0;
          var choices = all_polls[i].choices;

          for (var key in choices) {
            votes += choices[key];
          }

          all_polls[i].votes = votes;
        }

        data.polls = all_polls;
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
  req.session.user = {};
  rsp.redirect('/');
});


app.get('/user/polls',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, rsp) {
    var data = {};
    var filter = {};

    if (!req.user) {
      rsp.redirect('/', {'error': 'Could not find user data'});
    } else {
      var user = req.user;
      data.username = user.username;
      filter = {'owner': user._id.toString()};

      Polls.get(filter,
        function(err, user_polls) {
          if (err) {
            rsp.render('index', {'err_message': user.username + ', something went wrong'});
          } else {
            for (i = 0; i < user_polls.length; i++) {
              var votes = 0;
              var choices = user_polls[i].choices;

              for (var key in choices) {
                votes += choices[key];
              }

              user_polls[i].votes = votes;
            }

            data.polls = user_polls;
            data.userid = user._id.toString();

            if (user_polls.length == 0)
              data.info = 'Would you like to add some new poll?';

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
    var newuser = {'username': req.body.username,
                   'password': req.body.password};

    Users.get(newuser, (err, user) => {
      if (err) {
        req.flash('error', 'Something wrong happend');
        return rsp.render('user-form', {'action': '/subscribe', 'title': 'Please register'});
      }

      if (user) {
        console.error('user already exists');
        return rsp.render('user-form', {'action': '/subscribe', 'title': 'Please register', 'error': 'user already exists'});
      }

      Users.save(newuser, (err, result) => {
        if (err) {
          req.flash('error', 'Something wrong happend');
          return rsp.render('user-form', {'action': '/subscribe', 'title': 'Please register'});
        }

        req.login(newuser, function(err) {
          if (err) { return next(err); }
          rsp.redirect('/user/polls');
        });
      });
    });
});

app.get('/polls/new',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, rsp) {
    rsp.render('new-poll', {'action': '/polls/new', 'username': req.user.username});
});

app.post('/polls/new',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, rsp) {
    var user = req.user || null;

    if (user == null) {
      return rsp.render('index', {'error': 'Something went wrong'});
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

    // Split list of choices and drop empty elements
    var choice_list = choices.split("\r\n").filter(function(n) {return n});
    var choice_map = {};

    for (i = 0; i < choice_list.length; i++) {
      choice_map[choice_list[i]] = 0.0;
    }

    data = {'title': title,
           'owner': user._id.toString(),
           'choices': choice_map};

    Polls.save(data,
              function(err, result) {
                if (err)
                  return rsp.render('index', {'err_message': err});
                rsp.redirect('/user/polls');
              });
});


app.get('/polls/show/:id', function(req, rsp) {
  var data = {};
  var user = req.user || null;
  var id = req.params.id;

  assert(id != null);

  if (user) {
    data.username = user.username;
  }

  Polls.getById(id,
    function(err, poll)
      {
        if (err) {
            req.flash('error', 'Could not find poll\'s data');
            return rsp.redirect('/');
        }

        data.title = poll.title;
        data.labels = [];
        data.votes = [];

        for (var key in poll.choices){
            data.labels.push('"' + key + '"');
            data.votes.push(poll.choices[key]);
        }

        req.session.poll_id = poll._id;
        return rsp.render('poll', data);
      });
});


app.get('/polls/remove/:id',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, rsp) {
    var id = req.params.id;
    Polls.remove(id, function() {
        req.username = req.user.username;
        rsp.redirect('/user/polls');
    });
});


app.post('/polls/vote', function(req, rsp) {
  Polls.getById(req.session.poll_id,
    function(err, poll) {

      var labels = [];
      var selected = req.body.optRadio;

      for (var key in poll.choices) {
        labels.push(key);
      }

      if (labels.length > selected) {
        poll.choices[labels[selected]] += 1;

        Polls.update(poll._id, poll, function(err){
          if(err) req.flash('error', 'Update error');
          return rsp.redirect('/polls/show/' + poll._id);
        });
      } else {
          return rsp.redirect('/polls/show/' + poll._id);
      }

    });
});


app.get('/*', function(req, rsp) {
  rsp.redirect('/');
});

// === Run
port = process.env.PORT || 3001
app.listen(port);
console.log('Server listening on port ' + port);
