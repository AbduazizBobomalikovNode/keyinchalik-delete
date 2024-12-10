const express = require("express");
const router = express.Router();

var db = require('../db/mongodb');
var generateId = require('../resurs/functions/getid');
const validate = require("../resurs/validate/device");
var auth = require("../middlewire/auth");


setTimeout(async () => { db = await db }, 100);

router.get("/get/file/:id", auth, async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }
    let file = await (await db).file.getFile(id);
    if (!file) {
        return res.status(404).json({ error: 'ushbu idga mos file to\'pilmadi!' });
    }
    res.json(
        file
    );
})



router.get('/get/all', auth, async (req, res) => {
    let file = await (await db).file.getFileAll();
    res.json(
        file
    );
})

router.post('/add', auth, async (req, res) => {
    const { error } = validate(req.body, "add");
    if (error) {
        return res.status(400).send(error.details[0].message)
    }
    let body = req.body;
    let file_int = await (await db).file.getFileObj({ ...body });
    if (file_int.length > 0) {
        return res.status(400).json({ error: 'ushbu  qiymatlar allaqachon kritilgan' });
    }
    let file = {
        id: generateId(),
        ...body
    }

    let result = await (await db).file.getFile(file);
    if (result.hasOwnProperty('error')) {
        return res.status(400).json(
            result
        );
    }
    // console.log(result);
    res.json(
        file
    );
})

router.put('/update/:id', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message)
    }
    let body = req.body;

    let id = parseInt(req.params.id);

    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }

    if (!body) {
        return res.status(400).json({ error: 'no\'tog\'ri so\'rov. bosh qiymat yuborilgan.' });
    }

    if (body.hasOwnProperty("id")) {
        return res.status(400).json({ error: 'id qiymatini o\'zgartirib bo\'lmaydi.' });
    }



    let file = await (await db).file.getFile(id);
    if (!file) {
        return res.status(404).json({ error: 'ushbu idga mos qurilma to\'pilmadi!' });
    }
    
    // if (body.hasOwnProperty("name")) {
    //     let device_int = await (await db).device.getDeviceObj({ ...body });
    //     if (device_int.length > 0 && device.name != device_int.name) {
    //         return res.status(400).json({ error: 'ushbu  qiymatlar allaqachon kritilgan' });
    //     }
    // }

    // if (body.hasOwnProperty("token")) {
    //     let device_int = await (await db).device.getDeviceObj({ ...body });
    //     if (device_int.length > 0 && device.token != device_int.token) {
    //         return res.status(400).json({ error: 'ushbu  qiymatlar allaqachon kritilgan' });
    //     }
    // }



    let result = await (await db).file.update(id, file);
    if (result.hasOwnProperty('error')) {
        return res.status(400).json(
            result
        );
    }
    res.json(
        result
    );
})

router.delete('/delete/:id', auth, async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }

    let file = await (await db).file.getFile(id);
    if (!file) {
        return res.status(404).json({ error: 'ushbu idga mos qurilma to\'pilmadi!' });
    }

    let result = await (await db).file.delete(id);
    res.json(
        file
    );
})

module.exports = router;