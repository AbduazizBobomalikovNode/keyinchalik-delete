const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.URI_MONGO ? process.env.URI_MONGO : 'mongodb+srv://onetech:onetech@cluster0.mt7d1kk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

var db = null;
const role = require("./tables/role");
const user = require("./tables/user");
const task = require("./tables/task");
const RHT = require("./tables/role_has_task");
const certificate = require("./tables/certificate");
const file = require("./tables/file");
const action = require("./tables/action");
const statik = require("./tables/static");

const collections = ['certificate', 'file'];
const DB_NAME = "test_re_metrologiya";

class Db {
    constructor() {
        this.buffer = (async function () {
            await client.connect();
            db = await client.db(DB_NAME);
            console.log("bazaga ulanish hosil qilindi");
            // await sxema(db);

            const self = {
                role: new role(db.collection("role")),
                user: new user(db.collection("user")),
                task: new task(db.collection("task")),
                RHT: new RHT(db.collection("role_has_task")),
                certificate: new certificate(db.collection("certificate")),
                file: new file(db.collection("file")),
                action: new action(db.collection("action")),
                static: new statik(db.collection("static")),
                getUserCertificates: async (username, count) => {
                    try {
                        // 1. Foydalanuvchini username bo'yicha topamiz
                        const user = await db.collection('user').findOne({ name: { $regex: username, $options: 'i' } });

                        if (!user) {
                            throw new Error('Foydalanuvchi topilmadi'); // Agar foydalanuvchi topilmasa, xato
                        }

                        const userId = user._id; // Topilgan foydalanuvchining ID sini olish

                        if (count) {
                            return await db.collection('certificate').countDocuments({ iduser: userId });
                        }

                        // 2. Foydalanuvchiga tegishli certificate larni qidiramiz
                        const certificates = await db.collection('certificate').find({ iduser: userId }).toArray();

                        return certificates; // Certificate larni qaytarish
                    } catch (error) {
                        console.error("Xato:", error.message);
                        return count ? 0 : [];
                    }
                },
                searchInAllCollectionsCount: async (searchTerm, mustOBJ = []) => {
                    if (searchTerm.trim().length == 0 && mustOBJ.length == 0) {
                        return db.collection("certificate").countDocuments({});
                    }

                    // Har bir kolleksiya uchun qidiruv so'rovlarini tayyorlash
                    const searchQueries = await Promise.all(collections.map(async (collection) => {
                        const doc = await db.collection(collection).findOne({}, {
                            projection: { _id: 0, lastModified: 0, status: 0, link: 0, url: 0 }
                        }); // Birinchi hujjatni olish
                        if (!doc) return null; // Agar hujjat mavjud bo'lmasa, null qaytarish

                        // Ustunlar nomlarini olish
                        const fields = Object.keys(doc);

                        // searchTerm ni bo'sh yoki bo'sh joylar bilan cheklanganligini tekshirish
                        let yourQuery = {};
                        if (searchTerm && searchTerm.trim()) {
                            const searchTerms = searchTerm.trim().split(/\s+/);  // Bo'sh joylarga bo'linadi

                            // Har bir so'z va har bir maydon uchun bitta katta $or sharti yaratish
                            yourQuery = {
                                $or: searchTerms.flatMap(term => (
                                    fields.map(field => ({
                                        [field]: { $regex: term, $options: 'i' }
                                    }))
                                ))
                            };
                        }

                        // Majburiy shartlarni qo'shish
                        if (mustOBJ.length > 0) {
                            if (Object.keys(yourQuery).length > 0) {
                                // Agar qidiruv so'rovi allaqachon mavjud bo'lsa, $and bilan majburiy shartlarni qo'shish
                                yourQuery = {
                                    $and: [
                                        yourQuery, // Qidiruv shartlari
                                        ...mustOBJ // Majburiy shartlar
                                    ]
                                };
                            } else {
                                // Faqat mustOBJ bilan qidirish
                                yourQuery = { $and: mustOBJ };
                            }
                        }

                        // Agar searchTerm ham mustOBJ ham bo'lmasa, natija null bo'lishi kerak
                        if (Object.keys(yourQuery).length === 0) {
                            return null;
                        }

                        return { collection, yourQuery }; // Kolleksiya va so'rovni qaytarish
                    }));

                    // Faqat haqiqiy so'rovlarni filtrlaymiz va ularni bajaramiz
                    const counts = await Promise.all(searchQueries.filter(Boolean).map(async ({ collection, yourQuery }) => {
                        return db.collection(collection).countDocuments(yourQuery); // Har bir so'rov bo'yicha natijalarni hisoblash
                    }));

                    // Natijalar sonini qo'shish
                    const totalCount = counts.reduce((acc, curr) => acc + curr, 0);

                    // Foydalanuvchi sertifikatlarini hisoblash
                    const userCount = await self.getUserCertificates(searchTerm, true);
                    return totalCount + userCount; // Umumiy natija sonini qaytarish
                },
                searchInAllCollections: async (searchTerm, mustOBJ = [], limit, skip, sort) => {
                    console.log("searchInAllCollections",searchTerm, mustOBJ, limit, skip, sort);
                    const branches = [];
                    if (sort && sort.length > 0) {
                        // Create branches based on the provided sort order
                        for (let index = 0; index < sort.length; index++) {
                            branches.push({ case: { $eq: ["$status", sort[index]] }, then: index + 1 });
                        }
                    } else {
                        // Default branches for consistent ordering when `sort` is not provided
                        branches.push(
                            { case: { $eq: ["$status", 0] }, then: 1 },
                            { case: { $eq: ["$status", 1] }, then: 2 },
                            { case: { $eq: ["$status", 2] }, then: 3 },
                            { case: { $eq: ["$status", 3] }, then: 4 }
                        );
                    }
                    // branches.forEach((elm)=>{console.log(elm)})
                    // console.log(branches,sort)
                    if (searchTerm.trim().length == 0 && mustOBJ.length == 0) {
                        const pipeline = [
                            {
                                $project: {
                                    son: 1, id: 1, type: 1, lang: 1, status: 1,
                                    date: 1, time: 1, employee: 1, data: 1, link: 1, url: 1,
                                    compare: 1, comply_with: 1, organization: 1,
                                    measuring_instrument_name:1,
                                    measuring_instrument_type:1,
                                    measuring_instrument_count:1,
                                    measuring_instrument_id:1,
                                    original_document_path:1,
                                    original_document_path_pdf:1,
                                    ilova_link:1,
                                    ilova_url:1,
                                    result: {
                                        $switch: {
                                            branches: branches,
                                            default: 0
                                        }
                                    }
                                }
                            }
                        ];
                        // // Hujjatlarni qidirish
                        // let query = db.collection("certificate").aggregate(
                        //     [
                        //         {
                        //             $project: {
                        //                 "son": 1,
                        //                 "status": {
                        //                     $switch: {
                        //                         branches: [
                        //                             { case: { $eq: [1, 0] }, then: 1 },
                        //                         ],
                        //                         default: "ok"
                        //                     }
                        //                 }
                        //             }

                        //         }
                        //     ]
                        // );

                        // Agar limit mavjud bo'lsa, $limit bosqichini qo'shamiz
                        // if (limit) {
                        //     pipeline.push({ $limit: limit });
                        // }

                        // // Agar skip mavjud bo'lsa, $skip bosqichini qo'shamiz
                        // if (skip) {
                        //     pipeline.push({ $skip: skip });
                        // }

                        // Natijalarni to'plash
                        // const results = await query.toArray();
                        const results = await db.collection("certificate").aggregate(pipeline).sort({ result: 1 }).skip(skip || 0).limit(limit || 15).toArray();

                        return results; // Natijalarni qaytarish
                    }
                    // searchPromises - har bir kolleksiya uchun so'rovni bajaramiz
                    const searchPromises = collections.map(async (collection) => {
                        const doc = await db.collection(collection).findOne({}, {
                            projection: { _id: 0, lastModified: 0 }
                        }); // Birinchi hujjatni olish
                        if (!doc) return []; // Agar hujjat mavjud bo'lmasa, bo'sh massiv qaytarish

                        // Ustunlar nomlarini olish
                        const fields = Object.keys(doc);

                        // Qidiruv so'rovi - searchTerm bo'sh yoki bo'sh joylar bilan cheklanganligini tekshirish
                        let yourQuery = {};
                        if (searchTerm && searchTerm.trim()) {
                            const searchTerms = searchTerm.trim().split(/\s+/);  // Bo'sh joylarga bo'linadi

                            // Har bir so'z va har bir maydon uchun bitta katta $or sharti yaratish
                            yourQuery = {
                                $or: searchTerms.flatMap(term => (
                                    fields.map(field => ({
                                        [field]: { $regex: term, $options: 'i' }
                                    }))
                                ))
                            };
                        }

                        // Majburiy shartlarni qo'shish
                        if (mustOBJ.length > 0) {
                            // Agar allaqachon $or mavjud bo'lsa, $and bilan birlashtirish
                            if (Object.keys(yourQuery).length > 0) {
                                yourQuery = {
                                    $and: [
                                        yourQuery,  // Qidiruv shartlari
                                        ...mustOBJ  // Majburiy shartlar
                                    ]
                                };
                            } else {
                                // Faqat mustOBJ bilan qidirish
                                yourQuery = { $and: mustOBJ };
                            }
                        }
                        const pipeline = [
                            { $match: yourQuery },
                            {

                                $project: {
                                    son: 1, id: 1, type: 1, lang: 1, status: 1,
                                    date: 1, time: 1, employee: 1, data: 1, link: 1, url: 1,
                                    compare: 1, comply_with: 1, organization: 1,
                                    measuring_instrument_name:1,
                                    measuring_instrument_type:1,
                                    measuring_instrument_count:1,
                                    measuring_instrument_id:1,
                                    original_document_path:1,
                                    original_document_path_pdf:1,
                                    

                                    result: {
                                        $switch: {
                                            branches: branches,
                                            default: 0
                                        }
                                    }
                                }
                            }
                        ];

                        // Hujjatlarni qidirish
                        let query = db.collection(collection).aggregate(pipeline).sort({ result: 1}).skip(skip || 0).limit(limit || 15);

                        // Natijalarni to'plash
                        const results = await query.toArray();
                        // console.log(results);
                        return results; // Natijalarni qaytarish
                    });

                    // Promise.all yordamida barcha kolleksiyalarni parallel qidirish
                    const results = await Promise.all(searchPromises);

                    // Natijalarni birlashtirish
                    const mergedResults = [].concat(...results);

                    // Foydalanuvchi sertifikatlarini olish
                    const userCertificates = await self.getUserCertificates(searchTerm);
                    mergedResults.push(...userCertificates); // Foydalanuvchi sertifikatlarini natijalarga qo'shish

                    return mergedResults; // Umumiy natijalarni qaytarish
                },

                getDatabaseMemoryUsage: async () => {
                    try {
                        // Bazadan xotira bandligi haqida ma'lumot olish
                        const stats = await db.stats();

                        // Umumiy xotira sarfini baytlarda olish
                        const storageSizeInBytes = stats.storageSize; // Xotira bandligi baytlarda

                        // Megabaytlarga aylantirish
                        const storageSizeInMB = storageSizeInBytes / (1024 * 1024); // 1 MB = 1024 * 1024 bytes

                        console.log(`'${DB_NAME}' bazasi uchun umumiy xotira sarfi: ${storageSizeInMB.toFixed(2)} MB`);
                        return storageSizeInMB; // Natijani megabaytlarda qaytarish
                    } catch (error) {
                        console.error('Xato:', error.message);
                        return 0;
                    }
                },
                close: function () {
                    client.close();
                }
            }
            return self;
        })();
    }
    async Main() {
        return this.buffer;
    }
}





module.exports = new Db().Main();


