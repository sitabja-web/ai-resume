const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    let resume = ""
    if (req.file?.originalname.toLowerCase().endsWith(".pdf")) {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        resume = resumeContent.text || ""
    } else if (req.file) {
        const resumeContent = await mammoth.extractRawText({ buffer: req.file.buffer })
        resume = resumeContent.value || ""
    }

    const { selfDescription, jobDescription } = req.body

    if (!jobDescription?.trim() || (!resume.trim() && !selfDescription?.trim())) {
        return res.status(400).json({
            message: "A job description and either a PDF resume or experience summary are required."
        })
    }

    let interViewReportByAi
    try {
        interViewReportByAi = await generateInterviewReport({
            resume,
            selfDescription,
            jobDescription
        })
    } catch (error) {
        const status = Number(error.status || error.code)
        const isTemporary = [ 429, 500, 502, 503, 504 ].includes(status)
            || /UNAVAILABLE|RESOURCE_EXHAUSTED/.test(error.message || "")
        console.error("Interview report generation failed:", error.message)
        return res.status(isTemporary ? 503 : 502).json({
            message: isTemporary
                ? "The AI service is temporarily busy. Please try again in a minute."
                : "The AI service could not generate your plan. Please try again."
        })
    }
    const fallbackTitle = jobDescription.split(/\r?\n/).map(line => line.trim()).find(Boolean)
    const title = interViewReportByAi.title?.trim() || fallbackTitle?.slice(0, 120) || "Interview preparation"

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume,
        selfDescription,
        jobDescription,
        ...interViewReportByAi,
        title
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

async function deleteInterviewReportController(req, res) {
    const interviewReport = await interviewReportModel.findOneAndDelete({
        _id: req.params.interviewId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    return res.status(200).json({ message: "Interview report deleted successfully." })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    let pdfBuffer
    try {
        pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })
    } catch (error) {
        console.error("Resume PDF generation failed:", error.message)
        return res.status(502).json({ message: "Could not generate the resume PDF. Please try again." })
    }

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, deleteInterviewReportController, generateResumePdfController }

