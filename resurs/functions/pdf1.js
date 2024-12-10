const PizZip = require("pizzip");
var ImageModule = require('docxtemplater-image-module-free');
const Docxtemplater = require("docxtemplater");
var QRCode = require('qrcode');
var fs = require('fs');
const path = require("path");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const os = require("os");


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function createPDF(doc, pdf) {
    const inputPath = path.resolve(__dirname, "../../views/certifcate/" + doc);
    const outputPath = path.resolve(__dirname, "../../views/certifcate/" + pdf);

    console.log("Kiritish yo‘li:", inputPath);
    console.log("Chiqish yo‘li:", outputPath);


    if (!fs.existsSync(inputPath)) {
        console.log("Fayl topilmadi:", inputPath);
        return false;
    }
    //await waitForFile(inputPath,100);
    try {
        let command;

        // OSni aniqlash
        if (os.platform() === 'win32') {
            // Windows uchun docx2pdf
            command = `docx2pdf  "${inputPath}" "${outputPath}"`;
            console.log("command :", command);
        } else {
            // Linux/macOS uchun unoconv bilan LibreOffice server rejimida ishlatish
            command = `libreoffice --headless --invisible --convert-to pdf "${inputPath}" --outdir "${path.dirname(outputPath)}"`;
        }
        const { stdout, stderr } = await exec(command);
        console.log("const { stdout, stderr }  ", command);

        if (stderr.length, 1) {
            console.log("Xatolik (stderr):", stderr);
            return false;
        }

        console.log("Konvertatsiya bajarildi:", stdout);
        return true;
    } catch (error) {
        console.log("Xatolik:", error);
        return false;
    }
}

async function getContent(lang) {
    if (lang == "uz") {
        return path.resolve(__dirname, "../template/ilova_uz_end.docx")
    }
    // if (lang == "ru") {
    //     return fs.readFileSync(
    //         path.resolve(__dirname, "../template/demo1ru_end.docx"),
    //         "binary");
    // }

}

async function toPdf(data, name_doc) {
    let name_docx = name_doc + "_" + (new Date()).valueOf() + ".docx";
    let name_pdf = name_doc + "_" + (new Date()).valueOf() + ".pdf";

    const inputPath = getContent("uz");
    const outputPath = path.resolve(__dirname, "../../temp/" + name_docx);
    data.input_temp = inputPath;
    data.output_temp = outputPath;
    data.CR = "{%image}";
    const dataPath = path.join(__dirname, "../config/data.json");
    saveDataToJson(data, dataPath);

    await writePyDocTemplater("./temp/" + name_docx,);


    console.log(outputPath);
    // console.log(data, name_doc, url_doc, doc, lang)
    if (!fs.existsSync(outputPath)) {
        console.log("Fayl topilmadi:", outputPath);
    } else {
        console.log("topildi :", outputPath)
    }

    const content = fs.readFileSync(outputPath, "binary");

    const zip = new PizZip(content);
    var opts = {}
    opts.centered = false; //Set to true to always center images
    opts.fileType = "docx"; //Or pptx
    opts.getImage = function (tagValue, tagName) {
        // console.log("opts.getImage : ",tagValue);
        return fs.readFileSync(__dirname + '\\' + tagValue);
    }
    opts.getSize = function (img, tagValue, tagName) {
        // if (doc == 2) return [130, 130];
        // if (doc == 6) return [140, 140];
        return [130, 130];
    }
    var imageModule = new ImageModule(opts);
    var name = 'natija.jpg';
    data.image = name;
    console.log("name_doc :", name_doc)
    var segs = "https://re-metrologiya.uz/documents/" + name_pdf || (new Date()).toUTCString();
    const file = __dirname + '\\' + name;
    // const file_docx = __dirname + '\\' + name_docx;
    console.log("name_docx,name_pdf :", name_docx, name_pdf);
    await QRCode.toFile(file, segs, async function (err) {
        if (err) throw err;
        try {
            var doc = new Docxtemplater()
                .attachModule(imageModule)
                .loadZip(zip)
                .setData(data)
                .render();

            var buffer = doc
                .getZip()
                .generate({ type: "nodebuffer" });

            const inputPath = path.resolve(__dirname, "../../views/certifcate/" + name_docx);
            fs.writeFileSync(inputPath, buffer);
            fs.unlinkSync(file);


            await createPDF(name_docx, name_pdf);
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                console.log("fs.unlinkSync(inputPath) :", inputPath)
                // return false;
            } else {
                console.log("return false; :",inputPath)
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    });
    return { url: path.resolve(__dirname, "../../views/certifcate/" + name_pdf), link: "/documents/" + name_pdf };
}

function saveDataToJson(data, filePath) {
    const jsonData = JSON.stringify(data, null, 4); // JSON ma'lumotni formatlash
    fs.writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error("Ma'lumotni saqlashda xatolik yuz berdi:", err);
        } else {
            console.log("Ma'lumot muvaffaqiyatli saqlandi:", filePath);
        }
    });
}

// .docx faylni .pdf faylga aylantirish funksiyasi
async function writePyDocTemplater() {
    const command = `py "${path.resolve(__dirname, "./formatDoc.py")}"`;
    try {
        const { stdout, stderr } = await exec(command);
        // await sleep(2000);
        if (stderr) throw new Error(stderr);
        console.log("pyda   to'ldirish  natijasi:", stdout);
        return true;
    } catch (err) {
        console.error("pyda   to'ldirish  xatolik:", err);
        throw err;
    }
}


// toPdf(demo,'awdawd','Abduaziz');
module.exports = toPdf;



// let obj_doc = {
//     image: __dirname + '\\' + name,
//     id: data.id,
//     service_name: "_".repeat((62 - data.service_name.length) / 2) + data.service_name.slice(0, 62) + "_".repeat((62 - data.service_name.length) / 2),
//     validity_period_year: data.validity_period_year,
//     validity_period_day: data.validity_period_day,
//     validity_period_month: data.validity_period_month,
//     model_tools: "_".repeat((63 - data.model_tools.length) / 2) + data.model_tools.slice(0, 63) + "_".repeat((63 - data.model_tools.length) / 2),
//     document_title: "_".repeat((70 - data.document_title.length) / 2) + data.document_title.slice(0, 70) + "_".repeat((70 - data.document_title.length) / 2),
//     metrology_service_name: "_".repeat((58 - data.metrology_service_name.length) / 2) + data.metrology_service_name.slice(0, 58) + "_".repeat((58 - data.metrology_service_name.length) / 2),
//     instruments_owner: "_".repeat((70 - data.instruments_owner.length) / 2) + data.instruments_owner.slice(0, 70) + "_".repeat((70 - data.instruments_owner.length) / 2),
//     measuring_instruments: "_".repeat((83 - data.measuring_instruments.length) / 2) + data.measuring_instruments.slice(0, 83) + "_".repeat((83 - data.measuring_instruments.length) / 2),
//     importing_country: "_".repeat((37 - data.importing_country.length) / 2) + data.importing_country.slice(0, 37) + "_".repeat((37 - data.importing_country.length % 38) / 2),
//     parameters_measuring_instruments: "_".repeat((80 - data.parameters_measuring_instruments.length) / 2) + data.parameters_measuring_instruments.slice(0, 80) + "_".repeat((80 - data.parameters_measuring_instruments.length) / 2),
//     parameters_measuring_instruments2: "_".repeat((61 - data.parameters_measuring_instruments.slice(80).length) / 2) + data.parameters_measuring_instruments.slice(80) + "_".repeat((61 - data.parameters_measuring_instruments.slice(80).length) / 2),
//     importing_naming_marking: "_".repeat((62 - data.importing_naming_marking.length) / 2) + data.importing_naming_marking.slice(0, 62) + "_".repeat((62 - data.importing_naming_marking.length) / 2),
//     compliance_with_requirements: "_".repeat((78 - data.compliance_with_requirements.length) / 2) + data.compliance_with_requirements.slice(0, 78) + "_".repeat((78 - data.compliance_with_requirements.length) / 2),
//     compliance_with_requirements2: "_".repeat((60 - data.compliance_with_requirements.slice(78).length) / 2) + data.compliance_with_requirements.slice(78) + "_".repeat((60 - data.compliance_with_requirements.slice(78).length) / 2),
//     Comparison_date_year: data.Comparison_date_year,
//     Comparison_date_day: data.Comparison_date_day,
//     Comparison_date_month: data.Comparison_date_month,
//     leader: data.leader,
//     Scornful: data.Scornful
// }
var demo = {
    id: `${(new Date()).valueOf()}`.slice(0, 5),
    service_name: "юкори аникликдаги ўлчаш воситасини киёслаш ГУВОҲНОМАСИ*",
    validity_period_year: 20,
    validity_period_day: 25,
    validity_period_month: "aprel",
    model_tools: "wadwdawdawdawdawd",
    document_title: "dawdawdawdawd",
    metrology_service_name: "sefefesfesfesf",
    instruments_owner: "DWadwdwad",
    measuring_instruments: "dwadawdawd",
    importing_country: "wadwdawdwa",
    parameters_measuring_instruments: "wadwdawdCVawdawdawdaw",
    parameters_measuring_instruments2: "",
    importing_naming_marking: "wadwdawdawdawdawdawdawd",
    compliance_with_requirements: "wadawdawdawdawd",
    compliance_with_requirements2: "",
    Comparison_date_year: 23,
    Comparison_date_day: 23,
    Comparison_date_month: "yanvar",
    leader: "awdawdawddawd",
    Scornful: "awdawdawdawda"
}