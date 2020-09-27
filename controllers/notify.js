const async = require("async");
const { getRounds } = require("bcryptjs");
const { query } = require("express");
const express = require("express");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
var HashMap = require('hashmap');
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
            var map = new HashMap()
            var mapForIdNamme = new HashMap()
            const curr_user = jwt.verify(
                req.headers.cookie.split("=")[1],
                process.env.JWT_SECRET
            ).id;
            const curr_userName = jwt.verify(
                req.headers.cookie.split("=")[1],
                process.env.JWT_SECRET
            ).namee;


            console.table(curr_user);
            const promisekrForIdName = new Promise((resolve, reject) => {
                db.query(
                    "select name,id from sp_users",
                    (err, res) => {


                        if (res.length === 0) {
                            resolve(null);
                        } else {
                            for (var i = 0; i < res.length; i++) {
                                mapForIdNamme.set(res[i].id, res[i].name)
                            }

                            resolve(null)
                        }
                    }
                )
            })
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
                                    // console.log(groupNames)
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
                    const query4 = "select distinct(date),COUNT(case when uid=" + curr_user + " then date else null end) as sender,COUNT(case when fid=" + curr_user + " then date else null end) as receiver ,(case when uid=" + curr_user + " then fid when fid=" + curr_user + " then uid end) as name ,gid,description,ammount from sp_transaction  where uid=" + curr_user + " or fid=" + curr_user + " GROUP by date order by date desc"
                    const query5 = "select uidName,fidName, (case when uid=" + curr_user + " then 1 when fid =" + curr_user + " then 0 end) as status,date,amount from sp_settelup_transaction where uid=" + curr_user + " or fid=" + curr_user
                    if (groupList !== null) {
                        for (var currGid = 0; currGid < groupList.length; currGid++) {
                            map.set(groupList[currGid].gid, groupList[currGid].group_name);
                        }
                    }

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
                            function (callback) {
                                db.query(query4, callback);
                            },
                            function (callback) {
                                db.query(query5, callback);
                            }

                        ],
                        (err, results) => {

                            for (var currGid = 0; currGid < results[3][0].length; currGid++) {
                                results[3][0][currGid].gid = map.get(results[3][0][currGid].gid);
                                results[3][0][currGid].name = mapForIdNamme.get(results[3][0][currGid].name);
                                var tempDate = results[3][0][currGid].date.toString()
                                results[3][0][currGid].date = tempDate.split("T")[0].split(" ")[1] + " " + tempDate.split("T")[0].split(" ")[2] + " (" + tempDate.split("T")[0].split(" ")[4] + ")"
                                results[3][0][currGid].ammount = (results[3][0][currGid].ammount * (results[3][0][currGid].sender === 0 ? results[3][0][currGid].receiver : results[3][0][currGid].sender)).toFixed(2)
                            }



                            for (var id = 0; id < results[4][0].length; id++) {
                                var tempDate = results[4][0][id].date.toString()
                                results[4][0][id].date = tempDate.split("T")[0].split(" ")[1] + " " + tempDate.split("T")[0].split(" ")[2]
                                results[4][0][id].amount = results[4][0][id].amount.toFixed(2)
                            }
                            if (results[2][0][0].owe === null) {

                                results[2][0][0].owe = 0;
                            }
                            if (results[2][0][0].owed === null) {
                                {
                                    results[2][0][0].owed = 0;
                                }
                            }

                            results[2][0][0].owe = results[2][0][0].owe.toFixed(2)
                            results[2][0][0].owed = -results[2][0][0].owed;
                            results[2][0][0].owed = results[2][0][0].owed.toFixed(2);
                            const totalBalance = (results[2][0][0].owed - results[2][0][0].owe).toFixed(2)
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

                            // console.log(tempFriend)
                            // console.log(req.query.successfullyAddedGroup)


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
                                    owed: results[2][0][0].owed,
                                    name: curr_userName,
                                    groupTransaction: results[3][0],
                                    settleUpTransaction: results[4][0]

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
                                    owed: results[2][0][0].owed,
                                    name: curr_userName,
                                    groupTransaction: results[3][0],
                                    settleUpTransaction: results[4][0]

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
                                    owed: results[2][0][0].owed,
                                    name: curr_userName,
                                    groupTransaction: results[3][0],
                                    settleUpTransaction: results[4][0]

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
                                    owed: results[2][0][0].owed,
                                    name: curr_userName,
                                    groupTransaction: results[3][0],
                                    settleUpTransaction: results[4][0]

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
