/**
 * Rule-Based Smart Priority Recommendation Engine
 *
 * NOTE: This is a deterministic, rule-based expert system utilizing transparent
 * keyword matching, category heuristics, and safety risk detection.
 * It does NOT use external AI APIs, paid services, or black-box machine learning.
 */

export function recommendPriority({ category, title = '', description = '' }) {
  const text = `${title} ${description}`.toLowerCase();
  const matchedRules = [];

  // 1. Urgent / Critical Safety Hazards
  const urgentKeywords = [
    'spark', 'fire', 'smoke', 'burning', 'exposed wire', 'bare wire',
    'electric shock', 'short circuit', 'gas leak', 'structural crack',
    'ceiling collapse', 'flood', 'chemical spill', 'explosion hazard'
  ];
  const foundUrgent = urgentKeywords.filter(k => text.includes(k));
  if (foundUrgent.length > 0) {
    matchedRules.push(`Detected critical hazard keywords: "${foundUrgent.join('", "')}"`);
    return {
      recommendedPriority: 'urgent',
      reason: `Immediate safety or structural hazard detected (${foundUrgent.join(', ')}). Requires immediate dispatch.`,
      matchedRules
    };
  }

  // 2. High Priority (Major Infrastructure, Lab Equipment, Power Outage, Safety)
  const highKeywords = [
    'power outage', 'blackout', 'main lab', 'server down', 'exam hall',
    'elevator stuck', 'lift failure', 'water contamination', 'no water supply',
    'cctv failure', 'broken lock', 'security gate'
  ];
  const foundHigh = highKeywords.filter(k => text.includes(k));
  if (foundHigh.length > 0) {
    matchedRules.push(`Detected high-impact keywords: "${foundHigh.join('", "')}"`);
    return {
      recommendedPriority: 'high',
      reason: `High-impact campus disruption detected affecting critical services or multiple students (${foundHigh.join(', ')}).`,
      matchedRules
    };
  }

  if (category === 'Safety and infrastructure') {
    matchedRules.push('Category is Safety and Infrastructure');
    return {
      recommendedPriority: 'high',
      reason: 'Safety and infrastructure complaints are flagged as High priority by standard campus policy.',
      matchedRules
    };
  }

  if (category === 'Laboratory equipment') {
    matchedRules.push('Category is Laboratory Equipment');
    return {
      recommendedPriority: 'high',
      reason: 'Laboratory equipment affects practical academic coursework and research timelines.',
      matchedRules
    };
  }

  // 3. Medium Priority (Classrooms, Wi-Fi, Plumbing, Hostel)
  const mediumKeywords = [
    'projector', 'audio', 'mic', 'air conditioner', 'ac not cooling',
    'fan', 'switchboard', 'slow internet', 'network down', 'tap leaking',
    'toilet flush', 'bathroom leak'
  ];
  const foundMedium = mediumKeywords.filter(k => text.includes(k));
  if (foundMedium.length > 0) {
    matchedRules.push(`Detected academic/utility keywords: "${foundMedium.join('", "')}"`);
    return {
      recommendedPriority: 'medium',
      reason: `Academic or residential utility issue detected (${foundMedium.join(', ')}). Scheduled maintenance recommended.`,
      matchedRules
    };
  }

  if (category === 'Classroom equipment' || category === 'Wi-Fi and network connectivity' || category === 'Plumbing and sanitation') {
    matchedRules.push(`Category is ${category}`);
    return {
      recommendedPriority: 'medium',
      reason: `${category} issues disrupt day-to-day campus activity and are typically resolved within 24-48 hours.`,
      matchedRules
    };
  }

  // 4. Low Priority (Cosmetic, Minor Furniture, Cleanliness)
  const lowKeywords = [
    'paint', 'scratch', 'loose handle', 'squeaky', 'dust', 'curtain',
    'whiteboard marker', 'poster', 'chair wheel', 'aesthetic'
  ];
  const foundLow = lowKeywords.filter(k => text.includes(k));
  if (foundLow.length > 0) {
    matchedRules.push(`Detected non-urgent keywords: "${foundLow.join('", "')}"`);
    return {
      recommendedPriority: 'low',
      reason: `Minor or cosmetic issue detected (${foundLow.join(', ')}). Handled in routine maintenance rounds.`,
      matchedRules
    };
  }

  if (category === 'Furniture damage' || category === 'Cleanliness') {
    matchedRules.push(`Category is ${category}`);
    return {
      recommendedPriority: 'low',
      reason: 'General furniture and cleanliness tasks are queued for routine custodial maintenance.',
      matchedRules
    };
  }

  // Default fallback
  return {
    recommendedPriority: 'medium',
    reason: 'Standard campus maintenance issue assigned default Medium priority.',
    matchedRules: ['Default priority policy']
  };
}
