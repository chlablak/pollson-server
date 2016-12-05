'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: { type: String, required: true },

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

      // how many people chose this answer?
      count: { type: Number, default: 0 }
    }],

    // the number to the right answer (index from 0 to options.length - 1)
    answer: { type: Number },

    // is the quiz still open or locked?
    open: { type: Boolean, default: true },
  }],

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

const roomModel = mongoose.model('room', roomSchema);

module.exports = roomModel;
