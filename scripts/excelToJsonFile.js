const utils = require('./utils');
const fs = require('fs');
const xlsx = require('node-xlsx');

const printHelp = () => {
    console.log("Help: node excelToJsonFile.js -h (--help)")
};

const printUsage = () => {
    console.log(`Usage: node excelToJsonFile.js 
        --excelFile <Path to the Excel file> 
        --jsonFile_hi <Path to the json file> with Hindi 
    `);
};

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'help',
        ef: 'excelFile',
        jf_hi: 'jsonFile_hi'
    }
});

const extractSheet = (sheetMap, sheetName) => {
    return sheetMap[sheetName].data.filter(row => row[0]).reduce((o, row) => {
        o[row[0]] = row[2] || 'TBD';
        return o;
    }, {});
};

if (argv['h']) {
    printHelp();
    printUsage();
} else {
    const mandatoryParams = ['ef', 'jf_hi'];
    if (!utils.checkMandatoryParameters(argv, mandatoryParams)) {
        console.error('Missing mandatory arguments.');
        printUsage();
    } else {
        // Parse a file
        const workSheetsFromFile = xlsx.parse(argv['ef']);
        console.log('Parsed Excel file');
        const sheetMap = workSheetsFromFile.reduce((map, sheet) => {
            map[sheet.name] = sheet;
            return map;
        }, {});
        const beezone1 = extractSheet(sheetMap, 'Beezone 1');
        const beezoneDailyChallenge = extractSheet(sheetMap, 'Beezone Daily Challenge');
        const beezoneMindLab = extractSheet(sheetMap, 'Beezone Mind Lab');
        // const vsVirtues = extractSheet(sheetMap, 'Virtuescope virtues');
        const vsMonths = extractSheet(sheetMap, 'Virtuescope months');
        const vsStrings = extractSheet(sheetMap, 'Virtuescope strings');
        const vsPlans = extractSheet(sheetMap, 'Virtuescope plans');
        const vsPlansLength = extractSheet(sheetMap, 'Virtuescope plans length');
        const memory = extractSheet(sheetMap, 'Memory Game');
        const breathe = extractSheet(sheetMap, 'Breathe Game');
        const finalJsonObj = {
            beezone1,
            beezoneDailyChallenge,
            beezoneMindLab,
            vs: {
                // virtueTexts: vsVirtues,
                months: vsMonths,
                i18n: vsStrings,
                plans: vsPlans,
                plansLength: vsPlansLength
            },
            memory,
            breathe
        };
        fs.writeFileSync(argv['jf_hi'], JSON.stringify(finalJsonObj), 'utf8');
    }
}