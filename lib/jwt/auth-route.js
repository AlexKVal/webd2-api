'use strict'

const jwt = require('jsonwebtoken')

const User = require('../models/user')

/**
 * POST route
 * id and password => { token: JWT-Token }
 */
module.exports = function authenticateRoute (req, res, next) {
  User.passwordVerify(req.body.id, req.body.password)
  .then((user) => {
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name
      },
      req.app.get('jwtSecret'),
      { expiresIn: 60 * 60 * 12 } // 12h
    )

    res.status(201).json({ token })
  })
  .catch((err) => next(err))
}
