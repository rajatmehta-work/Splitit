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
            db.query("select  sp_users.Name,sp_friend_requests.request_id  from sp_users inner join sp_friend_requests on sp_users.id=sp_friend_requests.request_id where sp_friend_requests.uid=? group by  sp_users.email,sp_friend_requests.request_id ",[curr_user],(err,ress)=>{
                if(err)console.log(err)
                else{
                    console.log(ress)
                    tepmr:ress
                    return res.render("Dashboard",{
                        ress:ress
                        

                    })
                } 
                
            })
            console.log(tepmr+"=====")
            
            
        } 
    })
}