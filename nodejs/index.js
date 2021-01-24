require('dotenv').config()
const fs = require('fs');
const editJsonFile = require("edit-json-file");
const path = require('path');
const date = require('date-and-time');
var AdmZip = require('adm-zip');

const now = new Date();
const newTime = date.format(now, 'YYYYMMDDTHHmmss')
const macrosSubdir = process.env.MACROS_DIR
const configsSubdir = process.env.CONFIGS_DIR
const bluestacksMacrosSubdir = process.env.BLUESTACKS_MACROS_DIR
const bluestacksKeymapFile = process.env.BLUESTACKS_KEYMAP_FILE
const local_newmacros = process.env.LOCAL_NEWMACROS
const local_newconfigs = process.env.LOCAL_CONFIGS
const local_backups = process.env.LOCAL_BACKUPS

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
    var zip2 = new AdmZip();

    zip.addLocalFolder(bluestacksMacrosSubdir)
    zip.writeZip(path.join(__dirname, local_backups, `bsmacros_${newTime}.zip`));

    zip2.addLocalFile(bluestacksKeymapFile)
    zip2.writeZip(path.join(__dirname, local_backups, `bsconfig_${newTime}.zip`));

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
    fs.copyFileSync(bluestacksKeymapFile, path.join(configsSubdir, path.basename(bluestacksKeymapFile)))
    console.log("Finished cleaning macros");
}

function createKeyMap(opt) {
    horizontal = 2
    horizontalBuffer = 5
    vertical = 4
    verticalBuffer = 10
    keyMap = [];

    rowID = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    colID = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
    for (let row = 0; row < rowID.length; row++) {
        for (let col = 0; col < colID.length; col++) {
            console.log(`${rowID[row]} + ${colID[col]} = x${horizontal},y${vertical}`);
            keyMap.push(createKey({
                X: horizontal,
                Y: vertical,
                Key: `${rowID[row]} + ${colID[col]}`
            }))
            horizontal += horizontalBuffer
            macroKey = createSimpleMacro({
                Name: `Key.${rowID[row]}${colID[col]}`,
                Key1: rowID[row],
                Key2: colID[col]
            })
            const macroData = JSON.stringify(macroKey, null, 4);

            // write JSON string to a file
            fs.writeFile(path.join(__dirname, local_newmacros, `Key.${rowID[row]}${colID[col]}.json`), macroData, (err) => {
                if (err) {
                    throw err;
                }
                console.log("Macro data is saved.");
            });
        }
        horizontal = 2
        vertical += verticalBuffer
    }

    // convert JSON object to string
    const data = JSON.stringify(keyMap);

    // write JSON string to a file
    fs.writeFile('keyMap.json', data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    });
}

function getKeyMapSet(opt) {
    return new Promise(function (resolve, reject) {
        let keymapfileJSON = editJsonFile(path.join(bluestacksKeymapFile));
        let allKeySets = keymapfileJSON.get("ControlSchemes");
        let foundSet = false;
        allKeySets.forEach(keySet => {
            if (opt.Name == keySet.Name) {
                resolve(keySet);
                foundSet = true;
            }
        });
        if (foundSet == false) {
            reject(`Couldn't find set with name ${opt.Name}`)
        }
    })
}

function createKey(opt) {
    return {
        $type: 'Tap, Bluestacks',
        X: opt.X,
        Y: opt.Y,
        Key: `${opt.Key}`,
        Key_alt1: '',
        ShowOnOverlay: true,
        Type: 'Tap',
        Guidance: {},
        GuidanceCategory: 'Misc',
        Exclusive: false,
        ExclusiveDelay: 200,
        XExpr: '',
        YExpr: '',
        XOverlayOffset: '',
        YOverlayOffset: '',
        EnableCondition: '',
        IsVisibleInOverlay: true
    }
}

function createSimpleMacro(opt) {
    return {
        TimeCreated: `${newTime}`,
        Name: opt.Name,
        Events: [
            {
                Timestamp: 500,
                KeyName: opt.Key1,
                EventType: "KeyDown"
            },
            {
                Timestamp: 600,
                KeyName: opt.Key2,
                EventType: "KeyDown"
            },
            {
                Timestamp: 700,
                KeyName: opt.Key2,
                EventType: "KeyUp"
            },
            {
                Timestamp: 800,
                KeyName: opt.Key1,
                EventType: "KeyUp"
            }
        ],
        LoopType: "TillLoopNumber",
        LoopNumber: 1,
        LoopTime: 0,
        LoopInterval: 0,
        Acceleration: 1,
        PlayOnStart: false,
        DonotShowWindowOnFinish: false,
        RestartPlayer: false,
        RestartPlayerAfterMinutes: 60,
        ShortCut: "",
        UserName: "",
        MacroId: ""
    }
}
// createKeyMap()
clearDir({ directory: macrosSubdir })
makeBackup()
cleanMacros()