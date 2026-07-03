/**
 * linkedInService.js
 *
 * Posts a job opening as a share/UGC post on LinkedIn using the
 * LinkedIn UGC Posts API (v2).
 *
 * Requirements (set in .env):
 *   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 access token with r_liteprofile + w_member_social scopes
 *   LINKEDIN_ORGANIZATION_ID — URN of your company page, e.g. "123456789"
 *
 * How to get these:
 *   1. Create a LinkedIn App at https://www.linkedin.com/developers/apps
 *   2. Add products: "Share on LinkedIn" + "Sign In with LinkedIn"
 *   3. Generate an access token via OAuth 2.0 with scope: w_member_social, r_liteprofile
 *   4. For company page posts, also add "Marketing Developer Platform" product
 *      and use Organization scope: rw_organization_admin, w_organization_social
 *   5. Paste the token into .env as LINKEDIN_ACCESS_TOKEN
 *
 * Note: LinkedIn tokens expire after 60 days. For production, implement
 * the full OAuth refresh flow and store the refresh token securely.
 */

const https = require("https");

const LINKEDIN_API_BASE = "api.linkedin.com";
const UGC_POSTS_PATH = "/v2/ugcPosts";

/**
 * Makes an HTTPS POST request to the LinkedIn API.
 */
function linkedInPost(path, body, accessToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: LINKEDIN_API_BASE,
      path,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202304",
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: res.statusCode,
              data: parsed,
              headers: res.headers,
            });
          } else {
            reject(
              new Error(
                `LinkedIn API error ${res.statusCode}: ${responseData}`,
              ),
            );
          }
        } catch (e) {
          reject(
            new Error(
              `LinkedIn response parse error: ${e.message} — raw: ${responseData}`,
            ),
          );
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

/**
 * Post a job opening to LinkedIn as a UGC Post (Share).
 *
 * @param {Object} job  - { title, description, department, location }
 * @returns {Object}    - { success, postId } or throws on critical failure
 */
async function postJobToLinkedIn(job) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;

  if (!accessToken) {
    throw new Error("LINKEDIN_ACCESS_TOKEN is not configured in .env");
  }

  // Determine the author URN — org page preferred, personal profile as fallback
  let authorUrn;
  if (orgId) {
    authorUrn = `urn:li:organization:${orgId}`;
  } else {
    // Fall back to the authenticated user's profile
    const profileUrn = await getMyProfileUrn(accessToken);
    authorUrn = profileUrn;
  }

  const location = job.location ? ` · ${job.location}` : "";
  const shareText =
    `🚀 We're hiring! — ${job.title}${location}\n\n` +
    `📁 Department: ${job.department}\n\n` +
    `${job.description.slice(0, 700)}${job.description.length > 700 ? "..." : ""}\n\n` +
    `Interested? Apply through our careers portal. #hiring #${job.department.replace(/\s+/g, "")} #jobs #careers`;

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: shareText,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await linkedInPost(UGC_POSTS_PATH, body, accessToken);

  // The post ID is in the response header x-restli-id or response body id
  const postId =
    response.headers["x-restli-id"] || response.data?.id || "unknown";
  return { success: true, postId };
}

/**
 * Get the authenticated member's URN (fallback when no org ID set).
 */
function getMyProfileUrn(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: LINKEDIN_API_BASE,
      path: "/v2/me",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => {
        data += c;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) {
            resolve(`urn:li:person:${parsed.id}`);
          } else {
            reject(new Error("Could not retrieve LinkedIn member ID"));
          }
        } catch (e) {
          reject(new Error(`LinkedIn profile parse error: ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

module.exports = { postJobToLinkedIn };
