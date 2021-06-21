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

// read all user
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch(error) {
    res.status(500).send(error);
  }
})

// read one user using id
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if(!user) {
      return res.status(404).send('User not found!')
    }
    res.send(user);
  } catch(error) {
    res.status(500).send(error);
  }
})

// update a user by id
router.patch('/users/:id', async (req, res) => {
  const _id = req.params.id;

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
    so update operation has been done in a traditional mongoose way from line 67 */
    // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true});
    /* in options object, new: true will return the user with the updates applied
    new: false is set by default and it returns the user before update took place
    runValidators: true will run validation checks like it does while creation
    */
    const user = await User.findById(_id);

    // iterate through the updates that the user wants to make and assign the new value to user object
    requestedUpdates.forEach((requestedUpdate) => {
      user[requestedUpdate] = req.body[requestedUpdate];
    });

    await user.save(); // save the user with updates applied

    if(!user) {
      return res.status(404).send('User not found!')
    }
    res.send(user);
  } catch(error) {
    res.status(500).send(error);
  }
})

// delete a user by id
router.delete('/users/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findByIdAndDelete(_id);
    if(!user) {
      return res.status(404).send('User not found!')
    }
    res.send(user);
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

module.exports = router;