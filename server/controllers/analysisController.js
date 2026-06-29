import AnalysisModel from "../model/analysis.js";
import { analyzeSeoData } from "../services/geminiService.js";
import { scrapUrl } from "../services/scrapperService.js";

// analyse a url
export const analyseUrl = async (req, res) => {
	try {
		const { url } = req.body;
		if (!url)
			return res
				.status(400)
				.json({ success: false, message: "URL is required" });

		// valid url form
		let validURL;
		try {
			validURL = new URL(url.startsWith("http") ? url : `https://${url}`);
		} catch (error) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid URL format" });
		}

		// create analysis record with pending status
		const analysis = await AnalysisModel.create({
			userId: req.userId,
			url: validURL.href,
			status: "processing",
		});

		// send immediate response with analysis id
		res.json({
			success: true,
			message: "Analysis started",
			analysisId: analysis._id,
		});

		// start scraping the webpage and analysis in background
		try {
			// step 1: scrape the url with browserbase
			const scrapResult = await scrapUrl(validURL.href);

			if (!scrapResult.success) {
				analysis.status = "failed";
				await analysis.save();
				return;
			}

			// step 2: Analyze with Gemini AI
			const aiResult = await analyzeSeoData(scrapResult.data);

			if (!aiResult.success) {
				analysis.status = "failed";
				await analysis.save();
				return;
			}

			// step 3: save result in the database
			analysis.overallScore = aiResult.data.overallScore || 0;
			analysis.categories = aiResult.data.categories || {};
			analysis.metaData = scrapResult.data.metaData || {};
			analysis.headings = scrapResult.data.headings || {};
			analysis.links = scrapResult.data.links || {};
			analysis.images = scrapResult.data.images || {};
			analysis.keywords = aiResult.data.keywords || [];
			analysis.issues = aiResult.data.issues || [];
			analysis.loadTime = scrapResult.data.loadTime || 0;
			analysis.pageSize = scrapResult.data.pageSize || 0;
			analysis.wordCount = scrapResult.data.wordCount || 0;
            analysis.status = "completed";

            await analysis.save()
		} catch (bgError) {
			console.error("Background analysis message: ", bgError.message);
			try {
				analysis.status = "failed";
				await analysis.save();
			} catch (saveError) {
				console.error("Failed to save failed status: ", saveError.message);
			}
		}
	} catch (error) {
		console.error("Analyze URL Error: ", error.message);
		if (!res.headersSent) {
			res.status(500).json({ success: false, message: "Server error" });
		}
	}
};

// get analyse by id
export const getAnalysis = async (req, res) => {
    try {
        const analysis = await AnalysisModel.findOne({_id: req.params.id, userId: req.userId});

        if(!analysis) return res.status(404).json({success: false, message: "Analysis not found"})

        res.json({success: true, analysis})
    } catch (error) {
        console.error("Get analysis error: ", error.message);
        res.status(500).json({success: false, message: "Server error"})
    }
};

// get all analyse for user
export const getAnalyses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const analyses = await AnalysisModel.find({userId: req.userId}).sort({createdAt: -1}).skip(skip).limit(limit).select("-issues -keywords");

        const total = await AnalysisModel.countDocuments({userId: req.userId})

        res.json({success: true, analyses, pagination: {page, limit, total, pages: Math.ceil(total / limit)} })

    } catch (error) {
        console.error("Get analyses error: ", error.message);
        res.status(500).json({success: false, message: "Server error"})
    }
};

// delete analyse for user
export const deleteAnalysis = async (req, res) => {
	try {
        await AnalysisModel.findOneAndDelete({_id: req.params.id, userId: req.userId});

        res.json({success: true, message: "Analysis deleted!"})
    } catch (error) {
        console.error("Delete analysis error: ", error.message);
        res.status(500).json({success: false, message: "Server error"})
    }
};
