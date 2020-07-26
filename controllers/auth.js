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
    db.query("SELECT email,password,id from sp_users  where email=?",[email],async(error,result)=>{
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
                    const id=result[0].id;
                    const token=jwt.sign({id},process.env.JWT_SECRET,{
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
        db.query("INSERT INTO sp_users SET ?",{Name:name,email:email,password:hashpass},(error,result)=>{
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
        const current_user_id=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
        
        db.query("select email,id from sp_users where email=?",[invite], (err,result)=>{
            if(err){
                return res.sendStatus(400);
            }
            else{
                
                if(result.length<1){
                     
                    return res.render(path.join(__dirname,"../views/Dashboard"),{
                        message:"User not found"
                    })
                }
                else if(result[0].id==current_user_id){
                    return res.render(path.join(__dirname,"../views/Dashboard"),{
                        message:"you cant add yourself"
                    })
                }
                else{
                    db.query("insert into sp_friend_requests set ?",{uid:result[0].id,request_id:current_user_id},async(err,resul)=>{
                        if(err){
                            return res.sendStatus(404);
                        }
                        else{
                            return res.render(path.join(__dirname,"../views/Dashboard"),{
                                message:"Sended"
                            })
                    
                        }
                    })
                    
                }
            }
        })
    }
    exports.acceptInvitation=(req,res)=>{
        const friendId=req.body.accept;
        const currUser=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id;
        db.query("delete from sp_friend_requests where (request_id=? AND uid=?)",[friendId,currUser],(err,result)=>{
            if(err){
                console.log(err)
                return res.sendStatus(404);
            }   
            else{
                db.query("insert into sp_friends set ?",{uid:currUser,friend_id:friendId},(err,resultss)=>{
                    if(err)console.log(err)
                    
                })
                db.query("insert into sp_friends set ?",{uid:friendId,friend_id:currUser},(err,resultss)=>{
                    if(err)console.log(err)
                    else return  res.redirect("../Dashboard");
                })
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