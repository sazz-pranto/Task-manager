const express = require('express');
const multer = require('multer');
const sharp = require('sharp'); // module for resizing images

const User = require('../models/user');
const auth = require('../middlewares/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');

const router = express.Router();

// multer configuration for image upload  
const upload = multer({
  limits: {
    fileSize: 1000000, // maximum filesize in bytes
  },
  fileFilter(req, file, cb) {
    // if file is not jpg, jpeg or png, throw error
    if(!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only jpg, jpeg or png files are supported!'));
    }
    // if filetype is allowed, accept the file with error set to null and true for the file
    cb(null, true);
  }
});

// creating a user
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name); // sending a welcome email after saving the user's data
    // once the user is saved to the database, generate an auth token so that the user automatically gets logged in
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch(error) {
    res.status(400).send(error)
  }
})

// read currently logged in user
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);  // the user that is logged in was assigned to req object in auth middleware

})

// update a user profile
router.patch('/users/me', auth, async (req, res) => {
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
    sendCancellationEmail(req.user.email, req.user.name); // send an email on profile cancellation
    res.send(req.user);
  } catch(error) {
    res.status(500).send(error);
  }
})

// upload user's profile photo
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();  // req.file.buffer has the binary data for user's image
  req.user.avatar = buffer;  // buffer contains the buffer for the image after resizing and changing to png using sharp
  await req.user.save();
  res.status(200).send('Image uploaded');
}, (error, req, res, next) => { // this callback runs when upload.single() middleware throws an error
  res.status(400).send({ error: error.message });
})

// delete a user's avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send('Image deleted!');
})

// get user's avatar rendered in the browser
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    // if there's no user or user does not have an image to show, throw an error
    if(!user || !user.avatar) {
      throw new Error();
    }

    // set response header to render the image
    res.set('Content-Type', 'image/png');
    res.send(user.avatar); // sending the image data to the browser
  } catch(err) {
    res.status(400).send();
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