const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
    email: String,
    token: {
        type: String,
        unique: true
    },
    isLoggedOut: Number,
});

module.exports = mongoose.model('Session', sessionSchema);