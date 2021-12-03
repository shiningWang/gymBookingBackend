const express = require('express')
const router = express.Router()
const Utils = require('./../utils')
const User = require('./../models/User')
const Booking = require('./../models/Booking')
const path = require('path')

var bodyParser = require('body-parser');
router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// POST - create new bookings --------------------------------------
router.post('/newbooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length != 6) {
        return res.status(400).json({ 
            message: "User content can not be empty",
            error: "error"
        })
    }

    // this is how to get current universal timestamp
    let timePending = new Date();
    let serverTime = (timePending.getTime() + timePending.getTimezoneOffset());

    console.log(new Date(serverTime))

    if (serverTime > parseInt(req.body.startTime)) {
        return res.status(406).json({
            message: "Session Data Not Valid",
            error: "error"
        })
    }

    // check is there any class
    Booking.find({ startTime: { $lte: req.body.endTime, $gte: serverTime }, endTime: { $gte: req.body.startTime }, sessionType: req.body.sessionType })
        .then(booking => {
            if (Object.keys(booking).length != 0) {
                return res.status(406).json({
                    message: "Session Times Conflict",
                    error: "error"
                })
            } else {

                let fetchServerData = req.body
                // ready to send to server is fetchServerData
                let newBooking = new Booking(fetchServerData)
                newBooking.save()
                    .then(booking => {
                        return res.status(201).json(booking)
                    })
                    .catch(err => {
                        console.log(err)
                        return res.status(500).json({
                            message: "Problem Creating Booking",
                            error: err
                        })
                    })
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({
                message: "Couldn't Get User",
                error: err
            })
        })
})

// fetch to return all available bookings
// to the users that want to make booking
// need to take type of the session
router.post('/availablebooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "User content can not be empty",
            error: "error"
        })
    }
    let timePending = new Date();
    let serverTime = (timePending.getTime() + timePending.getTimezoneOffset());

    Booking.find({ startTime: { $gte: serverTime }, sessionType: req.body.sessionType })
        .then(result => {
            if (Object.keys(result).length === 0) {
                return res.status(406).json({
                    message: "No Session Times Available",
                    error: "error"
                })
            } else {
                return res.status(200).json(result)
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Problem Getting Booking",
                error: err
            })
        })
})

//find user upcoming bookings
router.post('/clientfind', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "User content can not be empty",
            error: "error"
        })
    }

    let timePending = new Date()
    let serverTime = (timePending.getTime() + timePending.getTimezoneOffset());

    Booking.find({ startTime: { $gte: serverTime }, attendees: { $in: req.body.clientId } })
        .then(result => {
            if (Object.keys(result).length === 0) {
                return res.status(406).json({
                    message: "Currently No Booking Has Been Made",
                    error: "error"
                })
            } else {
                return res.status(200).json(result)
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Problem Getting Booking",
                error: err
            })
        })
})

router.post('/findbooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "User content can not be empty",
            error: "error"
        })
    }

    Booking.find({ _id: req.body.sessionId })
        .then(result => {
            if (Object.keys(result).length === 0) {
                return res.status(406).json({
                    message: "No Session Times Available",
                    error: "error"
                })
            } else {
                return res.status(200).json(result)
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Problem Getting Booking",
                error: err
            })
        })
})


//client to make new booking here
router.post('/makebooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "Content can not be empty",
            error: "error"
        })
    } else {
        Booking.find({ _id: req.body.sessionId })
            .then(result => {
                return result[0]
            })
            .then(sessionDetail => {
                if (sessionDetail.attendees.includes(req.body.clientId) === true) {
                    return res.status(406).send({
                        message: "Already registered this session",
                        error: "error"
                    })
                } else {
                    if (Object.keys(sessionDetail.attendees).length == sessionDetail.attendeeLimit) {
                        return res.status(406).send({
                            message: "This session is full",
                            error: "error"
                        })
                    } else {
                        let sessionAttendees = sessionDetail.attendees
                        let currentClientId = [req.body.clientId]
                        let updateSessionAttendees = sessionAttendees.concat(currentClientId)
                        Booking.findOneAndUpdate({ _id: req.body.sessionId }, { attendees: updateSessionAttendees }, { new: true })
                            .then(updatedSession => {
                                return res.status(200).json(updatedSession)
                            })
                            .catch(err => {
                                return res.status(406).send({
                                    message: "Problem When Booking",
                                    error: err
                                })
                            })
                    }
                }
            })
            .catch(err => {
                console.log(err)
            })
    }
})

//client to make new booking here
router.post('/withdrawbooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "Content can not be empty",
            error: "error"
        })
    } else {
        Booking.find({ _id: req.body.sessionId })
            .then(result => {
                return result[0]
            })
            .then(sessionDetail => {
                console.log(sessionDetail)
                console.log(sessionDetail.attendees)
                console.log(req.body.sessionId)
                if (sessionDetail.attendees.indexOf(req.body.clientId) < 0){
                    return res.status(406).send({
                        message: "Not registered in this session",
                        error: "error"
                    })
                } else {
                    let sessionAttendees = []
                    sessionDetail.attendees.forEach(attendee => {
                        if (attendee != req.body.clientId) {
                            sessionAttendees.push(attendee)
                        } else {
                            //pass
                        }
                    })

                    Booking.findOneAndUpdate({ _id: req.body.sessionId }, { attendees: sessionAttendees }, { new: true })
                        .then(updatedSession => {
                            return res.status(201).json(updatedSession)
                        })
                        .catch(err => {
                            return res.status(500).send({
                                message: "Problem When Withdraw, Try Again Later",
                                error: err
                            })
                        })
                }

            })
            .catch(err => {
                console.log(err)
            })
    }
})

// this is for admin to delete existing session
router.post('/deletebooking', Utils.authenticateToken, (req, res) => {
    // validate request
    if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
            message: "Content can not be empty",
            error: "error"
        })
    } else {
        Booking.findOneAndRemove({ _id: req.body.sessionId })
            .then(result => {
                return res.status(200).json({
                    message: "success"
                })
            })
            .catch(err => {
                return res.status(500).send({
                    message: "Problem when deleting session",
                    error: "error"
                })
            })
    }
})

module.exports = router