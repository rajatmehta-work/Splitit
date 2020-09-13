const async=require("async");
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
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfy")
            return res.redirect("login")

        }
        else{
            const curr_user=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
            console.table(curr_user)
            const tepmr=new Array();
            return res.render("Dashboard");
            // const query1="select  sp_users.Name,sp_friend_requests.request_id  from sp_users inner join sp_friend_requests on sp_users.id=sp_friend_requests.request_id where sp_friend_requests.uid="+curr_user;
            // const query2="select distinct sp_friends.friend_id,sp_users.Name from sp_users inner join sp_friends  on sp_users.id=sp_friends.friend_id where sp_friends.uid="+curr_user;
            // // advantage of async.parrallel is both query will run parrallely such that response will quickier
            // async.parallel([
            //     function(callback){db.query(query1,callback)},
            //     function(callback){db.query(query2,callback)}
            // ],(err,results)=>{
            //     if(err)console.log(err)
            //     // console.log(results[1][0])
            //     return res.render("Dashboard",{
                     
            //     })
                
            // })
                        
            
            
        } 
    })
}