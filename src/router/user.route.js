const Router = require('koa-router');
const { login, register, getUser } = require('../controller/user.controller');
const router = new Router({ prefix: '/users'});
const { userValidator, verifyUser, crpytPassword, verifyLogin } = require('../middleware/user.middleware');
const { auth } = require('../middleware/auth.middleware');
router.post('/register', userValidator, verifyUser, crpytPassword, register);
router.post('/login', userValidator, verifyLogin, login);
router.get('/getUser', auth, getUser);

module.exports = router;