'use strict';

const fs = require('fs');
const xlsx = require('node-xlsx');

const workSheetsFromFile = xlsx.parse('Daily Chellenge Hindi.xlsx');

const sheetMap = workSheetsFromFile.reduce((map, sheet) => {
    map[sheet.name] = sheet;
    return map;
}, {});

console.log(Object.keys(sheetMap));

const contemplation = 1;
const value = 2;
const valueQuote = 3;
const day = 4;
const application = 5;

const challenges = sheetMap['Sheet1'].data.filter((r, i) => i > 0 && r[5]).reduce((a, r) => {
    if(!r[valueQuote]) {
        console.error(`${r[day]} is missing.`);
    }
    if(!r[contemplation]) {
        console.error(`${r[day]} is missing.`);
    }
    const row = {
        "Contemplation": r[contemplation],
        "Value": r[value],
        "ValueQuote": r[valueQuote] || 'Missing',
        "Day": r[day],
        "Application": r[application]
    };
    a.push(row);
    return a;
}, []);

const challengesObj = {
    "challenges": challenges
};

fs.writeFileSync("daily_challenge_hi.json", JSON.stringify(challengesObj), 'utf8');
