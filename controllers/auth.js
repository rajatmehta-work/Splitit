const jwtDecode=require("jwt-decode")
const sql=require("mysql");
const jwt=require("jsonwebtoken");
const bcry=require("bcryptjs");
const path=require("path");

const db=sql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASS,
    database:process.env.DATABASE,

});
exports.login=async(req,res)=>{
    const {email,password} =req.body;
    console.log("eanjkl")
    db.query("SELECT name,email,password,id from sp_users  where email=?",[email],async(error,result)=>{
        if(error){
            console.log(error);
        }
        else{
            if(!password || !email){
                return res.status(400).render("login",{
                    message:"Please enter the password or email"
                })
            }
            
            if(result.length<1){
                return res.status(400).render("login",{
                    message:"Email is not Registered"
                })
            }
            if(result.length==1){
                if(!(await bcry.compare(password,result[0].password))){
                    // console.log(password);
                    // console.log(result[0].password);
                    return res.status(401).render("login",{
                        message:"Password is not Correct"
                    })
                }
                else{
                    // console.log(result[0])
                    const id=result[0].id;
                    const namee=result[0].name;
                    const token=jwt.sign({id,namee},process.env.JWT_SECRET,{
                        expiresIn:process.env.JWT_expiresIn
                    });
                    // console.log(token);
                    const cookieOptions={
                        expires:new Date(
                            Date.now()+60*60*60*60
                        ),
                        httpOnly:true
                    }
                    // console.log(Date.now())
                    // cookie(typeof token,generatedToken,cookieOption)
                    res.cookie('jwt',token,cookieOptions);
                    res.status(200).redirect("../Dashboard");
                    
                }
    
            }
            else{
                return res.render("login",()=>{
                    message:"Email is not correct";
                })
            }
        }
    })
}
exports.signup=(req,res)=>{
    const {name,email,password,passwordComfirm}=req.body;
    console.log(req.body)
    // db.query("SELECT name from sp_users WHERE email=\"iamgabruh@gmail.com\"",(error,rek)=>{
    //     if(error)console.log("again");
    //     else{
    //         console.log(rek)
    //     }
    // })
    if(password=='' || email=='')return res.render("signup",{
        message:"enter values first"
    })
    // we are using ? to avoid sql injectoion so we use positional pararmeter
    db.query("SELECT email from sp_users WHERE email=?",[email],async(error,result)=>{
        if(!error){
            if(result.length>0){
                return res.render("signup",{
                    message:"email is akreadt taken"
                })
            }
            else if(password!==passwordComfirm){
                return res.render("signup",{
                    message:"password is not matched"
                })  
            }
               
        }
        else{
            console.log(error);
        }
        let hashpass=await bcry.hash(password,8);
        db.query("INSERT INTO sp_users SET ?",{name:name,email:email,password:hashpass},(error,result)=>{
            if(error)console.log(error);
            else{
                
                return res.redirect("/login");
            }
         });
        
         
        })
    }


    // handling send invitation to user 
    exports.sendInvitation=(req,res)=>{
        const {id,invite}=req.body;
        console.log("send Invitation")
        console.log(jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET))
        const current_user_id=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
        db.query("select email,id from sp_users where email=?",[invite], (err,result)=>{
            if(err){
                return res.sendStatus(400);
            }
            else{
                
                if(result.length<1){
                    return res.redirect("../Dashboard?message="+"Check Email again")
                }
                else if(result[0].id==current_user_id){
                      
                    return res.redirect("../Dashboard?message="+"You cant't sent yourself")
                }
                else{
                    db.query("insert into sp_friend_requests set ?",{uid:result[0].id,request_id:current_user_id},async(err,resul)=>{
                        if(err){
                            return res.sendStatus(404);
                        }
                        else{
                            // req.flash("message","ohyeash");
                            
                            res.redirect("../Dashboard?message="+"Sent");
                        }
                    })
                    
                }
            }
        })
    }
    exports.acceptInvitation=(req,res)=>{
        const friendId=req.body.accept;
        const friendName=req.body.name;
        const currUser=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
        const currUserName=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).namee;
        db.query("delete from sp_friend_requests where (request_id=? AND uid=?)",   [friendId,currUser],(err,result)=>{
            if(err){
                console.log(err)
                return res.sendStatus(404);
            }   
            else{

                db.query("update sp_users set friends=case when friends is not null then concat(friends,concat(\",\",concat(?,concat(\":\",?)))) else  concat(?,concat(\":\",?)) end where id=?",[friendId,friendName,friendId,friendName,currUser],(err,res)=>{
                    if(err)console.log(err)
                    
                })
                console.log("printing acceptInvi users by id"+currUser+" and name"+currUserName)
                console.log("friendId"+friendId)
                console.log("friendname"+friendName);
                db.query("update sp_users set friends=case when friends is not null then concat(friends,concat(\",\",concat(?,concat(\":\",?)))) else  concat(?,concat(\":\",?)) end where id=?",[currUser,currUserName,currUser,currUserName,friendId],(err,res)=>{
                    if(err)console.log(err)
                    
                })
               
                 return res.redirect("../Dashboard")
            }

        })
        // return res.redirect("/Dashboard")
    }
    exports.declineInvitation=(req,res)=>{
        const friendId=req.body.accept;
        const currUser=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
        db.query("delete from sp_friend_requests where (request_id=? AND uid=?)",[friendId,currUser],(err,result)=>{
            if(err){
                console.log(err)
                return res.sendStatus(404);
            }   
            else{
                return res.redirect("../Dashboard")
            }
        })

    }