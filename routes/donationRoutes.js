import express from "express";
import { 
    showDonationPage, // <- Make sure this matches
    processDonation, 
    showUserDonations,
    showDonationConfirmation,
    showAllDonations 
} from "../controllers/donationController.js";
import { authenticateUser } from "../controllers/authController.js";
import { createPayPalOrder, capturePayPalOrder } from "../controllers/donationController.js";
import { processPayPalDonation } from "../controllers/donationController.js";
import { createPayPalPayment, executePayPalPayment } from "../controllers/donationController.js";

const router = express.Router();

// ✅ Show the donation page for a campaign
router.get("/:id/donate", authenticateUser, showDonationPage);

// ✅ Process the donation submission
router.post("/:id/donate", authenticateUser, processDonation);

// ✅ Show user's donation history
router.get("/history", authenticateUser, showUserDonations);

router.get("/:id/confirmation", authenticateUser, showDonationConfirmation);

router.get("/admin/all", authenticateUser, showAllDonations);

router.post("/:id/paypal/create", authenticateUser, createPayPalOrder);
router.post("/paypal/capture", authenticateUser, capturePayPalOrder);
router.post("/:id/paypal-donate", authenticateUser, processPayPalDonation);

router.post("/:id/paypal", authenticateUser, createPayPalPayment);
router.get("/paypal/success", executePayPalPayment);
router.get("/paypal/cancel", (req, res) => res.send("Payment Cancelled"));









export default router;
