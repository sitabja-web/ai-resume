import React,{useState} from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ errorMessage, setErrorMessage ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage("")
        try {
            const user = await handleLogin({ email, password })
            if (user) {
                toast.success('Signed in successfully.')
                navigate('/')
            }
        } catch (error) {
            const message = error.response?.data?.message || "Unable to sign in. Please try again."
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
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
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
                    <button className='button primary-button' >Login</button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login