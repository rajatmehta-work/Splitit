const express=require("express");
const {check}=require("express-validator")
const router =express.Router();
const authcontroller=require("../controllers/auth");
router.post("/sendInvitation",authcontroller.sendInvitation)
router.post("/signup",authcontroller.signup);
router.post("/login",authcontroller.login);
router.post("/acceptInvitation",authcontroller.acceptInvitation);
router.post("/declineInvitation",authcontroller.declineInvitation);
router.post("/addNewGroup",[check("groupName","Enter group Name").isLength({min:1}),
    check("groupFriendId","Please Select Friends")
    .isLength({min:1})
    
],authcontroller.addnewgroup);
router.post("/sendInvitationfromaddGroup",authcontroller.sendInvitationfromaddGroup);
module.exports=router;