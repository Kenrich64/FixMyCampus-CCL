import { test, describe } from 'node:test';
import assert from 'node:assert';
import { recommendPriority } from '../src/services/priorityRules.js';

describe('Rule-Based Smart Priority Recommendation Engine', () => {
  test('flags bare wires and electrical sparks as urgent with safety reasoning', () => {
    const result = recommendPriority({
      category: 'Electrical problems',
      title: 'Sparking outlet in lab',
      description: 'Bare wire exposed and sparks are flying when plugged in.'
    });

    assert.strictEqual(result.recommendedPriority, 'urgent');
    assert.match(result.reason, /Immediate safety or structural hazard detected/i);
    assert.ok(result.matchedRules.length > 0);
  });

  test('flags fire, smoke, or structural collapse as urgent', () => {
    const result = recommendPriority({
      category: 'Safety and infrastructure',
      title: 'Smoke coming from breaker box',
      description: 'Visible smoke and burning smell in corridor.'
    });

    assert.strictEqual(result.recommendedPriority, 'urgent');
    assert.ok(result.matchedRules[0].includes('critical hazard keywords'));
  });

  test('flags major laboratory equipment and power blackout as high priority', () => {
    const result = recommendPriority({
      category: 'Laboratory equipment',
      title: 'Spectrometer optical laser uncalibrated',
      description: 'Major lab equipment is offline preventing scheduled student practicals.'
    });

    assert.strictEqual(result.recommendedPriority, 'high');
    assert.match(result.reason, /Laboratory equipment affects practical academic coursework/i);
  });

  test('flags classroom projector and Wi-Fi disruptions as medium priority', () => {
    const result = recommendPriority({
      category: 'Classroom equipment',
      title: 'Ceiling projector lamp blinking',
      description: 'Projector display shuts down every 10 minutes during lectures.'
    });

    assert.strictEqual(result.recommendedPriority, 'medium');
    assert.match(result.reason, /Academic or residential utility issue/i);
  });

  test('flags minor scratches or loose furniture as low priority', () => {
    const result = recommendPriority({
      category: 'Furniture damage',
      title: 'Desk surface scratch',
      description: 'Minor paint scratch on study table 14.'
    });

    assert.strictEqual(result.recommendedPriority, 'low');
    assert.match(result.reason, /Minor or cosmetic issue detected/i);
  });
});
