'use strict';
const fs = require('fs');
const utils = require('./utils');
const xml2js = require('xml2js');
var vm = require("vm");

const printHelp = () => {
    console.log("Help: node translationFileGenerator.js -h (--help)")
};

const printUsage = () => {
    console.log('Usage: node translationFileGenerator.js ' +
        '--beezone_xml <Path to Beezone XML> ' +
        '--beezone_dc_xml <Path to daily challenge XML file in Beezone> ' +
        '--beezone_mind_lab_xml <Path to Mind Lab XML file in Beezone> ' +
        '--virtuescope_js <Path to Virtuescope Javascript> ' +
        '--memory_js <Path to Memory Game Javascript>' +
        '--breathe_js <Path to Breathe Game Javascript>'
    )
};

const printExample = () => {
    console.log('Example: node translationFileGenerator.js ' +
        '--beezone_xml D:/dev/bk/beezone/BeeZone/app/src/main/res/values/strings.xml ' +
        '--beezone_dc_xml D:/dev/bk/beezone/BeeZone/daily_challenge/src/main/res/values/strings.xml ' +
        '--beezone_mind_lab_xml D:/dev/bk/beezone/BeeZone/mind_lab/src/main/res/values/strings.xml ' +
        '--virtuescope_js D:/dev/bk/beezone/BeeZone/app/src/main/assets/virtuescope/js/en_BZ.js ' +
        '--memory_js D:/dev/bk/beezone/BeeZone/app/src/main/assets/js/memory/en_BZ.js ' +
        '--breathe_js D:/dev/bk/beezone/BeeZone/app/src/main/assets/js/breathe/en_BZ.js'
    )
};

function handleError(message, errorFunc) {
    console.error(message);
    errorFunc(message);
}

const processBeezone = (beezoneStrings, translationObj) => {

    return new Promise((resolve, error) => {
        fs.readFile(beezoneStrings, 'utf8', (err, contents) => {
            if (err) {
                handleError(`Could not read from ${beezoneStrings}`, error);
            } else {
                var parser = new xml2js.Parser();
                parser.parseString(contents, function (err, result) {
                    if (err) {
                        console.error(`Could parse XML from ${beezoneStrings}`);
                        console.error(err);
                    }
                    result.resources.string.map((s) => {
                        translationObj[s.$.name] = s._;
                    });
                    resolve(translationObj);
                });
            }
        });
    });

};

const processVirtuescopeJs = (virtuescopeJs, translationObj) => {
    return new Promise((resolve, error) => {
        fs.readFile(virtuescopeJs, 'utf8', (err, contents) => {
            if (err) {
                handleError(`Could not read from ${virtuescopeJs}`, error);
            } else {
                const script = new vm.Script(contents);
                script.runInThisContext();
                translationObj.virtueTexts = {...virtueTexts};
                translationObj.months = {...months};
                translationObj.i18n = {...i18n};
                translationObj.plans = {...plans};
                translationObj.plansLength = {...plansLength};
                resolve(translationObj);
            }
        });
    });
};

const processGame = (memoryJs, translationObj, key) => {
    return new Promise((resolve, error) => {
        fs.readFile(memoryJs, 'utf8', (err, contents) => {
            if (err) {
                handleError(`Could not read from ${memoryJs}`, error);
            } else {
                const script = new vm.Script(contents);
                script.runInThisContext();
                translationObj[key] = {...i18n};
                resolve(translationObj);
            }
        });
    });
};

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'help',
        bx: 'beezone_xml',
        bdc: 'beezone_dc_xml',
        bml: 'beezone_mind_lab_xml',
        v: 'virtuescope_js',
        m: 'memory_js',
        b: 'breathe_js'
    }
});

if (argv['h']) {
    console.log('Used to produce a JSON file from the Beezone translation files.');
    printUsage();
    printExample();
} else {
    const mandatoryParams = ['bx', 'bdc', 'bml', 'v', 'm', 'b'];
    if (!utils.checkMandatoryParameters(argv, mandatoryParams)) {
        console.error('Missing mandatory arguments.');
        printUsage();
        printHelp();
    } else {
        const finalTranslation = {
            beezone1: {},
            beezoneDailyChallenge: {},
            beezoneMindLab: {},
            vs: {}
        };
        processBeezone(argv['bx'], finalTranslation.beezone1)
            .then((beezoneStringObj) => {
                return processBeezone(argv['bdc'], finalTranslation.beezoneDailyChallenge);
            })
            .then((beezoneStringObj) => {
                return processBeezone(argv['bml'], finalTranslation.beezoneMindLab);
            })
            .then((beezoneStringObj) => {
                return processVirtuescopeJs(argv['v'], finalTranslation.vs);
            })
            .then((beezoneStringObj) => {
                return processGame(argv['m'], finalTranslation, 'memory');
            })
            .then((beezoneStringObj) => {
                return processGame(argv['b'], finalTranslation, 'breathe');
            })
            .then((beezoneStringObj) => {
                let finalJSON = JSON.stringify(finalTranslation);
                console.log(finalJSON);
                const targetFile = 'beezone_translation.json';
                console.log(`Writing ${targetFile}`);
                fs.writeFileSync(targetFile, finalJSON, 'utf8')
            })
            .catch((err) => {
                console.log('An error occurred during processing.');
                console.log(err);
            });
    }
}