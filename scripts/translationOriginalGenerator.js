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

const createTargetFolder = (folder) => {
    return new Promise((resolve, error) => {
        fs.stat(folder, (err, status) => {
            if (err) {
                console.log(`Folder {folder} does not exist. Creating it now`);
                fs.mkdir(folder, (err) => {
                    if (err) {
                        error(err);
                    } else {
                        console.log(`Folder {folder} created.`);
                        resolve(folder);
                    }
                });
            } else {
                console.log(`Folder {folder} exists.`);
                resolve(folder);
            }
        });
    });

};

const processBeezoneStrings = (targetFolder, jsonContents, error, targetFile, sourceElement) => {
    let beezoneStrings = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n";
    beezoneStrings += '<resources>\n';
    Object.entries(jsonContents[sourceElement]).forEach(([key, value]) => {
        beezoneStrings += `    <string name="${key}">${value}</string>\n`;
    });
    beezoneStrings += '</resources>';
    fs.writeFile(targetFile, beezoneStrings, (err) => {
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
                        processBeezoneStrings(targetFolder, jsonContents, error, `${targetFolder}/strings.xml`, 'beezone1');
                        processBeezoneStrings(targetFolder, jsonContents, error, `${targetFolder}/string_layouts.xml`, 'beezone2');
                        resolve({targetFolder, jsonContents});
                    }
                });

            }
        });
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
    fs.writeFile(`${targetFolder}/${argv['lc']}_BZ.js`, vsJS, (err) => {
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
            fs.writeFile(`${targetFolder}/${gameName}/${argv['lc']}_BZ.js`, js, (err) => {
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
        createTargetFolder(argv['tfd'])
            .then((folder) => {
                console.log(`Generating files into ${folder}.`);
                return processTranslationFile(argv['tf'], folder);
            })
            .then(({targetFolder, jsonContents}) => {
                return writeVS(jsonContents, targetFolder);
            })
            .then(({targetFolder, jsonContents}) => {
                return extractGame(jsonContents, targetFolder, 'memory', 'memory');
            })
            .then(({targetFolder, jsonContents}) => {
                return extractGame(jsonContents, targetFolder, 'breathe', 'breathe');
            })
            .catch((err) => {
                console.error(`An error has occurred: ${err}`);
            });
    }
}