const sessionModel = require('../schemas/Session');

const validateToken = async (req, res, next) => {

    let ignoreValidation = req.headers['ignore-token'];

    if(req.url === "/") ignoreValidation = true;
    if(req.url === "/signup") ignoreValidation = true;

    if(ignoreValidation) {

        next();
        return;
    }

    const token = req.headers.authorization;
    let errorString = "";

    if(!token) errorString = "Token not provided";

    let doc = await sessionModel.findOne({token});

    if(!doc) errorString = "Token invalid"

   // if(doc.isLoggedOut) errorString = "Token Expired"

    if(errorString.length != 0){

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }
    next();
}

module.exports = validateToken;