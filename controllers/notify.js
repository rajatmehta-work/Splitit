const async = require("async");
const { getRounds } = require("bcryptjs");
const { query } = require("express");
const express = require("express");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
});

exports.showNotifications = (req, res) => {
    console.log("enter showNotificatoin");

    jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
        if (err) {
            console.log("Error in jwt.veryfiy");
            return res.redirect("login");
        } else {
            const curr_user = jwt.verify(
                req.headers.cookie.split("=")[1],
                process.env.JWT_SECRET
            ).id;
            console.table(curr_user);

            // advantage of async.parrallel is both query will run parrallely such that response will quickier
            const promise1 = new Promise((resolve, reject) => {
                var groupNameId;
                db.query(
                    "select group_ids from sp_users where id =?",
                    curr_user,
                    (err, res) => {
                        // console.log(res[0].group_ids)
                        if (res[0].group_ids == null) {
                            resolve(res[0].group_ids);
                        } else {
                            groupNameId = res[0].group_ids.split(",");
                            for (var i = 0; i < groupNameId.length; i++) {
                                groupNameId[i] = groupNameId[i] - "0";
                            }
                            resolve(groupNameId);
                        }
                    }
                );
            })
                .then((groupNameId) => {
                    // console.log("value")
                    // console.log(groupNameId)
                    if (groupNameId == null) return groupNameId;
                    else {
                        return new Promise((resolve, reject) => {
                            const query3 =
                                "select gid,group_name from sp_group where gid in (?)";
                            db.query(
                                query3,
                                [groupNameId],
                                (err, groupNames) => {
                                    // console.log(groupNames )
                                    resolve(groupNames);
                                }
                            );
                        });
                    }
                })
                .then((groupNames) => {
                    const query1 = "select  sp_users.name,sp_friend_requests.request_id  from sp_users inner join sp_friend_requests on sp_users.id=sp_friend_requests.request_id where sp_friend_requests.uid=" + curr_user;
                    const query2 = "select friends from sp_users where id=" + curr_user;
                    const groupList = groupNames;
                    const query3 = "select sum(case when amount>=0 then 0 else amount end)as  owed,sum(case when amount>=0 then amount else 0 end) as owe from sp_bkaya  where uid =" + curr_user
                    async.parallel(
                        [
                            function (callback) {
                                db.query(query1, callback);
                            },
                            function (callback) {
                                db.query(query2, callback);
                            },
                            function (callback) {
                                db.query(query3, callback);
                            },

                        ],
                        (err, results) => {
                            if (results[2][0][0].owe === null) {

                                results[2][0][0].owe = 0;
                            }
                            if (results[2][0][0].owed === null) {
                                {
                                    results[2][0][0].owed = 0;
                                }
                            }
                            results[2][0][0].owe = results[2][0][0].owe.toFixed(2)
                            results[2][0][0].owed = -results[2][0][0].owed.toFixed(2);
                            const totalBalance = results[2][0][0].owed - results[2][0][0].owe
                            if (err) console.log(err);
                            var tempFriend;

                            // console.log(groupNames);
                            if (results[1][0][0].friends !== null) {
                                var arrayOfcomasaparatedFriendlist = results[1][0][0].friends.split(",");
                                tempFriend = new Array();
                                // console.log(arrayOfcomasaparatedFriendlist)
                                arrayOfcomasaparatedFriendlist.forEach(
                                    (value) => {
                                        // console.log(value)
                                        tempFriend.push(value.split(":")[1]);
                                    }
                                );
                            } else {
                                tempFriend = null;
                            }
                            console.log("check message in show notifu");
                            // console.log(results)
                            // console.log(tempFriend)
                            // console.log(req.query.successfullyAddedGroup)
                            console.log(totalBalance)

                            if (tempFriend !== null && groupList !== null) {
                                return res.render("Dashboard", {
                                    ress: results[0][0],
                                    friendsList: tempFriend,
                                    message: req.query.message,
                                    successfullyAddedGroup:
                                        req.query.successfullyAddedGroup,
                                    groupList,
                                    selectGroup: req.query.selectGroup,
                                    totalBalance,
                                    owe: results[2][0][0].owe,
                                    owed: results[2][0][0].owed


                                });
                            } else if (tempFriend !== null) {
                                return res.render("Dashboard", {
                                    ress: results[0][0],
                                    friendsList: tempFriend,
                                    message: req.query.message,
                                    successfullyAddedGroup:
                                        req.query.successfullyAddedGroup,
                                    selectGroup: req.query.selectGroup,
                                    totalBalance,
                                    owe: results[2][0][0].owe,
                                    owed: results[2][0][0].owed

                                    // groupList
                                });
                            } else if (groupList !== null) {
                                return res.render("Dashboard", {
                                    ress: results[0][0],
                                    // friendsList:tempFriend,
                                    message: req.query.message,
                                    successfullyAddedGroup:
                                        req.query.successfullyAddedGroup,
                                    groupList,
                                    selectGroup: req.query.selectGroup,
                                    totalBalance,
                                    owe: results[2][0][0].owe,
                                    owed: results[2][0][0].owed

                                });
                            } else {
                                return res.render("Dashboard", {
                                    ress: results[0][0],
                                    // friendsList:tempFriend,
                                    message: req.query.message,
                                    successfullyAddedGroup:
                                        req.query.successfullyAddedGroup,
                                    selectGroup: req.query.selectGroup,
                                    totalBalance,
                                    owe: results[2][0][0].owe,
                                    owed: results[2][0][0].owed

                                });
                            }
                        }
                    );
                })
                .catch((err) => {
                    console.log("error in catch");
                    console.log(err);
                });
        }
    });
};
