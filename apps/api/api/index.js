const { app$, server } = require('../dist/lambda');

module.exports = async (req, res) => {
  await app$;
  server(req, res);
};
