const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// creating a Schema for users, this schema maps to the User collection and defines the shape of the documents within that collection.
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true, // requires the email to be unique
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid')
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a postive number')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate(value) {
      if(value.toLowerCase().includes('password')) {
        throw new Error("Password cannot contain 'password'!")
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
});

// adding a virtual method
// virtual method adds a property (here tasks) that is not stored in the database, it is just a way for mongoose to figure out how these two things (User and Task) are related
userSchema.virtual('tasks', {
  /* Mongoose will populate documents from the model in ref (here Task) whose 
  foreignField matches this document's localField */
  ref: 'Task',
  localField: '_id',  // here _id is the property in User model, so its the local field
  foreignField: 'owner'  // here owner is the property in Task model, so its the foreign field
})

// defining a method that will only be accessible with the instance (using Schema.methods object), not the model
userSchema.methods.generateAuthToken = async function() {
  const user = this;  // refers to the specific user for which the token is being generated

  // setting up a token for the user with its id and signing it
  const token = jwt.sign({ id: user._id.toString() }, 'secretxD'); // id should be converted to string cause its an ObjectId by default
  
  // concat the newly created token to the user's properties
  user.tokens = user.tokens.concat({ token: token });

  await user.save();

  return token;

}

// method to get profile details for a user to share publicly
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();  // mongodb's built in method toObject(), returns an object only properties that are added by the user, not the ones that mongodb adds
  delete userObject.password; // removing password from userObject
  delete userObject.tokens; // removing tokens array from userObject
  return userObject;
}

// findByCredentials is a function on the schema to check user's credentials before login, will be called in the user router
// statics lets us use this method directly on the model (User) without creating an instance of it.
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });
  if(!user) {
    throw new Error('Email not found!');
  }

  // if the email exists, check whether the password matches the password of the corresponding user
  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch) {
    throw new Error('Passwords do not match!');
  }

  // return the user if credentials are found
  return user;
}

/* creating a middleware using .pre() method on the schema to work just before the event, here the event is 'save' that saves the user.
as a callback, arrow funciton is not used cause is does not bind 'this', and 'this' is used here which refers to the document that's being saved.
*/
userSchema.pre('save', async function (next) {
  const user = this;  // refers to the specific user

  // check if the password is created or modified, hash it only if its modified(while updating), or created(when password is entered for the first time)
  if(user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8); // hashes user.password-> the actual password, 8-> number of rounds
  }

  next(); // proceeds to the next step(saving the data to the database)

})

// model for Users
const User = mongoose.model('User', userSchema);

module.exports = User;