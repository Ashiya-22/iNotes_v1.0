const express=require('express');
const router=express.Router();
const mainController=require('../controllers/mainController');


// App Routes
router.get('/',mainController.homepage);
router.get('*',mainController.error404);

module.exports=router;