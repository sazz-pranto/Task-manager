const express = require('express');

const User = require('../models/user');
const auth = require('../middlewares/auth');

const router = express.Router();

// creating a user
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();

    // once the user is saved to the database, generate an auth token so that the user automatically gets logged in
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch(error) {
    res.status(400).send(error)
  }
})

// // read all user
// router.get('/users', auth, async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.send(users);
//   } catch(error) {
//     res.status(500).send(error);
//   }
// })

// read currently logged in user
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);  // the user that is logged in was assigned to req object in auth middleware

})

// read one user using id
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id;
//   try {
//     const user = await User.findById(_id);
//     if(!user) {
//       return res.status(404).send('User not found!')
//     }
//     res.send(user);
//   } catch(error) {
//     res.status(500).send(error);
//   }
// })

// update a user by id
router.patch('/users/me', auth, async (req, res) => {
  const _id = req.user._id;

  // check if requested updates are allowed
  const requestedUpdates = Object.keys(req.body); // returns the properties of the user object entered as an update field as an array
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidUpdateRequest = requestedUpdates.every((requestedUpdate) => {
    return allowedUpdates.includes(requestedUpdate);
  });

  if(!isValidUpdateRequest) {
    return res.status(400).send({ error: 'Invalid Updates!'});
  }

  // if requested updates are allowed, proceed with the given user id
  try {
    /* findByIdAndUpdate() bypasses mongoose and performs a direct operation on the database, so to make
    middlewares work on updates as well, different approach is taken to update data 
    so update operation has been done in a traditional mongoose way */
    // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true});
    /* in options object, new: true will return the user with the updates applied
    new: false is set by default and it returns the user before update took place
    runValidators: true will run validation checks like it does while creation
    */
    const user = req.user;

    // iterate through the updates that the user wants to make and assign the new value to user object
    requestedUpdates.forEach((requestedUpdate) => {
      user[requestedUpdate] = req.body[requestedUpdate];
    });

    await user.save(); // save the user with updates applied
    res.send(user);
  } catch(error) {
    res.status(500).send(error);
  }
})

// delete a user's own profile
router.delete('/users/me', auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);  // user object was attached to req object in auth middleware
    await req.user.remove();  // does the same thing as findByIdAndDelete()
    res.send(req.user);
  } catch(error) {
    res.status(500).send(error);
  }
})

// login a user with its credentials
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch(error) {
    res.status(400).send(error);
  }
})

// logout a user from current device
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      // filtering through each token from tokens array, token is an object that has two properties, _id and token
      return token.token !== req.token;  // returns true only when the currently logged in user's token does not match other tokens, so the user can log out only from one device where logout is requested
    });
    await req.user.save();
    res.send(`Good Bye ${req.user.name}!`);
  } catch(error) {
    res.status(500).send('Cant logout');
  }
})

// logout a user from all devices
router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = []; // leaving the array empty to clear all the sessions
    await req.user.save();
    res.send(`Good Bye ${req.user.name} from all devices!`);
  } catch(error) {
    res.status(500).send('Cant logout');
  }
})

module.exports = router;