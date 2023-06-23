const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(email) {

    return jwt.sign(
        {email},
        process.env.JWT_SECRET_KEY,
    )
}

module.exports = generateToken;
