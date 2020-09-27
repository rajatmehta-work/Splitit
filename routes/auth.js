const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authcontroller = require("../controllers/auth");
router.post("/sendInvitation", middleware, authcontroller.sendInvitation);
router.post("/signup", authcontroller.signup);
router.post("/login", authcontroller.login);
router.get("/logout", authcontroller.logout);
router.post("/acceptInvitation", authcontroller.acceptInvitation);
router.post("/declineInvitation", authcontroller.declineInvitation);
router.post("/addNewGroup", middleware, [check("groupName", "Enter group Name").isLength({ min: 1 }), check("groupFriendId", "Please Select Friends").isLength({ min: 1 }),], authcontroller.addnewgroup);
router.post("/sendInvitationfromaddGroup", authcontroller.sendInvitationfromaddGroup);
router.post("/addexpenses", middleware, authcontroller.addexpenses);
router.post("/settleup", middleware, authcontroller.settleup)
function middleware(req, res, next) {
    const authHeader = req.headers.cookie;
    if (authHeader) {
        req.token = req.headers.cookie.split("=")[1];
        jwt.verify(req.token, process.env.JWT_SECRET, (err, id) => {
            if (err) return res.redirect("../login");
            else next();
        });
    } else {
        console.log("Error in Authentication");
        return res.redirect("../login");
    }
}
module.exports = router;
