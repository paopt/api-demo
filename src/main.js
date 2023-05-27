const { APP_PORT } = require('../config/config');
const app = require('./app');

app.listen(APP_PORT, () => {
  console.log('server is running at port 3000');
});