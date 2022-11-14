//this page runs the program through a line by line reader
//to use: run the program on JSON mode in the node
//        now open a new terminal and run the command node client.js client_input/test1.txt
//        any of the test files in the client_input folder can be used, and the user can edit these files or create new ones as long as the correct format is followed

const fs = require('fs');
const readline = require('readline');
const httpJSONRequest = require('./client_input/httpJSONRequest');
const { argv } = require('process');

//
async function processLineByLine(file_name) {
    const rs = fs.createReadStream(file_name);
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    const rl = readline.createInterface({
        input: rs,
        crlfDelay: Infinity
    });
    const url = 'http://localhost:8080/student/'; //NOTE: if you changed the PORT in the server.js file, please also update it here
    var internal_storage = {};
    var res;
    for await (const raw_line of rl) {
        line = raw_line.trim();
        if (!line || line.startsWith('//')) {
            continue;
        }
        // Ok, we have a non-empty non-comment line, let's see what command it is.
        // We split the line into an array of string tokens (parts of the line).
        const params = line.split(/[ \t]+/);
        // The first token must be the command name
        // From here the rest of the tokens are read and responded to accordingly by the system
        switch (params[0]) {
            case 'add_student':
                const [command_a, add_data, add_token, stu_name] = params;
                if (!add_data || !isJSON(add_data)) {
                    break;
                }
                res = await httpJSONRequest('post', `${url}add`, add_data);
                if (res == "FAILED") {
                    console.log("*** data does not match expected values");
                    break;
                } else {
                    console.log(`student ${res.name} was successfully saved in the database`)
                }
                if (add_token == "saveas") {
                    if (stu_name) {
                        internal_storage[stu_name] = res;
                        console.log(`student ${res.name} was successfully saved in the internal storage`)
                    } else { console.log(`Student name was not present after saveas token, so the student ${res.name} was NOT saved in the internal storage`) }
                }
                break;

            case 'get_students':
                const [command_g, get_data, get_token, token_data] = params;
                if (!get_data || !isJSON(get_data)) {
                    break;
                }
                const data = JSON.parse(get_data);
                let query = '';
                Object.keys(data).forEach(key => {
                    if (query) {
                        query += "&" + key + "=" + data[key]
                    }
                    else {
                        query += key + "=" + data[key]
                    }
                });
                res = await httpJSONRequest('get', `${url}?${query}`);
                if (res != "FAILED")
                    console.log(`Database returned the student IDs: ${res}`);
                var check = true;
                if (get_token == "expected_saveas_names") {
                    if (token_data) {
                        if (!isJSON(token_data)) {
                            break;
                        }
                        var students = JSON.parse(token_data);
                        var studentIds = students.map((s) => {
                            if (internal_storage[s]) { return internal_storage[s]._id } //this was added in order to stop the program from breaking in cases where the given name does not exist within the internal_storage object
                            else {
                                console.log(`*** ${s} does not exist within the internal storage, it's ID will not be compared.`);
                                students.splice(students.indexOf(s));
                            }
                        });
                        res.forEach(id => studentIds.includes(id) ? true : check = false);
                        if (!false) { console.log(`Database succesfully returned the IDs of students ${students}`) }
                    }
                    else { console.log(`Expected names token was not present after expected_saveas_names token, so the IDs will NOT be compared`) }
                }
                else if (get_token == "expected_num_documents") {
                    if (token_data) {
                        if (isNaN(token_data)) {
                            console.log("*** string inserted for expected number of documents is not a number, will not check expected number of documents")
                            break;
                        }
                        if (res.length != token_data) {
                            check = false;
                        } else { console.log(`Database succesfully returned ${token_data} IDs`) }
                    } else { console.log(`Expected number token was not present after expected_num_documents token, so the amount will NOT be checked`) }
                }
                if (res == "FAILED" || !check) {
                    console.log("*** returned IDs do not match expected values or amount");
                    break;
                }
                break;

            case "update_student":
                const [command_u, name_stu, update_data] = params;
                if (!update_data || !isJSON(update_data))
                    break;
                if (name_stu in internal_storage) {
                    var id = internal_storage[name_stu]._id;
                    res = await httpJSONRequest('post', `${url}update/${id}`, update_data);
                    if (res == "FAILED") {
                        console.log("*** data does not match expected values");
                        break;
                    } else {
                        internal_storage[name_stu] = res;
                        console.log(`Student ${name_stu} with the name ${res.name} was succesfully updated in the database and the internal storage`);
                    }
                } else { console.log(`Student ${name_stu} does not exist within the internal storage, and was NOT updated`) }
                break;

            case "add_course":
                const [command_c, course_name, course_data] = params;
                if (!course_data || !isJSON(course_data))
                    break;
                if (course_name in internal_storage) {
                    var id = internal_storage[course_name]._id;
                    res = await httpJSONRequest('post', `${url}update/${id}/addcourse`, course_data);
                    if (res == "FAILED") {
                        console.log("*** data does not match expected values");
                        break;
                    } else {
                        internal_storage[course_name] = res;
                        console.log(`Succesfully added course for student ${res.name} to both the database and the internal storage`);
                    }
                } else { console.log(`Student ${course_name} does not exist within the internal storage, and was NOT updated`) }
                break;

            case "del_student":
                const stu = params[1];
                if (stu in internal_storage) {
                    var id = internal_storage[stu]._id;
                    res = await httpJSONRequest('post', `${url}delete/${id}`);
                    if (res == "FAILED") {
                        console.log("*** data does not match expected values");
                        break;
                    } else {
                        delete internal_storage[stu];
                        console.log(`Succesfully deleted student ${stu} from both the database and the internal storage`);
                    }
                } else { console.log(`Student ${stu} does not exist within the internal storage, and was NOT deleted`) }
                break;

            case "del_all":
                res = await httpJSONRequest('post', `${url}deleteall`);
                if (res == "OK") {
                    internal_storage = {}; //this was added in order to allow the user to use the del_all command in any place within the client input files
                    console.log("Successfully deleted all students from the database");
                }
                if (res == "FAILED") {
                    console.log("*** Failed to delete database");
                    break;
                }
                break;

            default:
                console.log("Unrecognized command (ignored):", line);
        }
    }
}

// Run the function and insert the input file as the paramater, taken from the console input using argv
processLineByLine(argv[2]);


//function to check if inserted string (str) is in the proper JSON format, if yes the function returns the data in JSON format
function isJSON(str) {
    try {
        return (JSON.parse(str));
    } catch (err) {
        console.log("*** Data entered is not in the proper JSON format")
        return false;
    }
}