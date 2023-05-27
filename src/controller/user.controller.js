const { createUser, getUserInfo } = require('../service/user.service')
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/config');

class UserController {
  async login(ctx, next) {
    const {name} = ctx.request.body;
    try {
      const {password, ...res} = await getUserInfo({name});
      ctx.body = {
        code: 0,
        message: '用户登录成功',
        res: {
          token: jwt.sign(res, JWT_SECRET, {
            expiresIn: '1d'
          })
        }
      }
    } catch (err) {
      console.error('用户登录失败', err);
      ctx.body = {
        code: 400,
        message: '用户登录失败',
        res: null
      }
    }
  }
  async register(ctx, next) {
    const { name, password } = ctx.request.body;
    const res = await createUser(name, password)
    console.log('register: ', res);
    ctx.body = {
      code: 0,
      message: '注册成功',
      result: res,
    };
  }

  async getUser(ctx, next) {
    const user = ctx.state.user;
    try {
      const res = await getUserInfo({name: user.name});
      ctx.body = {
        code: 200,
        data: res
      }
    } catch (err) {
      ctx.body = {
        code: 400,
        message: '获取用户信息失败',
        res: null
      }
    }
  }
}

module.exports = new UserController();