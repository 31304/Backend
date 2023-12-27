const express = require("express");
const router = express.Router();
const authenticateUser = require("../Authentication/Authentication");
const {
  login,
  signup,
  verifyAccount,
  RequestAcceptMessge,
  PendingRequest,
  getAllOrganizar,
  BlockUser,
  UnBlockUser,
  AcceptedRequest,
  getOrgaziarNumber,
  getVendorNumber,
  DeclineRequest,
  getAllVendor,
} = require("../Controller/user");
RequestAcceptMessge;
router.post("/login", login);
router.post("/signup", signup);
router.post("/verifyAccount", verifyAccount);
router.put("/RequestAcceptMessge", authenticateUser, RequestAcceptMessge);
router.get("/PendingRequest",authenticateUser, PendingRequest);
router.put("/AcceptedRequest", authenticateUser, AcceptedRequest);
router.put("/RejectRequest", authenticateUser, DeclineRequest);
router.get("/getAllOrganizar",authenticateUser, getAllOrganizar);
router.put("/BlockUser", authenticateUser, BlockUser);
router.put("/UnBlockUser", authenticateUser, UnBlockUser);
router.get("/getAllVendor", authenticateUser, getAllVendor);
router.get("/getOrgaziarNumber", authenticateUser, getOrgaziarNumber);
router.get("/getVendorNumber", authenticateUser, getVendorNumber);
module.exports = router;
