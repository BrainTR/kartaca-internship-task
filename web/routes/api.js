const router = require('express').Router();
const apiController = require('../controllers/apiController.js');

router.get('/get', apiController.randResponse);
router.post('/post', apiController.randResponse);
router.put('/put', apiController.randResponse);
router.delete('/delete', apiController.randResponse);

router.get('/logs', apiController.getLogs);
 
module.exports = router;