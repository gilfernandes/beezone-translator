const fs = require('fs');
const xlsx = require('node-xlsx');

const workSheetsFromFile = xlsx.parse('email_addresses_for_centres.xlsx');
console.log('Parsed Excel file');
const sheetMap = workSheetsFromFile.reduce((map, sheet) => {
    map[sheet.name] = sheet;
    return map;
}, {});

const sheet1 = sheetMap['Sheet1'];

sheet1.data.forEach(d => {
    const admin = d[1].replace(/(.+)@.+/, "$1");
    console.log(`-- ${d[0]}`);
    console.log(`insert into tb_user_mail(id, username, email) values((select max(id) + 1 from tb_user_mail), '${admin}_admin', '${d[1]}');`);
    console.log(`select * from users where username = '${admin}_admin';`);
});