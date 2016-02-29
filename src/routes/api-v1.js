import express from 'express'

import usersRouter from './users'

const apiv1 = express.Router()
apiv1.use('/users', usersRouter)

export default apiv1
