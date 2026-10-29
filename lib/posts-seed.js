// The first Lab notes, loaded once as drafts when the posts table is created (see lib/db/index.js).
// Written in Opeyemi's voice. [[NOTE: …]] marks a fact only Opeyemi can supply; the admin won't publish a note
// while any are left. After that first load, edit them in the admin: changing this file doesn't touch the database.

const scam = {
  slug: 'spot-a-scam-before-you-pay',
  title: 'Spot a scam before you pay: the five checks I make',
  tag: 'Financial safety',
  author: 'Opeyemi',
  summary: 'Many payment scams fall apart under a few simple checks. These are the ones I make before I send money to a business or a person I don’t know.',
  body: `My background is in financial crime. [[NOTE: add a line on what you did, where and for how long.]] One thing that work teaches you is that the warning signs usually show up before the payment, not after. The trouble is that people rarely have the time, or the nudge, to look for them.

Scams aren’t only for the careless. They’re designed to work on busy, trusting, ordinary people. Here are the checks I make before I pay a business or a person I don’t know. None of them takes more than a few minutes.

## 1. Who wants this to happen fast?

Pressure is a scammer’s most useful tool. “Pay today or lose the deal.” “Your account will be frozen.” “The price goes up at midnight.” A real business can wait while you check. If the deadline is the strongest part of the pitch, slow down. An hour away costs you nothing with an honest seller.

## 2. Does the business really exist?

Search the business name with words like “reviews”, “scam” or “complaints”. In the UK, look up limited companies on [Companies House](https://find-and-update.company-information.service.gov.uk/): the name, address and directors should match what you’ve been told. A company formed last month selling “established” services is worth a second look.

If they’re offering investments or other financial services, check the [FCA register](https://register.fca.org.uk/). Scammers copy the details of real, authorised firms, so contact the firm using the details on the register, not the ones in the email.

## 3. Why are they asking for this payment method?

Bank transfers, crypto, gift cards and money-transfer apps are hard to reverse, which is exactly why scammers prefer them. Ask why you can’t pay by card. In the UK, paying by credit card can also give you extra protection if things go wrong. A seller who insists on a method with no protection is telling you something.

## 4. Did the bank details change?

One of the most damaging scams doesn’t involve a fake business at all. A real supplier, builder or solicitor “updates” their bank details by email. Their email account has been hacked, or the address is one letter off.

If you’re told the details have changed, call the person on a number you already have, not one from the email, and confirm before you pay. Buying a home? Confirm the account with your solicitor by phone before you send the deposit.

## 5. Am I being asked to keep it quiet?

“Don’t tell your bank why you’re moving the money.” “Bank staff may be involved.” Your bank, the police and HMRC will never ask you to move money to a “safe account”, and nobody honest needs you to mislead your bank. If you’re told to keep a payment secret, that’s the moment to tell someone.

## If something feels wrong

Stop. Hang up or close the chat, and call your bank on the number on the back of your card. In the UK, you can call 159 to reach the fraud team at many banks safely. UK Finance’s [Take Five](https://www.takefive-stopfraud.org.uk/) campaign sums it up in three words: stop, challenge, protect.

If you’ve already paid, tell your bank straight away. The sooner they know, the better the chance of stopping or recovering the money. In the UK, many people who were tricked into making a bank transfer can now get their money back from their bank, so don’t let embarrassment stop you calling. [[NOTE: add the current UK service for reporting fraud to the police, with its link.]]

Some of these details are UK-specific, but the warning signs travel.

## Why we built Scamfendr

These checks work, but they take effort at the exact moment someone is rushing you. That’s why we built Scamfendr: it helps you check a business before you pay. [[NOTE: one or two sentences on how Scamfendr works today and how people use it. Keep to what it really does.]]

A few minutes of checking is cheap. A payment you can’t get back is not. If this helped, share it with the person in your family who always pays first and asks later.`,
  linkedin: `Scams rarely work because people are careless.
They work because people are rushed.

[[NOTE: one line on your financial-crime background.]]

Before I pay a business or a person I don’t know, I ask five questions:

1. Who wants this to happen fast?
A real business can wait while you check.

2. Does the business really exist?
Check Companies House, and the FCA register for anything financial.

3. Why this payment method?
Bank transfers, crypto and gift cards are hard to reverse. That’s why scammers prefer them.

4. Did the bank details change?
Call the supplier on a number you already have before you pay.

5. Am I being asked to keep it quiet?
Nobody honest needs you to mislead your bank.

If something feels off, stop and call your bank on the number on your card. In the UK, 159 reaches the fraud team at many banks.

These checks take minutes. A payment you can’t get back takes far longer to recover from.

What would you add to the list?

The full version, including what to do if you’ve already paid, is on our site. Link in the comments.

#FraudPrevention #Scams #FinancialSafety`
};

const why = {
  slug: 'why-i-started-undaunted-lab',
  title: 'Why I started Undaunted Lab',
  tag: 'Building in public',
  author: 'Opeyemi',
  summary: 'One studio, three countries, five products. Why I’m building small AI tools for the moments that test everyday people.',
  body: `Some moments test people more than others. A message from your “bank” that looks exactly right. Your first month in a new country, with a list of forms and nobody to ask. A commute that eats hours of every day. A small change in someone you care for that you only hear about once it’s become a big one.

These aren’t edge cases. They’re ordinary life. And they’re where I think AI can do the most good: not by replacing people, but by giving them a head start.

That’s why I started Undaunted Lab.

## What we are

Undaunted Lab is an AI-native product studio. We build small, sharp tools, each one for a specific moment, for people in the UK, Nigeria and Canada. Every product has AI at its core, designed in from day one rather than added later.

Right now that means five products:

- **Scamfendr**, in the UK, helps you check a business before you pay.
- **Vervet**, between the UK and Nigeria, is compliance for cross-border payments. It’s still in the lab.
- **Ganusii**, in Lagos, is about sharing the commute. It’s in pilot.
- **NotisCare**, in Nigeria, is built around one idea: know before the family calls.
- **Nestlo**, in Canada, builds your Alberta settlement plan for you.

[[NOTE: check each description matches how you’d describe the product today.]]

## Why three countries

[[NOTE: the personal reason. Your connection to the UK, Nigeria and Canada, and why you build for all three rather than one.]]

What these places share matters more to me than their differences. In all three, people are dealing with fast-moving money, new systems, and services that weren’t designed with them in mind. The details change from London to Lagos to Calgary. The feeling of being on your own with a problem doesn’t.

## Why a studio, not one product

Founders are usually told to pick one thing and go deep. I understand why. But the moments I care about don’t arrive one at a time, and the lessons travel. What we learn about trust in a scam check helps us design a family alert. What we learn about meeting people on WhatsApp in Lagos shapes how we think about a QR code in Calgary.

A studio lets us build small, test with real people and keep what works. Not every experiment will become a product, and that’s the point of a lab.

## How we build

Three rules guide everything we make:

- **AI at the core.** Each product is designed around what a model can do for someone, from day one.
- **People decide.** AI notices, sorts and drafts. A person makes the call that matters.
- **Meet people where they are.** WhatsApp in Lagos, Telegram in the UK, a QR code in Calgary. No app store hurdles.

## Why “Undaunted”

[[NOTE: the story behind the name, if there is one. Otherwise delete this section.]]

## What’s next

I’ll write here about what we’re building, what works and what doesn’t. If you’re working on something for everyday people, or you’d like to, I’d love to hear from you.`,
  linkedin: `A message from your “bank” that looks exactly right.
Your first month in a new country.
A commute that eats hours of your day.
A quiet change in someone you love that you hear about too late.

These are the moments I started Undaunted Lab for.

We’re an AI-native product studio building small, sharp tools for everyday people in the UK, Nigeria and Canada:

→ Scamfendr: check a business before you pay (UK)
→ Vervet: compliance for cross-border payments (UK ⇄ Nigeria, in the lab)
→ Ganusii: Lagos commutes, shared (in pilot)
→ NotisCare: know before the family calls (Nigeria)
→ Nestlo: your Alberta settlement plan, built for you (Canada)

Three rules guide all of it:
AI at the core. People decide. Meet people where they are.

[[NOTE: one line on why these three countries matter to you.]]

I’ll be writing about what we build, what works and what doesn’t. The full story is on our new site. Link in the comments.

If you’re building for everyday people too, I’d love to compare notes.

#AI #Startups #BuildingInPublic`
};

const decide = {
  slug: 'ai-notices-a-person-decides',
  title: 'AI notices, a person decides',
  tag: 'AI productivity',
  author: 'Opeyemi',
  summary: 'The rule behind every product we build: let AI do the noticing, sorting and drafting, and keep the decisions that matter with people.',
  body: `There’s a line on our website I come back to more than any other: AI notices, sorts and drafts. A person makes the call that matters.

It sounds simple. In practice, it shapes almost every design decision we make.

## What AI is good at

AI models are tireless at the work that wears people down: reading everything, spotting patterns across thousands of small details, sorting what’s urgent from what isn’t, and turning a pile of information into a first draft. That work used to need a team, or it simply didn’t get done.

## What people are good at

People know the context a model can’t see. They know the payment looks odd because it’s for a funeral. That a parent’s quiet week is because they’re visiting a cousin. That a “suspicious” account belongs to a customer they’ve known for years.

People also carry the responsibility. When a decision affects someone’s money, safety or family, someone should be able to explain it and stand behind it.

## Where the line sits in our products

[[NOTE: check these against how each product really works, and cut any that don’t fit.]]

- In **Scamfendr**, AI does the digging on a business. You decide whether to pay.
- In **Vervet**, AI flags the payments that need a closer look. A compliance professional makes the call, with a record of why.
- In **NotisCare**, AI notices changes that might matter. The family decides what to do about them.

## Three questions we ask

When we design a feature, we ask:

1. **What should the AI notice that a person would miss?**
2. **What decision does this lead to, and who owns it?**
3. **What does that person need to see to decide well?** Not just the answer, but why: the evidence, and how sure the system is.

The third question is the easiest to skip. An alert that says “high risk” without saying why teaches people either to ignore it or to trust it blindly. Neither is good.

## Why not let AI decide?

Sometimes it should. Sorting your inbox doesn’t need a human to sign it off. But in the moments we build for, a wrong call is expensive and personal: money gone, a missed sign that someone needs help, a compliance failure. In those moments, AI is most useful as a very good colleague: fast, thorough and honest about what it doesn’t know.

Getting this balance right also builds trust. People are far more willing to use AI when they can see it working for them, not over them.

## Try it on your own work

If you’re building with AI, try writing your own line. What does the AI do? What does the person do? If you can’t say it in two sentences, your users won’t be able to tell either.

[[NOTE: optional: a short example from your own work where getting this balance right mattered. Delete this note if you’d rather not.]]`,
  linkedin: `AI notices, sorts and drafts.
A person makes the call that matters.

That one line shapes almost every product decision at Undaunted Lab.

AI is tireless at the work that wears people down: reading everything, spotting patterns, sorting what’s urgent from what isn’t, writing the first draft.

People know what a model can’t: the context. The odd payment that’s for a funeral. The quiet week because Mum is visiting a cousin.

And people carry the responsibility. When a decision touches someone’s money, safety or family, someone should be able to explain it and stand behind it.

So when we design a feature, we ask three questions:

1. What should the AI notice that a person would miss?
2. What decision does this lead to, and who owns it?
3. What does that person need to see to decide well?

The third is the easiest to skip. An alert that says “high risk” without saying why teaches people to ignore it, or to trust it blindly.

If you’re building with AI, can you say in two sentences what the AI does and what the person does? If you can’t, your users can’t either.

Where do you draw the line? Full article in the comments.

#AI #ProductDesign #ResponsibleAI`
};

const where = {
  slug: 'meet-people-where-they-are',
  title: 'Meet people where they are: why our products skip the app store',
  tag: 'Building in public',
  author: 'Opeyemi',
  summary: 'WhatsApp in Lagos, Telegram in the UK, a QR code in Calgary. Why we build on the channels people already use instead of asking them to download another app.',
  body: `Every app you ask someone to install is a small mountain. Find it in the store. Check the reviews. Wait for the download. Make an account. Remember a password. Decide about notifications. For a lot of people, especially when they’re stressed, busy or new to a country, that’s where the journey ends.

So we made a rule: meet people where they are.

## What that looks like

- **In Lagos, WhatsApp.** For many people in Nigeria, WhatsApp is already how they talk to family, friends and businesses. A service that lives there doesn’t need to be learned. [[NOTE: name the product(s) on WhatsApp.]]
- **In the UK, Telegram.** [[NOTE: name the product and say why Telegram rather than WhatsApp.]]
- **In Calgary, a QR code.** Someone new to Alberta can scan it and get started, with nothing to install. [[NOTE: confirm it’s Nestlo, and where people find the code.]]

## Why it matters

**Fewer steps, more people.** Every step between someone and help loses people along the way. Removing the install removes the biggest step of all.

**Data and storage are real costs.** Not everyone has a new phone with space to spare, or a generous data plan. A chat or a web page asks far less of a phone than another app.

**The trust is already there.** People know how their chat apps work. They’re comfortable asking a question in a chat. That familiarity makes a new service feel less like a risk.

**It fits the moment.** Nobody plans to need a scam check or a ride share. When the moment comes, help should be one message away.

## What we give up

It isn’t free. Building on someone else’s platform means living with their rules, their limits and their changes. We don’t control the experience the way we would in our own app. Some features are harder, and some are impossible.

We’ve decided the trade is worth it, for now. [[NOTE: optional: a limitation you’ve hit, and how you worked around it. Delete this note if you’d rather not.]]

## How we decide

For each product, we start with one question: where is this person when they need us? Not where we’d like them to be. Sometimes the answer is a chat app. Sometimes it’s a QR code on a poster. One day it might be an app, if people want one enough to install it.

## Try it on your own product

If you’re building something for everyday people, count the steps between someone hearing about your product and getting real value from it. Then try to halve them.`,
  linkedin: `Every app you ask someone to install is a small mountain.

Find it. Download it. Make an account. Remember a password. Decide about notifications.

For someone who’s stressed, busy or new to a country, that’s often where the journey ends.

So at Undaunted Lab we have a rule: meet people where they are.

→ In Lagos, WhatsApp.
→ In the UK, Telegram.
→ In Calgary, a QR code.

No app store hurdles.

Why it works:
- Fewer steps means more people actually get help.
- Data and phone storage are real costs for a lot of people.
- People already trust the chat apps they use every day.
- Nobody plans to need a scam check. When they do, help should be one message away.

It isn’t free. Building on someone else’s platform means living with their rules and limits. We think the trade is worth it.

Try this: count the steps between someone hearing about your product and getting value from it. Then try to halve them.

How many steps does yours take? Full article in the comments.

#ProductDesign #Startups #DigitalInclusion`
};

// The order here is the suggested publishing order.
export const DEFAULT_POSTS = [why, scam, decide, where];
