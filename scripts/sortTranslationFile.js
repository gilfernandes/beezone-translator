const fs = require('fs');
const utils = require('./utils');
const xml2js = require('xml2js');

let beezoneStrings = 'D:\\dev\\bk\\beezone\\BeeZone\\app\\src\\main\\res\\values-hi-rIN\\strings.xml';
translationObj = {};
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
        });
        const entries = Object.entries(translationObj).map(function (e) {
                return {"key": e[0], "value": e[1]}
            }
        );
        // sort by value
        entries.sort(function (a, b) {
            return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
        });
        let myXml = `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
              <resources>  
        `;
        entries.forEach(e => {
            myXml += `<string name="${e.key}">${e.value}</string>`
        });
        myXml += `</resources>`;
        fs.writeFile('D:\\dev\\bk\\beezone\\BeeZone\\app\\src\\main\\res\\values-hi-rIN\\strings_xxx.xml', myXml, 'utf8', (err) => {
            if(err) {
                console.log(err);
            }
        });
    }
});
