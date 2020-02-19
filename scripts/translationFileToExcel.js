const utils = require('./utils');
const xl = require('excel4node');

const printHelp = () => {
    console.log("Help: node translationOriginalGenerator.js -h (--help)")
};

const printUsage = () => {
    console.log(`Usage: node translationOriginalGenerator.js 
        --translationFile <Path to the translation file> 
        --translationFile_hi <Path to the translation file> with Hindi 
        --languageCode <Language code like e.g. hi, pt, etc> 
        --targetFolder <Target folder where all generated files will be stored> `
    );
};

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'help',
        tf: 'translationFile',
        tf_hi: 'translationFile_hi',
        lc: 'languageCode',
        tfd: 'targetFolder'
    }
});

const row = 1;
const keyCol = 1;
const valCol = 2;
const englishCol = 2;
const translationCol = 3;

function writeToSheet(wb, sheetName, languageCode, data, data_hi) {
    if(typeof data_hi === "undefined") {
        data_hi = JSON.parse(JSON.stringify(data));
    }
    // Add Worksheets to the workbook
    const beezone1Ws = wb.addWorksheet(sheetName);
    // Add title
    // Set value of cell A1 to 100 as a number type styled with paramaters of style
    // Create a reusable style
    const titleStyle = wb.createStyle({
        font: {
            color: '#0008FF',
            size: 14,
            bold: true
        }
    });
    const keyStyle = wb.createStyle({
        font: {
            color: '#000000',
            size: 12,
            bold: true
        }
    });
    beezone1Ws.cell(row, keyCol).string('Key').style(titleStyle);
    beezone1Ws.cell(row, englishCol).string('English').style(titleStyle);
    beezone1Ws.cell(row, translationCol).string(languageCode).style(titleStyle);
    Object.entries(data).forEach((kv, i) => {
        const currentRow = row + 1 + i;
        beezone1Ws.cell(currentRow, keyCol).string(kv[0]).style(keyStyle);
        beezone1Ws.cell(currentRow, valCol).string(kv[1]);
        beezone1Ws.cell(currentRow, valCol + 1).string(data_hi[kv[0]]);
    });
}

const convertJsonToExcel = ((targetFolder, jsonContents, languageCode, jsonContents_hi) => {
    return new Promise((resolve, err) => {
        // Create a new instance of a Workbook class
        const wb = new xl.Workbook();
        jsonContents_hi = jsonContents_hi.jsonContents_hi;
        writeToSheet(wb, 'Beezone 1', languageCode, jsonContents.beezone1, jsonContents_hi.beezone1);
        writeToSheet(wb, 'Beezone Daily Challenge', languageCode, jsonContents.beezoneDailyChallenge, jsonContents_hi.beezoneDailyChallenge);
        writeToSheet(wb, 'Beezone Mind Lab', languageCode, jsonContents.beezoneMindLab, jsonContents_hi.beezoneMindLab);
        writeToSheet(wb, 'Virtuescope virtues', languageCode, jsonContents.vs.virtueTexts, jsonContents_hi.vs.virtueTexts);
        writeToSheet(wb, 'Virtuescope months', languageCode, jsonContents.vs.months, jsonContents_hi.vs.months);
        writeToSheet(wb, 'Virtuescope strings', languageCode, jsonContents.vs.i18n, jsonContents_hi.vs.i18n);
        writeToSheet(wb, 'Virtuescope plans', languageCode, jsonContents.vs.plans, jsonContents_hi.vs.plans);
        writeToSheet(wb, 'Virtuescope plans length', languageCode, jsonContents.vs.plansLength, jsonContents_hi.vs.plansLength);
        writeToSheet(wb, 'Memory Game', languageCode, jsonContents.memory, jsonContents_hi.memory);
        writeToSheet(wb, 'Breathe Game', languageCode, jsonContents.breathe, jsonContents_hi.breathe);
        wb.write(`translation_${languageCode}.xlsx`);
    })
});

if (argv['h']) {
    printHelp();
    printUsage();
} else {
    const mandatoryParams = ['tf', 'tf_hi', 'lc', 'tfd'];
    if (!utils.checkMandatoryParameters(argv, mandatoryParams)) {
        console.error('Missing mandatory arguments.');
        printUsage();
    } else {
        let jsonContents_en = null;
        utils.createTargetFolder(argv['tfd'])
            .then((folder => {
                console.log(`Folder ${folder} created.`);
                return folder;
            }))
            .then((folder) => {
                return utils.processTranslationFile(argv['tf'], folder);
            })
            .then(({targetFolder, jsonContents}) => {
                jsonContents_en = jsonContents;
                return utils.processTranslationFile(argv['tf_hi'], targetFolder);
            })
            .then(({targetFolder, jsonContents}) => {
                return convertJsonToExcel(targetFolder, jsonContents_en, argv['lc'], {jsonContents_hi: jsonContents});
            });
    }
}

