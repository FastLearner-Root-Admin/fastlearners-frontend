const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://app.fastlearnersapp.com";
const TOKEN_FILE = path.join(__dirname, "auth-token.json");

function getApiClient() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error("Token file not found. Please run 01-auth-login.js first.");
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  const token = tokenData.token;

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return { client, user: tokenData.user };
}

module.exports = { getApiClient };
