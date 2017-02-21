var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/user');
var Song = require('./models/song');
var fs = require('fs');
var port = 80;
//
// connect to database
mongoose.connect('mongodb://admin:washetnu29-30of31@ds153659.mlab.com:53659/songlist');
//
// Connect to database;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to Database");
});
//
//
//
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
// use morgan to log requests to the console
var path = require('path');
public = __dirname + '/public/';
app.use(express.static(public));
app.get("/", function (req, res) {
    res.sendFile(public + "index.html");
});
// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router();
// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost/api/authenticate
app.post('/authenticate', function (req, res) {
    var mail = req.headers['mail'];
    // find the user
    User.findOne({
        mail: mail
    }, function (err, user) {
        if (err) {
            console.log(err);
            res.status(409).end();
            return;
        }
        if (!user) {
            res.status(422).end();
        }
        else {
            res.status(200).end();
        }
    });
});
app.post('/createuser', function (req, res) {
    // getting log in data
    var fname = req.headers['fname'];
    var lname = req.headers['lname'];
    var mail = req.headers['mail'];
    // create a new user if it doesn't exist yet
    User.findOne({
        mail: mail
    }, function (err, user) {
        if (err) console.log(err);
        else if (!user) {
            var newUser = new User({
                fname: fname
                , lname: lname
                , mail: mail
            });
            newUser.save(function (err, newUser) {
                if (err) return console.error(err);
                res.status(200).end();
            });
        }
        else {
            res.json({
                success: false
                , message: 'This email address is already in use.'
            });
            res.status(409).end();
        }
    });
});
app.get('/getsongs', function (req, res, next) {
    var songs = [];
    mongoose.connection.db.collection("songs", function (err, collection) {
        collection.find({
        }).toArray(function (err, data) {
            songs.push(data);
            return res.status(200).send({
                songs: songs
            });
        })
    });
});
app.get('/getuserinfo', function (req, res, next) {
    var userInfo = [];
    var mail = req.headers['mail'];
    mongoose.connection.db.collection("users", function (err, collection) {
        collection.find({
            mail: mail
        }).toArray(function (err, data) {
            userInfo.push(data);
            return res.status(200).send({
                userInfo: userInfo
            });
        })
    });
});
app.post('/addsong', function (req, res) {
    var userMail = req.headers['usermail'];
    var userFname = req.headers['userfname'];
    var userLname = req.headers['userlname'];
    var title = req.headers['title'];
    var artist = req.headers['artist'];
    var yturl = req.headers['yturl'];
    var newSong = new Song({
        userMail: userMail
        , userFname: userFname
        , userLname: userLname
        , title: title
        , artist: artist
        , upvotes: 0
        , yturl: yturl
    });
    newSong.save(function (err, newSong) {
        if (err) return console.error(err);
        res.status(200).end();
    });
});
app.post('/upvotesong', function (req, res) {
    var user = req.headers['user'];
    var title = req.headers['title'];
    var artist = req.headers['artist'];
    var upvotes = req.headers['upvotes'];
    Song.findOne({
        title: title
        , artist: artist
    }, function (err, doc) {
        if (err) {
            console.log(err);
            res.status(409).end();
        }
        else if (doc) {
            doc.upvotes = upvotes;
            doc.upvotedBy.push(user);
            console.log(doc.upvotedBy);
            doc.save();
            res.status(200).end();
        }
    });
});
// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);