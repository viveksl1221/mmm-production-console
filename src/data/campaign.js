// Editable monthly calendar data. Nothing in this file is app logic —
// swap the contents out each month and the console renders it as-is.
// (Ported verbatim from the offline prototype; no values were changed.)

// Which real calendar month/year this console is tracking.
// Used only to detect "today" and highlight the current week.
export const CAMPAIGN_YEAR = 2026;
export const CAMPAIGN_MONTH_INDEX = 7; // 0-indexed: 7 = August

export const WEEK_RANGES = {
  1: { label: 'Week 1', start: 'Aug 1', end: 'Aug 9' },
  2: { label: 'Week 2', start: 'Aug 10', end: 'Aug 16' },
  3: { label: 'Week 3', start: 'Aug 17', end: 'Aug 23' },
  4: { label: 'Week 4', start: 'Aug 24', end: 'Aug 31' },
};

// Every client shown in the Clients tab, in display order (including
// clients with no posts yet, e.g. blog-only accounts).
export const ALL_CLIENTS = [
  'My Health',
  'Sikkini',
  'Man Made Marketing',
  'Fika Time',
  'Journey Wellness',
  'Eshopify Fulfillment',
];

export const POST_TARGETS = { 'My Health': 20, Sikkini: 30, 'Man Made Marketing': 15, 'Fika Time': 15 };
export const BLOG_TARGETS = { 'My Health': 8, 'Journey Wellness': 8, Sikkini: 8, 'Man Made Marketing': 7, 'Eshopify Fulfillment': 8 };

// Weeks where a client has planned slots with no topic locked yet
// (bucketed week -> count of open slots).
export const FIKA_GAP = { 3: 4, 4: 4 };

// Free-text call-outs shown in "Needs attention" on the Overview tab.
// `text` may contain simple inline HTML (e.g. <b>) — it's rendered as-is.
export const ATTENTION_NOTES = [
  { client: 'Fika Time', text: 'Fika Time is short <b>8 posts</b> against its 15-post target' },
];

// Free-text notes shown inside a client's card on the Clients tab.
export const CLIENT_NOTES = {
  'Fika Time': '7 of 15 posts scheduled — 8 more need topics to hit target.',
};

export const DATA = {
  'My Health': [
    { num: 1, week: 1, format: 'Carousel', topic: 'The Science of Healthy Aging', hook: "Aging is optional. Decline isn't." },
    { num: 2, week: 1, format: 'Static', topic: 'Prevention Is Your Greatest Investment', hook: "Don't wait for symptoms." },
    { num: 3, week: 1, format: 'Reel', topic: 'Morning Habits for Longevity', hook: 'Your first hour matters.' },
    { num: 4, week: 1, format: 'Carousel', topic: 'Foods That Support Healthy Aging', hook: 'Eat for the next 20 years.' },
    { num: 5, week: 1, format: 'Static', topic: 'Why Choose My Health', hook: 'Healthcare, reimagined.' },
    { num: 6, week: 2, format: 'Reel', topic: 'Move More, Live Better', hook: 'Every step counts.' },
    { num: 7, week: 2, format: 'Carousel', topic: 'What Does a Preventive Check-up Include?', hook: "Know your numbers before they matter." },
    { num: 8, week: 2, format: 'Static', topic: 'Sleep Is Your Best Recovery Tool', hook: 'Better sleep. Better life.' },
    { num: 9, week: 2, format: 'Reel', topic: 'Inside My Health', hook: 'A premium healthcare experience.' },
    { num: 10, week: 3, format: 'Carousel', topic: '5 Silent Risk Factors', hook: "You can't feel everything." },
    { num: 11, week: 3, format: 'Static', topic: 'Your Body Needs More Than Water', hook: 'Hydration impacts every cell.' },
    { num: 12, week: 3, format: 'Reel', topic: 'Advanced Health Screening', hook: 'Prevention powered by technology.' },
    { num: 13, week: 3, format: 'Carousel', topic: 'How Stress Speeds Up Aging', hook: 'Stress leaves invisible marks.' },
    { num: 14, week: 4, format: 'Static', topic: 'Meet Our Specialists', hook: 'Experts dedicated to your longevity.' },
    { num: 15, week: 4, format: 'Reel', topic: 'Build a Longevity Plate', hook: 'Every meal is an investment.' },
    { num: 16, week: 4, format: 'Carousel', topic: 'Strength Training & Longevity', hook: 'Muscle is medicine.' },
    { num: 17, week: 4, format: 'Static', topic: 'Small Habits. Big Results.', hook: 'Consistency beats intensity.' },
    { num: 18, week: 4, format: 'Reel', topic: 'A Day at My Health', hook: 'Wellness starts here.' },
    { num: 19, week: 5, format: 'Carousel', topic: 'When Should You Get Screened?', hook: 'The right time is before symptoms.' },
    { num: 20, week: 5, format: 'Static', topic: 'Invest in Your Future Self', hook: 'Your future health starts today.' },
  ],
  Sikkini: [
    { num: 1, week: 1, format: 'Carousel', topic: 'Why Commercial Kitchens Should Stop Buying Knives', hook: 'Stop Buying. Start Exchanging.' },
    { num: 2, week: 1, format: 'Reel', topic: 'Tomato Slice Test', hook: 'One Slice Says It All.' },
    { num: 3, week: 1, format: 'Static', topic: 'What is SIKKINI?', hook: 'Knife Exchange Simplified.' },
    { num: 4, week: 1, format: 'Carousel', topic: 'Hidden Cost of Dull Knives', hook: "You're Losing More Than Sharpness." },
    { num: 5, week: 1, format: 'Reel', topic: 'Exchange Day', hook: '30 Seconds. Zero Downtime.' },
    { num: 6, week: 1, format: 'Carousel', topic: 'How the Exchange Works', hook: 'Supply → Exchange → Sharpen → Repeat' },
    { num: 7, week: 1, format: 'Static', topic: 'Knife Safety Tip', hook: 'Sharp Knives Are Safer.' },
    { num: 8, week: 2, format: 'Reel', topic: 'Paper Cutting Test', hook: 'Is Your Knife Really Sharp?' },
    { num: 9, week: 2, format: 'Carousel', topic: 'Color-Coded Knives', hook: 'Prevent Cross Contamination.' },
    { num: 10, week: 2, format: 'Reel', topic: 'Inside Tormek T8', hook: "Precision You Can't See." },
    { num: 11, week: 2, format: 'Static', topic: 'Meet the Team', hook: 'Experts Behind Every Blade.' },
    { num: 12, week: 2, format: 'Carousel', topic: 'Knife Arsenal', hook: 'One Service. Every Knife.' },
    { num: 13, week: 2, format: 'Reel', topic: 'Chef Prep Challenge', hook: 'Prep Faster.' },
    { num: 14, week: 2, format: 'Carousel', topic: 'Restaurant vs SIKKINI', hook: 'Which Kitchen Runs Better?' },
    { num: 15, week: 3, format: 'Reel', topic: 'Delivery Day', hook: 'Always On Time.' },
    { num: 16, week: 3, format: 'Static', topic: 'Knife Care Myth', hook: "Don't Store It Like This." },
    { num: 17, week: 3, format: 'Carousel', topic: 'Cost Comparison', hook: 'Renting Beats Buying.' },
    { num: 18, week: 3, format: 'Reel', topic: 'Slow Motion Prep', hook: 'Every Slice Matters.' },
    { num: 19, week: 3, format: 'Carousel', topic: 'Sanitation Process', hook: 'Clean Every Exchange.' },
    { num: 20, week: 3, format: 'Reel', topic: 'Quality Inspection', hook: 'Every Knife Checked.' },
    { num: 21, week: 3, format: 'Static', topic: '2-Week Free Trial', hook: 'Try Risk-Free.' },
    { num: 22, week: 4, format: 'Carousel', topic: 'Why Hotels Choose SIKKINI', hook: 'Built for Busy Kitchens.' },
    { num: 23, week: 4, format: 'Reel', topic: 'Knife Anatomy', hook: 'Know Your Blade.' },
    { num: 24, week: 4, format: 'Carousel', topic: 'Save Hours Weekly', hook: 'Time Is Money.' },
    { num: 25, week: 4, format: 'Reel', topic: 'Chef Testimonial', hook: 'Why We Switched.' },
    { num: 26, week: 4, format: 'Static', topic: 'Client Quote', hook: 'Trusted by Professionals.' },
    { num: 27, week: 4, format: 'Carousel', topic: 'Choose the Right Knife', hook: "One Knife Doesn't Fit All." },
    { num: 28, week: 4, format: 'Reel', topic: 'Dull to Razor Sharp', hook: 'See the Difference.' },
    { num: 29, week: 5, format: 'Carousel', topic: 'Frequently Asked Questions', hook: 'Everything You Need.' },
    { num: 30, week: 5, format: 'Reel', topic: 'Book Your Trial', hook: 'Ready to Upgrade?' },
  ],
  'Man Made Marketing': [
    { num: 1, week: 1, format: 'Static', topic: 'Blue Builds Trust', hook: 'Why do banks love blue?' },
    { num: 2, week: 1, format: 'Reel', topic: 'Why Apple Never Discounts', hook: "Premium isn't about price" },
    { num: 3, week: 1, format: 'Carousel', topic: '5 Branding Mistakes', hook: 'Is your brand making these mistakes?' },
    { num: 4, week: 1, format: 'Reel', topic: 'Red Makes You Hungry', hook: "There's a reason restaurants use red" },
    { num: 5, week: 2, format: 'Static', topic: 'People Buy Stories', hook: 'Stop selling. Start storytelling.' },
    { num: 6, week: 2, format: 'Carousel', topic: 'Why Consistency Wins', hook: 'The strongest brands repeat' },
    { num: 7, week: 2, format: 'Reel', topic: 'Can You Recognize This Logo?', hook: 'Remove the name, keep the shape' },
    { num: 8, week: 2, format: 'Static', topic: 'First Impressions Matter', hook: 'Your website has 5 seconds' },
    { num: 9, week: 3, format: 'Carousel', topic: 'Fonts That Build Trust', hook: 'Typography changes perception' },
    { num: 10, week: 3, format: 'Reel', topic: "Why Nike Doesn't Sell Shoes", hook: "They're selling identity" },
    { num: 11, week: 3, format: 'Static', topic: 'What We Actually Do', hook: 'More than social media' },
    { num: 12, week: 3, format: 'Carousel', topic: 'Signs Your Website Needs a Redesign', hook: 'Losing customers without knowing?' },
    { num: 13, week: 4, format: 'Reel', topic: "AI Won't Replace Good Branding", hook: 'Strategy still wins' },
    { num: 14, week: 4, format: 'Carousel', topic: 'Before & After Branding', hook: 'See the transformation' },
    { num: 15, week: 4, format: 'Reel', topic: "Let's Build Something Memorable", hook: 'Your next customer is watching' },
  ],
  'Fika Time': [
    { num: 101, week: 1, format: 'Carousel', topic: 'Fresh from the Oven', hook: 'Freshly Baked Every Day' },
    { num: 102, week: 1, format: 'Reel', topic: 'Brand Awareness Film', hook: 'Atmosphere & Fresh Food' },
    { num: 103, week: 1, format: 'Static', topic: 'Coffee & Cake Pairing', hook: 'Freshly Baked Every Day' },
    { num: 104, week: 2, format: 'Reel', topic: 'Brunch Moments', hook: 'Atmosphere & Fresh Food' },
    { num: 105, week: 2, format: 'Reel', topic: 'Fuel Your Morning', hook: 'Back to School' },
    { num: 106, week: 2, format: 'Static', topic: 'Dessert Spotlight', hook: 'Freshly Baked Every Day' },
    { num: 107, week: 2, format: 'Reel', topic: 'Slow Down at Fika', hook: 'Atmosphere & Fresh Food' },
  ],
};
