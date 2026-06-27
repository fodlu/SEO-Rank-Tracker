import AnalysisModel from "../model/analysis.js";
import { scrapUrl } from "../services/scrapperService.js";

// analyse a url
export const analyseUrl = async (req, res ) => {
    try {
        const {url} = req.body;
        if(!url) return res.status(400).json({success: false, message: "URL is required"});

        // valid url form
        let validURL;
        try {
            validURL = new URL(url.startsWith("http") ? url : `https://${url}`)
        } catch (error) {
            return res.status(400).json({success: false, message: "Invalid URL format"})
        }

        // create analysis record with pending status
        const analysis = await AnalysisModel.create({
            userId: req.userId, url: validURL.href, status: "processing"
        })

        // send immediate response with analysis id
        res.json({success: true, message: "Analysis started", analysisId: analysis._id})

        // start scraping the webpage and analysis in background
        try {
            // step 1: scrape the url with browserbase
            const scrapResult = await scrapUrl(validURL.href)

            if(!scrapResult.success) {
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // step 2: Analyze with Gemini AI

        } catch (error) {

        }
    } catch (error) {
        console.error("Analyze URL Error: ", error.message);
        if(!res.headerSent) {
            res.status(500).json({success: false, message: "Server error"})
        }
    }
}

// get analyse by id
export const getAnalysis = async (req, res ) => {

}

// get all analyse for user
export const getAnalyses = async (req, res ) => {

}

// delete analyse for user
export const deleteAnalysis = async (req, res ) => {

}