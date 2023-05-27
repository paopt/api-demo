const { getUserInfo } = require('../service/user.service');
const { userAlreadyExited, userFormateError, userRegisterError, userDoesNotExist, invalidPassword, userLoginError } = require('../constant/err.type');
const bcrypt = require('bcryptjs');

const userValidator = async (ctx, next) => {
  const { name, password } = ctx.request.body;
  if (!name || !password) {
    ctx.app.emit('error', userFormateError, ctx);
    return;
  }
  await next();
}

const verifyUser = async (ctx, next) => {
  const { name } = ctx.request.body;
  try {
    const res = await getUserInfo({name});
    if (res) {
      ctx.app.emit('error', userAlreadyExited, ctx);
      return;
    }
  } catch (error) {
    ctx.app.emit('error', userRegisterError, ctx);
    return;
  }
  await next();
}

const crpytPassword = async (ctx, next) => {
  const { password } = ctx.request.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  ctx.request.body.password = hash;
  await next();
}

const verifyLogin = async (ctx, next) => {
  const {name, password} = ctx.request.body;
  try {
    const res = await getUserInfo(name);
    if (!res) {
      ctx.app.emit('error', userDoesNotExist, ctx);
      return;
    }
    if (!bcrypt.compareSync(password, res.password)) {
      ctx.app.emit('error', invalidPassword, ctx);
      return;
    }
  } catch (error) {
    return ctx.app.emit('error', userLoginError, ctx)
  }
  await next();
}

module.exports = {
  userValidator,
  verifyUser,
  crpytPassword,
  verifyLogin
};