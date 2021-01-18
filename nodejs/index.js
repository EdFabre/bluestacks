require('dotenv').config()
const fs = require('fs');
const editJsonFile = require("edit-json-file");
const path = require('path');
const date = require('date-and-time');
var AdmZip = require('adm-zip');

const now = new Date();
const newTime = date.format(now, 'YYYYMMDDTHHmmss')
const macrosSubdir = process.env.MACROS_DIR
const bluestacksMacrosSubdir = process.env.BLUESTACKS_MACROS_DIR

function clearDir(opts) {

    fs.readdir(opts.directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(opts.directory, file), err => {
                if (err) throw err;
            });
        }
    });
}

function makeBackup() {
    var zip = new AdmZip();
    zip.addLocalFolder(bluestacksMacrosSubdir)
    zip.writeZip(path.join(__dirname, 'backups', `bsmacros_${newTime}.zip`));
}

function cleanMacros() {
    fs.readdir(bluestacksMacrosSubdir, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            let fileJSON = editJsonFile(path.join(bluestacksMacrosSubdir, file));
            fileJSON.unset("SourceRecordings")
            fileJSON.set("TimeCreated", newTime)
            fileJSON.save();
            fs.rename(path.join(bluestacksMacrosSubdir, file), path.join(bluestacksMacrosSubdir, file.toLowerCase()), function (err) {
                if (err) console.log('ERROR: ' + err);
                fs.copyFileSync(path.join(bluestacksMacrosSubdir, file.toLowerCase()), path.join(macrosSubdir, file.toLowerCase()))
            });

        });
    });
    console.log("Finished cleaning macros");
}
clearDir({ directory: macrosSubdir })
makeBackup()
cleanMacros()