const async=require("async");
const { getRounds } = require("bcryptjs");
const express=require("express");
const jwt=require("jsonwebtoken");
const mysql=require("mysql")

const db=mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASS,
    database:process.env.DATABASE,

});


exports.showNotifications=(req,res)=>{
    console.log("enter showNotificatoin")
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfiy")
            return res.redirect("login")

        }
        else{
            const curr_user=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
            console.table(curr_user)
            
            const query1="select  sp_users.name,sp_friend_requests.request_id  from sp_users inner join sp_friend_requests on sp_users.id=sp_friend_requests.request_id where sp_friend_requests.uid="+curr_user;
            const query2="select friends from sp_users where id="+curr_user;
            const query3="select group_name,group"
            // advantage of async.parrallel is both query will run parrallely such that response will quickier
            async.parallel([
                function(callback){db.query(query1,callback)},
                function(callback){db.query(query2,callback)}
            ],(err,results)=>{
                if(err)console.log(err)
                var tempFriend;
                console.log("printing resutl")
                console.log(results[1][0][0].friends);
                if(results[1][0][0].friends!==null){
                    var arrayOfcomasaparatedFriendlist=results[1][0][0].friends.split(",");
                    tempFriend=new Array();
                    // console.log(arrayOfcomasaparatedFriendlist)
                    arrayOfcomasaparatedFriendlist.forEach(value=>{
                        // console.log(value)
                        tempFriend.push(value.split(":")[1]);
                    })
                    

                }
                else{
                    tempFriend=null;
                }
                console.log("check message in show notifu")
                console.log(req.query)
                console.log(tempFriend)
                console.log(req.query.successfullyAddedGroup)
                let groupList=null;

                if(tempFriend!==null && groupList!==null){
                    return res.render("Dashboard",{
                        ress:results[0][0], 
                        friendsList:tempFriend,
                        message:req.query.message,
                        successfullyAddedGroup:req.query.successfullyAddedGroup,
                        groupList
                        

                    })

                }
                else if(tempFriend!==null){
                    return res.render("Dashboard",{
                        ress:results[0][0], 
                        friendsList:tempFriend,
                        message:req.query.message,
                        successfullyAddedGroup:req.query.successfullyAddedGroup,
                        // groupList
                        

                    })

                }
                else if(groupList!==null){
                    return res.render("Dashboard",{
                        ress:results[0][0], 
                        // friendsList:tempFriend,
                        message:req.query.message,
                        successfullyAddedGroup:req.query.successfullyAddedGroup,
                        groupList
                         

                    })

                }
                else{
                    return res.render("Dashboard",{
                        ress:results[0][0], 
                        // friendsList:tempFriend,
                        message:req.query.message,
                        successfullyAddedGroup:req.query.successfullyAddedGroup,
                         
                         

                    })

                }
                
            })
                        
            
            
        } 
    })
}