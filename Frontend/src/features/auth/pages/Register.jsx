import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ errorMessage, setErrorMessage ] = useState("")

    const {loading,handleRegister} = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage("")
        try {
            const user = await handleRegister({ username, email, password })
            if (user) {
                toast.success('Account created successfully.')
                navigate("/")
            }
        } catch (error) {
            const message = error.response?.data?.message || "Unable to create your account. Please try again."
            setErrorMessage(message)
            toast.error(message)
        }
    }

    if(loading){
        return (<main className="auth-page"><h1>Loading.......</h1></main>)
    }

    return (
        <main className="auth-page">
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            required
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            required
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            required
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>

                    {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
                    <button className='button primary-button' >Register</button>

                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register