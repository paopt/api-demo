const User = require('../model/user.model');

class UserService {
  async createUser(name, password) {
    const res = await User.create({
      name: name,
      password
    })
    return res.dataValues;
  }

  async getUserInfo ({id, name, password, is_admin}) {
    const options = {};
    id && Object.assign(options, {id});
    name && Object.assign(options, {name});
    password && Object.assign(options, {password});
    is_admin && Object.assign(options, {is_admin});

    const res = await User.findOne({
      // attributes: ['id', 'name', 'password', 'is_admin'],
      where: options
    });

    return res ? res.dataValues : null
  }
}

module.exports = new UserService()