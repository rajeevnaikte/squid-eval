import RuleEvaluator from "../index";

describe('rules eval test', () => {
  const evaluator = new RuleEvaluator();
  const data = {
    state: 'TX',
    county: 'San Jose',
    name: 'Wendy\'s',
    'day of birth': 23
  };

  test('one condition', () => {
    const ruleName = 'texas state';
    evaluator.parse(ruleName, '[state] = TX');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });

  test('rule name exists error', () => {
    const ruleName = 'texas state';
    expect(() => evaluator.parse(ruleName, '[state] = TX')).toThrow();
  });

  test('two condition', () => {
    const ruleName = 'texas state and county San Hose';
    evaluator.parse(ruleName, '[state] = TX and [county] = San Jose');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });

  test('update rule with text in qoute', () => {
    const ruleName = 'texas state';
    evaluator.update(ruleName, '[state] = \'TX\'');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });

  test('quote in text', () => {
    const ruleName = 'quote in text';
    evaluator.parse(ruleName, '[state] = TX and [name] = Wendy\'s');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });

  test('quote in quoted text', () => {
    const ruleName = 'quote in quoted text';
    evaluator.parse(ruleName, '[state] = TX and [name] = \'Wendy\'\'s\'');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });

  test('math operations', () => {
    const ruleName = 'math';
    evaluator.parse(ruleName, '(2 + [day of birth]/2 - 1)*2');
    expect(evaluator.execute(ruleName, data)).toBe(25);
  });

  test('math and condition', () => {
    const ruleName = 'math and condition';
    evaluator.parse(ruleName, '((2 + [day of birth]/2 - 1)*2 = 25) or ([state] = CA)');
    expect(evaluator.execute(ruleName, data)).toBe(true);
  });
});
