const { Router } = require("express");
const router = Router();
const authenticateUser = require("../Authentication/Authentication");
router.get("/", (req, res) => {
  res.send("Hello World");
});
module.exports = router;
