import pool from "../config/db.js"; // ✅ Import the database connection
import { addDonation, getTotalDonationsByCampaign, getDonationsByUser, getLatestDonation } from "../models/donationModel.js";
import { getCampaignById } from "../models/campaignModel.js";
import { getAllDonations } from "../models/donationModel.js";
import paypalClient from "../config/paypal.js";
import paypal from "@paypal/checkout-server-sdk";

import { updateCampaignCollectedAmount } from "../models/donationModel.js";




const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE;



// ✅ Show the Donation Page for a Campaign
export const showDonationPage = async (req, res) => {
    const { id } = req.params; // Campaign ID

    try {
        const [campaign] = await getCampaignById(id);
        if (!campaign.length) {
            return res.status(404).send("Campaign not found");
        }

        const isGoalMet = campaign[0].collected_amount >= campaign[0].goal_amount;
        
        // ✅ Calculate the remaining amount
        const remainingAmount = Math.max(campaign[0].goal_amount - campaign[0].collected_amount, 0);

        res.render("donations/donate", { 
            campaign: campaign[0], 
            isGoalMet, 
            remainingAmount,  // ✅ Pass it to EJS
            error: null 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};


// ✅ Handle Donation Submission
export const processDonation = async (req, res) => {
    const { id } = req.params; // Campaign ID
    const { amount } = req.body;
    const user_id = req.session.user.id;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.render("donations/donate", { campaign: { id }, error: "Invalid donation amount" });
    }

    try {
        // Fetch the current campaign data
        const [campaign] = await getCampaignById(id);
        if (!campaign.length) {
            return res.status(404).send("Campaign not found");
        }

        let campaignData = campaign[0];
        let remainingAmount = campaignData.goal_amount - campaignData.collected_amount;

        // ✅ Prevent donation if the campaign has already met its goal
        if (campaignData.collected_amount >= campaignData.goal_amount) {
            return res.render("donations/donate", { 
                campaign: campaignData, 
                error: "This campaign has already met its goal! Thank you for your support." 
            });
        }

        // ✅ Prevent donation amounts that exceed the remaining goal
        if (parseFloat(amount) > remainingAmount) {
            return res.render("donations/donate", { 
                campaign: campaignData, 
                error: `You can only donate up to $${remainingAmount.toFixed(2)} to reach the goal.` 
            });
        }

        // ✅ Add the donation first
        await addDonation(user_id, id, amount);

        // ✅ Update the campaign's collected amount correctly
        await pool.query(
            `UPDATE campaigns SET collected_amount = collected_amount + ? WHERE id = ?`,
            [amount, id]
        );

        // ✅ Fetch updated campaign data after donation
        const [updatedCampaign] = await getCampaignById(id);
        let updatedCampaignData = updatedCampaign[0];

        // ✅ If the goal is now met, update the page correctly
        if (updatedCampaignData.collected_amount >= updatedCampaignData.goal_amount) {
            return res.render("donations/donate", { 
                campaign: updatedCampaignData, 
                error: "This campaign has now reached its goal! No further donations are needed." 
            });
        }

        res.redirect(`/donations/${id}/confirmation`); // ✅ Redirect to confirmation page
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Show User Donation History
export const showUserDonations = async (req, res) => {
    const user_id = req.session.user.id;

    try {
        const [donations] = await getDonationsByUser(user_id);
        res.render("donations/history", { donations });
    } catch (error) {
        console.error("Error fetching user donations:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


export const showDonationConfirmation = async (req, res) => {
    const { id } = req.params;  // Campaign ID
    const user_id = req.session.user.id;

    console.log(`Fetching confirmation for user_id: ${user_id}, campaign_id: ${id}`);

    try {
        const [donation] = await getLatestDonation(user_id, id);
        if (!donation.length) {
            return res.status(404).send("Donation not found");
        }

        res.render("donations/confirmation", { donation: donation[0] });
    } catch (error) {
        console.error("Error in showDonationConfirmation:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
// ✅ Show all donations (Admins only)
export const showAllDonations = async (req, res) => {
    const { campaign_id, user_id } = req.query;
    
    console.log("Filter Params - Campaign ID:", campaign_id, "User ID:", user_id); // Debugging filters
    
    try {
        const donations = await getAllDonations(campaign_id, user_id);
        console.log("Filtered Donations:", donations); // Debugging Output
        
        res.render("donations/adminAll", { donations });
    } catch (error) {
        console.error("Error fetching filtered donations:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const createPayPalOrder = async (req, res) => {
    const { id } = req.params; // Campaign ID
    const { amount } = req.body;

    try {
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: amount,
                    },
                },
            ],
        });

        const order = await paypalClient.execute(request);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error("Error creating PayPal order:", error);
        res.status(500).json({ error: "Error creating PayPal order" });
    }
};

export const capturePayPalOrder = async (req, res) => {
    const { orderID } = req.body;

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const capture = await paypalClient.execute(request);

        if (capture.result.status === "COMPLETED") {
            // Save donation to database (implement this part)
            return res.json({ success: true, message: "Payment successful", capture });
        } else {
            return res.status(400).json({ success: false, message: "Payment not completed" });
        }
    } catch (error) {
        console.error("Error capturing PayPal order:", error);
        res.status(500).json({ error: "Error capturing PayPal order" });
    }
};

export const processPayPalDonation = async (req, res) => {
    const { orderID, amount } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const response = await paypalClient.execute(request);
        console.log("🚀 PayPal Payment Captured:", JSON.stringify(response, null, 2));

        const result = response?.result;
        if (!result) {
            throw new Error("Invalid PayPal response.");
        }

        // ✅ Extract the transaction ID safely
        const purchaseUnit = result.purchase_units?.[0];
        const capture = purchaseUnit?.payments?.captures?.[0];

        if (!capture || !capture.id) {
            throw new Error("PayPal response does not contain a valid Capture ID.");
        }

        const transactionID = capture.id;  // ✅ Correct transaction ID
        console.log("✅ PayPal Capture ID:", transactionID);

        const campaignId = req.params.campaignId;

        // ✅ Store donation with transaction ID in the database
        await addDonation(req.user.id, campaignId, amount, transactionID);
        await updateCampaignCollectedAmount(campaignId);

        res.json({ success: true });

    } catch (error) {
        console.error("❌ PayPal Payment Error:", error.message);
        res.status(500).json({ success: false, message: "Payment failed", error: error.message });
    }
};





// Create PayPal Payment
export const createPayPalPayment = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    const paymentData = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        redirect_urls: {
            return_url: `http://localhost:5000/donations/paypal/success?campaign_id=${id}&amount=${amount}`,
            cancel_url: `http://localhost:5000/donations/paypal/cancel`
        },
        transactions: [{
            amount: { total: amount, currency: "USD" },
            description: `Donation for campaign ${id}`
        }]
    };

    paypal.payment.create(paymentData, (error, payment) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Error creating PayPal payment" });
        } else {
            const approvalUrl = payment.links.find(link => link.rel === "approval_url").href;
            res.redirect(approvalUrl);
        }
    });
};

// Execute PayPal Payment
export const executePayPalPayment = async (req, res) => {
    const { paymentId, PayerID } = req.query;
    const { campaign_id, amount } = req.query;

    const execute_payment_data = {
        payer_id: PayerID
    };

    paypal.payment.execute(paymentId, execute_payment_data, async (error, payment) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Payment execution failed" });
        } else {
            // Save donation in database
            await addDonation(req.user.id, campaign_id, amount);

            // Update collected amount
            await updateCampaignCollectedAmount(campaign_id, amount);

            res.redirect(`/donations/${campaign_id}/confirmation`);
        }
    });
};







