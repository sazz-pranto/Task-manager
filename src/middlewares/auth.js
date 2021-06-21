const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    // user's authorization token is sent with the request header
    const token = req.header('Authorization').replace('Bearer ', ''); // removing the 'Bearer' tag from the token to get the token alone 
    const decoded = jwt.verify(token, 'secretxD'); // verifying if the user ever got an auth token
    console.log(decoded);
  } catch(error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
}

module.exports = auth;