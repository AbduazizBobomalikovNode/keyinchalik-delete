const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth"); // Word fayllarini o'qish uchun mammoth kutubxonasi
const { exec } = require('child_process');


// Excel yoki Word faylida qidiriladigan so'zlarni tekshirish
async function checkDocumentForWords(filePath, searchWords = ['bron']) {
    const extname = path.extname(filePath).toLowerCase();

    if (extname === '.xlsx' || extname === '.xls') {
        if (extname === '.xls') {
            let result = await convertXlsToXlsx(filePath)
                .then(newPath => {
                    console.log(`Fayl o'zgartirildi: ${newPath}`)
                    return newPath;
                })
                .catch(err => {
                    console.error("Xatolik:", err.message)
                    return false;
                });
            if (!result) {
                return
            }
            filePath = result;
        }
        return await checkExcelFile(filePath, searchWords);  // Excel faylini tekshirish
    }

    if (extname === '.docx') {
        return await checkWordFile(filePath, searchWords);  // Word faylini tekshirish
    }

    console.error("Qo'llab-quvvatlanmagan fayl turi:", extname);
    return false;
}

// Excel faylini tekshirish
async function checkExcelFile(filePath, searchWords) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath); // Excel faylini yuklash
    const worksheet = workbook.getWorksheet(workbook.worksheets[0]._name); // Birinchi varaqni olamiz

    if (!worksheet) {
        console.error("Worksheet topilmadi. Iltimos, varaq indeksini yoki nomini tekshiring.");
        return false;
    }

    // Excel faylida qidiriladigan so'zlarni tekshirish
    let wordFound = false;

    worksheet.eachRow((row, rowIndex) => {
        row.eachCell((cell, colIndex) => {
            if (typeof cell.value === "string") {
                const cellValue = cell.value.toLowerCase();
                if (searchWords.some(word => cellValue.includes(word.toLowerCase()))) {
                    wordFound = true;
                    console.log(`Excel faylida so'z topildi! Qator: ${rowIndex}, Ustun: ${colIndex}`);
                }
            }
        });
    });
    if (!wordFound) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log("texshiruvdagi faylni o'chirishda xatolik:", err);
            } else {
                console.log("o'chirildi " + filePath);
            }
        });
    } else {
        const extname = path.extname(filePath).toLowerCase();
        await convertAllToAll(filePath, extname, ".pdf");
        // Fayl yo'llari
        const destinationPath = path.join(path.resolve(__dirname, "../../"), 'documents', path.basename(filePath)); // Ko'chiriladigan joy yo'li

        // Faylni ko'chirish
        fs.rename(filePath, destinationPath, (err) => {
            if (err) {
                console.error('Faylni ko‘chirishda xatolik:', err);
            } else {
                console.log('Fayl muvaffaqiyatli ko‘chirildi!');
            }
        });
    }

    return wordFound;
}


function convertXlsToXlsx(filePath) {
    return new Promise((resolve, reject) => {
        const newFilePath = path.join(path.dirname(filePath), path.basename(filePath, '.xls') + '.xlsx');
        const cmd_command = `ml_convertor xls2xlsx "${filePath}" "${newFilePath}"`;
        exec(cmd_command, (err) => {
            if (err) {
                return reject(err);
            }
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log("konvertatsiyadan keyin fayl  o'chirishda xatolik :", err);
                } else {
                    console.log("konvertatsiyadan keyin fayl  o'chirildi " + filePath);
                }
            });
            resolve(newFilePath);
        });
    });
}
function convertAllToAll(filePath, from, to) {
    return new Promise((resolve, reject) => {
        const newFilePath = path.join(path.dirname(filePath), path.basename(filePath, from) + to);
        const cmd_command = `ml_convertor ${from.replace(".", "")}2${to.replace(".", "")} "${filePath}" "${newFilePath}"`;
        exec(cmd_command, (err) => {
            if (err) {
                return reject(err);
            }
            const destinationPath = path.join(path.resolve(__dirname, "../../"), 'documents', path.basename(newFilePath)); // Ko'chiriladigan joy yo'li

            // Faylni ko'chirish
            fs.rename(newFilePath, destinationPath, (err) => {
                if (err) {
                    console.error('Faylni ko‘chirishda xatolik:', err);
                } else {
                    console.log('Fayl muvaffaqiyatli ko‘chirildi!');
                }
            });
            resolve(newFilePath);
        });
    });
}

// Word faylini tekshirish
async function checkWordFile(filePath, searchWords) {
    try {
        const docxData = await mammoth.extractRawText({ path: filePath }); // Word faylidan matnni olish
        const text = docxData.value.toLowerCase(); // Matnni kichik harflarga o'girish

        if (searchWords.some(word => text.includes(word.toLowerCase()))) {
            console.log(`Word faylida so'z topildi!`);
            // Fayl yo'llari
            const destinationPath = path.join(path.resolve(__dirname, "../../"), 'documents', path.basename(filePath)); // Ko'chiriladigan joy yo'li
            const extname = path.extname(filePath).toLowerCase();
            await convertAllToAll(filePath, extname, ".pdf");
            // Faylni ko'chirish
            fs.rename(filePath, destinationPath, (err) => {
                if (err) {
                    console.error('Faylni ko‘chirishda xatolik:', err);
                } else {
                    console.log('Fayl muvaffaqiyatli ko‘chirildi!');
                }
            });
            return true;
        } else {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log("texshiruvdagi faylni o'chirishda xatolik:", err);
                } else {
                    console.log("o'chirildi " + filePath);
                }
            });
            console.log(`Word faylida so'z topilmadi!`);
            return false;
        }
    } catch (error) {
        console.error("Word faylini o'qishda xato:", error);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log("texshiruvdagi faylni o'chirishda xatolik:", err);
            } else {
                console.log("o'chirildi " + filePath);
            }
        });
        return false;
    }
}

// Foydalanish uchun misol
// (async () => {
//     const filePath = 'C:/Users/VICTUS/Desktop/o\'chirish mumkin/exceljs/template/input.xlsx'; // Fayl manzili
//     const searchWords = ['bron', 'so\'z1', 'so\'z2']; // Qidiriladigan so'zlar

//     const result = await checkDocumentForWords(filePath, searchWords);
//     console.log(result ? 'So\'z(lar) topildi!' : 'So\'z(lar) topilmadi!');
// })();

module.exports = checkDocumentForWords;
