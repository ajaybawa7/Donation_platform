import { 
    createCampaign, 
    getAllCampaigns, 
    getCampaignById, 
    updateCampaign, 
    deleteCampaign 
} from "../models/campaignModel.js";


// ✅ Show the Create Campaign Form (Admins only)
export const showCreateCampaignPage = (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }
    res.render("campaigns/create", { error: null });
};

// ✅ Handle Creating a Campaign
export const createNewCampaign = async (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const { title, description, goal_amount, start_date, end_date } = req.body;
    const created_by = req.session.user.id; // Admin ID

    if (!title || !description || !goal_amount || !start_date || !end_date) {
        return res.render("campaigns/create", { error: "All fields are required" });
    }

    try {
        await createCampaign(title, description, goal_amount, start_date, end_date, created_by);
        res.redirect("/campaigns");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Show All Campaigns
export const listCampaigns = async (req, res) => {
    try {
        const [campaigns] = await getAllCampaigns();
        res.render("campaigns/index", { campaigns, user: req.session.user }); // ✅ Pass user session to EJS
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Show a Single Campaign by ID
export const showCampaign = async (req, res) => {
    const { id } = req.params;

    try {
        const [campaign] = await getCampaignById(id);

        if (campaign.length === 0) {
            return res.status(404).send("Campaign not found");
        }

        res.render("campaigns/show", { campaign: campaign[0], user: req.session.user }); // ✅ Pass user to EJS
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Show Edit Campaign Page (Admins only)
export const showEditCampaignPage = async (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const { id } = req.params;
    try {
        const [campaign] = await getCampaignById(id);
        if (campaign.length === 0) {
            return res.status(404).send("Campaign not found");
        }

        res.render("campaigns/edit", { campaign: campaign[0], error: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Handle Campaign Update
export const updateExistingCampaign = async (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const { id } = req.params;
    const { title, description, goal_amount, start_date, end_date } = req.body;

    if (!title || !description || !goal_amount || !start_date || !end_date) {
        return res.render("campaigns/edit", { error: "All fields are required", campaign: { id, title, description, goal_amount, start_date, end_date } });
    }

    try {
        await updateCampaign(id, title, description, goal_amount, start_date, end_date);
        res.redirect("/campaigns");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Handle Campaign Deletion (Admins only)
export const deleteExistingCampaign = async (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const { id } = req.params;
    try {
        await deleteCampaign(id);
        res.redirect("/campaigns");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateCollectedAmount = async (campaignId, newAmount) => {
    const query = "UPDATE campaigns SET collected_amount = ? WHERE id = ?";
    return pool.execute(query, [newAmount, campaignId]);
};


