import { RuleName } from './types';
import { BaseError } from 'squid-utils';

export class InvalidExpError extends BaseError {
  constructor (exp: string) {
    super('INVALID_EXP', `Expression ${exp} is not valid.`);
  }
}

export class RuleExistsError extends BaseError {
  constructor (ruleName: RuleName) {
    super('RULE_EXISTS', `Rule name ${String(ruleName)} already exists. Please use other name or call updateRule method.`);
  }
}

export class RuleNotExistsError extends BaseError {
  constructor (ruleName: RuleName) {
    super('RULE_NOT_EXISTS', `${String(ruleName)} doesn't exist. Please call parse.`);
  }
}

export class ActionFoundError extends BaseError {
  constructor (ruleName: RuleName, action: string) {
    super('ACTION_FOUND',
      `Rule for action ${action} on input ${String(ruleName)} already added. Please use update method to update.`);
  }
}

export class ActionNotFoundError extends BaseError {
  constructor (ruleName: RuleName, action: string) {
    super('ACTION_NOT_FOUND',
      `Action ${action} on input ${String(ruleName)} not found to update. Please use add method for new entry.`);
  }
}

export class InputNotFoundError extends BaseError {
  constructor (ruleName: RuleName) {
    super('INPUT_NOT_FOUND',
      `Input ${String(ruleName)} not found to update. Please use add method for new entry.`);
  }
}
