const express = require('express');
const app = express();
const mongoose = require('mongoose');
uri_academy = mongoose.createConnection('mongodb://localhost:27017/academy');
uri_academylog = mongoose.createConnection('mongodb://localhost:27017/academylog');
const PORT = 8080; //NOTE: if this is changed, please also change the url used in the client.js file on line 20
const student_router = require('./routes/student_router');
const LogModel = require('./models/log');

//check if the mode is HTML or JSON
const { argv } = require('process');
if (argv.toString().toLocaleUpperCase().includes('JSON')) { //this confirms that the program is running on JSON mode, the to upper was added in order to catch both upper and lowercase inputs of --json
    global.runmode = "JSON";
}
else {
    global.runmode = "HTML";
}

//function to create logs for academy log database, this function must be before the use of the function in app.use
const my_log = async function (req, res, next) {
    const myLog = new LogModel({
        method: req.method,
        path: req.path,
        runmode: global.runmode
    })
    await myLog.save();
    next();
};

app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', my_log);
app.use('/student', student_router);
app.use((req, res) => {
    if (global.runmode == "HTML") {
        res.status(404).send('Illegal path');
    } else {
        res.status(404).json('FAILED');
    }
});

//listen to PORT
(async () => {
    app.listen(PORT, () => {
        console.log(`Listen on ${PORT}`);
    });
})().catch((err) => console.log(err));