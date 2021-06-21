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
  }
})

module.exports = Task;