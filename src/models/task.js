const mongoose = require('mongoose');

// model for Tasks
const Task = mongoose.model('Task', {
  description: {
      type: String,
      required: true,
      trim: true
  },
  completed: {
      type: Boolean,
      default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // ref is used to keep reference to another model, here User model is kept for using populate method on any task 
  }
})

module.exports = Task;