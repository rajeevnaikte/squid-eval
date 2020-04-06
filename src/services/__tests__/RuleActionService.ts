import RuleActionService from '../RuleActionService';
import { ActionFoundError } from '../../errors';
import { RuleName } from '../../types';

describe('RuleActionService', () => {
  const inputActionRules = new RuleActionService();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const inputNameActionRules = inputActionRules.ruleNameActionRules;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const ruleEvaluator = inputActionRules.ruleEvaluator;

  test('add', () => {
    const inputName = 'extension';
    const action = 'show';
    inputActionRules.add(inputName, action, '[phone number] > 0');

    const actionRules = inputNameActionRules.get(inputName) as any[];
    expect(actionRules).toBeDefined();
    expect(actionRules.length).toEqual(1);
    expect(actionRules[0].action).toEqual(action);

    const fields = ruleEvaluator.getVariables(actionRules[0].ruleName);
    expect(fields).toStrictEqual(['phone number']);
  });

  test('add duplicate', () => {
    const inputName = 'extension';
    const action = 'show';
    expect(() => inputActionRules.add(inputName, action, '[phone number] > 0'))
      .toThrow(new ActionFoundError(inputName, action));
  });

  test('update', () => {
    const inputName = 'extension';
    const action = 'show';
    inputActionRules.update(inputName, action, '[country code] > 0 and [phone number] > 0');

    const actionRules = inputNameActionRules.get(inputName) as any[];
    const fields = ruleEvaluator.getVariables(actionRules[0].ruleName);
    expect(fields.sort()).toStrictEqual(['phone number', 'country code'].sort());
  });

  test('delete', () => {
    const inputName = 'extension';
    const action = 'show';
    inputActionRules.delete(inputName, action);
    expect(inputNameActionRules.get(inputName)).toBeUndefined();
  });

  describe('evaluate', () => {
    const inputName = 'extension2';
    const action = 'show';
    const data = {
      ['country code']: 0,
      ['phone number']: 2100
    };
    inputActionRules.add(inputName, action, '[country code] > 0 and [phone number] > 0');

    test('no actions', () => {
      const actions = inputActionRules.evaluate(inputName, data);
      expect(actions).toEqual([]);
    });

    test('one action', () => {
      data['country code'] = 1;
      const actions = inputActionRules.evaluate(inputName, data);
      expect(actions).toEqual(['show']);
    });

    test('unknown input name', () => {
      const actions = inputActionRules.evaluate('unknown input', data);
      expect(actions).toEqual([]);
    });

    test('two actions', () => {
      inputActionRules.add(inputName, 'change', '[phone number] > 2000');
      const actions = inputActionRules.evaluate(inputName, data);
      expect(actions).toEqual(['show', 'change']);
    });

    test('evaluate all', () => {
      inputActionRules.add('extension1', 'show', '[country code] > -1 and [phone number] > 0');
      const expected = new Map<RuleName, string[]>();
      expected.set('extension1', ['show']);
      expected.set('extension2', ['show', 'change']);
      expect(inputActionRules.evaluateAll(data)).toEqual(expected);
    });
  });
});
