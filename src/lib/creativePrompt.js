// Builds a single-post AI generation brief as JSON — meant to be pasted
// into an image/video generation AI (Claude, Midjourney, etc.) to actually
// produce that one creative. JSON instead of the YAML used by
// summaryText.js because this is meant to be handed to a model as
// structured input, not read by a person — and it folds the client's Brand
// Kit in directly so colors/fonts don't have to be repeated by hand every
// time.

const ASPECT_RATIO = { Static: '4:5', Carousel: '4:5', Reel: '9:16' };
const DELIVERABLE = {
  Static: 'single static image',
  Carousel: 'carousel slide set',
  Reel: "Reel cover thumbnail (static image — not the video itself)",
};

export function buildCreativePromptJSON(client, item, brandKit) {
  const deliverable = DELIVERABLE[item.format] || 'creative image';
  const references = (item.references || [])
    .filter((r) => r.url)
    .map((r) => ({ label: r.label || 'Reference', url: r.url }));

  const instructions = [
    `Generate the ${deliverable} described below for ${client} on ${item.platform || 'Instagram'}.`,
    'Use only the brand colors and fonts listed — no other colors or fonts.',
    'Follow visual_direction for style/composition; use structure for slide-by-slide or shot-by-shot layout if present.',
  ];
  if (references.length) instructions.push('Match the style of the linked references where relevant.');

  const prompt = {
    task: 'generate_creative',
    client,
    post: {
      num: item.num,
      format: item.format,
      platform: item.platform || 'Instagram',
      topic: item.topic || '',
      hook: item.hook || '',
      cta: item.cta || '',
      audience: item.audience || '',
      funnel_stage: item.funnel || '',
      pillar: item.pillar || '',
      structure: item.breakdown || '',
      visual_direction: item.visualDirection || '',
      notes: item.notes || '',
    },
    brand: {
      colors: (brandKit?.colors || []).map((c) => ({ label: c.label || 'Color', hex: c.hex })),
      fonts: (brandKit?.fonts || []).map((f) => ({ label: f.label || 'Font', name: f.name })),
      notes: brandKit?.notes || '',
    },
    references,
    output_spec: {
      deliverable,
      aspect_ratio: ASPECT_RATIO[item.format] || '4:5',
    },
    instructions,
  };

  return JSON.stringify(prompt, null, 2);
}
