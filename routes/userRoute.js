import express from 'express'
import { authToken } from '../helpers/authToken.js' 
import { deleterUser, editUser, loginUser, registerUser } from '../controllers/UserController.js'

const userRoute = express.Router()  

// rotas publicas do usuário 
userRoute.post('/register', registerUser)
userRoute.post('/sign', loginUser) 

// rotas privadas usuário 
userRoute.put('/edit', authToken, editUser)
userRoute.delete('/delete', authToken, deleterUser)


export default userRoute