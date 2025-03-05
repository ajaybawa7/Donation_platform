import pool from "../config/db.js";

// Create a new campaign
export const createCampaign = async (title, description, goal_amount, start_date, end_date, created_by) => {
    const query = `INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [title, description, goal_amount, start_date, end_date, created_by];
    return pool.query(query, values);
};

// Get all campaigns
export const getAllCampaigns = async () => {
    const query = `SELECT * FROM campaigns ORDER BY created_at DESC`;
    return pool.query(query);
};

// Get a single campaign by ID
export const getCampaignById = async (id) => {
    const query = `SELECT * FROM campaigns WHERE id = ?`;
    return pool.query(query, [id]);
};

export const updateCampaign = async (id, title, description, goal_amount, start_date, end_date) => {
    const query = `UPDATE campaigns SET title = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ? WHERE id = ?`;
    const values = [title, description, goal_amount, start_date, end_date, id];
    return pool.query(query, values);
};

// Delete a campaign
export const deleteCampaign = async (id) => {
    const query = `DELETE FROM campaigns WHERE id = ?`;
    return pool.query(query, [id]);
};
