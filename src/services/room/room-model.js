'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId


const roomSchema = new Schema({
  name: { type: String, required: true },

  owner: { type: ObjectId },

  creator: Object,

  // 4 number id
  id: { type: Number },

  // optional 4 number password
  password: { type: Number },

  questions: [{

    // actual quesiton
    text: { type: String, required: true },

    // answer possibilities
    options: [{
      text: { type: String, required: true },

      answer: { type: Boolean },

      // list of users who have already answered this question
      answered: [{ type: ObjectId }]
    }],

    // is the quiz still open or locked?
    open: { type: Boolean, default: true }
  }],

  // is the quiz still open or locked?
  open: { type: Boolean, default: true },

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const roomModel = mongoose.model('room', roomSchema);

module.exports = roomModel;
