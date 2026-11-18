## The short version

Your site is built. To put it on ConspiracyTheoriesExplained.com you do five things:

1. Fill in your details (one small file).
2. Put the site on a free host. My pick is Cloudflare Pages.
3. Point your domain at it.
4. Connect three free tools: email list, contact form and book store.
5. Paste in your YouTube video IDs.

You can do steps 1, 4 and 5 by just asking Claude. Sample things to say are at the end.

## What it costs

| Thing | My pick | Cost |
|---|---|---|
| Hosting | Cloudflare Pages | $0 |
| Domain | You already own it | Only your yearly renewal |
| Email list | Kit (free plan) | $0 up to 10,000 subscribers |
| Book store | Payhip (free plan) | $0 a month, 5% of each sale plus card fees |
| Contact form | Formspree (free plan) | $0 |
| contact@ email address | Cloudflare Email Routing | $0 |

So you can start at **$0 a month**. You only pay when a book sells. Prices were checked in November 2026. Check each company's pricing page before you sign up, because plans change.

## Hosting: which one?

| Host | Free plan | Good | Watch out |
|---|---|---|---|
| **Cloudflare Pages** (my pick) | Unlimited visitors, 500 updates a month, your own domain with a free security lock | Never charges you for a traffic spike. Free email forwarding and free visit counts in the same account. | The dashboard has a lot of menus. |
| **Netlify** | 300 credits a month. One update costs 15 credits. | The easiest. You can drag a folder onto the page and it is live. | If you run out of credits, the site pauses until next month. The next plan is $9 a month. |
| **Vercel** | Free "Hobby" plan | Fast and simple | The free plan is for personal, non-business sites only. Your site sells books, so skip it. |

### How Claude can run it for you

All three hosts can update by themselves. Here is the setup that works best:

1. Your site files live in a free **GitHub** account. Think of it as a safe folder in the cloud that remembers every change.
2. **Cloudflare Pages** watches that folder. When a file changes, it rebuilds the site in about a minute.
3. **Claude** makes the changes. You say "add a blog post about the magic bullet" or "add my new video", and Claude edits the files and saves them to GitHub. The site updates itself.

Claude's connector list also has a **Netlify** connector and a **Cloudflare** connector. If you turn one on, Claude can publish and check the site for you. You can also give Claude a scheduled task, like "every Monday, draft a blog post from my newest video and show it to me first."

## Step 1. Fill in your details

Open `content/site.json`. Check each line:

- **company:** I used "Sharing Ideas Network". Change it if your company has a different legal name.
- **contactEmail:** I used contact@conspiracytheoriesexplained.com. Step 4 shows how to make that address work for free.
- **governingLaw:** type your state or country. This shows in the Terms of Use.
- **social:** I used the handle @CTExplainedTV for all four. Change these if you pick a different handle. Clear a line if you do not use that app.
- **amazonAssociate:** leave it `false` unless you join Amazon's affiliate program. If you join, change it to `true` and the right legal sentence appears by itself.

## Step 2. Add your real book covers

Right now the site draws a cover for each book in your channel's style. To show your real covers, save them into the `images` folder with these exact names:

- `cover-conspiracy-theory.jpg`
- `cover-the-paperclip-secret.jpg`
- `cover-case-never-closed.jpg`

The site picks them up by itself the next time it builds.

## Step 3. Put the site online

### Option A: the 10-minute way (no GitHub)

1. Make a free account at cloudflare.com.
2. Go to **Workers and Pages**, choose **Create**, then **Pages**, then **Upload assets**.
3. Name the project and drag in the `dist` folder from your site files.
4. Click **Deploy**. You get a test address that ends in `.pages.dev`. Open it and look around.

To update the site later, you upload the new `dist` folder again.

### Option B: the automated way (best with Claude)

1. Make a free account at github.com and create a private repository called `cte-site`.
2. Ask Claude to put the site files into it.
3. In Cloudflare, go to **Workers and Pages**, choose **Create**, then **Pages**, then **Connect to Git**. Pick the `cte-site` repository.
4. Type these two settings. Build command: `node build.js`. Output folder: `dist`.
5. Click **Save and Deploy**.

From now on, every change saved to GitHub goes live by itself.

Menu names in Cloudflare change from time to time. If a button has a new name, look for the words Pages, Upload or Git.

## Step 4. Point your domain at the site

1. In Cloudflare, click **Add a domain** and type conspiracytheoriesexplained.com. Pick the Free plan.
2. Cloudflare shows you two "nameservers". Log in where you bought the domain and replace the old nameservers with those two.
3. Wait. It can take a few minutes or up to a day.
4. Back in your Pages project, open **Custom domains** and add conspiracytheoriesexplained.com and www.conspiracytheoriesexplained.com.

The security lock (https) turns on by itself.

**Free email address:** in Cloudflare, open **Email**, then **Email Routing**. Create contact@conspiracytheoriesexplained.com and forward it to your own inbox.

## Step 5. Connect the three tools

### Email list (Kit)

1. Make a free account at kit.com and create a **Form**.
2. In the form's settings, set "after someone signs up" to send them to `https://conspiracytheoriesexplained.com/thanks/`. That page hands over both free PDFs, so you do not need any paid automation.
3. Copy the form's embed code and give it to Claude. Claude will put the right address into `newsletter.action` in `content/site.json`.

Why Kit: its free plan allows up to 10,000 subscribers. MailerLite's free plan dropped to 250 in June 2026.

### Contact form (Formspree)

1. Make a free account at formspree.io and create a form. Send it to your contact@ address.
2. Copy the form address. It looks like `https://formspree.io/f/abcd1234`.
3. Paste it into `contactForm.action` in `content/site.json`.

### Book store (Payhip and Amazon)

1. Make a free account at payhip.com. Add each eBook as a digital product and upload the file.
2. Copy the product link. Paste it into `directUrl` for that book in `content/books.json`.
3. When a book is live on Amazon, paste its Amazon link into `amazonUrl`.
4. Change `status` from "Coming soon" to "Out now".
5. Put "Payhip" in `directStoreName` in `content/site.json`. This updates the legal pages.

A book with no links shows a "Tell me when it is out" button that collects emails. So the site works for you even before launch day.

## Step 6. Add your videos

Open `content/videos.json`. Each video has a line called `youtubeId`.

1. Open your video on YouTube. Look at the address. The ID is the part after `v=`. Example: in `youtube.com/watch?v=AbC123xyz_0` the ID is `AbC123xyz_0`.
2. Paste the ID between the quotes.

The video now plays on your site and shows your real thumbnail. A video with no ID shows a "Coming soon" card in your cork or gray style. For a Short, add `"short": true` to that video.

## Step 7. Write blog posts

Each post is one text file in `content/posts`. Copy an old one, change the title, date and words, and save it. Or just ask Claude.

I wrote three starter posts so the blog is not empty. Please read them and change anything you like before you go live.

## Changing small words

The home page headlines, the menu names, the button labels and the footer lines are all in `content/home.json`. Open it, change the words between the quote marks and save.

The same kind of words for every other page (page titles, contact form labels, small links) are in `content/other-pages.json`.

- To make words red in a headline, put stars around them, like `Latest *case files*`.
- Headlines show in ALL CAPS by design, however you type them.

## Step 8. After you go live

- Click every button once. Send yourself a test message and a test sign-up.
- Go to Google Search Console (free) and submit `https://conspiracytheoriesexplained.com/sitemap.xml`. This tells Google your pages exist.
- Put the site link on your YouTube channel page and in every video description.
- Turn on **Web Analytics** in Cloudflare. It is free and uses no cookies.

## About the legal pages

The site has six: Privacy, Terms, Disclaimer, Affiliate Disclosure, Cookies and Refunds. They are plain-language starting points that fit how this site works. I am not a lawyer. Before you sell, have a lawyer look them over, mainly for your state or country.

## Things to say to Claude

- "Add this video to my site. The YouTube link is ..."
- "Write a blog post from this video script and add it to the site."
- "My JFK book is live on Amazon. Here is the link. Update the site."
- "Change the home page headline to ..."
- "Make a new free download about ... and add it to the Free page."

## What is in the folder

- `content` holds your words and settings. This is the only folder you need to touch.
- `images` holds your covers.
- `downloads` holds your free PDFs.
- `dist` is the finished website. This is what goes online.
- `build.js` turns `content` into `dist`. Claude or Cloudflare runs it. You do not have to.
