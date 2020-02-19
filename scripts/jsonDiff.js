const fs = require('fs');
const utils = require('./utils');

const printHelp = () => {
    console.log("Help: node jsonDiff.js -h (--help)")
};

const printUsage = () => {
    console.log(`Usage: node jsonDiff.js 
        --original <Path to the original json file> 
        --target <Path to the target json file>
    `);
};

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'help',
        o: 'original',
        t: 'target'
    }
});

if (argv['h']) {
    printHelp();
    printUsage();
} else {
    const mandatoryParams = ['o', 't'];
    if (!utils.checkMandatoryParameters(argv, mandatoryParams)) {
        console.error('Missing mandatory arguments.');
        printUsage();
    } else {
        const origFileContent = fs.readFileSync(argv['o'], 'utf8');
        const targetFileContent = fs.readFileSync(argv['t'], 'utf8');
        const origFileJSON = JSON.parse(origFileContent);
        const targetFileJSON = JSON.parse(targetFileContent);
        const diffResult = Object.entries(origFileJSON).reduce((a, tuple) => {
            const keyOrig = tuple[0];
            const valuesOrig = tuple[1];
            const valuesTarget = targetFileJSON[keyOrig];
            const valuesOrigKeys = new Set(Object.keys(valuesOrig));
            const valuesTargetKeys = new Set(Object.keys(valuesTarget));
            a[keyOrig] = {
                missingInTarget: [...valuesOrigKeys].filter(e => !valuesTargetKeys.has(e)).map(e => {
                    return {
                        [e]: valuesOrig[e]
                    }
                }),
                missingInOrig: [...valuesTargetKeys].filter(e => !valuesOrigKeys.has(e))
            };
            return a;
        }, {});
        fs.writeFileSync('diff_result.json', JSON.stringify(diffResult), 'utf8');
    }
}