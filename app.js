const express = require('express');
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan      = require('morgan');
const mongoose    = require('mongoose');

const config = require('./config/config'); // get our config file
const User   = require('./models/user'); // get our mongoose model

const app = express();

const PORT_NUMBER = 4000;

//connnct mongodb
mongoose.connect(config.database, {
    useMongoClient: true
}); // connect to database
mongoose.Promise = global.Promise;

// secret variable
app.set('secretKey', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));
app.use(cors());

//for test
app.post('/api/signup', function(req, res) {

    var name = req.body.name;
    var password = req.body.password;

    if(typeof name === 'undefined' || typeof password === 'undefined'){
        res.json({
            success: false,
            message: "invalid params"
        });
        return;
    }

    console.log('User name :', name);
    console.log('User password : ', password);

    var id = new mongoose.Types.ObjectId();
    console.log('new id :', id);

    // create a sample user
    var newUser = new User({
        _id: id,
        name: name,
        password: password,
        owner_id: id.toString()
    });

    console.log('newUser :', newUser);

    // save the sample user
    newUser.save(function(err) {
        if (err){
            console.log('User created err', err);

            //duplicate key
            if(err.code == 11000){
                res.status(400).json({
                    success: false,
                    message: 'duplication key.',
                    code: '11000'
                });
            }else{
                res.status(400).json({
                    success: false,
                    message: err.message,
                    code: err.code.toString()
                });
            }
            return;
        }

        console.log('User created successfully');
        res.status(201).json({ success: true });

        //add owner_id field
    });
});

app.get('/api/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});

//access url without JWT authentication
app.get('/api' , (req, res) => {
    res.json({
        message : "welcome to the API"
    });
});

//access url with JWT authentication
app.post('/api/posts' , verifyToken, (req,res) => {

    res.json({
        message : 'post created'
    });
});

app.post('/api/login', function(req, res) {

    var name = req.body.name;
    var password = req.body.password;

    console.log("user : ", name);
    console.log("password : ", password);

    // find the user
    User.findOne({
        name: name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            user.validPassword(password, function(err, result) {

                if(err){
                    console.log("err : ", err);
                }

                if(result == false){
                    res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                }else{
                    const payload = {
                        sub: user._id.toString(),
                        aud: 'Application-name',
                        stitch_meta : {
                            id : user._id.toString(),
                            name : user.name
                        }
                    };

                    //set expiration time : 60 mins
                    var token = jwt.sign(payload, app.get('secretKey'), {
                        expiresIn: '60m'
                    });

                    // return the information including token as JSON
                    res.json({
                        success: true,
                        user_id : user._id.toString(),
                        message: 'Login Successfully',
                        token: token
                    });
                }
            });
        }
    });
});


function verifyToken(req, res, next){
    //get auth header calue
    const bearerHeader = req.headers['authorization'];

    if(typeof bearerHeader !== 'undefined'){
        //split at the space
        const bearer = bearerHeader.split(' ');

        //get Token from array
        const bearerToken = bearer[1];

        var token = bearerToken;

        jwt.verify(token, app.get('secretKey'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    }else{
        //fobidden
        res.sendStatus(403);
    }
}

app.listen(PORT_NUMBER,()=> {
    console.log("auth server starts : " + PORT_NUMBER);
});
