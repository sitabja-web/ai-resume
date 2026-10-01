import { useRef, useState } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { toast } from 'sonner'

const formatPlanDateTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Saved plan'
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const Home = () => {
    const { user, loading: authLoading, handleLogout } = useAuth()
    const { loading, generateReport, reports, deleteReport } = useInterview({ enabled: Boolean(user) })
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [resumeFile, setResumeFile] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const resumeInputRef = useRef()
    const navigate = useNavigate()

    const gatePlannerInput = (event) => {
        if (authLoading) {
            event.currentTarget.blur()
            return
        }
        if (!user) {
            event.currentTarget.blur()
            setShowAuthPrompt(true)
        }
    }

    const handleLogoutClick = async () => {
        try {
            await handleLogout()
            setJobDescription("")
            setSelfDescription("")
            setResumeFile(null)
            setErrorMessage("")
            toast.success('Signed out.')
        } catch {
            setErrorMessage("Unable to sign out. Please try again.")
            toast.error("Unable to sign out. Please try again.")
        }
    }

    const removeReport = async (report) => {
        try {
            await toast.promise(deleteReport(report._id), {
                loading: 'Removing plan...',
                success: 'Plan removed from your recent plans.',
                error: (error) => error.response?.data?.message || 'Unable to remove this plan.'
            })
        } catch (error) {
            const message = error.response?.data?.message || "Unable to remove this plan. Please try again."
            setErrorMessage(message)
        }
    }

    const handleDeleteReport = (report) => {
        toast(`Remove "${report.title || 'Interview plan'}"?`, {
            description: 'This permanently deletes the saved plan.',
            action: {
                label: 'Delete',
                onClick: () => { removeReport(report) }
            },
            cancel: {
                label: 'Cancel'
            }
        })
    }

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        const isSupportedType = /\.(pdf|docx)$/i.test(file.name)
        if (!isSupportedType) {
            setErrorMessage("Choose a PDF or DOCX resume.")
            toast.error('Choose a PDF or DOCX resume.')
            event.target.value = ""
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Your resume must be 5 MB or smaller.")
            toast.error('Your resume must be 5 MB or smaller.')
            event.target.value = ""
            return
        }

        setErrorMessage("")
        setResumeFile(file)
        toast.success('Resume attached.')
    }

    const handleGenerateReport = async (event) => {
        event.preventDefault()
        setErrorMessage("")

        if (!user) {
            setShowAuthPrompt(true)
            return
        }

        if (!jobDescription.trim()) {
            setErrorMessage("Add the job description to build your interview plan.")
            toast.error('Add the job description to continue.')
            return
        }
        if (!resumeFile && !selfDescription.trim()) {
            setErrorMessage("Upload a resume or add a short profile summary.")
            toast.error('Upload a resume or add an experience summary.')
            return
        }

        try {
            const request = generateReport({ jobDescription, selfDescription, resumeFile }).then(data => {
                if (!data?._id) throw new Error("Report generation failed")
                return data
            })
            const data = await toast.promise(request, {
                loading: 'Building your interview plan...',
                success: 'Your interview plan is ready.',
                error: (error) => error.response?.data?.message || "We couldn't create your plan. Please try again."
            })
            navigate(`/interview/${data._id}`)
        } catch (error) {
            const message = error.response?.data?.message || "We couldn't create your plan. Check your connection and try again."
            setErrorMessage(message)
        }
    }

    return (
        <div className='home-page'>
            <header className='topbar'>
                <a className='brand' href='/' aria-label='Interview Studio home'>
                    <span className='brand__mark' aria-hidden='true'>
                        <svg viewBox='0 0 24 24' fill='none'><path d='M5 4.75h9.25L19 9.5v9.75a1.75 1.75 0 0 1-1.75 1.75h-10A1.75 1.75 0 0 1 5.5 19.25v-13A1.5 1.5 0 0 1 7 4.75Z' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round'/><path d='M14 5v5h5M8.5 13h7M8.5 16.5h4' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/><path d='m16.25 15.25.8 1.65 1.7.25-1.25 1.2.3 1.7-1.55-.8-1.55.8.3-1.7-1.25-1.2 1.7-.25.8-1.65Z' fill='currentColor'/></svg>
                    </span>
                    <span>Interview Studio</span>
                </a>
                <div className='topbar-actions'>
                    {user ? (
                        <>
                            <div className='topbar__status'><span />{user.username || 'Signed in'}</div>
                            <button className='topbar-action' type='button' onClick={handleLogoutClick} aria-label='Sign out' title='Sign out'>
                                <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className='topbar__status'><span />Public preview</div>
                            <Link className='topbar-link' to='/login'>Sign in</Link>
                            <Link className='topbar-link topbar-link--primary' to='/register'>Create account</Link>
                        </>
                    )}
                </div>
            </header>

            <main className='home-content'>
                <section className='page-header'>
                    <div className='eyebrow'><span>INTERVIEW PREP</span><span className='eyebrow__line' /></div>
                    <h1>Walk in <span className='highlight'>ready.</span></h1>
                    <p>Build a focused plan from the role you want and the experience you bring.</p>
                </section>

                <div className='workspace-layout'>
                    <form className='interview-card' onSubmit={handleGenerateReport}>
                        <div className='card-heading'>
                            <div>
                                <span className='step-label'>01 / YOUR BRIEF</span>
                                <h2>Set the direction</h2>
                            </div>
                            <span className='required-note'><span>*</span> Required</span>
                        </div>

                        <div className='interview-card__body'>
                    <div className='panel panel--left'>
                                <label className='section-label' htmlFor='jobDescription'>
                                    <span className='field-number'>A</span>
                                    Target role <span className='field-required'>*</span>
                                </label>
                                <textarea
                                    id='jobDescription'
                                    name='jobDescription'
                                    value={jobDescription}
                                    onChange={(event) => setJobDescription(event.target.value)}
                                    onFocus={gatePlannerInput}
                                    className='panel__textarea'
                                    placeholder='Paste the job description here. Include responsibilities, required skills, and anything the team values.'
                                    maxLength={5000}
                                    aria-describedby='jobDescription-count'
                                />
                                <div className='field-meta' id='jobDescription-count'>
                                    <span>Include the full listing for a more targeted plan.</span>
                                    <span>{jobDescription.length.toLocaleString()} / 5,000</span>
                                </div>
                            </div>

                            <div className='panel panel--right'>
                                <label className='section-label' htmlFor='resume'>
                                    <span className='field-number'>B</span>
                                    Your experience <span className='field-required'>*</span>
                                </label>
                                <input
                                    ref={resumeInputRef}
                                    className='visually-hidden'
                                    type='file'
                                    id='resume'
                                    name='resume'
                                    accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                    onChange={handleResumeChange}
                                    onFocus={gatePlannerInput}
                                />
                                <label className='dropzone' htmlFor='resume' onClick={(event) => {
                                    if (authLoading || !user) {
                                        event.preventDefault()
                                        setShowAuthPrompt(!authLoading)
                                    }
                                }}>
                                    <span className='dropzone__icon' aria-hidden='true'>
                                        <svg viewBox='0 0 24 24' fill='none'><path d='M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.25A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round'/></svg>
                                    </span>
                                    <span className='dropzone__title'>{resumeFile ? resumeFile.name : 'Choose a resume'}</span>
                                    <span className='dropzone__subtitle'>{resumeFile ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB · PDF or DOCX` : 'PDF or DOCX · Up to 5 MB'}</span>
                                </label>
                                {resumeFile && (
                                    <button className='remove-file' type='button' onClick={() => {
                                        setResumeFile(null)
                                        resumeInputRef.current.value = ""
                                    }}>Remove resume</button>
                                )}
                                <div className='or-divider'><span>OR ADD A SHORT SUMMARY</span></div>
                                <label className='visually-hidden' htmlFor='selfDescription'>Experience summary</label>
                                <textarea
                                    id='selfDescription'
                                    name='selfDescription'
                                    value={selfDescription}
                                    onChange={(event) => setSelfDescription(event.target.value)}
                                    onFocus={gatePlannerInput}
                                    className='panel__textarea panel__textarea--short'
                                    placeholder='Your role, years of experience, strengths, and a few relevant wins.'
                                    maxLength={1500}
                                />
                                <div className='field-meta field-meta--compact'>{selfDescription.length} / 1,500</div>
                            </div>
                        </div>

                        <div className='interview-card__footer'>
                            <div className='form-feedback' aria-live='polite'>
                                {errorMessage ? <p className='form-error'>{errorMessage}</p> : <p className='footer-info'>{user ? 'Your plan is private to your account.' : 'Sign in when you are ready to create a plan.'}</p>}
                            </div>
                            <button className='generate-btn' type='submit' disabled={loading}>
                                {loading ? <span className='button-spinner' aria-hidden='true' /> : <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'/><path d='m12 8 1.35 2.65L16 12l-2.65 1.35L12 16l-1.35-2.65L8 12l2.65-1.35L12 8Z' fill='currentColor'/></svg>}
                                {loading ? 'Building your plan...' : 'Build my interview plan'}
                            </button>
                        </div>
                    </form>

                    <aside className='workspace-rail' aria-label='Interview plan workspace'>
                        <section className='brief-panel'>
                            <span className='step-label'>AT A GLANCE</span>
                            <h2>Your prep brief</h2>
                            <div className='brief-status'>
                                <span className={`status-dot ${jobDescription.trim() ? 'is-ready' : ''}`} />
                                <span>Target role</span>
                                <strong>{jobDescription.trim() ? 'Added' : 'Waiting'}</strong>
                            </div>
                            <div className='brief-status'>
                                <span className={`status-dot ${resumeFile || selfDescription.trim() ? 'is-ready' : ''}`} />
                                <span>Your experience</span>
                                <strong>{resumeFile ? 'Resume' : selfDescription.trim() ? 'Summary' : 'Waiting'}</strong>
                            </div>
                            <div className='brief-rule' />
                            <p className='brief-note'>Two details are all it takes to get started.</p>
                        </section>

                        <section className='recent-reports'>
                            <div className='recent-heading'>
                                <div><span className='step-label'>YOUR LIBRARY</span><h2>Recent plans</h2></div>
                                <span className='report-count'>{reports.length}</span>
                            </div>
                            {user && reports.length > 0 ? (
                                <ul className='reports-list'>
                                    {reports.slice(0, 5).map((report) => (
                                        <li className='report-row' key={report._id}>
                                            <button className='report-item' type='button' onClick={() => navigate(`/interview/${report._id}`)}>
                                                <span className='report-item__icon' aria-hidden='true'><svg viewBox='0 0 24 24' fill='none'><path d='M7 17 17 7M8 7h9v9' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
                                                <span className='report-item__content'>
                                                    <strong>{report.title || 'Interview plan'}</strong>
                                                    <small>{formatPlanDateTime(report.createdAt)}</small>
                                                </span>
                                            </button>
                                            <button className='report-delete' type='button' aria-label={`Delete ${report.title || 'interview plan'}`} title='Delete plan' onClick={() => handleDeleteReport(report)}>
                                                <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'><path d='M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round'/></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className='empty-reports'>{user ? 'Your plans will appear here after you create one.' : 'Sign in to create and view your saved plans.'}</p>
                            )}
                        </section>
                    </aside>
                </div>

                <footer className='page-footer'><span>INTERVIEW STUDIO</span><span>Make the next conversation count.</span></footer>
            </main>
            {showAuthPrompt && (
                <div className='auth-prompt-backdrop' onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setShowAuthPrompt(false)
                }}>
                    <section className='auth-prompt' role='dialog' aria-modal='true' aria-labelledby='auth-prompt-title'>
                        <button className='auth-prompt__close' type='button' aria-label='Close' onClick={() => setShowAuthPrompt(false)}>×</button>
                        <span className='step-label'>YOUR PLAN, YOUR ACCOUNT</span>
                        <h2 id='auth-prompt-title'>Sign in to continue</h2>
                        <p>Create an account or sign in before adding personal information or uploading a resume.</p>
                        <div className='auth-prompt__actions'>
                            <Link className='generate-btn' to='/login'>Sign in</Link>
                            <Link className='auth-prompt__register' to='/register'>Create account</Link>
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}

export default Home