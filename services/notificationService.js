const nodemailer = require('nodemailer');

// In-memory or fallback notification configuration (can also be loaded from DB/env)
const getConfig = () => {
    return {
        email: {
            enabled: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
            user: String(process.env.SMTP_USER || 'devisundarenterprises09@gmail.com').trim(),
            pass: String(process.env.SMTP_PASS || '').trim(),
            senderName: String(process.env.SMTP_SENDER_NAME || 'AgentBuddy Auth').trim(),
        },
        telegram: {
            enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
            token: String(process.env.TELEGRAM_BOT_TOKEN || '').trim(),
            chatId: String(process.env.TELEGRAM_CHAT_ID || '').trim(),
        },
        discord: {
            enabled: Boolean(process.env.DISCORD_WEBHOOK_URL),
            webhookUrl: String(process.env.DISCORD_WEBHOOK_URL || '').trim(),
        },
    };
};

// Create reusable Nodemailer transporter
let transporter = null;
const getTransporter = () => {
    const config = getConfig();
    if (!config.email.user || !config.email.pass) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
    }
    return transporter;
};

/**
 * Send an email using Nodemailer
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const config = getConfig();
        const mailer = getTransporter();
        if (!mailer || !config.email.user || !config.email.pass) {
            console.log('[NotificationService] Email skipped: SMTP credentials not configured.');
            return { success: false, reason: 'SMTP not configured' };
        }

        const info = await mailer.sendMail({
            from: `"${config.email.senderName}" <${config.email.user}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('[NotificationService] Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[NotificationService] Email send error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send message to Telegram Bot
 */
const sendTelegram = async (messageText) => {
    try {
        const config = getConfig();
        if (!config.telegram.token || !config.telegram.chatId) {
            console.log('[NotificationService] Telegram skipped: Bot token or chat ID not set.');
            return { success: false, reason: 'Telegram not configured' };
        }

        const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.telegram.chatId,
                text: messageText,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.description || 'Telegram API request failed');
        }

        console.log('[NotificationService] Telegram message sent successfully.');
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Telegram send error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send rich embed message to Discord Webhook
 */
const sendDiscord = async ({ title, description, fields = [], color = 3447003 }) => {
    try {
        const config = getConfig();
        if (!config.discord.webhookUrl) {
            console.log('[NotificationService] Discord skipped: Webhook URL not set.');
            return { success: false, reason: 'Discord not configured' };
        }

        const payload = {
            embeds: [
                {
                    title,
                    description,
                    color, // Decimal color code (e.g. 3447003 for cyan/blue)
                    fields,
                    footer: { text: 'OAuth 4.0 & AgentBuddy Telemetry' },
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        const res = await fetch(config.discord.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`Discord API responded with status ${res.status}`);
        }

        console.log('[NotificationService] Discord embed sent successfully.');
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Discord send error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Broadcast event across all enabled channels
 */
const broadcastEvent = async ({ title, message, telegramMessage, discordFields = [], emailTo = null, emailSubject = null, emailHtml = null }) => {
    const results = {};

    // 1. Telegram
    results.telegram = await sendTelegram(telegramMessage || `🔔 <b>${title}</b>\n\n${message}`);

    // 2. Discord
    results.discord = await sendDiscord({
        title,
        description: message,
        fields: discordFields,
    });

    // 3. Email (if recipient provided)
    if (emailTo) {
        results.email = await sendEmail({
            to: emailTo,
            subject: emailSubject || title,
            html: emailHtml || `<p>${message}</p>`,
            text: message,
        });
    }

    return results;
};

/**
 * Event: User Created
 */
const notifyUserCreated = async (user, targetApp = 'agentbuddy') => {
    const title = `👤 New User Created: ${user.username}`;
    const desc = `User <b>${user.username}</b> (${user.email || 'No email'}) was created with role <code>${user.role}</code>.`;
    const tg = `👤 <b>New User Created</b>\n\n` +
               `• <b>Username:</b> <code>${user.username}</code>\n` +
               `• <b>Email:</b> ${user.email || 'None'}\n` +
               `• <b>Role:</b> ${user.role}\n` +
               `• <b>App:</b> <code>${targetApp}</code>`;

    return broadcastEvent({
        title,
        message: desc,
        telegramMessage: tg,
        discordFields: [
            { name: 'Username', value: user.username, inline: true },
            { name: 'Role', value: user.role, inline: true },
            { name: 'Email', value: user.email || 'N/A', inline: false },
        ],
        emailTo: user.email,
        emailSubject: `Welcome to AgentBuddy, ${user.username}!`,
        emailHtml: `
            <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0284c7;">Welcome to AgentBuddy!</h2>
                <p>Hello <strong>${user.username}</strong>,</p>
                <p>Your user account has been successfully created.</p>
                <p><strong>Username:</strong> <code>${user.username}</code></p>
                <p>You can now log in and connect your desktop application.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">OAuth 4.0 Platform &bull; Automated System Notification</p>
            </div>
        `,
    });
};

/**
 * Event: License Minted or Extended
 */
const notifyLicenseIssued = async ({ username, email, token, expiresAt, appId, daysAdded }) => {
    const title = `🔑 License Issued: ${username} (${appId})`;
    const expStr = expiresAt ? new Date(expiresAt).toISOString().split('T')[0] : 'Lifetime';
    const tg = `🔑 <b>License Issued / Extended</b>\n\n` +
               `• <b>User:</b> <code>${username}</code>\n` +
               `• <b>App:</b> <code>${appId}</code>\n` +
               `• <b>Valid Until:</b> <code>${expStr}</code>\n` +
               (daysAdded ? `• <b>Days Added:</b> +${daysAdded}\n` : '') +
               `• <b>Token:</b> <pre>${token ? token.substring(0, 30) + '...' : 'N/A'}</pre>`;

    return broadcastEvent({
        title,
        message: `License issued for ${username} on ${appId}. Valid until: ${expStr}`,
        telegramMessage: tg,
        discordFields: [
            { name: 'User', value: username, inline: true },
            { name: 'App', value: appId, inline: true },
            { name: 'Valid Until', value: expStr, inline: true },
        ],
        emailTo: email,
        emailSubject: `Your AgentBuddy License Key [${expStr}]`,
        emailHtml: `
            <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #059669;">Your AgentBuddy License is Active!</h2>
                <p>Hello <strong>${username}</strong>,</p>
                <p>Your license key has been generated and is ready to use:</p>
                <div style="background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; font-size: 13px;">
                    ${token}
                </div>
                <p style="margin-top: 15px;"><strong>Valid Until:</strong> ${expStr}</p>
                <p>Simply paste this token into AgentBuddy Settings &gt; License Token.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">OAuth 4.0 Platform &bull; Automated License Delivery</p>
            </div>
        `,
    });
};

/**
 * Event: App Heartbeat / Telemetry Report
 */
const notifyTelemetry = async ({ appId, os, version, user, ip }) => {
    const tg = `📡 <b>App Heartbeat Ping</b>\n\n` +
               `• <b>App:</b> <code>${appId}</code>\n` +
               `• <b>Version:</b> ${version || '1.0.0'}\n` +
               `• <b>OS:</b> ${os || 'Unknown'}\n` +
               `• <b>User:</b> <code>${user || 'Anonymous'}</code>\n` +
               `• <b>IP:</b> ${ip || 'N/A'}`;

    return broadcastEvent({
        title: `📡 Telemetry: ${appId} Active (${os || 'desktop'})`,
        message: `Ping received from ${user || 'client'} running ${appId} v${version || '1.0.0'} on ${os || 'Desktop'}.`,
        telegramMessage: tg,
        discordFields: [
            { name: 'App', value: appId, inline: true },
            { name: 'OS', value: os || 'N/A', inline: true },
            { name: 'Version', value: version || '1.0.0', inline: true },
        ],
    });
};

/**
 * Event: Crash / Error Alert from Field
 */
const notifyCrashReport = async ({ appId, error, stack, os, version, user }) => {
    const tg = `🚨 <b>CRASH REPORT: ${appId}</b>\n\n` +
               `• <b>Error:</b> <code>${error}</code>\n` +
               `• <b>OS:</b> ${os || 'N/A'}\n` +
               `• <b>User:</b> ${user || 'N/A'}\n` +
               `• <b>Stack:</b> <pre>${String(stack || '').substring(0, 300)}...</pre>`;

    return broadcastEvent({
        title: `🚨 Application Crash: ${appId}`,
        message: `Error: ${error}\nOS: ${os}\nUser: ${user}`,
        telegramMessage: tg,
        discordFields: [
            { name: 'App', value: appId, inline: true },
            { name: 'OS', value: os || 'N/A', inline: true },
            { name: 'Error', value: String(error).substring(0, 200), inline: false },
        ],
    });
};

module.exports = {
    getConfig,
    sendEmail,
    sendTelegram,
    sendDiscord,
    broadcastEvent,
    notifyUserCreated,
    notifyLicenseIssued,
    notifyTelemetry,
    notifyCrashReport,
};
