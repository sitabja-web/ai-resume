const express = require("express")
const { generateInterviewReport } = require("./services/ai.service")

const app = express()

app.use(express.json())

app.post("/api/interview-report", async (req, res) => {
	try {
		const report = await generateInterviewReport(req.body)
		res.status(200).json(report)
	} catch (error) {
		console.error("Interview report generation failed:", error.message)
		res.status(500).json({ message: "Failed to generate interview report" })
	}
})

module.exports  = app;