import RuleEvaluator from './RuleEvaluator';
import { ActionFoundError, ActionNotFoundError, InputNotFoundError } from '../errors';
import { nonNull, getOrSetDefault, JsonType } from 'squid-utils';
import { RuleName } from '../types';

/**
 * Holder of action name and corresponding rule.
 * e.g. { action: 'hide', ruleName: Symbol() }
 */
interface ActionRule {
  action: string;
  ruleName: symbol;
}

/**
 * Rules for actions to be taken on input fields.
 * such as, hide, remove, change input type
 */
export default class RuleActionService {
  private readonly ruleNameActionRules = new Map<RuleName, ActionRule[]>();
  private readonly ruleEvaluator = new RuleEvaluator();

  /**
   * Add a rule for an action.
   * @param ruleName
   * @param actionRule
   */
  add (ruleName: RuleName, action: string, rule: string): void {
    const actionRule = {
      action,
      ruleName: Symbol()
    };
    const actionRules = getOrSetDefault(this.ruleNameActionRules, ruleName, []);

    if (actionRules.find(item => item.action === action)) {
      throw new ActionFoundError(ruleName, action);
    }

    actionRules.push(actionRule);

    this.ruleEvaluator.parse(actionRule.ruleName, rule);
  }

  /**
   * Update rule of existing action.
   * @param ruleName
   * @param action
   * @param rule
   */
  update (ruleName: RuleName, action: string, rule: string): void {
    const actionRules = nonNull(this.ruleNameActionRules.get(ruleName),
      () => new InputNotFoundError(ruleName));
    const actionRule = nonNull(actionRules.find(item => item.action === action),
      () => new ActionNotFoundError(ruleName, action));

    this.ruleEvaluator.update(actionRule.ruleName, rule);
  }

  /**
   * Delete saved action of given ruleName.
   * @param ruleName
   * @param action
   */
  delete (ruleName: RuleName, action: string): void {
    const actionRules = this.ruleNameActionRules.get(ruleName);
    const actionRuleIdx = actionRules?.findIndex(item => item.action === action);

    if (actionRules && actionRuleIdx !== undefined && actionRuleIdx > -1) {
      this.ruleEvaluator.delete(actionRules[actionRuleIdx].ruleName);
      actionRules.splice(actionRuleIdx, 1);
      if (actionRules.length === 0) this.ruleNameActionRules.delete(ruleName);
    }

  }

  /**
   * Execute rules with given data and find actions.
   */
  evaluateActions (ruleName: RuleName, formData: JsonType): string[] {
    const actionRules = this.ruleNameActionRules.get(ruleName);
    const actions: string[] = [];

    if (actionRules) {
      for (const actionRule of actionRules) {
        if (this.ruleEvaluator.execute(actionRule.ruleName, formData)) {
          actions.push(actionRule.action);
        }
      }
    }

    return actions;
  }
}
