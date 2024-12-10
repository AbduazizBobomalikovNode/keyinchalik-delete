const jwt = require('jsonwebtoken');
const jwt_my_key = process.env.JWT_MY_KEY || "bu_dunyo_sinov_dunyo";

// let x = {
//     'user': ['get/user','get/device','get/role','get/all', 'add', 'uptade', 'delete'],
//     'role': ['get/role', 'get/all', 'add', 'uptade', 'delete'],
//     'task': ['get/task', 'get/user', 'get/device', 'get/all', 'add', 'uptade', 'delete'],
//     'device': ['get/device','get/all', 'add', 'uptade', 'delete'],
//     'history': ['get/history','get/device', 'get/all', 'add', 'uptade', 'delete']
// }
// let user = {
//     'task': ['get/task', 'get/user', 'get/device', 'get/all', 'add', 'uptade', 'delete']
// }



module.exports = async function (req, res, next) {
    const x_token = req.cookies['x-web-token'];
    if (!x_token) {
        console.log('cookies  ishlamadi');
        return res.send(`<script>setTimeout(()=>{window.location.href = '/login';},10);</script>`);
    }
    // console.log('cookies  ishladi:', x_token);
    let path_req = req.originalUrl.slice(0, req.originalUrl.lastIndexOf("/"));

    console.log(path_req);
    // return next();

    const token = req.cookies['x-web-token'];
    try {
        const expiredAt = jwt.decode(token).exp;
        const now = Math.floor(Date.now() / 1000);
        if (expiredAt < now) {
            console.log('Token yaroqsiz');
            return res.cookie("x-web-token", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            })
                .status(200)
                .send(`<script>setTimeout(()=>{window.location.href = '/login';},10);</script>`);
        }
        const user = jwt.verify(token, jwt_my_key);
        if (!user.rolePath.includes(path_req)) {
            console.log("no", user.rolePath, path_req);
            return res.cookie("x-web-token", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            })
                .status(200)
                .send(`<script>setTimeout(()=>{window.location.href = '/login';},10);</script>`);
        }

        // console.log("addConfig",user);
        req.user = user;
        addConfig(req);

        return next();
    } catch (err) {
        console.log(err);
        return res.send(`<script>setTimeout(()=>{window.location.href = '/login';},1);</script>`);
    }
}






function addConfig(req) {
    // console.log(req.user);
    try {
        let bolimlar = {
            update: false,
            deletes: false,
            deletesAll: false,
            add: false,
            view: false,
            role: false,
            user: false,
            certifcate: false,
            task: false,
            activeDocumentUpdate: false,
            activeDocumentDelete: false,
            activeDocumentCheck: false,
            activeDocumentCreate: false
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
        console.log("certifcate", req.originalUrl.includes("/certifcate"))
        if (req.originalUrl.includes("/certifcate")) {
            if (req.user.rolePath.includes("/certifcate/update")) {
                bolimlar.update = true;
            }
            if (req.user.rolePath.includes("/certifcate/delete")) {
                bolimlar.deletes = true;
            }
            if (req.user.rolePath.includes("/certifcate/all/delete")) {
                bolimlar.deletesAll = true;
            }
            if (req.user.rolePath.includes("/certifcate/add")) {
                bolimlar.add = true;
            }
        }
        console.log("role", req.originalUrl.includes("/role"))
        if (req.originalUrl.includes("/role")) {
            if (req.user.rolePath.includes("/role/update")) {
                bolimlar.update = true;
            }
            if (req.user.rolePath.includes("/role/delete")) {
                bolimlar.deletes = true;
            }
            if (req.user.rolePath.includes("/role/all/delete")) {
                bolimlar.deletesAll = true;
            }
            if (req.user.rolePath.includes("/role/add")) {
                bolimlar.add = true;
            }
            if (req.user.rolePath.includes("/role/view")) {
                bolimlar.view = true;
            }
        }
        if (req.originalUrl.includes("/user")) {
            if (req.user.rolePath.includes("/user/update")) {
                bolimlar.update = true;
            }
            if (req.user.rolePath.includes("/user/delete")) {
                bolimlar.deletes = true;
            }
            if (req.user.rolePath.includes("/user/all/delete")) {
                bolimlar.deletesAll = true;
            }
            if (req.user.rolePath.includes("/user/add")) {
                bolimlar.add = true;
            }
            if (req.user.rolePath.includes("/user/view")) {
                bolimlar.view = true;
            }
        }

        if (req.user.rolePath.includes("/document")) {
            bolimlar.view = true;
        }
        if (req.user.rolePath.includes("activeDocumentUpdate")) {
            bolimlar.activeDocumentUpdate = true;
        }
        if (req.user.rolePath.includes("activeDocumentDelete")) {
            bolimlar.activeDocumentDelete = true;
        }
        if (req.user.rolePath.includes("activeDocumentCheck")) {
            bolimlar.activeDocumentCheck = true;
        }
        if (req.user.rolePath.includes("activeDocumentCreate")) {
            bolimlar.activeDocumentCreate = true;
        }

        const searchString = req.user.role.toLowerCase();
        const keywords = ["admin", "direktor"];

        const found = keywords.some(keyword => searchString.includes(keyword));
        req.user.found = found;

        req.user.checker = searchString.includes("boshlig'i");
        // console.log("bolimlar :",bolimlar,req.user.rolePath)
        return req.user.bolimlar = bolimlar;
    } catch (error) {
        console.error(error.message)
    }
}
