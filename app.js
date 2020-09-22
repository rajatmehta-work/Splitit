// // entry point like app.js
// then we will import exprss module 
// then we will create a instance of express
// then we will create db
// then create a instance of sql in app.js
// then createconntection and in we will provede host password user db exitCode
// then we will create envitonment variable for storing variable outside the file 
// then we will create instance of dotenv
// then config like dotenv.config({path:"./env"})
// then check status of sql connection is created or not 
// after this we will work on frontend part 
// we will create a folder name as view
// in which all /html or .hbs pages are stored 
// then we will create public dircetory as static to use as name instead of using /public/namefile
// so to do static path 
// app.use(express.static(publicDirectory))
// this are call routed=>
                        // routes take user from place to aother place that place is called route
                        // app.get("/",(req,res)=>{
                        //     res.render("index")
                        // });
                        // app.get("/signup",(req,res)=>{
                        //     res.render("signup");
                        // });
                        // app.get("/login",(req,res)=>{
                        //     res.render("login");
                        // })
// we also create set view engine as hbs\
// now we can open localhost then app.get will display page now 

// now we will create routes 
// what is route 
    // routed defines the way in which client requents are handled on backend
// read:
//     hbs,template engine ,view engine,handlebars,ROUTING,controllers,callback
// now we use jwt for authorisatoin 
//     why we use coz it stateless
//         noe firstly we check user is correct or not 
//              then if yes then we create a ytoken for user 
//              then we will define payload and secreyt key also we  will true the flaag of httpony for securtity purpose 
//                 then we will send the token to cokkkie of browser 


// when something is decided on user then send response to pages otherwise auth







//import express module
const express=require('express');
// create a instance of express
const app=express();
const cookieParser=require("cookie-parser");
const path=require("path");
const sql=require("mysql")
const dotenv=require('dotenv');
const { urlencoded } = require('express');
dotenv.config({path:"./.env"})
const {check,   validationResult }=require("express-validator")
const db=sql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    
    database:process.env.DATABASE,

});
const expHbs=require("express-handlebars")
const handlebarshelpers=require("handlebars-helpers")
// 
const helpersHbs=require("handlebars-helpers")();
// setting default template
const hbs=expHbs.create({
    extname:"hbs",
    defaultLayout:"default",
    layoutsDir:path.join(__dirname,"views/layout/"),
    helpers:{
        helpersHbs,
        gtlength:function(length,options){
            if(length>=5){
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
})

app.engine("hbs",hbs.engine)

const publicDirectory=path.join(__dirname,'./public');
// express by default doesnt server static files
app.use(express.static(publicDirectory));
app.set("view engine","hbs");
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());

db.connect((error)=>{
    if(error){
        console.log("it is not working");
    }
    else{
        console.log("SQL is running");
    }
});

//  this .get is http method from browse that is usualyy use to render pages also called routes
app.use("/",require("./routes/pages"));
app.use("/auth",require("./routes/auth"));

app.listen(5001,()=>{
    console.table("yes")
})