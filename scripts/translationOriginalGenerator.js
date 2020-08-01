'use strict';
const utils = require('./utils');
const fs = require('fs');


const printHelp = () => {
    console.log("Help: node translationOriginalGenerator.js -h (--help)")
};

const printUsage = () => {
    console.log('Usage: node translationFileGenerator.js ' +
        '--translationFile <Path to the translation file> ' +
        '--languageCode <Language code like e.g. hi, pt, etc> ' +
        '--targetFolder <Target folder where all generated files will be stored> '
    )
};

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'help',
        tf: 'translationFile',
        lc: 'languageCode',
        tfd: 'targetFolder'
    }
});

const processBeezoneStrings = (targetFolder, jsonContents, error, targetFile, sourceElement) => {
    let beezoneStrings = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n";
    beezoneStrings += '<resources>\n';
    const entries = Object.entries(jsonContents[sourceElement]).map(function (e) {
            return {"key": e[0], "value": e[1]}
        }
    );
    // sort by key
    entries.sort(function (a, b) {
        return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });
    entries.forEach((e) => {
        beezoneStrings += `    <string name="${e.key}">${e.value}</string>\n`;
    });
    beezoneStrings += '</resources>';
    fs.writeFile(targetFile, beezoneStrings, 'utf8', (err) => {
        if (err) {
            error(err);
        }
    });
};

const processBeezoneIOSStrings = (targetFolder, jsonContents, error, targetFile, sourceElement) => {
    let beezoneStrings = "";
    const entries = Object.entries(jsonContents[sourceElement]).map(function (e) {
            return {"key": e[0], "value": e[1]}
        }
    );
    // sort by key
    entries.sort(function (a, b) {
        return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });
    entries.forEach((e) => {
        beezoneStrings += `"${e.key}" = "${e.value}";\n`;
    });
    fs.writeFile(targetFile, beezoneStrings, 'utf8', (err) => {
        if (err) {
            error(err);
        }
    });
};

const processTranslationFile = (translationFile, targetFolder) => {
    return new Promise((resolve, error) => {
        fs.stat(translationFile, (err, status) => {
            if (err) {
                error(err);
            } else {
                fs.readFile(translationFile, 'utf8', (err, contents) => {
                    if (err) {
                        error(err);
                    } else {
                        const jsonContents = JSON.parse(contents);
                        resolve({targetFolder, jsonContents});
                    }
                });
            }
        });
    });
};

const processJson = (targetFolder, jsonContents) => {
    return new Promise((resolve, error) => {
        processBeezoneStrings(targetFolder, jsonContents, error, `${targetFolder}/strings.xml`, 'beezone1');
        processBeezoneIOSStrings(targetFolder, jsonContents, error, `${targetFolder}/main_ios.txt`, 'beezone1');
        processBeezoneStrings(targetFolder, jsonContents, error, `${targetFolder}/strings_beezoneDailyChallenge.xml`, 'beezoneDailyChallenge');
        processBeezoneIOSStrings(targetFolder, jsonContents, error, `${targetFolder}/beezoneDailyChallenge_ios.txt`, 'beezoneDailyChallenge');
        processBeezoneStrings(targetFolder, jsonContents, error, `${targetFolder}/strings_beezoneMindLab.xml`, 'beezoneMindLab');
        processBeezoneIOSStrings(targetFolder, jsonContents, error, `${targetFolder}/beezoneMindLab_ios.txt`, 'beezoneMindLab');
        resolve({targetFolder, jsonContents});
    });
};

const removeEnclosingBrackets = (str) => {
    return str.replace(/^{/m, '')
        .replace(/^}$/m, '');
};

const writeVS = (jsonContents, targetFolder) => new Promise((resolve, error) => {
    let vsJS = JSON.stringify(jsonContents.vs, null, 2);
    vsJS = removeEnclosingBrackets(vsJS)
        .replace(/"(.+?)":\s*{/gm, '$1 = {')
        .replace(/(}),/gm, '$1;');
    fs.writeFile(`${targetFolder}/${argv['lc']}_BZ.js`, vsJS, 'utf8', (err) => {
        if (err) {
            error(err);
        } else {
            resolve({targetFolder, jsonContents});
        }
    });
});

const extractGame = (jsonContents, targetFolder, gameKey, gameName) => new Promise((resolve, error) => {
    let js = JSON.stringify(jsonContents[gameKey], null, 2);
    js = `i18n = ${js}`;
    fs.mkdir(`${targetFolder}/${gameName}`, (err) => {
        if (err) {
            error(err);
        } else {
            fs.writeFile(`${targetFolder}/${gameName}/${argv['lc']}_BZ.js`, js, 'utf8', (err) => {
                if (err) {
                    error(err);
                } else {
                    resolve({targetFolder, jsonContents});
                }
            });
        }
    });
});

if (argv['h']) {
    printHelp();
    printUsage();
} else {
    const mandatoryParams = ['tf', 'lc', 'tfd'];
    if (!utils.checkMandatoryParameters(argv, mandatoryParams)) {
        console.error('Missing mandatory arguments.');
        printUsage();
    } else {
        utils.createTargetFolder(argv['tfd'])
            .then((folder) => {
                console.log(`Generating files into ${folder}.`);
                return processTranslationFile(argv['tf'], folder);
            })
            .then(({targetFolder, jsonContents}) => {
                console.log(`Processing JSON.`);
                return processJson(targetFolder, jsonContents);
            })
            .then(({targetFolder, jsonContents}) => {
                console.log(`Processing VS.`);
                return writeVS(jsonContents, targetFolder);
            })
            .then(({targetFolder, jsonContents}) => {
                console.log(`Processing Memory.`);
                return extractGame(jsonContents, targetFolder, 'memory', 'memory');
            })
            .then(({targetFolder, jsonContents}) => {
                console.log(`Processing breathe.`);
                return extractGame(jsonContents, targetFolder, 'breathe', 'breathe');
            })
            .catch((err) => {
                console.error(`An error has occurred: ${err}`);
            });
    }
}
