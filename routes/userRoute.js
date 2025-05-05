import express from 'express'
import { authToken } from '../helpers/authToken.js' 
import { deleterUser, editUser, loginUser, registerUser, getUserById } from '../controllers/UserController.js'

const userRoute = express.Router()  

// rotas publicas do usuário 
userRoute.post('/register', registerUser)
userRoute.post('/sign', loginUser) 

// rotas privadas usuário 
userRoute.put('/edit', authToken, editUser)
userRoute.delete('/delete', authToken, deleterUser)
userRoute.get('/user/:id', authToken, getUserById);


export default userRoute