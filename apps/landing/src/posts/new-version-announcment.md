---
title: Introducing Rallly 2.0
date: "2022-04-08"
tags: ["announcement"]
draft: false
excerpt: A look at Rallly's first major update.
---

In case you're wondering why everything looks different today, it's because I've
just released a major update. This update has been planned for [some time](https://twitter.com/imlukevella/status/1288066459248349184)
now but starting this year I've decided to focus more of my time on Rallly which has allowed
to reach this milestone and hopefully more to come in the future. So…

## What happens to polls created with the old version?

Polls created with the old version can still be accessed with the same URL.
The poll will be converted from the legacy format into the new format automatically.
I plan to disable the legacy database in about two months so until then all
polls created with the old version will still be available. Hopefully this will
be enough time for any active polls to be transferred over.

If you have any issue accessing your poll please reach out through the on-site chat or send an email to [support@rallly.co](mailto:support@rallly.co).

## What's new?

The new version addresses a lot of long-standing issues and adds some highly requested features such as:

### Time-slots

By far the most requested feature! You can now select time-slots as options for your poll.
You can choose to add your options from either a month view or a week view.

![Time-slots Demo](/static/images/timeslots-demo.gif)

### Permission links

Previously, polls were accessible through a single link. Anyone with this link
had full access to change or delete anything in the poll. The new version lets
you choose between a participant link and an admin link. By only sharing your
participant link you avoid giving your participants the ability to change the
details of the poll.

![Share Demo](/static/images/share-demo.gif)

### Compact view for mobile devices

Rallly has always been mobile-friendly but it now has a more optimized view for smaller screens.

![Mobile Demo](/static/images/mobile-demo.gif)

### And much more…

- Improved time-zone support
- CSV export
- Changing poll options without resetting votes

## What's missing?

Previously, you could include the emails of your participants when creating a poll. This only served to
send out an email with a link to the poll as soon as it has been created. This was convinient in some cases but not
really necessary as you could always email the link to the poll directly to your participants to the same effect.

There are a few reasons why I chose to leave this feature out:

1. **Reliability**&mdash;Unfortunately the deliveribility of our emails has dipped recently
   due to certain mail providers throttling emails from our service provider. This is not uncommon since we
   rely on shared IPs. I believe it's better not to offer this feature till it can be offered in a more reliable
   manner so I'll be looking at switching providers and possibly using a dedicated IP to help with
   our deliveribility.

2. **Cost**&mdash;Sending out these emails isn't free and Rallly's user base has grown to the point that
   the cost of these emails is a significant portion of the total running costs. Cutting down the number of emails
   being sent out would help manage this cost to a more sustainable level.

There are a few upsides of sharing links directly with your participants too. You can:

1. Include a message explaining what it is that you are trying to organize.
2. Use different channels such as whatapp or facebook to share your poll.
3. Be more confident that your participants have received your link.

## This is only the beginning

There's plenty of new features coming so make sure to [follow me](https://twitter.com/imlukevella) or [@ralllyco](https://twitter.com/ralllyco) on Twitter for updates.
