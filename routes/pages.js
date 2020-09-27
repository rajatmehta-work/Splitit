const { reject } = require("async");
const express = require("express");
const { cookie } = require("express-validator");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const notifi = require("../controllers/notify");
const { resolve } = require("path");
const { captureRejectionSymbol } = require("events");
const { createBrotliCompress } = require("zlib");
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_pass,
});

const router = express.Router();
router.get("/", middleware, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
        if (err) {
            console.log("en");
            res.render("index");
        } else {
            console.log("ohhh ye ky")
            res.redirect("Dashboard");
        }
    });
});
router.get("/login", (req, res) => {
    console.log("er");
    res.render("login");
});
router.get("/signup", (req, res) => {
    res.render("signup");
});
router.get("/settleup", middleware, (req, res) => {
    console.log("enter in settle page")
    jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
        if (err) {
            console.log("Error in jwt.veryfy");
            return res.render("login");
        } else {
            var today = new Date();
            const currUserId = jwt.verify(req.headers.cookie.split("=")[1], process.env.JWT_SECRET).id

            const promisekr = new Promise((resolve, reject) => {
                db.query("select sum(case when amount>=0 then amount else 0 end) as owe  from sp_bkaya where uid =?", currUserId, (err, res) => {
                    if (err) throw err;

                    resolve(res[0].owe);

                })
            }).then(owe => {
                if (owe === null)
                    owe = 0;
                else {
                    owe = owe.toFixed(2)
                }
                db.query("select friends from sp_users where id=?", currUserId, (err, result) => {
                    if (err) throw err;
                    if (result[0].friends == null) {

                        res.render("settleup", {
                            date: today,
                            alertForSettleUp: req.query.alertForSettleUp,
                        })
                    }
                    else {
                        const finalList = []
                        const templistOfFriends = result[0].friends.split(",");
                        templistOfFriends.forEach((element) => {
                            finalList.push({

                                id: element.split(":")[0],
                                name: element.split(":")[1],
                            });
                        });

                        res.render("settleup", {
                            alertForSettleUp: req.query.alertForSettleUp,
                            friendsList: finalList,
                            owe,
                            date: today
                        })


                    }



                })

            }).catch(err => {
                console.log(err);
            })


        }
    });
});
router.get("/addgroup", middleware, (req, res) => {
    console.log("Add Group");
    jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
        if (err) {
            console.log("Error in jwt.veryfy");
            return res.redirect("login");
        } else {
            const currUserId = jwt.verify(
                req.headers.cookie.split("=")[1],
                process.env.JWT_SECRET
            ).id;
            db.query(
                "select friends from sp_users where id=?",
                [currUserId],
                (err, result) => {
                    if (err) console.log(err);
                    else {
                        console.log(result[0].friends);
                        const finalList = [];
                        if (result[0].friends !== null) {
                            const templistOfFriends = result[0].friends.split(",");
                            templistOfFriends.forEach((element) => {
                                finalList.push({
                                    id: element.split(":")[0],
                                    name: element.split(":")[1],
                                });
                            });
                            res.render("addgroup", {
                                message: req.query.message,
                                finalList: finalList,
                                alertForGroup: req.query.alertForGroup,
                            });
                        } else {
                            res.render("addgroup", {
                                message: req.query.message,
                                NoFriends: "No Friends",
                                alertForGroup: req.query.alertForGroup,
                            });
                        }
                    }
                }
            );
        }
    });
});
router.get("/addexpenses", middleware, (req, res) => {
    console.log("enter in addExpenses");

    if (req.query.selectedGroupId === undefined) {
        res.redirect("Dashboard?selectGroup=" + "Please Select Group");
    } else {
        // all content which i have to show to add expenses when click on add expenses dashboard will be handle here
        // like showing date which gruoup i selected willl be handle gherere

        res.render("addexpenses", {
            groupId: req.query.selectedGroupId,
        });
    }
});
router.get("/account", middleware, (req, res) => {
    console.log("enter in account")
    jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
        if (err) {
            console.log("Error in jwt.veryfy");
            return res.sendStatus(404);
        } else {
            const currUserId = jwt.verify(req.headers.cookie.split("=")[1], process.env.JWT_SECRET).id;

            const p1 = new Promise((resolve, reject) => {
                db.query("select id,name,email,friends,group_ids from sp_users where id=?", currUserId, (err, res) => {
                    if (err) throw err;

                    resolve(res[0]);
                })
            });
            const p2 = new Promise((resolve, reject) => {
                db.query("select count(uid) as Reqcount from sp_friend_requests where uid=? ", currUserId, (err, ress) => {
                    if (err) throw err;
                    resolve(ress[0])
                })

            });
            const p3 = new Promise((resolve, reject) => {
                db.query("select count(id) as Transcount from sp_transaction where uid=?", currUserId, (err, res) => {
                    resolve(res[0])
                })
            })

            const query3 = "select sum(case when amount>=0 then 0 else amount end)as  owed,sum(case when amount>=0 then amount else 0 end) as owe from sp_bkaya  where uid =?";
            const p4 = new Promise((resolve, reject) => {
                db.query(query3, currUserId, (err, res) => {
                    var owe = 0;
                    var owed = 0;
                    if (res[0].owe !== null) {
                        owe = res[0].owe.toFixed(2);

                    }
                    if (res[0].owed !== null) {
                        owed = -res[0].owed;
                        owed = owed.toFixed(2);
                    }
                    resolve([owe, owed]);
                })
            })


            Promise.all([p1, p2, p3, p4]).then((value) => {
                console.log(value)
                var totalFriends, totalGroup, totalRequests, totalRequests, totalTransactions
                if (value[0].friends !== null) {
                    totalFriends = value[0].friends.split(",").length
                }
                else {
                    totalFriends = 0;
                }
                if (value[0].group_ids !== null) {
                    totalGroup = value[0].group_ids.split(",").length;
                }
                else {
                    totalGroup = 0
                }
                if (value[1].Reqcount !== null) {
                    totalRequests = value[1].Reqcount;
                }
                else {
                    totalRequests = 0
                }
                if (value[2].Transcount !== null) {
                    totalTransactions = value[2].Transcount;
                }
                else {
                    totalTransactions = 0
                }

                const owe = value[3][0]
                const owed = value[3][1]
                return res.render("account", {
                    imageId: value[0].id,
                    name: value[0].name,
                    email: value[0].email,
                    friends: totalFriends,
                    groups: totalGroup,
                    friendsRequests: totalRequests,
                    totalTransactions,
                    totalBalance: (owed - owe).toFixed(2),
                    owe,
                    owed

                })
            })





        }
    });
});
function middleware(req, res, next) {
    const authHeader = req.headers.cookie;
    // console.log(aut  hHeader)
    if (authHeader) {
        console.log("User entered");
        req.token = authHeader.split("=")[1];
    } else {
        console.log("Something Wrong in fetched Cookie");
    }
    next();
}
router.get("/Dashboard", middleware, notifi.showNotifications);

module.exports = router;
