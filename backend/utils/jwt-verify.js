const jwt = require('jsonwebtoken');
const sessionModel = require('../schemas/Session');

require('dotenv').config();

async function decodeToken(req, res, next) {

    const token = req.headers.authorization; 

    // let doc = await sessionModel.findOne({token});

    // if(!doc) return null;

    // if(doc.isLoggedOut) return null;

    return jwt.verify(token, process.env.JWT_SECRET_KEY, (err, vt) => {

        req.headers['vt'] = vt;
        console.log(vt);
        next();
    });
}

module.exports = decodeToken;