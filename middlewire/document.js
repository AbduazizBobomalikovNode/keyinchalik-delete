const jwt = require('jsonwebtoken');
const jwt_my_key = process.env.JWT_MY_KEY || "bu_dunyo_sinov_dunyo";
var db = require('../db/mongodb');

setInterval(async () => { db = await db }, 100);

module.exports = async (req, res, next) => {
    console.log(req.url);
    const token = req.cookies['x-web-token'];
    // console.log(token);
    let re_ = await (await db).certificate.getCertificateObj({ link: `/documents${req.url}` });
    let documents = re_.length>0?re_: await (await db).certificate.getCertificateObj({ ilova_link: `/documents${req.url}` });
    console.log(documents,`/documents${req.url}`);
    if (documents.length < 1) {
        return res.render('public/pages/erors/not-active');
    } else {
        try {
            const user = jwt.verify(token, jwt_my_key);
            if (user || documents[0].status) {
                return next();
            }
            return res.render('public/pages/erors/not-active');
        } catch (err) {
            if (documents[0].status) {
                return next();
            }
            console.log(err);
            return res.render('public/pages/erors/not-active');
        }
    }
    return next();
}