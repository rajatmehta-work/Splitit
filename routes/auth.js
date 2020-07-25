const express=require("express");
const router =express.Router();
const authcontroller=require("../controllers/auth");
router.get("/sendInvitation",authcontroller.sendInvitation)
router.post("/signup",authcontroller.signup);
router.post("/login",authcontroller.login);
router.post("/acceptInvitation",authcontroller.acceptInvitation);
router.post("/declineInvitation",authcontroller.acceptInvitation);

module.exports=router;