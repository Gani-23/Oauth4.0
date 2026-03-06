# Persistent Admin Bearer Token Guide

This guide creates one long-lived admin bearer token for your account and shows how to rotate/revoke it if compromised.

## 1) Login as admin and get a short-lived access token

```bash
curl -s -X POST https://oauth4-0.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ganiadmin@agentbuddy.local",
    "password": "Gani@Admin!2026"
  }'
```

Copy `accessToken` from the response.

## 2) Rotate to a new persistent admin token

This revokes existing persistent admin token(s) for your admin user and issues exactly one fresh token.

```bash
curl -s -X POST https://oauth4-0.onrender.com/api/users/admin/personal-token/rotate \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_LOGIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "gani-primary-admin",
    "reason": "manual rotation"
  }'
```

Copy `adminToken` from the response and keep it secret.

## 3) Use persistent token in Admin Console

Open:

```text
https://oauth4-0.onrender.com/3vc17cs006
```

Paste:

```text
adminToken
```

into **Admin Access Token** and connect.

## 4) List your persistent admin tokens

```bash
curl -s https://oauth4-0.onrender.com/api/users/admin/personal-token \
  -H "Authorization: Bearer <ADMIN_TOKEN_OR_ACCESS_TOKEN>"
```

## 5) Revoke one compromised token

```bash
curl -s -X DELETE https://oauth4-0.onrender.com/api/users/admin/personal-token/<TOKEN_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN_OR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"compromised"}'
```

## 6) Revoke all persistent tokens immediately

```bash
curl -s -X DELETE https://oauth4-0.onrender.com/api/users/admin/personal-token \
  -H "Authorization: Bearer <ADMIN_TOKEN_OR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"security incident"}'
```

Then run step 2 to generate a new one.

## Security notes

- Persistent token has no automatic expiry. Treat it like a production secret.
- Store it in a password manager or secret vault, never in public repos.
- Rotate immediately if exposed.
