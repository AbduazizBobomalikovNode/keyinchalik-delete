const express = require("express");
const router = express.Router();
var db = require('../db/mongodb');
var generateId = require("../resurs/functions/getid");
const validate = require("../resurs/validate/task");
var auth = require("../middlewire/auth");

setTimeout(async () => { db = await db }, 100);



router.get("/",  auth,async (req, res) => {
    let task = await (await db).task.getTaskAll();
    let tasks = await (await db).task.getTaskAllFilter(0,15);
    let bolimlar = {
        update: false,
        deletes: false,
        deletesAll:false,
        add: false,
        view: false,
        role: false,
        user: false,
        certifcate: false,
        task: false
    };
    if (req.user.rolePath.includes("/certifcate")) {
        bolimlar.certifcate = true;
    }
    if (req.user.rolePath.includes("/role")) {
        bolimlar.role = true;
    }
    if (req.user.rolePath.includes("/task")) {
        bolimlar.task = true;
    }
    if (req.user.rolePath.includes("/user")) {
        bolimlar.user = true;
    }
    if (req.user.rolePath.includes("/task/update")) {
        bolimlar.update = true;
    }
    if (req.user.rolePath.includes("/task/delete")) {
        bolimlar.deletes = true;
    }
    if (req.user.rolePath.includes("/task/all/delete")) {
        bolimlar.deletesAll = true;
    }
    if (req.user.rolePath.includes("/task/add")) {
        bolimlar.add = true;
    }
    if (req.user.rolePath.includes("/task/view")) {
        bolimlar.view = true;
    }
    res.render('public/pages/task',{
        path:'',
        tasks:tasks,
        count:task.length,
        page:1,
        ...bolimlar,
        user:req.user
    });
})

router.get("/view/:id",  auth,async (req, res) => {
    let id = Number(req.params.id);
    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.render('public/pages/erors/error-404',{
            status:404,
            error: 'ushbu idga mos vazifa to\'pilmadi!',
            path: '/task'
        });
    }
    let bolimlar = {
        role: false,
        user: false,
        certifcate: false,
        task: false
    };
    if (req.user.rolePath.includes("/certifcate")) {
        bolimlar.certifcate = true;
    }
    if (req.user.rolePath.includes("/role")) {
        bolimlar.role = true;
    }
    if (req.user.rolePath.includes("/task")) {
        bolimlar.task = true;
    }
    if (req.user.rolePath.includes("/user")) {
        bolimlar.user = true;
    }
    res.render('public/pages/view',{
        header:"Vazifa",
        data:task,
        back:'../',
        ...bolimlar,
        user:req.user
    });
})

router.get("/page/:page",  auth,async (req, res) => {
    let page = parseInt(req.params.page);
    if(!page){
        page = 1;
    }
    let task = await (await db).task.getTaskAll();
    let tasks = await (await db).task.getTaskAllFilter(page*15-15,15);
    let bolimlar = {
        update: false,
        deletes: false,
        deletesAll:false,
        add: false,
        view: false,
        role: false,
        user: false,
        certifcate: false,
        task: false
    };
    if (req.user.rolePath.includes("/certifcate")) {
        bolimlar.certifcate = true;
    }
    if (req.user.rolePath.includes("/role")) {
        bolimlar.role = true;
    }
    if (req.user.rolePath.includes("/task")) {
        bolimlar.task = true;
    }
    if (req.user.rolePath.includes("/user")) {
        bolimlar.user = true;
    }
    if (req.user.rolePath.includes("/task/update")) {
        bolimlar.update = true;
    }
    if (req.user.rolePath.includes("/task/delete")) {
        bolimlar.deletes = true;
    }
    if (req.user.rolePath.includes("/task/all/delete")) {
        bolimlar.deletesAll = true;
    }
    if (req.user.rolePath.includes("/task/add")) {
        bolimlar.add = true;
    }
    if (req.user.rolePath.includes("/task/view")) {
        bolimlar.view = true;
    }
    res.render('public/pages/task',{
        path:'../',
        tasks:tasks,
        count:task.length,
        page:page,
        ...bolimlar,
        user:req.user
    });
})

router.get("/get/task/:id",  auth,async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }
    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.status(404).json({ error: 'ushbu idga mos vazifa to\'pilmadi!' });
    }
    res.json(
        task
    ); 
})



router.get('/get/all',  auth,async (req, res) => {
    let task = await (await db).task.getTaskAll();
    res.json(
        task
    );
});

router.get('/add',  auth,async (req, res) => {
    let bolimlar = {
        role: false,
        user: false,
        certifcate: false,
        task: false
    };
    if (req.user.rolePath.includes("/certifcate")) {
        bolimlar.certifcate = true;
    }
    if (req.user.rolePath.includes("/role")) {
        bolimlar.role = true;
    }
    if (req.user.rolePath.includes("/task")) {
        bolimlar.task = true;
    }
    if (req.user.rolePath.includes("/user")) {
        bolimlar.user = true;
    }
    res.render('public/pages/tasks/add',{...bolimlar,user: req.user});
    // console.log(req.user);
    // const { error } = validate(req.body, "add");
    // if (error) {
    //     return res.render('public/pages/erors/error-404',{
    //         status:400,
    //         error: details[0].message,
    //         path: '/task'
    //     });
    // }
    // let body = req.body;

    // let tasks =await (await db).task.getTaskObj({...body});

    // if(tasks.length > 0){
    //     return res.render('public/pages/erors/error-404',{
    //         status:400,
    //         error: 'ushbu  qiymatlar allaqachon kritilgan',
    //         path: '/task'
    //     });
    // }
    
    // let task = {
    //     id: generateId(),
    //     ...body
    // };

    // let result = await (await db).task.addTask(task);
    // if (result.hasOwnProperty('error')) {
    //     return res.render('public/pages/erors/error-404',{
    //         status:400,
    //         error: JSON.stringify(result),
    //         path: '/task'
    //     });
    // }
    // console.log(result);

    // res.send(`<!DOCTYPE html>
    // <html lang="en">
    // <head>
    //     <meta charset="UTF-8">
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     <script>
    //         window.location.href = '/task';
    //     </script>
    // </head>
    // <body>
        
    // </body>
    // </html>`)
});

router.post('/add',  auth,async (req, res) => {
    // console.log(req.user);
    const { error } = validate(req.body, "add");
    if (error) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: error.details[0].message,
            path: '/task'
        });
    }
    let body = req.body;

    let tasks =await (await db).task.getTaskObj({...body});

    if(tasks.length > 0){
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'ushbu  qiymatlar allaqachon kritilgan',
            path: '/task'
        });
    }
    
    let task = {
        id: generateId(),
        ...body
    };

    let result = await (await db).task.addTask(task);
    if (result.hasOwnProperty('error')) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: JSON.stringify(result),
            path: '/task'
        });
    }
    // console.log(result);

    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
            window.location.href = '/task';
        </script>
    </head>
    <body>
        
    </body>
    </html>`)
    // console.log(req.user);
    // const { error } = validate(req.body, "add");
    // if (error) {
    //     return res.status(400).send(error.details[0].message)
    // }
    // let body = req.body;

    // let tasks =await (await db).task.getTaskObj({...body});

    // if(tasks.length > 0){
    //     return res.status(400).json({ error: 'ushbu  qiymatlar allaqachon kritilgan' });
    // }
    
    // let task = {
    //     id: generateId(),
    //     ...body
    // };

    // let result = await (await db).task.addTask(task);
    // if (result.hasOwnProperty('error')) {
    //     return res.status(400).json(
    //         result
    //     );
    // }
    // console.log(result);

    // res.json(
    //     task
    // );
});

router.get('/update/:id',  auth,async (req, res) => {
    let id = Number(req.params.id);
    if (!id) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
            path: '/task'
        });
    }

    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.render('public/pages/erors/error-404',{
            status:404,
            error: 'ushbu idga mos vazifa to\'pilmadi!',
            path: '/task'
        });
    }
    let bolimlar = {
        role: false,
        user: false,
        certifcate: false,
        task: false
    };
    if (req.user.rolePath.includes("/certifcate")) {
        bolimlar.certifcate = true;
    }
    if (req.user.rolePath.includes("/role")) {
        bolimlar.role = true;
    }
    if (req.user.rolePath.includes("/task")) {
        bolimlar.task = true;
    }
    if (req.user.rolePath.includes("/user")) {
        bolimlar.user = true;
    }
    res.render('public/pages/tasks/edit',{
        ...task,
        ...bolimlar,
        user:req.user
    });
});


router.post('/update/:id',  auth,async (req, res) => {
    const { error } = validate(req.body);
    if (error) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: error.details[0].message,
            path: '/task'
        });
    }
    let body = req.body;
    let id = Number(req.params.id);
    // console.log(body);
    if (!id) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
            path: '/task'
        });
    }

    if (!body) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'no\'tog\'ri so\'rov. bosh qiymat yuborilgan.',
            path: '/task'
        });
    }

    if (body.hasOwnProperty("id")) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'id qiymatini o\'zgartirib bo\'lmaydi.' ,
            path: '/task'
        });
    }

    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.render('public/pages/erors/error-404',{
            status:404,
            error: 'ushbu idga mos vazifa to\'pilmadi!',
            path: '/task'
        });
    }
    let result = await (await db).task.update(id, body);
    // console.log(result);
    if (result.hasOwnProperty('error')) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: JSON.stringify(result),
            path: '/task'
        });
    }
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
            window.location.href = '/task';
        </script>
    </head>
    <body>
        
    </body>
    </html>`)
});



router.put('/update/:id',  auth,async (req, res) => {
    const { error } = validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message)
    }
    let body = req.body;
    let id = Number(req.params.id);
    
    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }

    if (!body) {
        return res.status(400).json({ error: 'no\'tog\'ri so\'rov. bosh qiymat yuborilgan.' });
    }

    if (body.hasOwnProperty("id")) {
        return res.status(400).json({ error: 'id qiymatini o\'zgartirib bo\'lmaydi.' });
    }

    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.status(404).json({ error: 'ushbu idga mos vazifa to\'pilmadi!' });
    }
    let result = await (await db).task.update(id, body);
    if (result.hasOwnProperty('error')) {
        return res.status(400).json(
            result
        );
    }

    res.json(
        result
    );
});

router.get('/delete/:id', auth, async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'id xato berildi, id butun son qiymat bo\'lishi shart',
            path: '/task'
        });
    }
    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.render('public/pages/erors/error-404',{
            status:404,
            error: 'ushbu idga mos vazifa to\'pilmadi!',
            path: '/task'
        });
    }
    let result = await (await db).task.delete(id);
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
            window.location.href = '/task';
        </script>
    </head>
    <body>
        
    </body>
    </html>`)
});


router.get('/all/delete/:id', auth, async (req, res) => {
    let ids = (req.params.id.split('+')).map((el)=>{return parseInt(el)});
    if (!ids) {
        return res.render('public/pages/erors/error-404',{
            status:400,
            error: 'idlar xato berildi, idlar bo\'sh bo\'lmasligi shart',
            path: '/task'
        });
    }
    let tasks = [];
    for (let index = 1; index < ids.length; index++) {
        const element = ids[index];
        let task = await (await db).task.getTask(element);
        if (!task) {
            return res.render('public/pages/erors/error-404',{
                status:404,
                error: element + 'ushbu idga mos vazifa to\'pilmadi!',
                path: '/task'
            });
        }
        let result = await (await db).task.delete(element);
    }
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
            window.location.href = '/task';
        </script>
    </head>
    <body>
        
    </body>
    </html>`)
});

router.delete('/delete/:id', auth, async (req, res) => {
    let id = parseInt(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'id xato berildi, id butun son qiymat bo\'lishi shart' });
    }
    let task = await (await db).task.getTask(id);
    if (!task) {
        return res.status(404).json({ error: 'ushbu idga mos vazifa to\'pilmadi!' });
    }
    let result = await (await db).task.delete(id);
    res.json(
        task
    );
});

module.exports = router;
