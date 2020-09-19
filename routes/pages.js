const express=require("express");
const jwt=require("jsonwebtoken");
const mysql=require("mysql")
const notifi=require("../controllers/notify")
const db=mysql.createConnection({
    host:process.env.DATABASE_HOST,
    database:process.env.DATABASE,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_pass

})

const router=express.Router();
router.get("/",middleware,(req,res)=>{
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("en")
           res.render("index")
        }
        else{
            res.redirect("Dashboard")
        }
    })
    
});
router.get("/login",(req,res)=>{
    console.log("er")
    res.render("login")
    
});
router.get("/signup",(req,res)=>{
        res.render("signup")
});
router.get("/settleup",middleware,(req,res)=>{
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfy")
            return res.sendStatus(404);

        }
        else{ 
            res.render("settleup") 
        } 
    })
})
router.get("/addgroup",middleware,(req,res)=>{
    console.log("Add Group")
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfy")
            return res.sendStatus(404);

        }
        else{   
            const currUserId=jwt.verify(req.headers.cookie.split("=")[1],process.env.JWT_SECRET).id
            db.query("select friends from sp_users where id=?",[currUserId],(err,result)=>{
                if(err)console.log(err)
                else{
                    console.log(result[0].friends)
                    const finalList=[]
                    if(result[0].friends!==null){
                        const templistOfFriends=result[0].friends.split(",");
                        templistOfFriends.forEach(element => {
                            finalList.push({id:element.split(":")[0],name:element.split(":")[1]})    
                        });
                        res.render("addgroup",{
                            message:req.query.message,
                            finalList:finalList,
                            alertForGroup:req.query.alertForGroup
                        })
                    }
                    else{
                        res.render("addgroup",{
                            message:req.query.message,
                            NoFriends:"No Friends",
                            alertForGroup:req.query.alertForGroup
                        })
                    }
                    
                     
                }
            })
            
        } 
    })
})
router.get("/addexpenses",middleware,(req,res)=>{
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfy")
            return res.sendStatus(404);

        }
        else{ 
            res.render("addexpenses") 
        } 
    })
})
router.get("/account",middleware,(req,res)=>{
    jwt.verify(req.token,process.env.JWT_SECRET,(err,id)=>{
        if(err){
            console.log("Error in jwt.veryfy")
            return res.sendStatus(404);

        }
        else{ 
            res.render("account") 
        } 
    })
})
function middleware(req,res,next){      
    const authHeader=req.headers.cookie;
    // console.log(aut  hHeader)
    if(authHeader){
        console.log("User entered")
        req.token=authHeader.split("=")[1]
        
    }
    else{
        console.log("Something Wrong in fetched Cookie")
        
    }
    next();
 
}
router.get("/Dashboard",middleware,notifi.showNotifications)      

module.exports=router;



