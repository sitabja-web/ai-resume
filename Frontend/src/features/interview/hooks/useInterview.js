import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReport } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
import { toast } from "sonner"


export const useInterview = ({ enabled = true } = {}) => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            const interviewReports = response?.interviewReports ?? []
            setReports(interviewReports)
            return interviewReports
        } catch (error) {
            setReports([])
            if (error.response?.status !== 401) console.error(error)
            return []
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (interviewId) => {
        await deleteInterviewReport(interviewId)
        setReports(currentReports => currentReports.filter(reportItem => reportItem._id !== interviewId))
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const download = generateResumePdf({ interviewReportId }).then(response => {
                const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
                const link = document.createElement("a")
                link.href = url
                link.setAttribute("download", `resume_${interviewReportId}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
            })
            await toast.promise(download, {
                loading: 'Preparing your resume PDF...',
                success: 'Resume PDF downloaded.',
                error: 'Unable to generate the resume PDF. Please try again.'
            })
        } catch (error) {
            console.error('Resume PDF download failed:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!enabled) return
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, enabled ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, deleteReport }

}