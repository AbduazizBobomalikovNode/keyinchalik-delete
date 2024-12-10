var crypto = require('crypto');
const express = require("express");
const router = express.Router();

var db = require('../db/mongodb');
var generateId = require('../resurs/functions/getid');
const validate = require("../resurs/validate/certificate");
const { lang, doc_name } = require('../resurs/config/golobalVar');
const checkDocument = require("../resurs/functions/check_document")
const { balance_doc, formatDate } = require("../resurs/functions/doc_balanced");

var auth = require("../middlewire/auth");
var toPdf = require("../resurs/functions/pdf")
var toPdf_ilova = require("../resurs/functions/pdf1")
const formatDoc = require('../resurs/functions/formatDoc');
const action = require("../resurs/functions/action");
const fiil_up = require("../resurs/functions/fill_up");
const { unlinkSync } = require('fs');
const fs = require('fs');
const path = require('path');
const multer = require("multer");

// Multer yordamida faylni yuklash
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp/"); // Fayllarni saqlash manzili
  },
  filename: (req, file, cb) => {
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // console.log('Decoded Name:', decodedName);
    cb(null, Date.now() + "-" + decodedName); // Fayl nomini o'zgartirish
  },
});

const upload = multer({ storage: storage });

const uploadDir = path.join(__dirname, "../", 'temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



setTimeout(async () => { db = await db }, 100);//

router.post("/api/search", auth, async (req, res) => {
  // Req.body dan kelayotgan obyekt
  let obj = req.body;

  // Mustahkamlanadigan obyektlar ro'yxati (shartlar)
  let mustOBJ = [];

  // Maydonlar va ularning qiymatlarini avtomatik tekshirish
  if (req.user.found) {
    for (let key in obj) {
      if (obj[key] && obj[key] !== 'Hammasi' && obj[key] !== 0) {
        if (key == 'status') {
          mustOBJ.push({ [key]: (obj[key] - 1) });
        } else if (key != 'search') {
          if (key == 'doc') {
            mustOBJ.push({ type: obj[key] });
          } else
            mustOBJ.push({ [key]: obj[key] });
        }
      }
    }
  } else {
    mustOBJ.push({ employee: req.user.id });
    for (let key in obj) {
      if (obj[key] && obj[key] !== 'Hammasi' && obj[key] !== 0) {
        if (key == 'status') {
          mustOBJ.push({ [key]: (obj[key] - 1) });
        } else if (key != 'search') {
          if (key == 'doc') {
            mustOBJ.push({ type: obj[key] });
          } else
            mustOBJ.push({ [key]: obj[key] });
        }
      }

    }
  }

  console.log(req.body, mustOBJ);
  let count = await (await db).searchInAllCollectionsCount(req.body.search, mustOBJ);
  console.log(count);
  return res.json({
    count: count
  });
})
router.post('/api/results/:page', auth, async (req, res) => {
  let page = parseInt(req.params.page) || 1;
  let obj = req.body;

  // Mustahkamlanadigan obyektlar ro'yxati (shartlar)
  let mustOBJ = [];

  // Maydonlar va ularning qiymatlarini avtomatik tekshirish
  if (req.user.found) {
    for (let key in obj) {
      if (obj[key] && obj[key] !== 'Hammasi' && obj[key] !== 0) {
        if (key == 'status') {
          mustOBJ.push({ [key]: (obj[key] - 1) });
        } else if (key != 'search') {
          if (key == 'doc') {
            mustOBJ.push({ type: obj[key] });
          } else
            mustOBJ.push({ [key]: obj[key] });
        }
      }
    }
  } else {
    mustOBJ.push({ employee: req.user.id });
    for (let key in obj) {
      if (obj[key] && obj[key] !== 'Hammasi' && obj[key] !== 0) {
        if (key == 'status') {
          mustOBJ.push({ [key]: (obj[key] - 1) });
        } else if (key != 'search') {
          if (key == 'doc') {
            mustOBJ.push({ type: obj[key] });
          } else
            mustOBJ.push({ [key]: obj[key] });
        }
      }
    }
  }

  let employees = {};
  const users = await (await db).user.getUserAll();

  users.forEach(user => {
    employees[user.id] = user.name; // Kalit: user.id, Qiymat: user.name
  });
  console.log(req.body, mustOBJ, page - 1);

  const limit = 15;
  const startIndex = (page - 1) * limit;

  // searchInAllCollections va searchInAllCollectionsCount parallel ravishda bajariladi
  let [results, count] = [null, null];

  if (req.user.degree == 1) {
    isAdmin = true;
    let sort = [2, 1, 0, 3];
    [results, count] = await Promise.all([
      (await db).searchInAllCollections(req.body.search, mustOBJ, limit, startIndex, sort),
      (await db).searchInAllCollectionsCount(req.body.search, mustOBJ,)
    ]);
  } else if (req.user.degree == 2) {
    let sort = [1, 2, 0, 3];
    [results, count] = await Promise.all([
      (await db).searchInAllCollections(req.body.search, mustOBJ, limit, startIndex, sort),
      (await db).searchInAllCollectionsCount(req.body.search, mustOBJ,)
    ]);
  } else if (req.user.degree == 3) {
    let sort = [0, 1, 2, 3];
    mustOBJ.push({ employee: req.user.id });
    [results, count] = await Promise.all([
      (await db).searchInAllCollections(req.body.search, mustOBJ, limit, startIndex, sort),
      (await db).searchInAllCollectionsCount(req.body.search, mustOBJ)
    ]);
  }
  // console.log(results, count);

  res.render('public/pages/element/table', {
    data: results,
    lang: lang,
    doc_name: doc_name,
    bolimlar: req.user.bolimlar,
    employees: employees,
    totalResults: count,
    user: req.user,
    currentPage: page,
    totalPages: Math.ceil(count / limit)
  });
});
router.post('/api/check-document', auth, upload.single('document'), async (req, res) => {
  const document = req.file.path;
  console.log(req.file); // Fayl haqida ma'lumot



  let result = await checkDocument(document, ['{son}', 'Bayonnoma raqami:']);
  if (result) {
    const destinationPath = path.join('documents', path.basename(document));
    req.file.filename = destinationPath;
    res.send({ message: 'Fayl muvaffaqiyatli yuklandi!', file: req.file });
  } else {
    return res.status(422).send('Hujjat yaroqsiz!');
  }
  console.log(req.file, result); // Fayl haqida ma'lumot
});




router.get("/generation", auth, async (req, res) => {
  let files = await (await db).searchInAllCollections("", []);

  for (let index = 0; index < files.length; index++) {
    // await sleep(1000);
    var element = files[index];

    const fileName = element.link;
    const filePath = path.resolve(fileName);

    // Fayl mavjudligini tekshirish (asinxron)
    let fileExists = true;
    try {
      await fs.access(filePath, fs.constants.F_OK);
    } catch (err) {
      fileExists = false;
    }

    if (fileExists) {
      console.log(`Fayl mavjud: ${filePath}`);
    } else {
      let flag = element.status || false;

      // formatDoc funksiyasi haqiqiy ma'lumot qaytarayotganiga ishonch hosil qilish
      let result_format = formatDoc(element.data);
      if (!result_format) {
        console.error(`Xato: formatDoc element IDsi bilan noto'g'ri ma'lumot qaytardi: ${element.id}`);
        continue; // formatDoc noto'g'ri bo'lsa, keyingi elementga o'tadi
      }

      result_format.id = element.id;
      var name = generateId();
      var hash = crypto.createHash('md5').update(name + "").digest('hex');

      try {
        console.log("generation :", result_format, hash, __dirname, element.type, element.lang, flag);

        let result_pdf = await toPdf({ ...result_format }, hash, __dirname, element.type, element.lang, flag);

        if (!result_pdf) {
          console.log("Hujjatni tahrirlab bo'lmadi");
        } else {
          // Agar PDF muvaffaqiyatli yaratilgan bo'lsa, asl hujjatni o'chirish
          try {
            console.log("Faylni asinxron o'chirish uchun fs.promises.unlink")
            fs.unlinkSync(element.url); // Faylni asinxron o'chirish uchun fs.promises.unlink
          } catch (error) {
            console.error(`Faylni o'chirishda xato: ${element.url}`, error.message);
          }
        }

        const certificate = {
          link: result_pdf.link,
          url: result_pdf.url,
        };

        const result = await (await db).certificate.update(element.id, certificate);

        if (!result) {
          console.log("Hujjatni tahrirlab bo'lmadi");
        }
      } catch (error) {
        console.error("Xatolik:", error);
        // Docxtemplater xatolarini qayta ishlash
        if (error.properties && error.properties.id === 'filetype_not_identified') {
          console.error("Fayl turi aniqlanmadi. Fayl buzilgan yoki qo'llab-quvvatlanmaydi.");
        }
      }
    }
  }


  res.send(`<script> alert('generatsiya  qilindi'); window.location.href = '/certifcate'; </script>`);
});


router.get("/", auth, async (req, res) => {
  const limit = 0;
  const startIndex = 1 * limit;
  var docs = [], docs_count = 0;
  let isAdmin = false;


  console.log(await (await db).getDatabaseMemoryUsage()); // true

  // searchInAllCollections va searchInAllCollectionsCount parallel ravishda bajariladi
  if (req.user.degree == 1) {
    isAdmin = true;
    let sort = [2, 1, 0, 3];
    [docs, docs_count] = await Promise.all([
      (await db).searchInAllCollections("", [], limit, startIndex, sort),
      (await db).searchInAllCollectionsCount("", [])
    ]);
  } else if (req.user.degree == 2) {
    let sort = [1, 2, 0, 3];
    [docs, docs_count] = await Promise.all([
      (await db).searchInAllCollections("", [], limit, startIndex, sort),
      (await db).searchInAllCollectionsCount("", [])
    ]);
  } else if (req.user.degree == 3) {
    let sort = [0, 1, 2, 3];
    [docs, docs_count] = await Promise.all([
      (await db).searchInAllCollections("", [{ employee: req.user.id }], limit, startIndex, sort),
      (await db).searchInAllCollectionsCount("", [{ employee: req.user.id }])
    ]);
  }
  // console.log(docs, docs_count);
  // toPdf();
  // let id = (await (await db).role.getRoleForObj({ name: "Qiyoslovchi" }))[0].id;
  let employees = {};
  const users = await db.user.getUserAll();

  users.forEach(user => {
    employees[user.id] = user.name; // Kalit: user.id, Qiymat: user.name
  });
  // console.log(id,employee);
  // console.log(docs)
  // (await db).certificate.allDocUpdate();
  res.render('public/pages/certificate', {
    path: '',
    docs: docs,
    count: docs_count,

    filter_count: docs_count,
    page: 1,

    lang: lang,
    doc_name: doc_name,
    employees: employees,

    isAdmin: isAdmin,
    bolimlar: req.user.bolimlar,
    user: req.user
  });
})


// checked
// check

router.get("/check/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  certificate = {
    status: 1
  }

  let result = await (await db).certificate.update(id, certificate);
  res.send(`<script>window.location.href='/certifcate';</script>`);
});

router.get("/checked/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  certificate = {
    status: 2
  }

  let result = await (await db).certificate.update(id, certificate);
  res.send(`<script>window.location.href='/certifcate';</script>`);
});

router.get("/null/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  certificate = {
    status: 0
  }

  let result = await (await db).certificate.update(id, certificate);
  res.send(`<script>window.location.href='/certifcate';</script>`);
});

router.get("/active/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  let result_format = formatDoc(certifcate.data);
  // console.log("result_format : ",result_format);
  result_format.id = certifcate.id;
  var name = generateId();
  var hash = crypto.createHash('md5').update(name + "").digest('hex');
  let result_pdf = await toPdf({ ...result_format }, hash, __dirname, certifcate.type, certifcate.lang, true);

  if (!result_pdf) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: "Hujjatni  tahrirlab bo'lmadi",
      path: '/certifcate'
    });
  } else {
    try {
      unlinkSync(certifcate.url);
    } catch (error) {
      console.error(error);
    }
  }
  certificate = {
    link: result_pdf.link,
    status: 3
  }
  certificate.url = result_pdf.url;

  let result = await (await db).certificate.update(id, certificate);
  res.send(`<script>window.location.href='/certifcate';</script>`);
});

router.get("/back/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  certificate = {
    status: 1
  }

  let result = await (await db).certificate.update(id, certificate);
  res.send(`<script>window.location.href='/certifcate';</script>`);
});

router.get("/get/certificate/:id", auth, async (req, res) => {
  let id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
  }
  let certificate = await (await db).certificate.getCertificate(id);
  if (!certificate) {
    return res.status(404).json({ error: 'ushbu idga mos certificate to\'pilmadi!' });
  }
  res.json(
    certificate
  );
})




router.get('/get/all', auth, async (req, res) => {
  let certificate = await (await db).certificate.getCertificateAll();
  res.json(
    certificate
  );
})

router.get('/add', auth, async (req, res) => {
  res.render('public/pages/certifcate/add', { bolimlar: req.user.bolimlar, user: req.user });
})



router.post('/add', auth, upload.single('file'), async (req, res) => {
  // const { error } = validate(req.body, "add");
  // if (error) {
  //     return res.status(400).send(error.details[0].message)
  // }
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.log("body dagi faylni o'chirishda xatolik:", err);
    } else {
      console.log("o'chirildi " + req.file.path);
    }
  });
  let body = req.body;
  console.log("router body:", body);
  console.log(req.file);


  let result_format = formatDoc(body);

  let certificate = {
    ...result_format
  }
  let result_ = await (await db).certificate.getCertificateObj({ id: parseInt(body.ids) });
  if (parseInt(body.ids) && result_) {
    if (result_.length > 0) {
      certificate.id = parseInt(body.ids);
      certificate.son = result[0].son;
    } else {
      certificate.id = generateId();
      let raqami = await (await db).static.add(`doc${body.doc}`);
      // console.log("yaratilgan hujjat raqami :", raqami);
      certificate.son = raqami;
    }
  } else {
    certificate.id = generateId();
    let raqami = await (await db).static.add(`doc${body.doc}`);
    // console.log("yaratilgan hujjat raqami :", raqami);
    certificate.son = raqami;
  }

  var name = generateId();
  var hash = crypto.createHash('md5').update(name + "").digest('hex');
  let result_pdf = await toPdf(certificate, hash, __dirname, body.doc, body.lang);

  if (!result_pdf) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: "Hujjatni  yaratip bo'lmadi.",
      path: '/certifcate'
    });
  }
  const original_document_path_pdf = path.join(
    path.dirname(body.original_document_path),
    path.basename(body.original_document_path, path.extname(body.original_document_path)) + ".pdf"
  );
  console.log(original_document_path_pdf);
  certificate = {
    son: certificate.son,
    id: certificate.id,

    measuring_instrument_name: body.measuring_instrument_name,
    measuring_instrument_type: body.measuring_instrument_type,
    measuring_instrument_count: body.measuring_instrument_count,
    measuring_instrument_id: body.measuring_instrument_id,

    type: body.doc,
    lang: body.lang,
    status: 0,
    date: (new Date()).toLocaleString().slice(0, 10).replace(',', ''),
    time: (new Date()).toLocaleTimeString().slice(0, 5),
    employee: req.user.id,
    data: body,
    link: result_pdf.link,
    original_document_path: body.original_document_path,
    original_document_path_pdf: original_document_path_pdf,
    // original_document_path: body.original_document_path
  }
  certificate.url = result_pdf.url;
  if (req.user.degree == 1) {
    certificate.status = 2;
  }
  let add = fiil_up(body);
  if (add) {
    for (const key in add) {
      if (Object.hasOwnProperty.call(add, key)) {
        certificate[key] = add[key];
      }
    }
  }
  // console.log(certificate);
  let result = await (await db).certificate.addCertificate(certificate);
  if (result.hasOwnProperty('error')) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: result,
      path: '/certifcate'
    });
  }
  action({
    user: req.user.name,
    module: "Sertiftikatlar",
    description: `${certificate.id} sonli  hujjatni  qo'shishdi!`
  });
  (await db).static.add(1);
  res.render('public/pages/loading', { link: result_pdf.link });
})

router.get('/ilova/:id', auth, async (req, res) => {
  let id = Number(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }

  // Maqsad: `ln` bilan boshlanadigan elementlarni guruhlash
  let data = [];
  if (certifcate.ilova_data) {

    // `ln` bilan boshlanadigan kalitlarni guruhlash
    for (let [key, value] of Object.entries(certifcate.ilova_data)) {
      if (key.startsWith('ln')) {
        // `ln1`, `ln2` kabi qismlarni olish
        let [ln, n] = key.split('_');  // 'ln1' va 'n1'ni ajratish
        let index = parseInt(ln.replace('ln', '')) - 1; // ln1 -> 0, ln2 -> 1

        // Agar massivda kerakli indexdagi obyekt mavjud bo'lmasa, yaratish
        if (!data[index]) {
          data[index] = {};  // yangi obyekt yaratish
        }

        switch (n) {
          case 'n1':
            data[index][0] = { key: key, value: value }
            break;
          case 'n2':
            data[index][1] = { key: key, value: value };
            break;
          case 'n3':
            data[index][2] = { key: key, value: value };
            break;
          case 'n4':
            data[index][3] = { key: key, value: value };
            break;
          case 'n5':
            data[index][4] = { key: key, value: value };
            break;
        }
        // `n` bo'yicha qiymatni saqlash
      }
    }
    // console.log(data);
  }

  res.render('public/pages/certifcate/ilova', {
    bolimlar: req.user.bolimlar, user: req.user, lang: "uz", ...certifcate.ilova_data, data: data,id:certifcate.id
  });
});

router.post('/ilova/add', auth, async (req, res) => {
  let id = Number(req.body.id);
  console.log(req.body)
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  // console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  try {
    unlinkSync(certificate.ilova_url);
  } catch (error) {
    console.error(error);
  }
  console.log(req.body);
  let body = req.body;

  let format_json = { son: id };
  let dates = [formatDate(body.date1, body.lang), formatDate(body.date2, body.lang)];
  // console.log("dates :",dates);
  format_json.date1 = dates[0][0];
  format_json.date1_1 = dates[0][1];
  format_json.date1_2 = dates[0][2];
  format_json.date2 = dates[1][0];
  format_json.date2_1 = dates[1][1];
  format_json.date2_2 = dates[1][2];


  let line1demo = balance_doc(body.line1, 86);
  format_json.line1_start = line1demo[0];
  format_json.line1 = line1demo[1];
  format_json.line1_end = line1demo[2];

  let line2demo = balance_doc(body.line2, 86);
  format_json.line2_start = line2demo[0];
  format_json.line2 = line2demo[1];
  format_json.line2_end = line2demo[2];

  // Maqsad: `ln` bilan boshlanadigan elementlarni guruhlash
  let data = [];

  // `ln` bilan boshlanadigan kalitlarni guruhlash
  for (let [key, value] of Object.entries(body)) {
    if (key.startsWith('ln')) {
      // `ln1`, `ln2` kabi qismlarni olish
      let [ln, n] = key.split('_');  // 'ln1' va 'n1'ni ajratish
      let index = parseInt(ln.replace('ln', '')) - 1; // ln1 -> 0, ln2 -> 1

      // Agar massivda kerakli indexdagi obyekt mavjud bo'lmasa, yaratish
      if (!data[index]) {
        data[index] = {};  // yangi obyekt yaratish
      }

      switch (n) {
        case 'n1':
          data[index]["tr"] = value;
          break;
        case 'n2':
          data[index]["ov_nomi"] = value;
          break;
        case 'n3':
          data[index]["zavod_raqami"] = value;
          break;
        case 'n4':
          data[index]["olcham_chegarasi"] = value;
          break;
        case 'n5':
          data[index]["izoh"] = value;
          break;
      }
      // `n` bo'yicha qiymatni saqlash
    }
  }
  format_json.table = data;
  console.log(format_json);
  var name = generateId();
  var hash = crypto.createHash('md5').update(name + "").digest('hex');
  // let result_pdf = await toPdf(format_json, hash, "", "", "uz", true, true);
  // let result_pdf = await toPdf({ ...result_format }, hash, __dirname, body.doc, body.lang, flag);
  // console.log("result_pdf start : ",hash);
  let result_pdf = await toPdf_ilova(format_json, hash);
  // console.log("result_pdf end : ",result_pdf);
  if (!result_pdf) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: "Hujjatni  tahrirlab bo'lmadi",
      path: '/certifcate'
    });
  }
  let certifcate_ = {
    ilova_link: result_pdf.link,
    ilova_url: result_pdf.url,
    ilova_data: body
  }

  let result = await (await db).certificate.update(id, certifcate_);
  if (result.hasOwnProperty('error')) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: result,
      path: '/certifcate'
    });
  }
  res.render('public/pages/loading', { link: result_pdf.link });
  // res.render('public/pages/certifcate/ilova', {
  //    bolimlar: req.user.bolimlar, user: req.user,lang:"uz"
  // });
});

router.get('/download/:id', auth, async (req, res) => {
  let id = Number(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'ID noto‘g‘ri, u butun son bo‘lishi kerak!',
      path: '/certifcate'
    });
  }

  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'Ushbu ID ga mos sertifikat topilmadi!',
      path: '/certifcate'
    });
  }

  const filePath = certifcate.original_document_path;
  console.log(filePath, certifcate);
  if (!fs.existsSync(filePath)) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'Fayl topilmadi!',
      path: '/certifcate'
    });
  }

  res.download(filePath, 'protocol' + path.extname(filePath), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).render('public/pages/erors/error-404', {
        status: 500,
        error: 'Faylni yuklashda xatolik yuz berdi!',
        path: '/certifcate'
      });
    }
  });
});

router.get('/protocol/:id', auth, async (req, res) => {
  let id = Number(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  // console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }

  res.render('public/pages/certifcate/protocol', {
    bolimlar: req.user.bolimlar, user: req.user, ...certifcate
  });
});
router.get('/protocol/view/:id', auth, async (req, res) => {
  console.log(req.params);
  let body = req.body;
  let id = Number(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  // console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }

  const filePath = path.resolve(__dirname, '..', certifcate.original_document_path_pdf);

  // Faylni yuborish
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Xato yuz berdi:", err);
      return res.render('public/pages/erors/error-404', {
        status: err.status || 500,
        error: 'Faylni yuklashda xatolik yuz berdi.',
        path: '/certifcate'
      });
    }
  });
});
router.post('/protocol/update', auth, async (req, res) => {
  console.log(req.body);
  let body = req.body;
  let id = Number(req.body.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  // console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }


  const original_document_path_pdf = path.join(
    path.dirname(body.original_document_path),
    path.basename(body.original_document_path, path.extname(body.original_document_path)) + ".pdf"
  );
  console.log(original_document_path_pdf);
  certificate = {
    original_document_path: body.original_document_path,
    original_document_path_pdf: original_document_path_pdf
  }

  let result = await (await db).certificate.update(id, certificate);
  if (result.hasOwnProperty('error')) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: result,
      path: '/certifcate'
    });
    // return res.status(400).json(
    //   result
    // );
  }
  // action({
  //   user: req.user.name,
  //   module: "Sertiftikatlar",
  //   description: `${certificate.id} sonli  hujjatni  tahrirladi!`
  // });
  // (await db).static.add(2);
  const filePath = path.resolve(__dirname, '..', original_document_path_pdf);

  // Faylni yuborish
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Xato yuz berdi:", err);
      res.status(err.status || 500).send('Faylni yuklashda xatolik yuz berdi.');
    }
  });
});


router.get('/update/:id', auth, async (req, res) => {
  let id = Number(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  // console.log(certifcate);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos sertiftikat to\'pilmadi!',
      path: '/certifcate'
    });
  }


  res.render('public/pages/certifcate/edit', {
    ...certifcate, bolimlar: req.user.bolimlar, user: req.user
  });
});

router.post('/update/:id', auth, async (req, res) => {
  // const { error } = validate(req.body);
  // if (error) {
  //   return res.status(400).send(error.details[0].message)
  // }
  let body = req.body;

  let id = parseInt(req.params.id);

  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart!',
      path: '/certifcate'
    });
    // return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
  }

  if (!body) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'no\'tog\'ri so\'rov. bosh qiymat yuborilgan!',
      path: '/certifcate'
    });
    // return res.status(400).json({ error: 'no\'tog\'ri so\'rov. bosh qiymat yuborilgan.' });
  }

  if (body.hasOwnProperty("id")) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id qiymatini o\'zgartirib bo\'lmaydi!',
      path: '/certifcate'
    });
    // return res.status(400).json({ error: 'id qiymatini o\'zgartirib bo\'lmaydi.' });
  }

  let certificate = await (await db).certificate.getCertificate(id);
  if (!certificate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos certificate to\'pilmadi!',
      path: '/certifcate'
    });
    // return res.status(404).json({ error: 'ushbu idga mos certificate to\'pilmadi!' });
  }
  // console.log("certificate : ",certificate);

  let flag = false;
  if (certificate.status) {
    flag = true;
  }
  let result_format = formatDoc(body);
  // console.log("result_format : ",result_format);
  result_format.id = certificate.id;
  var name = generateId();
  var hash = crypto.createHash('md5').update(name + "").digest('hex');
  let result_pdf = await toPdf({ ...result_format }, hash, __dirname, body.doc, body.lang, flag);

  if (!result_pdf) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: "Hujjatni  tahrirlab bo'lmadi",
      path: '/certifcate'
    });
  } else {
    try {
      unlinkSync(certificate.url);
    } catch (error) {
      console.error(error);
    }
  }
  certificate = {
    measuring_instrument_name: body.measuring_instrument_name,
    measuring_instrument_type: body.measuring_instrument_type,
    measuring_instrument_count: body.measuring_instrument_count,
    measuring_instrument_id: body.measuring_instrument_id,
    data: body,
    link: result_pdf.link,
  }
  certificate.url = result_pdf.url;
  let add = fiil_up(body);
  if (add) {
    for (const key in add) {
      if (Object.hasOwnProperty.call(add, key)) {
        certificate[key] = add[key];
      }
    }
  }
  let result = await (await db).certificate.update(id, certificate);
  if (result.hasOwnProperty('error')) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: result,
      path: '/certifcate'
    });
    // return res.status(400).json(
    //   result
    // );
  }
  action({
    user: req.user.name,
    module: "Sertiftikatlar",
    description: `${certificate.id} sonli  hujjatni  tahrirladi!`
  });
  // (await db).static.add(2);
  res.render('public/pages/loading', { link: result_pdf.link });
});

router.get('/delete/:id', auth, async (req, res) => {
  let id = parseInt(req.params.id);
  if (!id) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
      path: '/certifcate'
    });
  }
  let certifcate = await (await db).certificate.getCertificate(id);
  if (!certifcate) {
    return res.render('public/pages/erors/error-404', {
      status: 404,
      error: 'ushbu idga mos Hujjat to\'pilmadi!',
      path: '/certifcate'
    });
  }
  let result = await (await db).certificate.delete(id);
  try {
    unlinkSync(certifcate.url);
  } catch (error) {
    console.error(error);
  }
  action({
    user: req.user.name,
    module: "Sertiftikatlar",
    description: `${id} sonli  hujjatni  o'chirdi!`
  });
  (await db).static.add(3);
  res.send(`<script> window.location.href = '/certifcate'; </script>`)
});

router.get('/all/delete/:id', auth, async (req, res) => {
  let ids = (req.params.id.split('+')).map((el) => { return parseInt(el) });
  // console.log(ids, req.params.id);
  if (!ids) {
    return res.render('public/pages/erors/error-404', {
      status: 400,
      error: 'idlar bo\'sh berildi, idlar bo\'sh bo\'lmasligi shart',
      path: '/certifcate'
    });
  }
  let roles = [];
  for (let index = 1; index < ids.length; index++) {
    const element = ids[index];
    (await db).static.add(3);
    let certificate = await (await db).certificate.getCertificate(element);
    if (!certificate) {
      continue;
    }
    let result = await (await db).certificate.delete(element);
    try {
      unlinkSync(certificate.url);
    } catch (error) {
      console.error(error);
    }
  }
  action({
    user: req.user.name,
    module: "Sertiftikatlar",
    description: `${ids.length - 1} ta   hujjatni  o'chirdi!`
  });
  res.send(`<script> window.location.href = '/certifcate'; </script>`)
});


router.delete('/delete/:id', auth, async (req, res) => {
  let id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
  }
  let certificate = await (await db).certificate.getCertificate(id);
  if (!certificate) {
    return res.status(404).json({ error: 'ushbu idga mos certificate to\'pilmadi!' });
  }
  let result = await (await db).certificate.delete(id);
  res.json(
    certificate
  );
});




module.exports = router;