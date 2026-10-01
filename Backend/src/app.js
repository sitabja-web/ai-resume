const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { generateInterviewReport } = require("./services/ai.service")
const authRouter = require("./routes/auth.routes")

const app = express()

app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRouter)

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