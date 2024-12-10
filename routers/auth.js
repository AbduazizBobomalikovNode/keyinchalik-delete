const express = require('express');
const bcrypt = require('bcrypt');
const Auth = express.Router();
const jwt = require('jsonwebtoken');
const action = require("../resurs/functions/action");

const jwt_my_key = process.env.JWT_MY_KEY || "bu_dunyo_sinov_dunyo";
var db = require('../db/mongodb');

setInterval(async () => { db = await db }, 100);

Auth.get('/', async (req, res) => {
    const x_token = req.cookies['x-web-token'];
    if (!x_token) {
        return res.render('public/pages/login');
    }
    res.send(`<!DOCTYPE html><head> <script>setTimeout(()=>{window.location.href = '/';},50);</script></head><body></body></html>`);
})

Auth.post('/', async (req, res) => {
    const auth = req.body;
    console.log("body : ", auth);

    if (auth.hasOwnProperty('login') && auth.hasOwnProperty('password')) {
        let user = await (await db).user.getUserForObj({ phone: auth.login });
        if (!user || user.length < 1) {
            user = await (await db).user.getUserForObj({email: auth.login });
        }
        console.log(user)
        if (user.length < 1) {
            return res.render('public/pages/login', { error: "parol yoki login  xato!." });
        }
        const role = await (await db).role.getRole(user[0].idrole);
        if (!role) {
            return res.render('public/pages/login', { error: "o'chirilgan hisob!." });
        }
        // user[0].licence = JSON.parse(`${role.licence}`.replaceAll("'", '"'));;
        // console.log(role)
        user[0].role = role.name;
        user[0].degree = parseInt(role.degree);
        let array = await (await db).RHT.getRHTRole(user[0].idrole);
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            try {
                array[index] = (await (await db).task.getTask(element.idtask)).path;
            } catch (error) {
                console.log("task  tozalandi :",element);
                await (await db).RHT.delete(element.id);
            }
        }
        user[0].rolePath = array.join();
        user[0].exp = Math.floor(Date.now() / 1000) + 60*60*3;
        let pas_flag =auth.password == user[0].password || await bcrypt.compare(auth.password, user[0].password);
        // console.log('pas', pas_flag, user[0].rolePath);
        action({
            user: user[0].name,
            module: "Login",
            description: `tizimga kirdi!`
        });
        // console.log(user);
        if (user[0] && pas_flag) {
            const token = jwt.sign({ ...user[0] }, jwt_my_key);
            if (user[0]) {
                return res
                    .cookie("x-web-token", token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                    })
                    .status(200)
                    .send(`<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title> REAL  ELECTRONICS  MChJ</title>
                        <script>
                            setTimeout(()=>{window.location.href = '/';},1000);
                        </script>
                        <style>
                        body{
                            background-color:black;
                        }
                        .center{
                            width: fit-content;
                            height: fit-content;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%,-50%);
                            display: flex;
                        }
                        .left,.right,.left_right{
                            margin-left: 5vw;
                            width: fit-content;
                            height: fit-content;
                        }
                        .right{
                            padding-top: 8vh;
                        }
                        .loader {
                            width: 84px;
                            height: 84px;
                            position: relative;
                            overflow: hidden;
                          }
                          .loader:before , .loader:after {
                            content: "";
                            position: absolute;
                            left: 50%;
                            bottom: 0;
                            width:64px;
                            height: 64px;
                            border-radius: 50%;
                            background:#FFF;
                            transform: translate(-50% , 100%)  scale(0);
                            animation: push 2s infinite ease-in;
                          }
                          .loader:after {
                          animation-delay: 1s;
                          }
                          @keyframes push {
                              0% {
                                transform: translate(-50% , 100%)  scale(1);
                              }
                              15% , 25%{
                                transform: translate(-50% , 50%)  scale(1);
                              }
                            50% , 75% {
                                transform: translate(-50%, -30%) scale(0.5);
                              }
                            80%,  100% {
                                transform: translate(-50%, -50%) scale(0);
                              }
                          }                    
                        </style>
                    </head>
                    <body>
                        <div class="center"> 
                            <div class="left">
                                <span class="loader"></span>
                            </div>
                        </div>
                    </body>
                    </html>`);
            }
        } else {
            return res.render('public/pages/login', { error: "parol yoki login  xato!." });
        }
    } else {
        return res.render('public/pages/login', { error: "parol yoki login  xato!." });
    }
});

module.exports = Auth;



