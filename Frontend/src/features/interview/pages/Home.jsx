import { useRef, useState } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'

const Home = () => {
    const { loading, generateReport, reports } = useInterview()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [resumeFile, setResumeFile] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    const resumeInputRef = useRef()
    const navigate = useNavigate()

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        const isSupportedType = /\.(pdf|docx)$/i.test(file.name)
        if (!isSupportedType) {
            setErrorMessage("Choose a PDF or DOCX resume.")
            event.target.value = ""
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Your resume must be 5 MB or smaller.")
            event.target.value = ""
            return
        }

        setErrorMessage("")
        setResumeFile(file)
    }

    const handleGenerateReport = async (event) => {
        event.preventDefault()
        setErrorMessage("")

        if (!jobDescription.trim()) {
            setErrorMessage("Add the job description to build your interview plan.")
            return
        }
        if (!resumeFile && !selfDescription.trim()) {
            setErrorMessage("Upload a resume or add a short profile summary.")
            return
        }

        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            if (!data?._id) throw new Error("Report generation failed")
            navigate(`/interview/${data._id}`)
        } catch {
            setErrorMessage("We couldn't create your plan. Check your connection and try again.")
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
                <div className='topbar__status'><span />Private workspace</div>
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
                                />
                                <label className='dropzone' htmlFor='resume'>
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
                                    className='panel__textarea panel__textarea--short'
                                    placeholder='Your role, years of experience, strengths, and a few relevant wins.'
                                    maxLength={1500}
                                />
                                <div className='field-meta field-meta--compact'>{selfDescription.length} / 1,500</div>
                            </div>
                        </div>

                        <div className='interview-card__footer'>
                            <div className='form-feedback' aria-live='polite'>
                                {errorMessage ? <p className='form-error'>{errorMessage}</p> : <p className='footer-info'>Your resume or summary stays attached to this plan.</p>}
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
                            {reports.length > 0 ? (
                                <ul className='reports-list'>
                                    {reports.slice(0, 5).map((report) => (
                                        <li key={report._id}>
                                            <button className='report-item' type='button' onClick={() => navigate(`/interview/${report._id}`)}>
                                                <span className='report-item__icon' aria-hidden='true'><svg viewBox='0 0 24 24' fill='none'><path d='M7 17 17 7M8 7h9v9' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
                                                <span className='report-item__content'>
                                                    <strong>{report.title || 'Interview plan'}</strong>
                                                    <small>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Saved plan'}</small>
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className='empty-reports'>Your plans will appear here after you create one.</p>
                            )}
                        </section>
                    </aside>
                </div>

                <footer className='page-footer'><span>INTERVIEW STUDIO</span><span>Make the next conversation count.</span></footer>
            </main>
        </div>
    )
}

export default Home