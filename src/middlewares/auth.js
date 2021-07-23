const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    // user's authorization token is sent with the request header
    const token = req.header('Authorization').replace('Bearer ', ''); // removing the 'Bearer' tag from the token to get the token alone 

    // verifying if the user ever got an auth token, jwt.verify returns the decoded version of the payload in the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // find the user that has the id and token used while logging in
    const user = await User.findOne({ _id: decoded.id, 'tokens.token': token });
    
    if(!user) {
      throw new Error();
    }
    req.token = token; // keeping the token that the user logged in with to use in logout
    req.user = user; // keeping the user in req object for later use
    next();
  } catch(error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
}

module.exports = auth;