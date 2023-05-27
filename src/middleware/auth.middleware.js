const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../../config/config');
const { tokenExpiredError, invalidToken, notLogin } = require('../constant/err.type');

const auth = async (ctx, next) => {
  const { authorization } = ctx.request.header;
  if (!authorization) {
    return ctx.app.emit('error', notLogin, ctx);
  }
  
  try {
    const token = authorization.replace('Bearer', '');
    const user  = jwt.verify(token, JWT_SECRET);
    ctx.state.user = user;
  } catch (err) {
    console.log(err)
    switch (err.name) {
      case 'TokenExpiredError':
        console.error('token已过期', err)
        return ctx.app.emit('error', tokenExpiredError, ctx)
      case 'JsonWebTokenError':
        console.error('无效的token', err)
        return ctx.app.emit('error', invalidToken, ctx)
    }
  }
  await next();
}

module.exports = {
  auth
}