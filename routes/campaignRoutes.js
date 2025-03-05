import express from "express";
import { 
    showCreateCampaignPage, 
    createNewCampaign, 
    listCampaigns, 
    showCampaign,
    showEditCampaignPage,
    updateExistingCampaign,
    deleteExistingCampaign,
    
} from "../controllers/campaignController.js";
import { authenticateUser } from "../controllers/authController.js"; 

const router = express.Router();

// ✅ Show Create Campaign Page (Admins only)
router.get("/create", authenticateUser, showCreateCampaignPage);

// ✅ Handle Campaign Creation (Admins only)
router.post("/create", authenticateUser, createNewCampaign);

// ✅ List All Campaigns
router.get("/", listCampaigns);

// ✅ Show a Single Campaign
router.get("/:id", showCampaign);

// ✅ Show Edit Campaign Page (Admins only)
router.get("/:id/edit", authenticateUser, showEditCampaignPage);

// ✅ Handle Campaign Update (Admins only)
router.post("/:id/edit", authenticateUser, updateExistingCampaign);

// ✅ Handle Campaign Deletion (Admins only)
router.post("/:id/delete", authenticateUser, deleteExistingCampaign);

// ✅ New route to fetch real-time campaign data
router.get("/:id/data", async (req, res) => {
    const { id } = req.params;
    try {
        const [campaign] = await getCampaignById(id);
        if (!campaign.length) return res.status(404).json({ error: "Campaign not found" });

        res.json({ collected_amount: campaign[0].collected_amount, goal_amount: campaign[0].goal_amount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


export default router;
