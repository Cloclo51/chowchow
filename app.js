const express   = require('express'),
      app       = express(),
      bp        = require('body-parser'),
      session   = require('express-session'),
      memstore  = require('memorystore')(session),
      m         = require('./middleware'),
      flash     = require('connect-flash')

// environment config
var ip          = process.env.IP || '0.0.0.0',
    port        = parseInt(process.env.PORT, 10) || 3000,
    secret      = process.env.SECRET || 'some random long string we should read from the environment'

app.set('view engine', 'ejs')
app.use(bp.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'))

app.use(session({
    store: new memstore({
        checkPeriod: 3600000 // 1 hour in ms
    }),
    resave: false,
    saveUninitialized: false,
    secret: secret
}))

// must come after session config
app.use(flash())

app.use(function (req, res, next) {
    if (!req.session.results) {
        req.session.results = []
        req.session.choice = {}
    }

    // store error messages
    res.locals.error = req.flash('error')

    next()
})

/*
 * template helpers
 */

// truncate long strings; only add elipsis on truncation
app.locals.shorten = function(str, len = 30) {
    if (str.length > len) {
        str = str.substring(0,len).trim() + '...'
    }
    return str
}

// convert rating number to svg stars
app.locals.stars = function(num) {
    let stars = ''
    let style = 'style="color: #FFD700"' // "gold"

    for (let i = 0; i < num-1; i++) {
        stars += '<i class="fas fa-star fa-lg" ' + style + '></i>'
    }

    if (num%1 != 0) {
        stars += '<i class="fas fa-star-half fa-lg" ' + style + '></i>'
    }

    return stars
}

/*
 * routes
 */

app.get('/', m.logRequest, function(req, res, next) {
    res.render('home')
})

app.post('/random', m.logRequest, m.parseRequest, function(req, res, next) {
    req.session.save(function(err) {
        res.redirect('/random')
    })
})

app.get('/random', m.logRequest, function(req, res, next) {
    // got random choice from yelp
    if (req.session.choice) {
        res.render('random', {biz: req.session.choice})
    } else {
        req.flash('error', 'No results found: please try again')
        res.redirect('/')
    }
})

app.get('/list', m.logRequest, function(req, res, next) {
    res.render('list', {results: req.session.results})
})

app.all('*', m.logRequest, function(req, res, next) {
    res.status(404).render('catchall')
})

app.listen(port, ip, function() {
    console.log('Server listening on ' + ip + ':' + port + '...')
})
