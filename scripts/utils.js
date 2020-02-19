
const fs = require('fs');

const createTargetFolder = (folder) => {
    return new Promise((resolve, error) => {
        fs.stat(folder, (err, status) => {
            if (err) {
                console.log(`Folder ${folder} does not exist. Creating it now`);
                fs.mkdir(folder, (err) => {
                    if (err) {
                        error(err);
                    } else {
                        console.log(`Folder ${folder} created.`);
                        resolve(folder);
                    }
                });
            } else {
                console.log(`Folder ${folder} exists.`);
                resolve(folder);
            }
        });
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
                        resolve ({targetFolder, jsonContents});
                    }
                });
            }
        });
    });
};

module.exports = {
    checkMandatoryParameters: (argv, mandatoryParams) => {
        return mandatoryParams.map((p) => argv[p]).filter(v => v).reduce((a, v) => a + 1, 0) === mandatoryParams.length;
    },
    createTargetFolder: createTargetFolder,
    processTranslationFile: processTranslationFile
};