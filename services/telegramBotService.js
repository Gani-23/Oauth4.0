const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const TrialLicenseGrant = require('../models/TrialLicenseGrant');
const RenewalRequest = require('../models/RenewalRequest');
const { sendEmail } = require('./notificationService');

let isPolling = false;
let pollingOffset = 0;
let abortController = null;

const getConfig = () => ({
    token: String(process.env.TELEGRAM_BOT_TOKEN || '').trim(),
    adminChatId: String(process.env.TELEGRAM_CHAT_ID || '').trim(),
    accessSecret: process.env.JWT_ACCESS_SECRET,
});

/**
 * Send an interactive renewal request to Telegram admin with inline buttons
 */
const sendInteractiveRenewalRequest = async ({ requestId, username, userEmail, appId, currentExp, reason }) => {
    const config = getConfig();
    if (!config.token || !config.adminChatId) {
        console.log('[TelegramBot] Skipped: Bot token or chat ID missing.');
        return null;
    }

    const expText = currentExp ? new Date(currentExp).toISOString().split('T')[0] : 'Expired / Not Set';
    const message = `🔔 <b>LICENSE RENEWAL REQUEST</b>\n\n` +
                    `• <b>User:</b> <code>${username}</code>\n` +
                    `• <b>App:</b> <code>${appId.toUpperCase()}</code>\n` +
                    `• <b>Email:</b> ${userEmail || 'None'}\n` +
                    `• <b>Current Expiry:</b> <code>${expText}</code>\n` +
                    (reason ? `• <b>Note:</b> <i>${reason}</i>\n` : '') +
                    `\nTap an action below to process on the fly:`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: '✅ Approve +30 Days', callback_data: `renew:approve:30:${requestId}` },
                { text: '✨ Approve 1 Year', callback_data: `renew:approve:365:${requestId}` },
            ],
            [
                { text: '🌟 Lifetime Access', callback_data: `renew:approve:36500:${requestId}` },
                { text: '❌ Decline', callback_data: `renew:decline:0:${requestId}` },
            ],
        ],
    };

    try {
        const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.adminChatId,
                text: message,
                parse_mode: 'HTML',
                reply_markup: inlineKeyboard,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
            const messageId = data.result.message_id;
            await RenewalRequest.updateOne({ requestId }, { $set: { telegramMessageId: messageId } });
            return messageId;
        }
    } catch (err) {
        console.error('[TelegramBot] Failed to send renewal request:', err.message);
    }
    return null;
};

/**
 * Execute license approval in database, generate JWT, and email user
 */
const processApproval = async ({ renewalReq, days, adminChatId, messageId }) => {
    const config = getConfig();
    const user = await User.findById(renewalReq.userId);
    if (!user) throw new Error('User not found');

    const isLifetime = days >= 36500;
    const now = new Date();

    // Check existing grant
    const existingGrants = await TrialLicenseGrant.find({
        $or: [{ userId: user._id }, { username: user.username }],
        revokedAt: null,
    }).sort({ expiresAt: -1 });

    const latestGrant = existingGrants.length > 0 ? existingGrants[0] : null;

    let expiresAtDate;
    let expiresAtUnix;
    if (isLifetime) {
        expiresAtUnix = 4102444799; // 2099-12-31
        expiresAtDate = new Date(expiresAtUnix * 1000);
    } else {
        let baseMs = now.getTime();
        if (latestGrant && new Date(latestGrant.expiresAt).getTime() > now.getTime()) {
            baseMs = new Date(latestGrant.expiresAt).getTime();
        }
        expiresAtDate = new Date(baseMs + days * 24 * 60 * 60 * 1000);
        expiresAtUnix = Math.floor(expiresAtDate.getTime() / 1000);
    }

    const targetAppId = renewalReq.appId || 'agentbuddy';

    // Ensure user has app in projects
    if (targetAppId !== '*' && !(user.projects || []).includes(targetAppId)) {
        user.projects = [...(user.projects || []), targetAppId];
        await user.save();
    }

    let grantRecord;
    if (latestGrant) {
        latestGrant.expiresAt = expiresAtDate;
        latestGrant.claimRef = `${latestGrant.claimRef || targetAppId}+telegram-renewed`;
        if (targetAppId !== '*' && !latestGrant.apps.includes(targetAppId)) {
            latestGrant.apps.push(targetAppId);
        }
        grantRecord = await latestGrant.save();
    } else {
        const tokenId = `license-${targetAppId}-${Date.now()}`;
        grantRecord = await TrialLicenseGrant.create({
            userId: user._id,
            username: user.username,
            source: 'telegram_approval',
            tokenId,
            claimRef: `${targetAppId}-telegram-approved`,
            apps: [targetAppId],
            expiresAt: expiresAtDate,
            revokedAt: null,
        });
    }

    // Sign new JWT
    const payload = {
        sub: user._id.toString(),
        username: user.username,
        role: user.role,
        projects: user.projects && user.projects.length > 0 ? user.projects : [targetAppId],
        tokenVersion: user.tokenVersion,
        appId: targetAppId,
        trialGrant: true,
        trialSource: grantRecord.source,
        trialTokenId: grantRecord.tokenId,
        exp: expiresAtUnix,
    };

    const licenseToken = jwt.sign(payload, config.accessSecret);

    // Update RenewalRequest
    renewalReq.status = 'approved';
    renewalReq.approvedDays = days;
    renewalReq.newLicenseToken = licenseToken;
    renewalReq.newExpiresAt = expiresAtDate;
    renewalReq.updatedAt = new Date();
    await renewalReq.save();

    // Auto-email user with new license key
    if (user.email) {
        const expStr = expiresAtDate.toISOString().split('T')[0];
        sendEmail({
            to: user.email,
            subject: `🎉 Your AgentBuddy License Has Been Renewed! [Valid until ${expStr}]`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #10b981; border-radius: 12px;">
                    <h2 style="color: #059669;">License Renewal Approved!</h2>
                    <p>Hello <strong>${user.username}</strong>,</p>
                    <p>Your renewal request has been approved by the administrator.</p>
                    <p><strong>App:</strong> <code>${targetAppId}</code></p>
                    <p><strong>Extension:</strong> +${isLifetime ? 'Lifetime' : days + ' days'}</p>
                    <p><strong>Valid Until:</strong> ${expStr}</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
                    <p><strong>Your Updated License Key:</strong></p>
                    <div style="background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 13px;">
                        ${licenseToken}
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 15px;">If you have AgentBuddy open, it will auto-update within seconds. Otherwise, copy and paste this key into Settings &gt; License Token.</p>
                </div>
            `,
            text: `Your AgentBuddy license has been renewed until ${expStr}. License Key: ${licenseToken}`,
        }).catch((e) => console.error('[TelegramBot] Failed to email user:', e.message));
    }

    return { expiresAtDate, licenseToken };
};

/**
 * Handle incoming callback queries from Telegram buttons
 */
const handleCallbackQuery = async (callbackQuery) => {
    const config = getConfig();
    const { id, from, message, data } = callbackQuery;

    // Security check: Only configured admin can approve
    if (String(from.id) !== config.adminChatId) {
        await answerCallbackQuery(id, '⛔ Unauthorized: You are not configured as the admin.');
        return;
    }

    const parts = (data || '').split(':');
    if (parts[0] !== 'renew' || parts.length < 4) {
        await answerCallbackQuery(id, 'Invalid command.');
        return;
    }

    const action = parts[1]; // 'approve' or 'decline'
    const days = Number(parts[2]) || 30;
    const requestId = parts[3];

    const renewalReq = await RenewalRequest.findOne({ requestId });
    if (!renewalReq) {
        await answerCallbackQuery(id, '⚠️ Renewal request not found or expired.');
        return;
    }

    if (renewalReq.status !== 'pending') {
        await answerCallbackQuery(id, `Request was already ${renewalReq.status}.`);
        return;
    }

    if (action === 'approve') {
        try {
            const { expiresAtDate } = await processApproval({
                renewalReq,
                days,
                adminChatId: config.adminChatId,
                messageId: message?.message_id,
            });

            const expStr = expiresAtDate.toISOString().split('T')[0];
            const updatedText = `✅ <b>RENEWAL APPROVED (+${days >= 36500 ? 'Lifetime' : days + ' Days'})</b>\n\n` +
                                `• <b>User:</b> <code>${renewalReq.username}</code>\n` +
                                `• <b>App:</b> <code>${renewalReq.appId.toUpperCase()}</code>\n` +
                                `• <b>New Expiration:</b> <code>${expStr}</code>\n` +
                                `• <b>Status:</b> Key generated and emailed to client automatically!`;

            await editMessageText(config.adminChatId, message.message_id, updatedText);
            await answerCallbackQuery(id, `Approved +${days >= 36500 ? 'Lifetime' : days + ' days'}!`);
        } catch (err) {
            console.error('[TelegramBot] Error processing approval:', err.message);
            await answerCallbackQuery(id, `Error: ${err.message}`);
        }
    } else if (action === 'decline') {
        renewalReq.status = 'declined';
        renewalReq.updatedAt = new Date();
        await renewalReq.save();

        const updatedText = `❌ <b>RENEWAL DECLINED</b>\n\n` +
                            `• <b>User:</b> <code>${renewalReq.username}</code>\n` +
                            `• <b>App:</b> <code>${renewalReq.appId.toUpperCase()}</code>\n` +
                            `• <b>Status:</b> Declined by admin.`;

        await editMessageText(config.adminChatId, message.message_id, updatedText);
        await answerCallbackQuery(id, 'Renewal declined.');
    }
};

const answerCallbackQuery = async (callbackQueryId, text) => {
    const config = getConfig();
    try {
        await fetch(`https://api.telegram.org/bot${config.token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: true }),
        });
    } catch (_) {}
};

const editMessageText = async (chatId, messageId, text) => {
    const config = getConfig();
    try {
        await fetch(`https://api.telegram.org/bot${config.token}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: 'HTML',
            }),
        });
    } catch (_) {}
};

/**
 * Long-polling worker loop
 */
const startPolling = async () => {
    const config = getConfig();
    if (!config.token || !config.adminChatId) {
        console.log('[TelegramBot] Polling skipped: Token or chat ID not set.');
        return;
    }

    if (isPolling) return;
    isPolling = true;
    abortController = new AbortController();

    console.log('[TelegramBot] Interactive approval worker started via long-polling...');

    while (isPolling) {
        try {
            const url = `https://api.telegram.org/bot${config.token}/getUpdates?offset=${pollingOffset}&timeout=20`;
            const res = await fetch(url, { signal: abortController.signal });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.ok && Array.isArray(data.result)) {
                for (const update of data.result) {
                    pollingOffset = update.update_id + 1;
                    if (update.callback_query) {
                        await handleCallbackQuery(update.callback_query);
                    }
                }
            } else {
                await new Promise((r) => setTimeout(r, 2000));
            }
        } catch (err) {
            if (err.name === 'AbortError') break;
            await new Promise((r) => setTimeout(r, 4000));
        }
    }
};

const stopPolling = () => {
    isPolling = false;
    if (abortController) {
        abortController.abort();
    }
};

module.exports = {
    sendInteractiveRenewalRequest,
    startPolling,
    stopPolling,
};
