const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    name: {
        type: String,
        lowercase: true, // Always convert `name` to lowercase
        unique: true
    },
    password: {
        type: String,
    },
    owner_id: {
        type: String,
        lowercase: true, // Always convert `id` to lowercase
        unique: true
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
});

userSchema.pre("save", function (next) {

    console.log("pre save is called : ", this.password);
    bcrypt.hash(this.password, null, null, (err, hash) => {

        if(err){
            console.log("err : ", err);
        }

        console.log("hash : ", hash);
        this.password = hash;


        var currentDate = new Date;
        this.updated_at= currentDate;
        if(!this.created_at){
            this.created_at= currentDate;
        }
        next();
    });
});

userSchema.pre("update", function (next) {

    console.log("pre save is called : ", this.password);
    bcrypt.hash(this.password, null, null, (err, hash) => {

        if(err){
            console.log("err : ", err);
        }

        console.log("hash : ", hash);
        this.password = hash;
        var currentDate = Date().now;
        this.updated_at = new Date(currentDate);
        next();
    });
});

userSchema.methods.validPassword = function(password, cb){
    bcrypt.compare(password, this.password, cb);
};

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', userSchema);