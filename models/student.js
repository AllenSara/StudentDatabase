const mongoose = require('mongoose');

// Schema for courses
const take_course_schema = new mongoose.Schema({
    cid: {
        type: String, required: true,
        validate: {
            validator: function (v) {
                return (v.length == 5 && v.trim() != '' && !/ /.test(v))
            }
        }
    },
    grade: {
        type: Number, required: true, min: 0, max: 100
    },
});

// Schema for students
const student_schema = new mongoose.Schema({
    id: {
        type: String, required: [true, 'ID is required'],
        validate: {
            validator: function (v) {
                return (v.length == 9 && v.trim() != '' && !/ /.test(v)) //the test function checks a string to see if the first string is conatined within the inputted string, here it verifies that there are no whitespaces within the ID
            },
            message: 'ID must be exactly nine characters long and include no whitespace'
        }
    },
    name: {
        type: String, required: [true, 'Name is required'],
        validate: {
            validator: function (v) {
                return (v.length >= 1 && v.trim() != '')
            },
            message: 'Name must contain at least one non-blank character'
        }
    },
    city: {
        type: String,
        validate: {
            validator: function (v) {
                return (v.length >= 1 && v.trim() != '')
            },
            message: 'City must contain at least one non-blank character'
        }
    },
    toar: {
        type: String, required: [true, 'Toar is required'],
        enum: {
            values: ['ba', 'ma', 'phd'],
            message: 'Undefined Toar value {VALUE}'
        }
    },
    courses: [take_course_schema] // from schema for courses
},
    {
        collection: 'students'
    }
);

// This method is used when creating a new student in order to print a message with the proper error, it is not run when students are updated
global.print_error = function print_error(error) {
    student_schema.eachPath((pathname) => {
       if (error?.errors[pathname]) console.log(error.errors[pathname].message);
    });
}

const student = global.uri_academy.model('', student_schema);
module.exports = student;