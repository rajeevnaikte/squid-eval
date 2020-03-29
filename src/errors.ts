class BaseError extends Error {
  readonly code: string

  constructor (code: string, message: string) {
    super();
    this.code = code;
    this.message = message;
  }
}

export class InvalidExpError extends BaseError {
  constructor (exp: string) {
    super('INVALID_EXP', `Expression ${exp} is not valid.`);
  }
}

export class RuleExistsError extends BaseError {
  constructor (ruleName: string | number) {
    super('RULE_EXISTS', `Rule name ${ruleName} already exists. Please use other name or call updateRule method.`);
  }
}

export class RuleNotExistsError extends BaseError {
  constructor (ruleName: string | number) {
    super('RULE_NOT_EXISTS', `${ruleName} doesn't exist. Please call parse.`);
  }
}
