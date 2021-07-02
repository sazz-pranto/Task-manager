const express = require('express');

const Task = require('../models/task');
const auth = require('../middlewares/auth');  // authenticates user

const router = express.Router();

//creating a task
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,  // getting all the properties for a task passed in the body
    owner: req.user._id  // getting user's id from user object attached to req object in auth middleware
  });
  try {
    await task.save()
    res.status(201).send(task);
  } catch(error) {
    res.status(400).send(error);
  }
})

// read all tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id });
    res.send(tasks);

    // another way of getting the user's own tasks
    // await req.user.populate('tasks').execPopulate();
    // res.send(req.user.tasks);
  } catch(error) {
    res.status(500).send(error);
  }
})

// read one task by id
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;  
  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// update a task by id
router.patch('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  // check if requested updates are allowed
  const requestedUpdates = Object.keys(req.body); // returns the properties of the user object as an array
  const allowedUpdates = ['completed', 'description'];
  const isValidUpdateRequest = requestedUpdates.every((requestedUpdate) => {
    return allowedUpdates.includes(requestedUpdate);
  });

  if(!isValidUpdateRequest) {
    return res.status(400).send({ error: 'Invalid Updates!'});
  }

  // if requested updates are allowed, proceed with the given task id
  try {
    /* findByIdAndUpdate() bypasses mongoose and performs a direct operation on the database, so to make
    middlewares work on updates as well, different approach is taken to update data 
    so update operation has been done in a traditional mongoose way */
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true});
    /* in options object, new: true will return the task with the updates applied
    new: false is set by default and it returns the task before update took place
    runValidators: true will run validation checks like it does while creation
    */
    
    const task = await Task.findOne({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }

    // iterate through the updates that the user wants to make and assign the new value to task object
    requestedUpdates.forEach((requestedUpdate) => {
      task[requestedUpdate] = req.body[requestedUpdate];
    })

    await task.save();
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// delete a task by id
router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

module.exports = router;