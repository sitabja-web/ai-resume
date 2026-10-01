const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod/v3")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewModels = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite"
]

function isRetryableModelError(error) {
    const status = Number(error.status || error.code)
    return [ 429, 500, 502, 503, 504 ].includes(status)
        || [ "InvalidModelOutputError", "SyntaxError" ].includes(error.name)
        || /UNAVAILABLE|RESOURCE_EXHAUSTED/.test(error.message || "")
}

async function generateStructuredResponse(prompt, schema) {
    let lastError
    for (const [ index, model ] of interviewModels.entries()) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(schema)
                }
            })
            const parsedResponse = schema.safeParse(JSON.parse(response.text))
            if (!parsedResponse.success) {
                const error = new Error("Gemini returned data that did not match the required schema.")
                error.name = "InvalidModelOutputError"
                throw error
            }
            return parsedResponse.data
        } catch (error) {
            lastError = error
            if (!isRetryableModelError(error) || index === interviewModels.length - 1) throw error
            console.warn(`Gemini model ${model} failed; trying fallback model.`)
        }
    }
    throw lastError
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate a complete interview report for this candidate. Return every field in the response schema, including at least five technical questions, five behavioral questions, skill gaps, a preparation plan, a 0-100 match score, and the job title.
                        Candidate details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    return generateStructuredResponse(prompt, interviewReportSchema)

}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    try {
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })
        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
        })
    } finally {
        await browser.close()
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const { html } = await generateStructuredResponse(prompt, resumePdfSchema)
    return generatePdfFromHtml(html)

}

module.exports = { generateInterviewReport, generateResumePdf }