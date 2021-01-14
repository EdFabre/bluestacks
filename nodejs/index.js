const fs = require('fs');
const editJsonFile = require("edit-json-file");
const path = require('path');
const lineReplace = require('line-replace')
require('dotenv').config()

const newTime = "20210106T170304"
const macrosSubdir = process.env.MACROS_DIR
// const regex = /([A-Z0-9]){15}/g
console.log(macrosSubdir);
//requiring path and fs modules

//passsing macrosSubdir and callback function
fs.readdir(macrosSubdir, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        let fileJSON = editJsonFile(path.join(macrosSubdir,file));
        fileJSON.unset("SourceRecordings")
        fileJSON.set("TimeCreated", newTime)
        fileJSON.save();
        fs.rename(path.join(macrosSubdir,file), path.join(macrosSubdir,file.toLowerCase()), function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });
        console.log(file.toLowerCase());
    });
});
