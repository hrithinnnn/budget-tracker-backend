const express = require('express');
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
var ObjectId = require('mongodb').ObjectId;

const income = require('../backend/schemas/income');
const expense = require('../backend/schemas/expense');
const userModel = require('../backend/schemas/User');
const sessionModel = require('../backend/schemas/Session')
const validator = require('../backend/middlewares/token-validator')
const app = express();
const jsonParser = bodyParser.json();

const jwtSign = require('./utils/jwt-sign');
const jwtVerify = require('./utils/jwt-verify');

const logger = (req, res, next) => {

    let current_datetime = new Date();

    let formatted_date =
        current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();

    let method = req.method;

    let url = req.url;

    let log = `[${formatted_date}] ${method}:${url}`;

    console.log(log);

    next();
};

require('dotenv').config();

mongoose.connect(process.env.DB_URI)
app.use(cors())
app.use(jsonParser)
app.use(logger)
app.use(validator)



app.get('/', (req, res) => {
    res.status(200).json({ message: "success" })
})

app.post('/add', jwtVerify, (req, res) => {
    const title = req.body.title;
    const amount = req.body.amount;
    const date = req.body.date;
    const type = req.body.type;
    const user = req.headers['vt'].email;
    // const id=req.body.id;
    console.log(type)
    if (type === 'income') {
        income.insertMany({ title, amount, date, user }).then((docs) => {
            res.status(200).json({ docs })
        }
        )
    }
    else {
        expense.insertMany({ title, amount, date, user }).then((docs) => {
            res.status(200).json({ docs })
        })
    }


    // else{
    //         const title=req.body.title;
    //         const amount=req.body.amount;
    //         const date= new Date();
    //         const user=req.headers['vt'].email;
    //         income.insertMany({title,amount,date,user}).then((docs)=>{
    //             res.status(200).json({docs})
    //         }
    //         ).catch((err)=>{
    //             res.status(400).json({message:"unsuccessful"})
    //         })
    // }

})

app.get('/budget/expenses', jwtVerify, (req, res) => {
    const user = req.headers['vt'].email;
    expense.find({ type: "expense", user }).then((docs) => {
        console.log(docs)
        res.status(200).json({ docs })
    }).catch((err) => {
        res.status(200).json({ message: "bruh" })
    })
})

app.get('/budget/incomes', jwtVerify, (req, res) => {
    const user = req.headers['vt'].email;
    console.log(user);
    income.find({ type: 'income', user }).then((docs) => {
        console.log(docs)
        res.status(200).json({ docs })
    }).catch((err) => res.status(400).json({ message: "unsuccessful" }))
})

app.post('/signup', (req, res) => {

    // const { name, role, email, password } = req.body; //destructuring
    let errorString = "";

    if (!req.body.name) errorString = "No name was provided"

    else if (req.body.name.length === 0) errorString = "No name was provided"

    if (!req.body.email) errorString = "No email was provided"

    else if (req.body.email.length === 0) errorString = "No email was provided"

    if (!req.body.password) errorString = "No password was provided"

    else if (req.body.password.length === 0) errorString = "No password was provided"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    let hashedPassword;

    // Encryption of the string password
    bcrypt.genSalt(10, function (err, Salt) {

        // The bcrypt is used for encrypting password.
        bcrypt.hash(req.body.password, Salt, function (err, hash) {

            if (err) {
                return console.log('Cannot encrypt');
            }

            hashedPassword = hash;

            const doc = { name: req.body.name, role: req.body.role, email: req.body.email, password: hashedPassword };

            userModel.create(doc).then((result) => {

                const data = { id: result.id, name: result.name, role: result.role, email: result.email }
                res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

            }).catch((err) => {

                // console.log("HRIHTINNNNNNN LOGGGG")
                // console.log(err.code);
                // console.log("HRIHTINNNNNNN LOGGGG")

                if (err.code === 11000) errorString = "Email exists"
                else errorString = err.code;

                res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
            });
            // console.log(hash);
        })
    });
});

app.post('/login', (req, res) => {


    let errorString = "";
    // const { email, password } = req.body; //destructuring

    if (!req.body.email) errorString = "No email was provided"

    else if (req.body.email.length === 0) errorString = "No email was provided"

    if (!req.body.password) errorString = "No password was provided"

    else if (req.body.password.length === 0) errorString = "No password was provided"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    userModel.findOne({ email: req.body.email }).then((doc) => {

        console.log(doc);

        if (!doc) {

            res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
            return;
        }

        const success = bcrypt.compareSync(req.body.password, doc.password);
        if (success) {
            console.log(success);
            const token = jwtSign(req.body.email);
            console.log(token);
            sessionModel.create({ email: req.body.email, token, isLoggedOut: 0 }).then((result) => {

                const data = { token }
                res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

            }).catch((err) => {

                if (err.code === 11000) errorString = "Token expired"

                else errorString = err.code;

                res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });

            });

        } else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} });
    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });
});

app.post('/logout', (req, res) => {

    let errorString = "";

    const token = req.headers.authorization;

    sessionModel.updateOne({ token }, { isLoggedOut: 1 }).then((doc) => {

        const data = { token }
        res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    })
    // localStorage.removeItem("token");
});
app.post('/delete', jwtVerify, (req, res) => {
    const type = req.body.type
    const id = req.body.id
    const user = req.headers['vt'].email;
    if (type == 'income') {
        income.deleteOne({ "_id": new ObjectId(id) }).then((doc) => {
            res.status(200).json(doc);
        }).catch((err) => {
            res.status(200).json(err)
        })

    }
    if (type == 'expense') {
        expense.deleteOne({ "_id": new ObjectId(id) }).then((doc) => {
            res.status(200).json(doc);
        }).catch((err) => {
            res.status(200).json(err)
        })

    }
})

app.post('/update', (req, res) => {
    const id = req.body.obj._id;
    const type = req.body.obj.type;
    const obj = req.body.obj;
    console.log(req.body.obj)
    if (type === 'expense') {
        expense.updateOne({ "_id": new ObjectId(id) }, { $set: { title: obj.title, date: obj.date, amount: obj.amount, type: obj.type } }).then((doc) => {
            res.status(200).json(doc);
        }).catch((err) => {
            res.status(400).json(req.body.obj)
        })
    }
    if (type === 'income') {
        income.updateOne({ "_id": new ObjectId(id) }, { $set: { title: obj.title, date: obj.date, amount: obj.amount, type: obj.type } }).then((doc) => {
            res.status(200).json(doc);
        }).catch((err) => {
            res.status(400).json(req.body.obj)
        })
    }

})
app.get('/decode', jwtVerify, (req, res) => {

    const token = req.headers.authorization;

    const decoded = req.headers['vt']?.email;

    if (!decoded) {

        res.status(400).json({ status: 400, error: { errorString: "Token Invalid" }, message: "Failure", data: {} });
        return;
    }

    res.status(200).json({ status: 200, error: { errorString: "" }, message: "Success", data: { decoded } });
})
app.post('/changepassword', jwtVerify, (req, res) => {
    const user = req.headers['vt'].email;
    const id = req.body.email;
    const newPassword = req.body.newPassword;
    // const obj=req.body.obj;
    // console.log(req.body.obj)
    if (user === id) {
        userModel.findOne({ email: req.body.email }).then((doc) => {

            console.log(doc);

            if (!doc) {

                res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
                return;
            }

            const success = bcrypt.compareSync(req.body.oldPassword, doc.password);
            if (success) {
                let hashedPassword;

                // Encryption of the string password
                bcrypt.genSalt(10, function (err, Salt) {

                    // The bcrypt is used for encrypting password.
                    bcrypt.hash(newPassword, Salt, function (err, hash) {

                        if (err) {
                            return console.log('Cannot encrypt');
                        }

                        hashedPassword = hash;
                        console.log("hash", hash)
                    
                    console.log(success);
                    // const token = jwtSign(req.body.email);
                    // setTimeout(console.log(1),2000);
                    console.log("hashed", hashedPassword);
                    userModel.updateOne({ email: id }, { $set: { password: hashedPassword } }).then((doc) => {
                        res.status(200).json(doc)
                    }).catch((err) => {
                        res.status(400).json(err)
                    })

                })
            })
            
            } else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} });
        }).catch((err) => {

            res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
        });
    }
});


// app.post('/updateprofile', jwtVerify, (req, res) => {
//     const user = req.headers['vt'].email;
//     const id = req.body.email;
//     const name = req.body.name;
//     // const obj=req.body.obj;
//     // console.log(req.body.obj)
//     // con/st user=req.headers['vt'].email;
//     // const id=req.body.email;
//     // const password=req.body.password;
//     // const obj=req.body.obj;
//     // console.log(req.body.obj)
//     if (user === id) {
//         userModel.findOne({ email: req.body.email }).then((doc) => {

//             console.log(doc);

//             if (!doc) {

//                 res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
//                 return;
//             }

//             const success = bcrypt.compareSync(req.body.password, doc.password);
//             if (success) {
//                 // const token = jwtSign(req.body.email);
//                 // console.log(token);
//                 userModel.updateOne({ email: id }, { $set: { name: name, email: email } }).then((doc) => {
//                     res.status(200).json(doc)
//                 }).catch((err) => {
//                     res.status(400).json(err)
//                 })

//             }

//         })
//     }
//     else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} }).catch((err) => {

//         res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
//     }
//     );
// });



app.post('/deleteprofile', jwtVerify, (req, res) => {
    const user = req.headers['vt'].email;
    const id = req.body.email;
    const name = req.body.name;
    // const obj=req.body.obj;
    // console.log(req.body.obj)
    // con/st user=req.headers['vt'].email;
    // const id=req.body.email;
    // const password=req.body.password;
    // const obj=req.body.obj;
    // console.log(req.body.obj)
    // if (user === id) {
        // userModel.findOne({ email: req.body.email }).then((doc) => {

        //     console.log(doc);

        //     if (!doc) {

        //         res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
        //         return;
        //     }

            //const success = bcrypt.compareSync(req.body.password, doc.password);
            // if (success) {
            // const token = jwtSign(req.body.email);
            console.log(user);
            userModel.deleteOne({ email: user }).then((doc) => {
                res.status(200).json(doc)
            }).catch((err) => {
                res.status(400).json(err)
            })

            // }

        // )
    
    // else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} }).catch((err) => {

        // res.status(400).json({ status: 400, message: "Failure", data: {} });
    }
    );
// }

// )

app.post('/getname',jwtVerify, (req,res)=>{
    userModel.find({email: req.headers['vt'].email}).then((doc)=>{
        res.status(200).json(doc)
    }).catch((err)=>{
        res.status(400).json(doc)
    })
})

app.listen(5000, () => console.log(`listening on port 5000`));

