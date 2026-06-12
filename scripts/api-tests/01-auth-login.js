const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://app.fastlearnersapp.com";
const CREDENTIALS = {
  email_phone: "student@fastlearnersapp.com",
  password: "password",
};

const TOKEN_FILE = path.join(__dirname, "auth-token.json");

async function login() {
  try {
    console.log(
      "Attempting to login with credentials:",
      CREDENTIALS.email_phone,
    );
    const response = await axios.post(`${BASE_URL}/api/v1/login`, CREDENTIALS, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.data.success) {
      console.log("Login successful!");
      const token = response.data.content.access_token;
      console.log("Token received:", token.substring(0, 10) + "...");

      fs.writeFileSync(
        TOKEN_FILE,
        JSON.stringify({ token, user: response.data.content.user }, null, 2),
      );
      console.log(`Token saved to ${TOKEN_FILE}`);
    } else {
      console.error("Login failed:", response.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.error("Login error:", error.response.status, error.response.data);
    } else {
      console.error("Login error:", error.message);
    }
  }
}

login();
