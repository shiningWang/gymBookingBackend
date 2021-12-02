const { Number } = require('mongoose')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Utils = require('./../utils')

//types
// group
// yoga
// personal

// schema
const bookingSchema = new mongoose.Schema({
  startTime: {
    type: Number,
    require: true
  },
  endTime: {
    type: Number,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  sessionType: {
    type: String,
    require: true
  },
  attendeeLimit: {
    type: Number,
    require: true
  },
  attendees: {
    type: Array
  }
}, { timestamps: true })

// encrypt password field on save
bookingSchema.pre('save', function (next) {
  // check if password is present and is modifed  
  if (this.password && this.isModified()) {
    this.password = Utils.hashPassword(this.password);
  }
  next()
})

// model
const bookingModel = mongoose.model('Booking', bookingSchema)

// export
module.exports = bookingModel




