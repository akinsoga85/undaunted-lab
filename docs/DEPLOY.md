# Deploying undauntedlab.com

Expect about 30 minutes, most of it waiting on DNS. You'll need accounts with GitHub, Vercel, Neon (created through Vercel) and Resend.

## 1. Put the code on GitHub

```bash
cd undaunted-lab
git init && git add -A && git commit -m "Undaunted Lab site + admin"   # skip if .git already exists
gh repo create undaunted-lab --private --source . --push
```

## 2. Create the Vercel project

- Go to **Vercel → Add New → Project → Import** and pick the repo.
- The framework is detected as Next.js. Keep the defaults: `npm run build`, with Node 20 or 22.
- **Don't deploy yet.** The first build needs the database to be set up first.

Using the CLI instead: run `npx vercel link` in the folder.

## 3. Add the database (Neon Postgres)

In **Project → Storage → Create Database → Neon**, connect it to the project for all environments. This adds `DATABASE_URL`, and some other `PG*` variables that the app doesn't use.

Tables (`products`, `site_content`, `messages`, `events`, `login_tokens`, `sessions`, `activity`) are created and seeded with the five current products on the first request.

## 4. Set up email (Resend)

1. Create a Resend account, then go to **Domains → Add domain → `undauntedlab.com`**.
2. Add the DNS records Resend shows you, which are SPF, DKIM and optionally DMARC, at your DNS provider. Wait until Resend shows the domain as **Verified**.
3. Create an API key with sending access.

Until this is done, nobody can sign in to the admin in production, because sign-in links go by email.

## 5. Environment variables

In **Project → Settings → Environment Variables**, set these for Production and Preview:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | set by Neon in step 3 |
| `ADMIN_EMAILS` | `opeyemi@undauntedlab.com` (comma-separate to add more people) |
| `RESEND_API_KEY` | from step 4 |
| `MAIL_FROM` | `Undaunted Lab <hello@undauntedlab.com>` (must be on the verified domain) |
| `SITE_URL` | `https://undauntedlab.com`. Sign-in links go back to whichever of the site's own addresses you asked from (this one or its `.vercel.app` ones), so they work before the domain moves; any other address gets this one |
| `ANALYTICS_SALT` | a long random string, e.g. from `openssl rand -hex 32` |
| `CONTACT_TO` | optional: where contact-form alerts go (defaults to `ADMIN_EMAILS`) |

Paste only the value itself (for `SITE_URL`, exactly `https://undauntedlab.com`), with no notes or spaces. Never set `AUTH_DEV_LINKS` in production.

## 6. Deploy

Click **Deploy**, or run `npx vercel --prod`.

## 7. Attach the domain

1. In **Project → Settings → Domains**, add `undauntedlab.com` and `www.undauntedlab.com`, and set www to redirect to the apex.
2. At the DNS provider, use the records Vercel shows. Typically that's an `A` record for `@` pointing to `76.76.21.21` and a `CNAME` for `www` pointing to `cname.vercel-dns.com`. The current site is on Framer, so remove the Framer records for the apex and www.
3. Wait for Vercel to show **Valid Configuration** and issue the certificate.

## 8. Verify the deployment

1. `https://undauntedlab.com` shows the world. Hovering a building updates the card, and clicking opens the product.
2. Go to `https://undauntedlab.com/admin`. It redirects to `/admin/login`. Enter your email and the link should arrive within a minute. Click **Continue to admin** and the dashboard loads.
3. In **Settings → Connections**, all three rows should say **OK**.
4. Send a test message from **Say hello** on the site. It appears under **Messages** with an unread badge, and you get an email alert.
5. Change one word under **Site text**, save, and reload the site to see it live. Then change it back.
6. Refresh the site a few times. **Analytics** should show views within a few seconds.
7. Read the privacy notice (**How we handle them** under the Say hello form). Make sure it matches how you handle messages, and edit it under **Site text** if not.
8. `https://undauntedlab.com/robots.txt` and `/sitemap.xml` load, and a made-up address such as `/nope` shows the styled page-not-found page.

If something fails:

- **Build fails:** check the Vercel build logs.
- **Page errors:** check **Vercel → Logs**. A `DATABASE_URL is not set` error means step 3 didn't reach that environment.
- **No sign-in email:** check the Resend dashboard under Logs. `MAIL_FROM` must use the verified domain.
- **Settings → Connections says Site address needs action:** `SITE_URL` has something extra in it. Set it to just the address and redeploy. Until then the site ignores it and uses `https://undauntedlab.com` for robots.txt and the sitemap.

## Day-to-day

- **Content and products:** managed in `/admin`, and they go live straight away.
- **Code changes:** push to `main` and Vercel redeploys. Preview deployments get their own URL but share the production database unless you give Preview a separate Neon branch, which is recommended in Neon under **Branches**.
- **Adding an admin:** edit `ADMIN_EMAILS` and redeploy.
- **Backups:** Neon has point-in-time restore. The free tier keeps about a day of history, so consider a paid plan once the site has real messages.
