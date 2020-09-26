const jwtDecode = require("jwt-decode");
const sql = require("mysql");
const jwt = require("jsonwebtoken");
const bcry = require("bcryptjs");
const path = require("path");
const { check, validationResult } = require("express-validator");
const { resolve } = require("path");
const { reject, sortBy } = require("async");
const { group } = require("console");
const e = require("express");
const { send } = require("process");

const db = sql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
});
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("eanjkl");
    db.query(
        "SELECT name,email,password,id from sp_users  where email=?",
        [email],
        async (error, result) => {
            if (error) {
                console.log(error);
            } else {
                if (!password || !email) {
                    return res.status(400).render("login", {
                        message: "Please enter the password or email",
                    });
                }

                if (result.length < 1) {
                    return res.status(400).render("login", {
                        message: "Email is not Registered",
                    });
                }
                if (result.length == 1) {
                    if (!(await bcry.compare(password, result[0].password))) {
                        // console.log(password);
                        // console.log(result[0].password);
                        return res.status(401).render("login", {
                            message: "Password is not Correct",
                        });
                    } else {
                        // console.log(result[0])
                        const id = result[0].id;
                        const namee = result[0].name;
                        const token = jwt.sign(
                            { id, namee },
                            process.env.JWT_SECRET,
                            {
                                expiresIn: process.env.JWT_expiresIn,
                            }
                        );
                        // console.log(token);
                        const cookieOptions = {
                            expires: new Date(Date.now() + 60 * 60 * 60 * 60),
                            httpOnly: true,
                        };
                        // console.log(Date.now())
                        // cookie(typeof token,generatedToken,cookieOption)
                        res.cookie("jwt", token, cookieOptions);
                        res.status(200).redirect("../Dashboard");
                    }
                } else {
                    return res.render("login", () => {
                        message: "Email is not correct";
                    });
                }
            }
        }
    );
};
exports.signup = (req, res) => {
    const { name, email, password, passwordComfirm } = req.body;
    console.log(req.body);
    // db.query("SELECT name from sp_users WHERE email=\"iamgabruh@gmail.com\"",(error,rek)=>{
    //     if(error)console.log("again");
    //     else{
    //         console.log(rek)
    //     }
    // })
    if (password == "" || email == "" || name == "")
        return res.render("signup", {
            message: "Fill All Value",
        });
    // we are using ? to avoid sql injectoion so we use positional pararmeter
    db.query(
        "SELECT email from sp_users WHERE email=?",
        [email],
        async (error, result) => {
            if (!error) {
                if (result.length > 0) {
                    return res.render("signup", {
                        message: "email is akreadt taken",
                    });
                } else if (password !== passwordComfirm) {
                    return res.render("signup", {
                        message: "password is not matched",
                    });
                }
            } else {
                console.log(error);
            }
            let hashpass = await bcry.hash(password, 8);
            db.query(
                "INSERT INTO sp_users SET ?",
                { name: name, email: email, password: hashpass },
                (error, result) => {
                    if (error) console.log(error);
                    else {
                        return res.redirect("/login");
                    }
                }
            );
        }
    );
};
// handling send invitation to user
exports.sendInvitation = (req, res) => {
    const { id, invite } = req.body;
    console.log("send Invitation");

    const current_user_id = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    db.query(
        "select email,id from sp_users where email=?",
        [invite],
        (err, result) => {
            if (err) {
                return res.sendStatus(400);
            } else {
                if (result.length < 1) {
                    return res.redirect(
                        "../Dashboard?message=" + "Check Email again"
                    );
                } else if (result[0].id == current_user_id) {
                    return res.redirect(
                        "../Dashboard?message=" + "You cant't sent yourself"
                    );
                } else {
                    db.query(
                        "insert into sp_friend_requests set ?",
                        { uid: result[0].id, request_id: current_user_id },
                        async (err, resul) => {
                            if (err) {
                                return res.sendStatus(404);
                            } else {
                                // req.flash("message","ohyeash");

                                res.redirect("../Dashboard?message=" + "Sent");
                            }
                        }
                    );
                }
            }
        }
    );
};
exports.acceptInvitation = (req, res) => {
    const friendId = req.body.accept;
    const friendName = req.body.name;
    const currUser = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    const currUserName = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).namee;
    db.query(
        "delete from sp_friend_requests where (request_id=? AND uid=?)",
        [friendId, currUser],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.sendStatus(404);
            } else {
                db.query(
                    'update sp_users set friends=case when friends is not null then concat(friends,concat(",",concat(?,concat(":",?)))) else  concat(?,concat(":",?)) end where id=?',
                    [friendId, friendName, friendId, friendName, currUser],
                    (err, res) => {
                        if (err) console.log(err);
                    }
                );
                console.log(
                    "printing acceptInvi users by id" +
                    currUser +
                    " and name" +
                    currUserName
                );
                console.log("friendId" + friendId);
                console.log("friendname" + friendName);
                db.query(
                    'update sp_users set friends=case when friends is not null then concat(friends,concat(",",concat(?,concat(":",?)))) else  concat(?,concat(":",?)) end where id=?',
                    [currUser, currUserName, currUser, currUserName, friendId],
                    (err, res) => {
                        if (err) console.log(err);
                    }
                );

                return res.redirect("../Dashboard");
            }
        }
    );
    // return res.redirect("/Dashboard")
};
exports.declineInvitation = (req, res) => {
    const friendId = req.body.accept;
    const currUser = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    db.query(
        "delete from sp_friend_requests where (request_id=? AND uid=?)",
        [friendId, currUser],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.sendStatus(404);
            } else {
                return res.redirect("../Dashboard");
            }
        }
    );
};
exports.sendInvitationfromaddGroup = (req, res) => {
    const { id, invite } = req.body;
    console.log("sendInvitationfromaddGroup");
    console.log(
        jwt.verify(req.headers.cookie.split("=")[1], process.env.JWT_SECRET)
    );
    const current_user_id = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    db.query(
        "select email,id from sp_users where email=?",
        [invite],
        (err, result) => {
            if (err) {
                return res.sendStatus(400);
            } else {
                if (result.length < 1) {
                    return res.redirect(
                        "../addgroup?message=" + "Check Email again"
                    );
                } else if (result[0].id == current_user_id) {
                    return res.redirect(
                        "../addgroup?message=" + "You cant't sent yourself"
                    );
                } else {
                    db.query(
                        "insert into sp_friend_requests set ?",
                        { uid: result[0].id, request_id: current_user_id },
                        async (err, resul) => {
                            if (err) {
                                return res.sendStatus(404);
                            } else {
                                // req.flash("message","ohyeash");
                                console.log("enter");
                                res.redirect("../addgroup?message=" + "Sent");
                            }
                        }
                    );
                }
            }
        }
    );
};
exports.addnewgroup = (req, res) => {
    const currUser = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    const currUserName = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).namee;

    console.log("enter addnewgrou;p");
    // console.log(req.body.groupFriendId)

    var finalGroupFriendId = "";
    const err = validationResult(req);
    var alertForgroup;
    if (!err.isEmpty()) {
        alertForgroup = err.array();
        console.log(err.array());

        if (err.array().length == 2) {
            return res.redirect(
                "../addgroup?alertForGroup=" +
                "Please Add Friends and Enter Group Name"
            );
        } else if (err.array().param === "checkbox") {
            return res.redirect(
                "../addgroup?alertForGroup=" + err.array()[0].msg
            );
        } else {
            return res.redirect(
                "../addgroup?alertForGroup=" + err.array()[0].msg
            );
        }
    }
    var finalGroupFriendArray = new Array();
    for (var i = 0; i < req.body.groupFriendId.length; i++) {
        finalGroupFriendId += req.body.groupFriendId[i] + ",";
        finalGroupFriendArray.push(req.body.groupFriendId[i] - "0");
    }
    finalGroupFriendArray.push(currUser);
    finalGroupFriendId += currUser + ",";
    var lastInsertedId;
    // https://www.youtube.com/watch?v=_JOP8rcDjJE
    const promisekr = new Promise((resolve, reject) => {
        db.query(
            "insert into sp_group set ?",
            {
                group_name: req.body.groupName,
                group_member: finalGroupFriendId,
            },
            (err, res) => {
                if (err) reject(err);
                resolve(res.insertId);
            }
        );
    })
        .then((value, value2) => {
            // console.log(value2+nter)
            db.query(
                'UPDATE sp_users set group_ids= case when group_ids is not null then concat(group_ids,concat(",",?)) else ? end where id in (?)',
                [value, value, finalGroupFriendArray],
                (err, ress) => {
                    if (err) console.log(err);
                }
            );
            return "Successfully Created Group :))";
        })
        .then((value) => {
            return res.redirect("../Dashboard?successfullyAddedGroup=" + value);
        })
        .catch((err) => {
            console.log("Error while promising");
            console.log(err);
        });
};
exports.addexpenses = (req, res) => {
    // all queries of db will be handle here i.e insering total ammont into db when user clickkedonsave on adfdexpesnes
    const currUser = jwt.verify(
        req.headers.cookie.split("=")[1],
        process.env.JWT_SECRET
    ).id;
    console.log("enter in authaddexpenses");
    const promisekr = new Promise((resolve, reject) => {
        db.query(
            "select group_member from sp_group where gid=?",
            req.body.groupId,
            (err, ress) => {
                if (err) console.log(err);
                else {
                    resolve(ress[0]);
                }
            }
        );
    })
        .then((value) => {
            // array of all gid
            const group_memberIDArray = value.group_member.split(",");

            for (var currId = 0; currId < group_memberIDArray.length; currId++) {
                group_memberIDArray[currId] -= "0";
            }
            // removing curruser
            var index = group_memberIDArray.indexOf(currUser);
            if (index > -1) {
                group_memberIDArray.splice(index, 1);
            }
            var perPersonMoney = req.body.ammount / group_memberIDArray.length;
            index = group_memberIDArray.indexOf(0);
            group_memberIDArray.splice(index, 1);

            // making array of all
            const group_memberIDArray2 = value.group_member.split(",");
            for (var currId = 0; currId < group_memberIDArray2.length; currId++) {
                group_memberIDArray2[currId] -= "0";
            }
            // removing 0
            index = group_memberIDArray2.indexOf(0);
            group_memberIDArray2.splice(index, 1);
            console.log([
                currUser,
                perPersonMoney * group_memberIDArray.length,
                group_memberIDArray,
                perPersonMoney,
                group_memberIDArray,
                perPersonMoney,
                currUser,
                currUser,
                perPersonMoney * group_memberIDArray.length,
                group_memberIDArray,
                group_memberIDArray2,
            ]);
            return [value, group_memberIDArray, perPersonMoney]

        })
        .then(([value, group_memberIDArray, perPersonMoney]) => {
            for (var currId = 0; currId < group_memberIDArray.length; currId++) {
                db.query(
                    "insert into sp_transaction (description,uid,fid,gid, ammount) values(?,?,?,?,?)",
                    [
                        req.body.description,
                        currUser,
                        group_memberIDArray[currId],
                        req.body.groupId,
                        perPersonMoney,
                    ],
                    (err, res) => { if (err) console.log(err) }
                );
            }
            return ([perPersonMoney, group_memberIDArray])
        }).then(([perPersonMoney, group_memberIDArray]) => {
            // updating ammount of groupid
            db.query("update sp_group set totalTransaction =totalTransaction+? where gid =?",
                [req.body.ammount, req.body.groupId], (err, res) => {
                    if (err) console.log(err)
                })
            return ([perPersonMoney, group_memberIDArray])



        }).then(([perPersonMoney, group_memberIDArray]) => {
            Promise.all([fix(group_memberIDArray, perPersonMoney, currUser)]).then(() => {
                return res.redirect("../Dashboard");
            })

        })

        .catch((err) => {
            console.log(err);
        });


};


async function updateBkaya(group_memberIDArray, perPersonMoney, currUser, currId, uidFid) {
    return new Promise((resolve, reject) => {
        db.query("update sp_bkaya set  amount=amount+ case when uid=? and fid=? then -? when fid=? and uid =? then ? end where uid in (?) and fid in (?)",
            [
                currUser,
                group_memberIDArray[currId],
                perPersonMoney,
                currUser,
                group_memberIDArray[currId],
                perPersonMoney,
                uidFid,
                uidFid

            ],
            (err, ress) => {
                if (err) console.log(err)



                if (ress.affectedRows === 0) {

                    db.query("insert into sp_bkaya set ?",
                        [{
                            uid: currUser,
                            fid: group_memberIDArray[currId],
                            amount: -perPersonMoney
                        }], (err, resss) => {

                            db.query("insert into sp_bkaya set ?",
                                [{
                                    fid: currUser,
                                    uid: group_memberIDArray[currId],
                                    amount: perPersonMoney
                                }], (err, resss) => {
                                    if (err) console.log(err)
                                    resolve(null)
                                })

                        })


                } else {
                    resolve(null);
                }


            }
        )
    })
}

async function fix(group_memberIDArray, perPersonMoney, currUser) {

    for (var currId = 0; currId < group_memberIDArray.length; currId++) {
        var uidFid = [group_memberIDArray[currId], currUser]
        await updateBkaya(group_memberIDArray, perPersonMoney, currUser, currId, uidFid)

    }

    console.log("exiting from db")
    return;

}
exports.settleup = (req, res) => {
    const senderId = jwt.verify(req.headers.cookie.split("=")[1], process.env.JWT_SECRET).id
    console.log(req.body)
    if (req.body.Money === '' && req.body.settleUpFriend === undefined) {
        return res.redirect("../settleup?alertForSettleUp=" + "Select Friend And Enter Money")
    }
    else if (req.body.Money === '') {
        return res.redirect("../settleup?alertForSettleUp=" + "Enter Money")
    }
    else if (req.body.settleUpFriend === undefined) {
        return res.redirect("../settleup?alertForSettleUp=" + "Select Friend")
    }
    else {
        const Money = req.body.Money;
        const RecieverId = req.body.settleUpFriend
        // for sender settling sp_users owe,owed,totalAmmount
        const promisekr = new Promise((resolve, reject) => {
            // db.query("select owe from sp_users where id =?", (senderId), (err, res) => {
            //     if (err) throw err;
            //     resolve(res[0].owe)
            // })



            // })

            // .then(owe => {
            //     if (owe >= Money) {
            //         db.query("update sp_users set owe=owe-? where id=?", [Money, senderId], (err, res) => {

            //         })
            //     }
            //     else {
            //         const rest = Money - owe
            //         db.query("update sp_users set owe=?,totalMoney=totalMoney+?,owed=owed+? where id=?", [0, rest, rest, senderId], (err, res) => {
            //             if (err) throw err;

            //         })
            //     }
            //     return;
            // })
            // / for reciever settling sp_users owe,owed,totalAmmount 
            // .then(() => {

            //     db.query("update sp_users set totalMoney=totalMoney-?,owed=owed- case when owed>0? where id=?", [Money, Money, RecieverId], (err, res) => {
            //         if (err) throw err;

            //     })
            // })
            // // updating bkaya of sender
            // .then(() => {
            var uidFid = [senderId, RecieverId]
            db.query("update sp_bkaya set  amount=amount+ case when uid=? and fid=? then -? when fid=? and uid =? then ? end where uid in (?) and fid in (?)",
                [
                    senderId,
                    RecieverId,
                    Money,
                    senderId,
                    RecieverId,
                    Money,
                    uidFid,
                    uidFid

                ],
                (err, ress) => {
                    if (err) console.log(err)


                    if (ress.affectedRows === 0) {
                        db.query("insert into sp_bkaya set ?",
                            [{
                                uid: senderId,
                                fid: RecieverId,
                                amount: -Money
                            }], (err, resss) => {
                                if (err) console.log(err)

                            })
                        db.query("insert into sp_bkaya set ?",
                            [{
                                fid: senderId,
                                uid: RecieverId,
                                amount: Money
                            }], (err, resss) => {
                                if (err) console.log(err)

                            })

                    }

                    return;

                })

        })
            // settleuptransaction
            .then(() => {
                db.query("insert into sp_settelup_transaction set ?", { uid: senderId, fid: RecieverId, amount: Money }, (err, res) => {

                })
                return;
            })
            .catch(value => {
                console.log(value)
            })
        return res.redirect("../Dashboard?successfullySent=" + "SuccessfullySent");




    }



}
