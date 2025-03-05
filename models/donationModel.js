import pool from "../config/db.js";

// ✅ Add a New Donation
export const addDonation = async (userId, campaignId, amount, transactionId = null) => {
    const query = `
        INSERT INTO donations (user_id, campaign_id, amount, transaction_id) 
        VALUES (?, ?, ?, ?);
    `;

    try {
        const [result] = await pool.query(query, [userId, campaignId, amount, transactionId]);
        return result;
    } catch (error) {
        console.error("❌ Error adding donation:", error);
        throw error;
    }
};


// ✅ Get Total Donations for a Campaign
export const getTotalDonationsByCampaign = async (campaign_id) => {
    const query = `SELECT SUM(amount) as total FROM donations WHERE campaign_id = ?`;
    const [result] = await pool.query(query, [campaign_id]);
    return result[0].total || 0;
};

// ✅ Get Donations Made by a User
// ✅ Get Donations by User ID
export const getDonationsByUser = async (user_id) => {
    const query = `
        SELECT donations.*, campaigns.title AS campaign_name
        FROM donations
        JOIN campaigns ON donations.campaign_id = campaigns.id
        WHERE donations.user_id = ?
        ORDER BY donations.donation_date DESC;
    `;
    return pool.query(query, [user_id]);
};


export const getLatestDonation = async (user_id, campaign_id) => {
    const query = `
        SELECT donations.amount, donations.donation_date, campaigns.title 
        FROM donations 
        JOIN campaigns ON donations.campaign_id = campaigns.id 
        WHERE donations.user_id = ? AND donations.campaign_id = ? 
        ORDER BY donations.donation_date DESC LIMIT 1
    `;
    return pool.query(query, [user_id, campaign_id]);
};

export const getAllDonations = async (campaign_id = null, user_id = null) => {
    let query = `
        SELECT donations.*, users.name AS donor_name, campaigns.title AS campaign_name 
        FROM donations 
        JOIN users ON donations.user_id = users.id 
        JOIN campaigns ON donations.campaign_id = campaigns.id 
        WHERE 1=1`;

    let values = [];

    if (campaign_id) {
        query += " AND donations.campaign_id = ?";
        values.push(campaign_id);
    }
    if (user_id) {
        query += " AND donations.user_id = ?";
        values.push(user_id);
    }

    console.log("Generated Query:", query, values); // Debugging Query
    const [rows] = await pool.query(query, values);
    console.log("Fetched Donations Data:", rows); // Debugging Data
    return rows;
};

export const updateCampaignCollectedAmount = async (campaignId) => {
    const query = `
        UPDATE campaigns 
        SET collected_amount = (SELECT SUM(amount) FROM donations WHERE campaign_id = ?) 
        WHERE id = ?;
    `;

    try {
        const [result] = await pool.query(query, [campaignId, campaignId]);
        return result;
    } catch (error) {
        console.error("Error updating campaign collected amount:", error);
        throw error;
    }
};

