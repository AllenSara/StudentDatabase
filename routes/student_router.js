const express = require('express');
const router = express.Router();
const StudentModel = require('../models/student');

// Read all students- GET
router.get('/', async (req, res) => {
    try {
        const result = await StudentModel.find().exec();
        if (result.length === 0) {
            const empty = true;
            res.render('get_students', { empty, base_url: req.baseUrl });
        }
        else if (!req.query) {
            if (global.runmode == "HTML") {
                res.render('get_students', { stu: result, base_url: req.baseUrl });
            } else {
                res.json(result);
            }
        }
        else {
            const { toar, city, avg } = req.query;
            const filter = {
                $expr: { $and: [] }
            }
            if (toar && toar.trim() != '' && toar.trim() != "all") {
                filter['$expr']["$and"].push({ "$eq": ["$toar", toar] })
            }
            if (city && city.trim() != '') {
                filter['$expr']["$and"].push({ "$eq": ["$city", city] })
            }
            if (avg && avg.trim() != '') {
                avg_num = avg * 1;
                filter['$expr']["$and"].push({
                    "$gte": [{ "$avg": "$courses.grade" },
                        avg_num]
                })
            }
            const result = await StudentModel.find(filter).exec();
            if (global.runmode == "HTML") {
                res.render('get_students', { stu: result, toar, city, avg, base_url: req.baseUrl });
            } else {
                const result_id = result.map(r => r._id);
                res.json(result_id);
            }
        }
    }
    catch {
        res.send("FAILED");
    }
});

// Create student- GET
router.get('/add/', (req, res) => {
    if (global.runmode == "HTML") {
        res.render('add_student', { base_url: req.baseUrl });
    } else {
        res.json('This URL does not run on JSON mode.');
    }
});

// Create student- POST
router.post('/add/', async (req, res) => {
    try {
        var student;
        const { id, name, city, toar } = req.body;
        if (!city) {
            student = new StudentModel({ id: id, name: name, toar: toar });
        } else {
            student = new StudentModel(req.body);
        }
        const error = print_error(student.validateSync());
        if (error) {
            console.log("The incoming data did not match the schema.");
            if (global.runmode == "HTML") {
                res.send("Failed to add student");
            }
            else {
                res.json("FAILED");
            }
            return;
        }
        const the_added_student = await student.save();
        if (global.runmode == "HTML") {
            res.render('add_student', { id, name, city, toar, base_url: req.baseUrl });
        } else {
            res.json(the_added_student);
        }
    } catch (err) {
        console.log("An error occurred when trying to add the student.");
        if (global.runmode == "HTML") {
            res.sendStatus(404);
        } else {
            res.json("FAILED");
        }
    }
});

// Update student- GET
router.get('/update/:id', async (req, res) => {
    try {
        const student = await StudentModel.findOne({ _id: req.params.id }).exec();
        if (global.runmode == "HTML") {
            res.render('update_student', { stu: student, base_url: req.baseUrl });
        } else {
            res.json('This URL does not run on JSON mode.');
        }
    }
    catch {
        res.send("Could not find requested student");
    }
});

// Update student- POST
router.post('/update/:id', async (req, res) => {
    try {
        const opts = { runValidators: true, new: true };
        var st;
        if (req.body.city != "") {
            st = await StudentModel.findOneAndUpdate(
                { _id: req.params.id },
                { $set: { name: req.body.name, city: req.body.city, toar: req.body.toar } }, opts);
        } else { //added for case where city is blank
            st = await StudentModel.findOneAndUpdate(
                { _id: req.params.id },
                { $set: { name: req.body.name, toar: req.body.toar } }, opts);
            st.city = undefined;
            await st.save();
        }
        if (global.runmode == "HTML") {
            res.redirect(`${req.baseUrl}/update/${req.params.id}`);
        } else {
            res.json(st);
        }
    }
    catch {
        if (global.runmode == "HTML") {
            res.send("Update failed");
        } else {
            res.json("FAILED");
        }
    }
});

// Update course- POST
router.post('/update/:id/addcourse', async (req, res) => {
    try {
        const opts = { runValidators: true, new: true };
        const st = await StudentModel.findOneAndUpdate(
            { _id: req.params.id },
            { $push: { courses: { cid: req.body.cid, grade: req.body.grade } } }, opts);
        if (global.runmode == "HTML") {
            res.redirect(`${req.baseUrl}/update/${req.params.id}`);
        } else {
            res.json(st);
        }
    }
    catch {
        if (global.runmode == "HTML") {
            res.send("Failed to add course");
        } else {
            res.json("FAILED");
        }
    }
});

// Delete student- POST
router.post('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        result = await StudentModel.deleteOne({ _id: id })
        if (result.deletedCount == 1){
            if (global.runmode == "HTML") {
                res.redirect(req.baseUrl);
                console.log(`The student with the ID:${req.params.id} was successfully deleted`);
            } else {
                console.log(`The student with the ID:${req.params.id} was successfully deleted`);
                res.json(1);
            }
        }
    }
    catch {
        if (global.runmode == "HTML") {
            res.send("Could not delete student");
        } else {
            res.json(0);
        }
    }
});

// Delete all students- POST
router.post('/deleteall', async (req, res) => {
    try {
        await StudentModel.deleteMany();
        console.log('All students were successfully deleted');
        if (global.runmode == "HTML") {
            res.redirect(req.baseUrl);
        } else {
            res.json("OK");
        }
    }
    catch {
        if (global.runmode == "HTML") {
            res.send("Failed to delete all students");
        } else {
            res.json("FAILED");
        }
    }
});

// export the student router
module.exports = router; 