const multer = require("multer")
const path = require("node:path")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase()
        if (![ ".pdf", ".docx" ].includes(extension)) {
            return callback(new Error("Resume must be a PDF or DOCX file."))
        }
        callback(null, true)
    }
})

module.exports = upload